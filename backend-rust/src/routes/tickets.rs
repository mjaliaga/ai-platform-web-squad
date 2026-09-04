use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::email::notify_ticket;
use crate::middleware::auth::require_auth;
use crate::models::{
    Claims, PublicUser, Ticket, TicketActivity, TicketActivityWithUser, TicketComment,
    TicketCommentWithAuthor, TicketLevelConfig, TicketLevelConfigWithUser, TicketWithDetails,
};
use crate::validation::{
    error_response, internal_error, require_admin, validate_enum, validate_required, PRIORITIES,
    TICKET_CATEGORIES, TICKET_STATUSES,
};
use crate::AppState;

// Helper to get assignee for a given level (1 or 2)
// Primero busca en ticket_level_config, si no existe hace fallback por email
async fn get_assignee_for_level(db: &sqlx::SqlitePool, level: i64) -> Option<String> {
    // 1. Buscar en config
    if let Ok(Some((user_id,))) =
        sqlx::query_as::<_, (String,)>("SELECT user_id FROM ticket_level_config WHERE level = ?")
            .bind(level)
            .fetch_optional(db)
            .await
    {
        // Verificar que el usuario aún existe y activo
        if let Ok(Some((_,))) = sqlx::query_as::<_, (String,)>(
            "SELECT id FROM users WHERE id = ? AND deleted_at IS NULL AND active = 1",
        )
        .bind(&user_id)
        .fetch_optional(db)
        .await
        {
            return Some(user_id);
        }
    }
    // 2. Fallback por email / nombre
    let fallback_email = match level {
        1 => "manuel.aliaga@tivit.com",
        2 => "sergio.aguas@tivit.com",
        _ => return None,
    };
    let fallback_name = match level {
        1 => "Manuel Aliaga",
        2 => "Sergio Aguas",
        _ => return None,
    };
    // Buscar por email exacto
    if let Ok(Some((id,))) = sqlx::query_as::<_, (String,)>(
        "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL",
    )
    .bind(fallback_email)
    .fetch_optional(db)
    .await
    {
        return Some(id);
    }
    // Buscar por nombre like
    if let Ok(Some((id,))) = sqlx::query_as::<_, (String,)>(
        "SELECT id FROM users WHERE name LIKE ? AND deleted_at IS NULL LIMIT 1",
    )
    .bind(format!("%{}%", fallback_name))
    .fetch_optional(db)
    .await
    {
        return Some(id);
    }
    None
}

// CI: helper de actividad con campos fijos del dominio; se permite el lint.
#[allow(clippy::too_many_arguments)]
async fn log_ticket_activity(
    db: &sqlx::SqlitePool,
    ticket_id: &str,
    user_id: &str,
    action: &str,
    field_changed: Option<&str>,
    old_value: Option<&str>,
    new_value: Option<&str>,
    metadata: Option<&str>,
) {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let _ = sqlx::query(
        "INSERT INTO ticket_activity (id, ticket_id, user_id, action, field_changed, old_value, new_value, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(ticket_id)
    .bind(user_id)
    .bind(action)
    .bind(field_changed)
    .bind(old_value)
    .bind(new_value)
    .bind(metadata)
    .bind(&now)
    .execute(db)
    .await;
}

async fn batch_users(
    db: &sqlx::SqlitePool,
    ids: &[&str],
) -> std::collections::HashMap<String, PublicUser> {
    use std::collections::HashMap;
    if ids.is_empty() {
        return HashMap::new();
    }
    // Dedup
    let mut uniq: Vec<String> = ids.iter().map(|s| s.to_string()).collect();
    uniq.sort();
    uniq.dedup();
    let placeholders = uniq.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!("SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id IN ({}) AND deleted_at IS NULL", placeholders);
    let mut q = sqlx::query_as::<_, crate::models::User>(&sql);
    for id in &uniq {
        q = q.bind(id);
    }
    if let Ok(users) = q.fetch_all(db).await {
        users
            .into_iter()
            .map(|u| (u.id.clone(), u.into()))
            .collect()
    } else {
        HashMap::new()
    }
}

async fn build_ticket_with_details(
    db: &sqlx::SqlitePool,
    ticket: Ticket,
) -> Result<TicketWithDetails, Response> {
    let project: Option<(String, String)> =
        sqlx::query_as("SELECT name, code FROM projects WHERE id = ?")
            .bind(&ticket.project_id)
            .fetch_optional(db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let (project_name, project_code) = project.unzip();

    let mut ids: Vec<&str> = vec![ticket.reporter_id.as_str()];
    if let Some(a) = ticket.assignee_id.as_deref() {
        ids.push(a);
    }
    let users = batch_users(db, &ids).await;
    let reporter = users
        .get(&ticket.reporter_id)
        .cloned()
        .ok_or_else(|| internal_error("reporter not found"))?;
    let assignee = ticket
        .assignee_id
        .as_ref()
        .and_then(|id| users.get(id).cloned());

    Ok(TicketWithDetails {
        ticket,
        reporter,
        assignee,
        project_name,
        project_code,
    })
}

#[derive(Debug, Deserialize)]
pub struct ListTicketsParams {
    pub project_id: Option<String>,
    pub level: Option<i64>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub category: Option<String>,
    pub q: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn list_tickets(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListTicketsParams>,
) -> Result<Json<crate::pagination::PaginatedResponse<TicketWithDetails>>, Response> {
    let limit = params.limit.unwrap_or(50).clamp(1, 200);
    let offset = params.offset.unwrap_or(0).max(0);

    // Validaciones
    if let Some(ref s) = params.status {
        validate_enum("status", s, TICKET_STATUSES)?;
    }
    if let Some(ref p) = params.priority {
        validate_enum("priority", p, PRIORITIES)?;
    }
    if let Some(ref c) = params.category {
        validate_enum("category", c, TICKET_CATEGORIES)?;
    }
    if let Some(l) = params.level {
        if !crate::validation::TICKET_LEVELS.contains(&l) {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "Nivel inválido: debe ser 1 o 2".to_string(),
            ));
        }
    }

    let mut where_parts: Vec<String> = vec!["t.deleted_at IS NULL".to_string()];
    let mut binds: Vec<String> = Vec::new();

    // Non-admin solo ve sus tickets (reportados o asignados)
    let is_admin = claims.role == "admin";
    let is_level_user = {
        // Verificar si es asignado configurado para algún nivel
        let l1 = get_assignee_for_level(&state.db, 1).await;
        let l2 = get_assignee_for_level(&state.db, 2).await;
        l1.as_deref() == Some(&claims.sub) || l2.as_deref() == Some(&claims.sub)
    };

    if !is_admin && !is_level_user {
        where_parts.push("(t.reporter_id = ? OR t.assignee_id = ?)".to_string());
        binds.push(claims.sub.clone());
        binds.push(claims.sub.clone());
    } else if !is_admin && is_level_user {
        // Nivel users ven todo (para gestionar cola), pero filtramos por nivel si piden?
        // Por ahora ven todo, pero podríamos filtrar solo los de su nivel si no es admin
        // Dejamos ver todo para nivel users
    }

    if let Some(pid) = params.project_id {
        where_parts.push("t.project_id = ?".to_string());
        binds.push(pid);
    }
    if let Some(l) = params.level {
        where_parts.push("t.level = ?".to_string());
        binds.push(l.to_string());
    }
    if let Some(s) = params.status.clone() {
        where_parts.push("t.status = ?".to_string());
        binds.push(s);
    }
    if let Some(p) = params.priority.clone() {
        where_parts.push("t.priority = ?".to_string());
        binds.push(p);
    }
    if let Some(c) = params.category.clone() {
        where_parts.push("t.category = ?".to_string());
        binds.push(c);
    }
    if let Some(q) = params.q.clone() {
        let qq = format!("%{}%", q.trim());
        where_parts.push("(t.title LIKE ? OR t.description LIKE ? OR t.code LIKE ?)".to_string());
        binds.push(qq.clone());
        binds.push(qq.clone());
        binds.push(qq);
    }

    let where_sql = where_parts.join(" AND ");

    // Total
    let count_sql = format!("SELECT COUNT(*) FROM tickets t WHERE {}", where_sql);
    let mut q = sqlx::query_as::<_, (i64,)>(&count_sql);
    for b in &binds {
        q = q.bind(b);
    }
    let total: (i64,) = q
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    // Rows
    let sql = format!("SELECT t.id, t.code, t.title, t.description, t.status, t.priority, t.level, t.category, t.project_id, t.reporter_id, t.assignee_id, t.due_date, t.resolution, t.created_at, t.updated_at, t.closed_at, t.deleted_at FROM tickets t WHERE {} ORDER BY t.created_at DESC LIMIT ? OFFSET ?", where_sql);
    let mut q = sqlx::query_as::<_, Ticket>(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    q = q.bind(limit).bind(offset);
    let rows = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let mut items = Vec::with_capacity(rows.len());
    for t in rows {
        items.push(build_ticket_with_details(&state.db, t).await?);
    }

    Ok(Json(crate::pagination::PaginatedResponse {
        items,
        total: total.0,
        limit,
        offset,
    }))
}

pub async fn get_ticket(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<TicketWithDetails>, Response> {
    let ticket: Option<Ticket> = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let ticket = match ticket {
        Some(t) => t,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Ticket no encontrado".to_string(),
            ))
        }
    };

    // Access check: reporter, assignee, or admin
    let is_admin = claims.role == "admin";
    let l1 = get_assignee_for_level(&state.db, 1).await;
    let l2 = get_assignee_for_level(&state.db, 2).await;
    let is_level_user = l1.as_deref() == Some(&claims.sub) || l2.as_deref() == Some(&claims.sub);
    if !is_admin
        && !is_level_user
        && ticket.reporter_id != claims.sub
        && ticket.assignee_id.as_deref() != Some(&claims.sub)
    {
        return Err(error_response(
            StatusCode::FORBIDDEN,
            "No tienes acceso a este ticket".to_string(),
        ));
    }

    Ok(Json(build_ticket_with_details(&state.db, ticket).await?))
}

#[derive(Debug, Deserialize)]
pub struct CreateTicketRequest {
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub category: Option<String>,
    pub level: Option<i64>,
    pub project_id: String,
    pub due_date: Option<String>,
}

pub async fn create_ticket(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTicketRequest>,
) -> Result<(StatusCode, Json<TicketWithDetails>), Response> {
    validate_required("title", &payload.title, 200)?;
    if let Some(ref d) = payload.description {
        if d.chars().count() > 5000 {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "description supera 5000 caracteres".to_string(),
            ));
        }
    }
    let priority = payload.priority.as_deref().unwrap_or("medium");
    validate_enum("priority", priority, PRIORITIES)?;
    if let Some(ref cat) = payload.category {
        validate_enum("category", cat, TICKET_CATEGORIES)?;
    }
    let level = payload.level.unwrap_or(1);
    if !crate::validation::TICKET_LEVELS.contains(&level) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "Nivel inválido: debe ser 1 o 2".to_string(),
        ));
    }
    // Validar proyecto existe y activo
    let project: Option<(String, String)> = sqlx::query_as(
        "SELECT id, name FROM projects WHERE id = ? AND deleted_at IS NULL AND status = 'active'",
    )
    .bind(&payload.project_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let (project_id, project_name) = match project {
        Some((id, name)) => (id, name),
        None => {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "Proyecto no encontrado o inactivo".to_string(),
            ))
        }
    };

    // Determinar assignee según nivel configurado
    let assignee_id = get_assignee_for_level(&state.db, level).await;

    // Generar code TKT-XXXX
    let max_code: Option<(String,)> =
        sqlx::query_as("SELECT code FROM tickets ORDER BY code DESC LIMIT 1")
            .fetch_optional(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let next_num = if let Some((code,)) = max_code {
        code.strip_prefix("TKT-")
            .and_then(|n| n.parse::<i32>().ok())
            .unwrap_or(0)
            + 1
    } else {
        1
    };
    let code = format!("TKT-{:04}", next_num);
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO tickets (id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, 'abierto', ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&code)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(priority)
    .bind(level)
    .bind(&payload.category)
    .bind(&project_id)
    .bind(&claims.sub)
    .bind(&assignee_id)
    .bind(&payload.due_date)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    log_ticket_activity(
        &state.db,
        &id,
        &claims.sub,
        "created",
        None,
        None,
        None,
        None,
    )
    .await;

    let ticket: Ticket = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let details = build_ticket_with_details(&state.db, ticket).await?;

    // Notificar (in-app + email Brevo) al assignee si existe
    if let Some(assignee) = assignee_id {
        let proj_name = project_name.clone();
        let title = payload.title.clone();
        let code_clone = code.clone();
        let db_clone = state.db.clone();
        let reporter = claims.sub.clone();
        tokio::spawn(async move {
            notify_ticket(
                &db_clone,
                &assignee,
                &reporter,
                &id,
                &code_clone,
                &title,
                &proj_name,
                level,
                "created",
            )
            .await;
        });
    }

    Ok((StatusCode::CREATED, Json(details)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateTicketRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub category: Option<String>,
    pub level: Option<i64>,
    pub due_date: Option<String>,
    pub project_id: Option<String>,
}

pub async fn update_ticket(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateTicketRequest>,
) -> Result<Json<TicketWithDetails>, Response> {
    let existing: Option<Ticket> = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let existing = match existing {
        Some(t) => t,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Ticket no encontrado".to_string(),
            ))
        }
    };

    // Solo reporter, assignee o admin puede editar
    let is_admin = claims.role == "admin";
    if !is_admin
        && existing.reporter_id != claims.sub
        && existing.assignee_id.as_deref() != Some(&claims.sub)
    {
        return Err(error_response(
            StatusCode::FORBIDDEN,
            "No tienes permisos para editar este ticket".to_string(),
        ));
    }

    if let Some(ref title) = payload.title {
        validate_required("title", title, 200)?;
    }
    if let Some(ref p) = payload.priority {
        validate_enum("priority", p, PRIORITIES)?;
    }
    if let Some(ref c) = payload.category {
        validate_enum("category", c, TICKET_CATEGORIES)?;
    }
    if let Some(l) = payload.level {
        if !crate::validation::TICKET_LEVELS.contains(&l) {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "Nivel inválido".to_string(),
            ));
        }
    }
    if let Some(ref pid) = payload.project_id {
        let exists: Option<(String,)> =
            sqlx::query_as("SELECT id FROM projects WHERE id = ? AND deleted_at IS NULL")
                .bind(pid)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
        if exists.is_none() {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "Proyecto no encontrado".to_string(),
            ));
        }
    }

    let mut sets: Vec<&str> = Vec::new();
    let mut binds: Vec<String> = Vec::new();
    let mut level_changed = false;
    let mut new_level = existing.level;
    let mut new_assignee: Option<String> = existing.assignee_id.clone();

    if let Some(title) = payload.title {
        sets.push("title = ?");
        binds.push(title);
    }
    if let Some(desc) = payload.description {
        sets.push("description = ?");
        binds.push(desc);
    }
    if let Some(p) = payload.priority {
        sets.push("priority = ?");
        binds.push(p);
    }
    if let Some(c) = payload.category {
        sets.push("category = ?");
        binds.push(c);
    }
    if let Some(due) = payload.due_date {
        sets.push("due_date = ?");
        binds.push(due);
    }
    if let Some(pid) = payload.project_id {
        sets.push("project_id = ?");
        binds.push(pid);
    }
    if let Some(l) = payload.level {
        if l != existing.level {
            level_changed = true;
            new_level = l;
            // Reasignar según nivel
            new_assignee = get_assignee_for_level(&state.db, l).await;
            sets.push("level = ?");
            binds.push(l.to_string());
            // assignee_id será seteado abajo
        }
    }

    if sets.is_empty() && !level_changed {
        // Nada que actualizar, devolver existente
        return Ok(Json(build_ticket_with_details(&state.db, existing).await?));
    }

    // Si hubo cambio de nivel, también actualizar assignee
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let mut sql = format!(
        "UPDATE tickets SET {} , updated_at = ? WHERE id = ?",
        sets.join(", ")
    );
    if sets.is_empty() {
        sql = "UPDATE tickets SET updated_at = ?, level = ?, assignee_id = ? WHERE id = ?"
            .to_string();
        let q = sqlx::query(&sql)
            .bind(&now)
            .bind(new_level)
            .bind(&new_assignee)
            .bind(&id);
        q.execute(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    } else {
        // Construir query con assignee si level cambió
        if level_changed {
            sets.push("level = ?");
            binds.push(new_level.to_string());
            sets.push("assignee_id = ?");
            // Para assignee_id, si es None, necesitamos bind NULL -> usar Option
            // Reconstruir sets sin el último y manejar aparte
            // Simplificar: hacer dos queries o usar sqlx con Option
            // Vamos a hacer update separado para level/assignee
            let sql_main = format!(
                "UPDATE tickets SET {} , updated_at = ? WHERE id = ?",
                sets[..sets.len() - 2].join(", ")
            );
            let mut q = sqlx::query(&sql_main);
            for b in &binds[..binds.len() - 2] {
                q = q.bind(b);
            }
            q = q.bind(&now).bind(&id);
            q.execute(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
            // Ahora level y assignee
            sqlx::query(
                "UPDATE tickets SET level = ?, assignee_id = ?, updated_at = ? WHERE id = ?",
            )
            .bind(new_level)
            .bind(&new_assignee)
            .bind(&now)
            .bind(&id)
            .execute(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
        } else {
            let sql = format!(
                "UPDATE tickets SET {} , updated_at = ? WHERE id = ?",
                sets.join(", ")
            );
            let mut q = sqlx::query(&sql);
            for b in &binds {
                q = q.bind(b);
            }
            q = q.bind(&now).bind(&id);
            q.execute(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
        }
    }

    if level_changed {
        log_ticket_activity(
            &state.db,
            &id,
            &claims.sub,
            "level_changed",
            Some("level"),
            Some(&existing.level.to_string()),
            Some(&new_level.to_string()),
            None,
        )
        .await;
        if let Some(assignee) = new_assignee.clone() {
            // Notificar nuevo assignee
            let ticket_code = existing.code.clone();
            let title = existing.title.clone();
            // Necesitamos project name
            let proj_name: Option<(String,)> =
                sqlx::query_as("SELECT name FROM projects WHERE id = ?")
                    .bind(&existing.project_id)
                    .fetch_optional(&state.db)
                    .await
                    .map_err(|e| internal_error(&format!("db error: {e}")))?;
            let proj_name = proj_name
                .map(|(n,)| n)
                .unwrap_or_else(|| "Proyecto".to_string());
            let db_clone = state.db.clone();
            let reporter = existing.reporter_id.clone();
            let ticket_id = id.clone();
            let code_clone = ticket_code.clone();
            let title_clone = title.clone();
            let assignee_owned = assignee.clone();
            tokio::spawn(async move {
                notify_ticket(
                    &db_clone,
                    &assignee_owned,
                    &reporter,
                    &ticket_id,
                    &code_clone,
                    &title_clone,
                    &proj_name,
                    new_level,
                    "escalated",
                )
                .await;
            });
        }
    }

    let updated: Ticket = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(build_ticket_with_details(&state.db, updated).await?))
}

#[derive(Debug, Deserialize)]
pub struct UpdateStatusRequest {
    pub status: String,
    pub resolution: Option<String>,
}

pub async fn update_ticket_status(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<Json<TicketWithDetails>, Response> {
    validate_enum("status", &payload.status, TICKET_STATUSES)?;

    let existing: Option<Ticket> = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let existing = match existing {
        Some(t) => t,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Ticket no encontrado".to_string(),
            ))
        }
    };

    // Permiso: assignee, reporter, o admin puede cambiar status
    let is_admin = claims.role == "admin";
    if !is_admin
        && existing.assignee_id.as_deref() != Some(&claims.sub)
        && existing.reporter_id != claims.sub
    {
        return Err(error_response(
            StatusCode::FORBIDDEN,
            "No tienes permisos para cambiar el estado".to_string(),
        ));
    }

    // Validar transición simple: no permitir volver de cerrado a abierto sin admin?
    // Por ahora permitir cualquier transición válida, excepto que cerrado solo puede ser seteado si antes estaba resuelto o por admin
    if payload.status == "cerrado" && existing.status != "resuelto" && !is_admin {
        // Permitir solo si ya estaba resuelto o es assignee?
        // Simplificar: solo admin o reporter puede cerrar desde resuelto
        if existing.status != "resuelto" {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "Solo se puede cerrar un ticket resuelto".to_string(),
            ));
        }
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let closed_at = if payload.status == "cerrado" || payload.status == "resuelto" {
        Some(now.clone())
    } else {
        None
    };

    sqlx::query(
        "UPDATE tickets SET status = ?, resolution = ?, updated_at = ?, closed_at = ? WHERE id = ?",
    )
    .bind(&payload.status)
    .bind(&payload.resolution)
    .bind(&now)
    .bind(&closed_at)
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    log_ticket_activity(
        &state.db,
        &id,
        &claims.sub,
        "status_changed",
        Some("status"),
        Some(&existing.status),
        Some(&payload.status),
        payload.resolution.as_deref(),
    )
    .await;

    // Notificar
    if let Some(assignee) = existing.assignee_id.clone() {
        // Notificar a reporter y assignee (si son distintos)
        let proj_name: Option<(String,)> = sqlx::query_as("SELECT name FROM projects WHERE id = ?")
            .bind(&existing.project_id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
        let proj_name = proj_name
            .map(|(n,)| n)
            .unwrap_or_else(|| "Proyecto".to_string());
        let db_clone = state.db.clone();
        let ticket_id = id.clone();
        let code = existing.code.clone();
        let title = existing.title.clone();
        let level = existing.level;
        let reporter = existing.reporter_id.clone();
        // Notificar assignee si no es quien hizo el cambio
        if assignee != claims.sub {
            let db2 = db_clone.clone();
            let code2 = code.clone();
            let title2 = title.clone();
            let proj2 = proj_name.clone();
            let reporter2 = reporter.clone();
            let ticket_id2 = ticket_id.clone();
            let assignee2 = assignee.clone();
            tokio::spawn(async move {
                notify_ticket(
                    &db2,
                    &assignee2,
                    &reporter2,
                    &ticket_id2,
                    &code2,
                    &title2,
                    &proj2,
                    level,
                    "status_changed",
                )
                .await;
            });
        }
        // Notificar reporter si no es assignee ni quien hizo cambio
        if reporter != claims.sub && reporter != assignee {
            let db3 = db_clone.clone();
            tokio::spawn(async move {
                notify_ticket(
                    &db3,
                    &reporter,
                    &claims.sub,
                    &ticket_id,
                    &code,
                    &title,
                    &proj_name,
                    level,
                    "status_changed",
                )
                .await;
            });
        }
    }

    let updated: Ticket = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(build_ticket_with_details(&state.db, updated).await?))
}

pub async fn delete_ticket(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    let existing: Option<Ticket> = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let existing = match existing {
        Some(t) => t,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Ticket no encontrado".to_string(),
            ))
        }
    };
    // Solo admin o reporter puede borrar (soft delete)
    if claims.role != "admin" && existing.reporter_id != claims.sub {
        return Err(error_response(
            StatusCode::FORBIDDEN,
            "Solo el reportero o admin puede eliminar".to_string(),
        ));
    }
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    sqlx::query("UPDATE tickets SET deleted_at = ?, updated_at = ? WHERE id = ?")
        .bind(&now)
        .bind(&now)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    log_ticket_activity(
        &state.db,
        &id,
        &claims.sub,
        "deleted",
        None,
        None,
        None,
        None,
    )
    .await;

    Ok(StatusCode::NO_CONTENT)
}

// Actividad y comentarios

pub async fn list_ticket_activity(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<Vec<TicketActivityWithUser>>, Response> {
    // Verificar acceso
    let ticket: Option<Ticket> = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let ticket = match ticket {
        Some(t) => t,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Ticket no encontrado".to_string(),
            ))
        }
    };
    let is_admin = claims.role == "admin";
    if !is_admin
        && ticket.reporter_id != claims.sub
        && ticket.assignee_id.as_deref() != Some(&claims.sub)
    {
        // Permitir a nivel users ver? Si es nivel 1/2, ver todo?
        let l1 = get_assignee_for_level(&state.db, 1).await;
        let l2 = get_assignee_for_level(&state.db, 2).await;
        let is_level = l1.as_deref() == Some(&claims.sub) || l2.as_deref() == Some(&claims.sub);
        if !is_level {
            return Err(error_response(
                StatusCode::FORBIDDEN,
                "No tienes acceso".to_string(),
            ));
        }
    }

    let activities: Vec<TicketActivity> = sqlx::query_as::<_, TicketActivity>(
        "SELECT id, ticket_id, user_id, action, field_changed, old_value, new_value, metadata, created_at FROM ticket_activity WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 100"
    )
    .bind(&id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user_ids: Vec<&str> = activities.iter().map(|a| a.user_id.as_str()).collect();
    let users = batch_users(&state.db, &user_ids).await;
    let mut result = Vec::with_capacity(activities.len());
    for a in activities {
        if let Some(u) = users.get(&a.user_id) {
            result.push(TicketActivityWithUser {
                activity: a,
                user: u.clone(),
            });
        }
    }
    Ok(Json(result))
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub body: String,
}

pub async fn list_ticket_comments(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<Vec<TicketCommentWithAuthor>>, Response> {
    let ticket: Option<Ticket> = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let ticket = match ticket {
        Some(t) => t,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Ticket no encontrado".to_string(),
            ))
        }
    };
    let is_admin = claims.role == "admin";
    if !is_admin
        && ticket.reporter_id != claims.sub
        && ticket.assignee_id.as_deref() != Some(&claims.sub)
    {
        let l1 = get_assignee_for_level(&state.db, 1).await;
        let l2 = get_assignee_for_level(&state.db, 2).await;
        let is_level = l1.as_deref() == Some(&claims.sub) || l2.as_deref() == Some(&claims.sub);
        if !is_level {
            return Err(error_response(
                StatusCode::FORBIDDEN,
                "No tienes acceso".to_string(),
            ));
        }
    }

    let comments: Vec<TicketComment> = sqlx::query_as::<_, TicketComment>(
        "SELECT id, ticket_id, author_id, body, created_at, updated_at, deleted_at FROM ticket_comments WHERE ticket_id = ? AND deleted_at IS NULL ORDER BY created_at ASC"
    )
    .bind(&id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user_ids: Vec<&str> = comments.iter().map(|c| c.author_id.as_str()).collect();
    let users = batch_users(&state.db, &user_ids).await;
    let mut result = Vec::with_capacity(comments.len());
    for c in comments {
        if let Some(u) = users.get(&c.author_id) {
            result.push(TicketCommentWithAuthor {
                comment: c,
                author: u.clone(),
            });
        }
    }
    Ok(Json(result))
}

pub async fn create_ticket_comment(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<CreateCommentRequest>,
) -> Result<(StatusCode, Json<TicketCommentWithAuthor>), Response> {
    validate_required("body", &payload.body, 5000)?;
    let ticket: Option<Ticket> = sqlx::query_as::<_, Ticket>(
        "SELECT id, code, title, description, status, priority, level, category, project_id, reporter_id, assignee_id, due_date, resolution, created_at, updated_at, closed_at, deleted_at FROM tickets WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let ticket = match ticket {
        Some(t) => t,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Ticket no encontrado".to_string(),
            ))
        }
    };
    // Cualquiera con acceso al ticket puede comentar
    let is_admin = claims.role == "admin";
    if !is_admin
        && ticket.reporter_id != claims.sub
        && ticket.assignee_id.as_deref() != Some(&claims.sub)
    {
        let l1 = get_assignee_for_level(&state.db, 1).await;
        let l2 = get_assignee_for_level(&state.db, 2).await;
        let is_level = l1.as_deref() == Some(&claims.sub) || l2.as_deref() == Some(&claims.sub);
        if !is_level {
            return Err(error_response(
                StatusCode::FORBIDDEN,
                "No tienes acceso".to_string(),
            ));
        }
    }

    let comment_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    sqlx::query(
        "INSERT INTO ticket_comments (id, ticket_id, author_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&comment_id)
    .bind(&id)
    .bind(&claims.sub)
    .bind(&payload.body)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    log_ticket_activity(
        &state.db,
        &id,
        &claims.sub,
        "commented",
        None,
        None,
        None,
        Some(&payload.body),
    )
    .await;

    // Notificar al otro participante
    let other = if ticket.reporter_id == claims.sub {
        ticket.assignee_id.clone()
    } else {
        Some(ticket.reporter_id.clone())
    };
    if let Some(other_id) = other {
        if other_id != claims.sub {
            let _ = crate::routes::notifications::create_notification(
                &state.db,
                &other_id,
                "ticket_comment",
                Some(&id),
                Some(&claims.sub),
                &format!(
                    "Nuevo comentario en {}: {}",
                    ticket.code,
                    payload.body.chars().take(80).collect::<String>()
                ),
            )
            .await;
        }
    }

    let comment: TicketComment = sqlx::query_as::<_, TicketComment>(
        "SELECT id, ticket_id, author_id, body, created_at, updated_at, deleted_at FROM ticket_comments WHERE id = ?"
    )
    .bind(&comment_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let users = batch_users(&state.db, &[comment.author_id.as_str()]).await;
    let author = users
        .get(&comment.author_id)
        .cloned()
        .ok_or_else(|| internal_error("author not found"))?;

    Ok((
        StatusCode::CREATED,
        Json(TicketCommentWithAuthor { comment, author }),
    ))
}

// Config de niveles

pub async fn get_ticket_config(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
) -> Result<Json<Vec<TicketLevelConfigWithUser>>, Response> {
    let configs: Vec<TicketLevelConfig> = sqlx::query_as::<_, TicketLevelConfig>(
        "SELECT level, user_id, updated_by, updated_at FROM ticket_level_config ORDER BY level ASC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    // Si no hay config, devolver defaults con lookup
    let mut result = Vec::new();
    for level in [1, 2] {
        if let Some(c) = configs.iter().find(|x| x.level == level) {
            let user: Option<crate::models::User> = sqlx::query_as::<_, crate::models::User>(
                "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id = ? AND deleted_at IS NULL"
            )
            .bind(&c.user_id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
            if let Some(u) = user {
                result.push(TicketLevelConfigWithUser {
                    level: c.level,
                    user_id: c.user_id.clone(),
                    user_name: u.name,
                    user_email: u.email,
                    updated_by: c.updated_by.clone(),
                    updated_at: c.updated_at.clone(),
                });
            }
        } else {
            // Fallback default
            if let Some(uid) = get_assignee_for_level(&state.db, level).await {
                if let Some(u) = sqlx::query_as::<_, crate::models::User>(
                    "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id = ?"
                )
                .bind(&uid)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?
                {
                    result.push(TicketLevelConfigWithUser {
                        level,
                        user_id: u.id.clone(),
                        user_name: u.name,
                        user_email: u.email,
                        updated_by: None,
                        updated_at: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                    });
                }
            }
        }
    }
    Ok(Json(result))
}

#[derive(Debug, Deserialize)]
pub struct UpdateTicketConfigRequest {
    pub level: i64,
    pub user_id: String,
}

pub async fn update_ticket_config(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateTicketConfigRequest>,
) -> Result<Json<TicketLevelConfigWithUser>, Response> {
    require_admin(&claims)?;
    if !crate::validation::TICKET_LEVELS.contains(&payload.level) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "Nivel debe ser 1 o 2".to_string(),
        ));
    }
    // Validar usuario existe
    let user: Option<crate::models::User> = sqlx::query_as::<_, crate::models::User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&payload.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let user = match user {
        Some(u) => u,
        None => {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "Usuario no encontrado".to_string(),
            ))
        }
    };

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    sqlx::query(
        "INSERT INTO ticket_level_config (level, user_id, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(level) DO UPDATE SET user_id = excluded.user_id, updated_by = excluded.updated_by, updated_at = excluded.updated_at"
    )
    .bind(payload.level)
    .bind(&payload.user_id)
    .bind(&claims.sub)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(TicketLevelConfigWithUser {
        level: payload.level,
        user_id: user.id.clone(),
        user_name: user.name,
        user_email: user.email,
        updated_by: Some(claims.sub),
        updated_at: now,
    }))
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{get, patch},
    };

    axum::Router::new()
        .route("/api/tickets", get(list_tickets).post(create_ticket))
        .route(
            "/api/tickets/config",
            get(get_ticket_config).post(update_ticket_config),
        )
        .route(
            "/api/tickets/:id",
            get(get_ticket).patch(update_ticket).delete(delete_ticket),
        )
        .route("/api/tickets/:id/status", patch(update_ticket_status))
        .route("/api/tickets/:id/activity", get(list_ticket_activity))
        .route(
            "/api/tickets/:id/comments",
            get(list_ticket_comments).post(create_ticket_comment),
        )
        .layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
