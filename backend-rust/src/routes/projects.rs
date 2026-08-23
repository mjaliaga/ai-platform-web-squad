use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::auth::require_auth;
use crate::models::{
    Claims, Project, ProjectMemberWithUser, ProjectWithStats,
};
use crate::validation::{error_response, internal_error, require_admin, validate_required};
use crate::AppState;

const MEMBER_ROLES: &[&str] = &["lead", "dev", "design", "qa", "viewer", "arquitecto"];

async fn load_members(
    db: &sqlx::SqlitePool,
    project_id: &str,
) -> Result<Vec<ProjectMemberWithUser>, Response> {
    let rows: Vec<ProjectMemberWithUser> = sqlx::query_as(
        "SELECT pm.user_id, pm.role, u.name, u.email, u.avatar_color \
         FROM project_members pm INNER JOIN users u ON u.id = pm.user_id \
         WHERE pm.project_id = ? ORDER BY pm.role = 'lead' DESC, u.name"
    )
    .bind(project_id)
    .fetch_all(db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(rows)
}

async fn build_project_with_stats(
    db: &sqlx::SqlitePool,
    project: Project,
) -> Result<ProjectWithStats, Response> {
    let stats: (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*), SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) FROM tasks WHERE project_id = ?"
    )
    .bind(&project.id)
    .fetch_one(db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let members = load_members(db, &project.id).await?;

    Ok(ProjectWithStats {
        project,
        task_count: stats.0,
        done_count: stats.1,
        members,
    })
}

pub async fn list_projects(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<crate::pagination::PaginatedResponse<ProjectWithStats>>, Response> {
    let limit: i64 = params
        .get("limit")
        .and_then(|v| v.parse().ok())
        .unwrap_or(50)
        .clamp(1, 200);
    let offset: i64 = params
        .get("offset")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0)
        .max(0);

    let rows: Vec<Project> = if claims.role == "admin" {
        sqlx::query_as::<_, Project>(
            "SELECT id, name, description, color, status, sector, code, po_user_id, created_at \
             FROM projects WHERE status = 'active' AND deleted_at IS NULL \
             ORDER BY name LIMIT ? OFFSET ?"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as::<_, Project>(
            "SELECT DISTINCT p.id, p.name, p.description, p.color, p.status, p.sector, p.code, p.po_user_id, p.created_at \
             FROM projects p \
             LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL \
             LEFT JOIN project_members pm ON pm.project_id = p.id \
             WHERE p.status = 'active' AND p.deleted_at IS NULL AND (t.assignee_id = ? OR pm.user_id = ?) \
             ORDER BY p.name LIMIT ? OFFSET ?"
        )
        .bind(&claims.sub)
        .bind(&claims.sub)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let total: i64 = if claims.role == "admin" {
        let r: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM projects WHERE status = 'active' AND deleted_at IS NULL"
        )
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
        r.0
    } else {
        let r: (i64,) = sqlx::query_as(
            "SELECT COUNT(DISTINCT p.id) FROM projects p \
             LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL \
             LEFT JOIN project_members pm ON pm.project_id = p.id \
             WHERE p.status = 'active' AND p.deleted_at IS NULL AND (t.assignee_id = ? OR pm.user_id = ?)"
        )
        .bind(&claims.sub)
        .bind(&claims.sub)
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
        r.0
    };

    let mut items = Vec::with_capacity(rows.len());
    for p in rows {
        items.push(build_project_with_stats(&state.db, p).await?);
    }

    Ok(Json(crate::pagination::PaginatedResponse {
        items,
        total,
        limit,
        offset,
    }))
}

pub async fn get_project(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ProjectWithStats>, Response> {
    let project: Option<Project> = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at FROM projects WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match project {
        Some(p) => Ok(Json(build_project_with_stats(&state.db, p).await?)),
        None => Err(error_response(
            StatusCode::NOT_FOUND,
            "Proyecto no encontrado".to_string(),
        )),
    }
}

#[derive(Debug, Deserialize)]
pub struct MemberEntry {
    pub user_id: String,
    #[serde(default = "default_member_role")]
    pub role: String,
}
fn default_member_role() -> String { "dev".to_string() }

#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default = "default_sector")]
    pub sector: String,
    #[serde(default)]
    pub code: Option<String>,
    #[serde(default)]
    pub po_user_id: Option<String>,
    #[serde(default)]
    pub members: Option<Vec<MemberEntry>>,
}
fn default_sector() -> String { "Proyecto".to_string() }

pub async fn create_project(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateProjectRequest>,
) -> Result<(StatusCode, Json<ProjectWithStats>), Response> {
    validate_required("name", &payload.name, 100)?;

    let color = payload.color.as_deref().unwrap_or("#dc2626");
    if !color.starts_with('#') || color.len() != 7 {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "color debe ser un hex (#rrggbb)".to_string(),
        ));
    }

    const SECTORS: &[&str] = &["Proyecto", "PoC", "Laboratorio"];
    if !SECTORS.contains(&payload.sector.as_str()) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            format!("Sector inválido '{}'. Debe ser: {}", payload.sector, SECTORS.join(", ")),
        ));
    }

    if let Some(members) = &payload.members {
        for m in members {
            if !MEMBER_ROLES.contains(&m.role.as_str()) {
                return Err(error_response(
                    StatusCode::BAD_REQUEST,
                    format!("Rol inválido '{}'. Debe ser: {}", m.role, MEMBER_ROLES.join(", ")),
                ));
            }
            let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM users WHERE id = ?")
                .bind(&m.user_id)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
            if exists.is_none() {
                return Err(error_response(
                    StatusCode::BAD_REQUEST,
                    format!("Usuario {} no existe", m.user_id),
                ));
            }
        }
    }

    let id = Uuid::new_v4().to_string();
    let description = payload.description.unwrap_or_default();

    sqlx::query(
        "INSERT INTO projects (id, name, description, color, sector, code, po_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&description)
    .bind(color)
    .bind(&payload.sector)
    .bind(payload.code.as_deref().unwrap_or(""))
    .bind(&payload.po_user_id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if let Some(members) = &payload.members {
        for m in members {
            sqlx::query(
                "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)"
            )
            .bind(&id)
            .bind(&m.user_id)
            .bind(&m.role)
            .execute(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
        }
    }

    // Auto-add creator as lead if no members specified
    if payload.members.as_ref().map_or(true, |m| m.is_empty()) {
        sqlx::query(
            "INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, 'lead')"
        )
        .bind(&id)
        .bind(&claims.sub)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let row = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at FROM projects WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(build_project_with_stats(&state.db, row).await?)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub sector: Option<String>,
    #[serde(default)]
    pub code: Option<String>,
    #[serde(default)]
    pub po_user_id: Option<Option<String>>,
}

pub async fn update_project(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateProjectRequest>,
) -> Result<Json<ProjectWithStats>, Response> {
    if let Some(name) = &payload.name {
        validate_required("name", name, 100)?;
    }
    if let Some(color) = &payload.color {
        if !color.starts_with('#') || color.len() != 7 {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "color debe ser un hex (#rrggbb)".to_string(),
            ));
        }
    }
    if let Some(status) = &payload.status {
        if status != "active" && status != "archived" {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "status debe ser 'active' o 'archived'".to_string(),
            ));
        }
    }

    let existing: Option<(String,)> = sqlx::query_as("SELECT id FROM projects WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if existing.is_none() {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Proyecto no encontrado".to_string(),
        ));
    }

    let mut sets: Vec<&str> = Vec::new();
    let mut bindings: Vec<serde_json::Value> = Vec::new();
    if let Some(name) = &payload.name {
        sets.push("name = ?");
        bindings.push(serde_json::json!(name));
    }
    if let Some(desc) = &payload.description {
        sets.push("description = ?");
        bindings.push(serde_json::json!(desc));
    }
    if let Some(color) = &payload.color {
        sets.push("color = ?");
        bindings.push(serde_json::json!(color));
    }
    if let Some(status) = &payload.status {
        sets.push("status = ?");
        bindings.push(serde_json::json!(status));
    }
    if let Some(sector) = &payload.sector {
        const SECTORS: &[&str] = &["Proyecto", "PoC", "Laboratorio"];
        if !SECTORS.contains(&sector.as_str()) {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                format!("Sector inválido '{}'. Debe ser: {}", sector, SECTORS.join(", ")),
            ));
        }
        sets.push("sector = ?");
        bindings.push(serde_json::json!(sector));
    }
    if let Some(code) = &payload.code {
        sets.push("code = ?");
        bindings.push(serde_json::json!(code));
    }
    if let Some(po) = &payload.po_user_id {
        sets.push("po_user_id = ?");
        bindings.push(serde_json::json!(po));
    }

    if !sets.is_empty() {
        let sql = format!("UPDATE projects SET {} WHERE id = ?", sets.join(", "));
        let mut q = sqlx::query(&sql);
        for b in &bindings {
            if b.is_null() {
                q = q.bind(Option::<String>::None);
            } else if let Some(s) = b.as_str() {
                q = q.bind(s);
            }
        }
        q = q.bind(&id);
        q.execute(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let row = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at FROM projects WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(build_project_with_stats(&state.db, row).await?))
}

pub async fn delete_project(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM projects WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if exists.is_none() {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Proyecto no encontrado".to_string(),
        ));
    }

    sqlx::query("UPDATE tasks SET project_id = NULL WHERE project_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE sprints SET project_id = NULL WHERE project_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct AddMemberRequest {
    pub user_id: String,
    #[serde(default = "default_member_role")]
    pub role: String,
}

pub async fn add_member(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<String>,
    Json(payload): Json<AddMemberRequest>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    if !MEMBER_ROLES.contains(&payload.role.as_str()) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            format!("Rol inválido '{}'. Debe ser: {}", payload.role, MEMBER_ROLES.join(", ")),
        ));
    }

    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM users WHERE id = ?")
        .bind(&payload.user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if exists.is_none() {
        return Err(error_response(StatusCode::NOT_FOUND, "Usuario no encontrado".to_string()));
    }

    let proj_exists: Option<(String,)> = sqlx::query_as("SELECT id FROM projects WHERE id = ?")
        .bind(&project_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if proj_exists.is_none() {
        return Err(error_response(StatusCode::NOT_FOUND, "Proyecto no encontrado".to_string()));
    }

    sqlx::query(
        "INSERT OR REPLACE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)"
    )
    .bind(&project_id)
    .bind(&payload.user_id)
    .bind(&payload.role)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemberRoleRequest {
    pub role: String,
}

pub async fn update_member_role(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((project_id, user_id)): Path<(String, String)>,
    Json(payload): Json<UpdateMemberRoleRequest>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    if !MEMBER_ROLES.contains(&payload.role.as_str()) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            format!("Rol inválido '{}'. Debe ser: {}", payload.role, MEMBER_ROLES.join(", ")),
        ));
    }

    let result = sqlx::query(
        "UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?"
    )
    .bind(&payload.role)
    .bind(&project_id)
    .bind(&user_id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(StatusCode::NOT_FOUND, "Miembro no encontrado en este proyecto".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_member(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((project_id, user_id)): Path<(String, String)>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    let result = sqlx::query(
        "DELETE FROM project_members WHERE project_id = ? AND user_id = ?"
    )
    .bind(&project_id)
    .bind(&user_id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(StatusCode::NOT_FOUND, "Miembro no encontrado en este proyecto".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_projects_simple(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Project>>, Response> {
    let rows: Vec<Project> = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at FROM projects WHERE status = 'active' ORDER BY name"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(rows))
}

pub async fn list_solicitudes(
    State(state): State<Arc<AppState>>,
    Path(project_id): Path<String>,
) -> Result<Json<Vec<crate::models::TaskWithDetails>>, Response> {
    let tasks: Vec<crate::models::Task> = sqlx::query_as::<_, crate::models::Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at \
         FROM tasks WHERE project_id = ? AND type = 'solicitud' AND deleted_at IS NULL \
         ORDER BY CASE status \
           WHEN 'pendiente' THEN 0 \
           WHEN 'en_revision' THEN 1 \
           WHEN 'aprobada' THEN 2 \
           WHEN 'rechazada' THEN 3 \
           WHEN 'resuelta' THEN 4 \
           ELSE 5 END, created_at DESC"
    )
    .bind(&project_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let result = crate::routes::tasks::batch_load_task_details(&state.db, tasks).await?;

    Ok(Json(result))
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{get, patch, post},
    };

    axum::Router::new()
        .route("/api/projects", get(list_projects).post(create_project))
        .route("/api/projects/list", get(list_projects_simple))
        .route(
            "/api/projects/:id",
            get(get_project).patch(update_project).delete(delete_project),
        )
        .route("/api/projects/:id/members", post(add_member))
        .route("/api/projects/:id/members/:uid",
            patch(update_member_role).delete(remove_member),
        )
        .route("/api/projects/:id/solicitudes", get(list_solicitudes))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}