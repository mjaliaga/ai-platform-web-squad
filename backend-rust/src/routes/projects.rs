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

pub const PORTFOLIO_CATEGORIAS: &[&str] = &[
    "Backlog de Propuestas Internas",
    "Backlog de Propuestas Comerciales",
    "Evaluación técnica",
    "PoC",
    "Proyecto",
    "Producción",
];

pub fn validate_categoria(cat: &str) -> Result<(), axum::response::Response> {
    if PORTFOLIO_CATEGORIAS.contains(&cat) {
        Ok(())
    } else {
        Err(crate::validation::error_response(
            axum::http::StatusCode::BAD_REQUEST,
            format!(
                "Categoría inválida '{}'. Debe ser: {}",
                cat,
                PORTFOLIO_CATEGORIAS.join(", ")
            ),
        ))
    }
}

pub const PORTFOLIO_STAGES: &[&str] = &[
    "Backlog",
    "Evaluación técnica",
    "PoC",
    "Proyecto",
    "Producción",
    "Cerrado",
];

pub fn validate_stage(stage: &str) -> Result<(), axum::response::Response> {
    if PORTFOLIO_STAGES.contains(&stage) {
        Ok(())
    } else {
        Err(crate::validation::error_response(
            axum::http::StatusCode::BAD_REQUEST,
            format!(
                "Stage inválido '{}'. Debe ser: {}",
                stage,
                PORTFOLIO_STAGES.join(", ")
            ),
        ))
    }
}

fn parse_portfolio_data(s: &Option<String>) -> serde_json::Value {
    let mut val = s.as_deref()
        .and_then(|v| serde_json::from_str::<serde_json::Value>(v).ok())
        .unwrap_or_else(|| serde_json::json!({}));
    // Si viene doblemente stringificado (ej. "\"{\\\"key\\\": ...}\"")
    if let Some(inner_str) = val.as_str() {
        if let Ok(nested) = serde_json::from_str::<serde_json::Value>(inner_str) {
            val = nested;
        }
    }
    val
}

fn can_transition(current: &str, next: &str, claims: &crate::models::Claims, data: &serde_json::Value, sponsor_id: &Option<String>) -> Result<(), axum::response::Response> {
    // Regla profesional: solo ciertos roles mueven cada transición, con validaciones de salida por etapa
    let allowed_next = match current {
        "Backlog" => vec!["Evaluación técnica"],
        "Evaluación técnica" => vec!["PoC", "Proyecto"], // Proyecto solo si skip PoC por baja complejidad
        "PoC" => vec!["Proyecto"],
        "Proyecto" => vec!["Producción"],
        "Producción" => vec!["Cerrado"],
        "Cerrado" => vec![],
        _ => vec![],
    };
    if !allowed_next.contains(&next) {
        // Permitir también salto PoC→Producción si es baja complejidad? No, solo vía Proyecto
        if !(current == "Evaluación técnica" && next == "Proyecto" && data.get("complejidad").and_then(|v| v.as_str()) == Some("Baja")) {
            return Err(crate::validation::error_response(
                axum::http::StatusCode::BAD_REQUEST,
                format!("Transición no permitida de '{}' a '{}'. Permitidas: {}", current, next, allowed_next.join(", ")),
            ));
        }
    }
    // Validaciones de salida por etapa (profesional)
    match current {
        "Backlog" => {
            let desc_ok = data.get("descripcion_problema").and_then(|v| v.as_str()).map(|s| !s.trim().is_empty()).unwrap_or(false)
                || data.get("valor_esperado").and_then(|v| v.as_str()).map(|s| !s.trim().is_empty()).unwrap_or(false);
            if !desc_ok {
                return Err(crate::validation::error_response(StatusCode::BAD_REQUEST, "Backlog: falta descripcion_problema/valor_esperado".to_string()));
            }
        }
        "Evaluación técnica" => {
            if next == "PoC" {
                let has_lider = data.get("lider_tecnico").or_else(|| data.get("ingeniero_encargado")).and_then(|v| v.as_str()).map(|s| !s.trim().is_empty()).unwrap_or(false);
                let has_tshirt = data.get("tshirt").and_then(|v| v.as_str()).map(|s| ["S","M","L","XL"].contains(&s)).unwrap_or(false);
                if !has_lider || !has_tshirt {
                    return Err(crate::validation::error_response(StatusCode::BAD_REQUEST, "Evaluación: falta ingeniero encargado o estimación tshirt (S/M/L/XL)".to_string()));
                }
            }
            if next == "Proyecto" {
                // skip PoC solo si baja complejidad
                let comp = data.get("complejidad").and_then(|v| v.as_str()).unwrap_or("");
                if comp != "Baja" {
                    return Err(crate::validation::error_response(StatusCode::BAD_REQUEST, "Solo complejidad Baja puede saltar PoC directo a Proyecto".to_string()));
                }
            }
        }
        "PoC" => {
            // Permitir avanzar si es Go
            let go = data.get("decision_go_nogo").and_then(|v| v.as_str()).map(|s| s == "Go").unwrap_or(true);
            if !go {
                return Err(crate::validation::error_response(StatusCode::BAD_REQUEST, "PoC: requiere decisión Go".to_string()));
            }
        }
        "Proyecto" => {
            let qa = data.get("qa_aprobado").and_then(|v| v.as_bool()).unwrap_or(false);
            let uat = data.get("uat_aprobado").and_then(|v| v.as_bool()).unwrap_or(false);
            if !qa || !uat {
                return Err(crate::validation::error_response(StatusCode::BAD_REQUEST, "Proyecto: requiere qa_aprobado y uat_aprobado".to_string()));
            }
        }
        _ => {}
    }
    Ok(())
}

async fn assert_project_access(
    db: &sqlx::SqlitePool,
    claims: &crate::models::Claims,
    project_id: &str,
) -> Result<(), axum::response::Response> {
    if claims.role == "admin" {
        return Ok(());
    }
    // Miembro explícito
    let member: Option<(String,)> = sqlx::query_as(
        "SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?",
    )
    .bind(project_id)
    .bind(&claims.sub)
    .fetch_optional(db)
    .await
    .map_err(|e| crate::validation::internal_error(&format!("db error: {e}")))?;
    if member.is_some() {
        return Ok(());
    }
    // Fallback: asignado a alguna tarea del proyecto (compatibilidad con list_projects)
    let task_assignee: Option<(String,)> = sqlx::query_as(
        "SELECT id FROM tasks WHERE project_id = ? AND assignee_id = ? AND deleted_at IS NULL LIMIT 1",
    )
    .bind(project_id)
    .bind(&claims.sub)
    .fetch_optional(db)
    .await
    .map_err(|e| crate::validation::internal_error(&format!("db error: {e}")))?;
    if task_assignee.is_some() {
        return Ok(());
    }
    Err(crate::validation::error_response(
        axum::http::StatusCode::FORBIDDEN,
        "No tienes acceso a este proyecto. Solo miembros del proyecto pueden ver esta información.".to_string(),
    ))
}

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
    let categoria_filter = params.get("categoria").cloned();
    if let Some(ref cat) = categoria_filter {
        validate_categoria(cat)?;
    }
    let stage_filter = params.get("stage").cloned();
    if let Some(ref s) = stage_filter {
        validate_stage(s)?;
    }
    let tipo_filter = params.get("tipo_proyecto").cloned();
    if let Some(ref t) = tipo_filter {
        if t != "interno" && t != "comercial" {
            return Err(error_response(StatusCode::BAD_REQUEST, "tipo_proyecto debe ser 'interno' o 'comercial'".to_string()));
        }
    }

    // Construcción dinámica profesional (soporta stage + categoria legacy + tipo)
    let rows: Vec<Project> = {
        let base_cols = "id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, galeria, video_promocional, video_tecnico, documento_drive, documentacion, url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto";
        if claims.role == "admin" {
            let mut where_parts = vec!["status = 'active'".to_string(), "deleted_at IS NULL".to_string(), "slug IS NULL".to_string()];
            let mut binds: Vec<String> = vec![];
            if let Some(cat) = categoria_filter.clone() { where_parts.push("categoria = ?".to_string()); binds.push(cat); }
            if let Some(st) = stage_filter.clone() { where_parts.push("stage = ?".to_string()); binds.push(st); }
            if let Some(tp) = tipo_filter.clone() { where_parts.push("tipo_proyecto = ?".to_string()); binds.push(tp); }
            let where_sql = where_parts.join(" AND ");
            let sql = format!("SELECT {} FROM projects WHERE {} ORDER BY name LIMIT ? OFFSET ?", base_cols, where_sql);
            let mut q = sqlx::query_as::<_, Project>(&sql);
            for b in &binds { q = q.bind(b); }
            q = q.bind(limit).bind(offset);
            q.fetch_all(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?
        } else {
            let mut where_parts_member = vec!["p.status = 'active'".to_string(), "p.deleted_at IS NULL".to_string(), "p.slug IS NULL".to_string()];
            let mut binds_member: Vec<String> = vec![];
            if let Some(cat) = categoria_filter.clone() { where_parts_member.push("p.categoria = ?".to_string()); binds_member.push(cat); }
            if let Some(st) = stage_filter.clone() { where_parts_member.push("p.stage = ?".to_string()); binds_member.push(st); }
            if let Some(tp) = tipo_filter.clone() { where_parts_member.push("p.tipo_proyecto = ?".to_string()); binds_member.push(tp); }
            where_parts_member.push("(t.assignee_id = ? OR pm.user_id = ?)".to_string());
            let where_sql_m = where_parts_member.join(" AND ");
            let sql_m = format!("SELECT DISTINCT p.{} FROM projects p LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL LEFT JOIN project_members pm ON pm.project_id = p.id WHERE {} ORDER BY p.name LIMIT ? OFFSET ?", base_cols.replace(", ", ", p."), where_sql_m);
            let mut qm = sqlx::query_as::<_, Project>(&sql_m);
            for b in &binds_member { qm = qm.bind(b); }
            qm = qm.bind(&claims.sub).bind(&claims.sub).bind(limit).bind(offset);
            qm.fetch_all(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?
        }
    };

    let total: i64 = {
        if claims.role == "admin" {
            let mut where_parts = vec!["status = 'active'".to_string(), "deleted_at IS NULL".to_string(), "slug IS NULL".to_string()];
            let mut binds: Vec<String> = vec![];
            if let Some(cat) = categoria_filter.clone() { where_parts.push("categoria = ?".to_string()); binds.push(cat); }
            if let Some(st) = stage_filter.clone() { where_parts.push("stage = ?".to_string()); binds.push(st); }
            if let Some(tp) = tipo_filter.clone() { where_parts.push("tipo_proyecto = ?".to_string()); binds.push(tp); }
            let where_sql = where_parts.join(" AND ");
            let sql = format!("SELECT COUNT(*) FROM projects WHERE {}", where_sql);
            let mut q = sqlx::query_as::<_, (i64,)>(&sql);
            for b in &binds { q = q.bind(b); }
            let r: (i64,) = q.fetch_one(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?;
            r.0
        } else {
            let mut where_parts = vec!["p.status = 'active'".to_string(), "p.deleted_at IS NULL".to_string(), "p.slug IS NULL".to_string()];
            let mut binds: Vec<String> = vec![];
            if let Some(cat) = categoria_filter.clone() { where_parts.push("p.categoria = ?".to_string()); binds.push(cat); }
            if let Some(st) = stage_filter.clone() { where_parts.push("p.stage = ?".to_string()); binds.push(st); }
            if let Some(tp) = tipo_filter.clone() { where_parts.push("p.tipo_proyecto = ?".to_string()); binds.push(tp); }
            where_parts.push("(t.assignee_id = ? OR pm.user_id = ?)".to_string());
            let where_sql = where_parts.join(" AND ");
            let sql = format!("SELECT COUNT(DISTINCT p.id) FROM projects p LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL LEFT JOIN project_members pm ON pm.project_id = p.id WHERE {}", where_sql);
            let mut q = sqlx::query_as::<_, (i64,)>(&sql);
            for b in &binds { q = q.bind(b); }
            q = q.bind(&claims.sub).bind(&claims.sub);
            let r: (i64,) = q.fetch_one(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?;
            r.0
        }
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
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ProjectWithStats>, Response> {
    assert_project_access(&state.db, &claims, &id).await?;
    let project: Option<Project> = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, \
         slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, \
         descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, \
         galeria, video_promocional, video_tecnico, documento_drive, documentacion, \
         url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto FROM projects WHERE id = ?"
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
    #[serde(default = "default_categoria")]
    pub categoria: String,
    #[serde(default = "default_stage")]
    pub stage: String,
    #[serde(default)]
    pub tipo_proyecto: Option<String>,
    #[serde(default)]
    pub sponsor_id: Option<String>,
    #[serde(default)]
    pub portfolio_data: Option<serde_json::Value>,
}
fn default_sector() -> String { "Proyecto".to_string() }
fn default_categoria() -> String { "Proyecto".to_string() }
fn default_stage() -> String { "Backlog".to_string() }

pub async fn create_project(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateProjectRequest>,
) -> Result<(StatusCode, Json<ProjectWithStats>), Response> {
    tracing::info!("create_project called by {} with sponsor_id={:?} stage={:?}", claims.sub, payload.sponsor_id, payload.stage);
    require_admin(&claims)?;
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
    validate_categoria(&payload.categoria)?;
    tracing::info!("create payload sponsor_id={:?} stage={:?} tipo={:?}", payload.sponsor_id, payload.stage, payload.tipo_proyecto);
    // Stage profesional (5 etapas) — validar y mapear legacy categoria si es necesario
    let mut final_stage = payload.stage.clone();
    let mut final_tipo = payload.tipo_proyecto.clone();
    let mut final_portfolio_data = payload.portfolio_data.clone().unwrap_or_else(|| serde_json::json!({}));
    // Mapear legacy categoria a stage/tipo si stage es default y categoria indica otra cosa
    if final_stage == "Backlog" && payload.categoria != "Proyecto" {
        match payload.categoria.as_str() {
            "Backlog de Propuestas Internas" => { final_stage = "Backlog".to_string(); final_tipo = Some("interno".to_string()); },
            "Backlog de Propuestas Comerciales" => { final_stage = "Backlog".to_string(); final_tipo = Some("comercial".to_string()); },
            "Evaluación técnica" => final_stage = "Evaluación técnica".to_string(),
            "PoC" => final_stage = "PoC".to_string(),
            "Producción" => final_stage = "Producción".to_string(),
            _ => {}
        }
    }
    validate_stage(&final_stage)?;
    if let Some(ref tp) = final_tipo {
        if tp != "interno" && tp != "comercial" {
            return Err(error_response(StatusCode::BAD_REQUEST, "tipo_proyecto debe ser 'interno' o 'comercial'".to_string()));
        }
    }
    let sponsor_id = payload.sponsor_id.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty());
    if let Some(sid) = sponsor_id {
        let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM users WHERE id = ?").bind(sid).fetch_optional(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?;
        if exists.is_none() { return Err(error_response(StatusCode::BAD_REQUEST, format!("Sponsor {} no existe", sid))); }
    }
    // Normalizar sponsor_id vacío a None para BD
    let sponsor_id_db = sponsor_id.map(|s| s.to_string());
    // Enriquecer portfolio_data con tipo_proyecto si se provee
    if let Some(ref tp) = final_tipo {
        if let Some(obj) = final_portfolio_data.as_object_mut() {
            obj.insert("tipo_proyecto".to_string(), serde_json::Value::String(tp.clone()));
        }
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

    let final_categoria = match final_stage.as_str() {
        "Backlog" => {
            if final_tipo.as_deref() == Some("comercial") {
                "Backlog de Propuestas Comerciales".to_string()
            } else {
                "Backlog de Propuestas Internas".to_string()
            }
        }
        "Evaluación técnica" => "Evaluación técnica".to_string(),
        "PoC" => "PoC".to_string(),
        "Proyecto" => "Proyecto".to_string(),
        "Producción" => "Producción".to_string(),
        _ => payload.categoria.clone(),
    };

    let id = Uuid::new_v4().to_string();
    let description = payload.description.unwrap_or_default();

    let portfolio_data_str = serde_json::to_string(&final_portfolio_data).unwrap_or_else(|_| "{}".to_string());
    sqlx::query(
        "INSERT INTO projects (id, name, description, color, sector, code, po_user_id, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&description)
    .bind(color)
    .bind(&payload.sector)
    .bind(payload.code.as_deref().unwrap_or(""))
    .bind(&payload.po_user_id)
    .bind(&final_categoria)
    .bind(&final_stage)
    .bind(&portfolio_data_str)
    .bind(&sponsor_id_db)
    .bind(&final_tipo)
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
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, galeria, video_promocional, video_tecnico, documento_drive, documentacion, url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto FROM projects WHERE id = ?"
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
    #[serde(default)]
    pub slug: Option<Option<String>>,
    #[serde(default)]
    pub categoria: Option<String>,
    #[serde(default)]
    pub stage: Option<String>,
    #[serde(default)]
    pub portfolio_data: Option<serde_json::Value>,
    #[serde(default)]
    pub sponsor_id: Option<Option<String>>,
    #[serde(default)]
    pub tipo_proyecto: Option<String>,
}

pub async fn update_project(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateProjectRequest>,
) -> Result<Json<ProjectWithStats>, Response> {
    require_admin(&claims)?;
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

    let existing: Option<Project> = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, galeria, video_promocional, video_tecnico, documento_drive, documentacion, url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto FROM projects WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let existing = match existing {
        Some(p) => p,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Proyecto no encontrado".to_string())),
    };
    // Validar transición de stage si cambia
    if let Some(new_stage) = &payload.stage {
        validate_stage(new_stage)?;
        if new_stage != existing.stage.as_deref().unwrap_or("Backlog") {
            let existing_data = parse_portfolio_data(&existing.portfolio_data);
            // sponsor efectivo para validación: payload sponsor o existente (tratar vacío como None)
            let effective_sponsor = payload.sponsor_id.as_ref().and_then(|opt| opt.as_ref()).and_then(|v| {
                let s = v.trim();
                if s.is_empty() { None } else { Some(s.to_string()) }
            }).or_else(|| existing.sponsor_id.as_ref().and_then(|s| {
                let s = s.trim();
                if s.is_empty() { None } else { Some(s.to_string()) }
            }));
            // data efectiva: merge payload portfolio_data con existente para validar salida
            let effective_data = if let Some(ref pd) = payload.portfolio_data {
                let mut merged = existing_data.clone();
                let pd_obj = if let Some(obj) = pd.as_object() {
                    Some(obj.clone())
                } else if let Some(s) = pd.as_str() {
                    serde_json::from_str::<serde_json::Value>(s).ok().and_then(|v| v.as_object().cloned())
                } else {
                    None
                };
                if let Some(obj) = pd_obj {
                    for (k,v) in obj { merged[k] = v; }
                }
                merged
            } else { existing_data };
            can_transition(existing.stage.as_deref().unwrap_or("Backlog"), new_stage, &claims, &effective_data, &effective_sponsor)?;
            // registrar actividad de cambio de stage (no bloqueante, ignora FK si es proyecto)
            let _ = sqlx::query("INSERT INTO activity_log (id, task_id, user_id, action, field_changed, old_value, new_value) VALUES (?, ?, ?, 'stage_changed', 'stage', ?, ?)")
                .bind(Uuid::new_v4().to_string())
                .bind(&id)
                .bind(&claims.sub)
                .bind(existing.stage.as_deref().unwrap_or("Backlog"))
                .bind(new_stage)
                .execute(&state.db)
                .await;
        }
    }
    if let Some(tp) = &payload.tipo_proyecto {
        if tp != "interno" && tp != "comercial" {
            return Err(error_response(StatusCode::BAD_REQUEST, "tipo_proyecto debe ser 'interno' o 'comercial'".to_string()));
        }
    }
    if let Some(sid_opt) = &payload.sponsor_id {
        let sid = sid_opt.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty());
        if let Some(sid) = sid {
            let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM users WHERE id = ?").bind(sid).fetch_optional(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?;
            if exists.is_none() { return Err(error_response(StatusCode::BAD_REQUEST, format!("Sponsor {} no existe", sid))); }
        }
    }

    // Normalizar sponsor_id para update
    let sponsor_id_db = payload.sponsor_id.as_ref().and_then(|opt| opt.as_ref()).and_then(|v| {
        let s = v.trim();
        if s.is_empty() { None } else { Some(s.to_string()) }
    });

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
    if let Some(slug) = &payload.slug {
        sets.push("slug = ?");
        bindings.push(serde_json::json!(slug));
    }
    if let Some(cat) = &payload.categoria {
        validate_categoria(cat)?;
        sets.push("categoria = ?");
        bindings.push(serde_json::json!(cat));
    }
    if let Some(stage) = &payload.stage {
        sets.push("stage = ?");
        bindings.push(serde_json::json!(stage));
    }
    if let Some(pd) = &payload.portfolio_data {
        // merge con existente para no perder campos de otras etapas
        let mut merged = parse_portfolio_data(&existing.portfolio_data);
        let pd_obj = if let Some(obj) = pd.as_object() {
            Some(obj.clone())
        } else if let Some(s) = pd.as_str() {
            serde_json::from_str::<serde_json::Value>(s).ok().and_then(|v| v.as_object().cloned())
        } else {
            None
        };
        if let Some(obj) = pd_obj {
            for (k,v) in obj { merged[k] = v; }
        }
        sets.push("portfolio_data = ?");
        bindings.push(serde_json::json!(serde_json::to_string(&merged).unwrap_or_else(|_| "{}".to_string())));
    }
    if let Some(sid) = &sponsor_id_db {
        sets.push("sponsor_id = ?");
        bindings.push(serde_json::json!(sid));
    }
    if let Some(tp) = &payload.tipo_proyecto {
        sets.push("tipo_proyecto = ?");
        bindings.push(serde_json::json!(tp));
        // también reflejar en portfolio_data para consistencia
        // se hará en próximo PATCH si es necesario
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
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, galeria, video_promocional, video_tecnico, documento_drive, documentacion, url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto FROM projects WHERE id = ?"
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

    sqlx::query("DELETE FROM epics WHERE project_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("DELETE FROM versions WHERE project_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("DELETE FROM workflows WHERE project_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("DELETE FROM saved_filters WHERE project_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("DELETE FROM project_members WHERE project_id = ?")
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
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, galeria, video_promocional, video_tecnico, documento_drive, documentacion, url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto FROM projects WHERE status = 'active' AND slug IS NULL ORDER BY name"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(rows))
}

pub async fn list_solicitudes(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<String>,
) -> Result<Json<Vec<crate::models::TaskWithDetails>>, Response> {
    assert_project_access(&state.db, &claims, &project_id).await?;
    let tasks: Vec<crate::models::Task> = sqlx::query_as::<_, crate::models::Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
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

pub async fn get_project_by_slug(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(slug): Path<String>,
) -> Result<Json<ProjectWithStats>, Response> {
    let project: Option<Project> = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, \
         slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, \
         descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, \
         galeria, video_promocional, video_tecnico, documento_drive, documentacion, \
         url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto FROM projects WHERE slug = ?"
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match project {
        Some(p) => {
            assert_project_access(&state.db, &claims, &p.id).await?;
            Ok(Json(build_project_with_stats(&state.db, p).await?))
        },
        None => Err(error_response(
            StatusCode::NOT_FOUND,
            "Proyecto no encontrado".to_string(),
        )),
    }
}

#[derive(Deserialize)]
pub struct PublishBody {
    pub published: bool,
}

pub async fn set_published(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(body): Json<PublishBody>,
) -> Result<Json<serde_json::Value>, Response> {
    require_admin(&claims)?;
    let val: i64 = if body.published { 1 } else { 0 };
    let result = sqlx::query("UPDATE projects SET published = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(val)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(StatusCode::NOT_FOUND, "Proyecto no encontrado".to_string()));
    }

    Ok(Json(serde_json::json!({ "ok": true, "published": body.published })))
}

#[derive(Deserialize)]
pub struct ReserveBody {
    pub reservado: bool,
}

pub async fn set_reservado(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(body): Json<ReserveBody>,
) -> Result<Json<serde_json::Value>, Response> {
    require_admin(&claims)?;
    let val: i64 = if body.reservado { 1 } else { 0 };
    let result = sqlx::query("UPDATE projects SET reservado = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(val)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(StatusCode::NOT_FOUND, "Proyecto no encontrado".to_string()));
    }

    Ok(Json(serde_json::json!({ "ok": true, "reservado": body.reservado })))
}

// ============================================================================
// Public endpoints (no auth required)
// ============================================================================

pub async fn public_list_projects(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<crate::pagination::PaginatedResponse<Project>>, Response> {
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

    let rows: Vec<Project> = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, \
         slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, \
         descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, \
         galeria, video_promocional, video_tecnico, documento_drive, documentacion, \
         url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto \
         FROM projects WHERE published = 1 AND reservado = 0 AND deleted_at IS NULL AND slug IS NOT NULL \
         ORDER BY name LIMIT ? OFFSET ?"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM projects WHERE published = 1 AND reservado = 0 AND deleted_at IS NULL AND slug IS NOT NULL"
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(crate::pagination::PaginatedResponse {
        items: rows,
        total: total.0,
        limit,
        offset,
    }))
}

pub async fn public_get_project_by_slug(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<Project>, Response> {
    let project: Option<Project> = sqlx::query_as::<_, Project>(
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, \
         slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, \
         descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, \
         galeria, video_promocional, video_tecnico, documento_drive, documentacion, \
         url_proyecto, video_placeholder, updated_at, categoria, stage, portfolio_data, sponsor_id, tipo_proyecto \
         FROM projects WHERE slug = ? AND deleted_at IS NULL"
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match project {
        Some(p) => Ok(Json(p)),
        None => Err(error_response(
            StatusCode::NOT_FOUND,
            "Proyecto no encontrado".to_string(),
        )),
    }
}

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct ProjectProgress {
    pub total_tasks: i64,
    pub done_tasks: i64,
    pub in_progress_tasks: i64,
    pub todo_tasks: i64,
    pub review_tasks: i64,
    pub backlog_tasks: i64,
    pub total_estimate_hours: f64,
    pub total_spent_hours: f64,
    pub completion_pct: f64,
}

pub async fn get_project_progress(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ProjectProgress>, Response> {
    assert_project_access(&state.db, &claims, &id).await?;
    let existing: Option<(String,)> = sqlx::query_as("SELECT id FROM projects WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if existing.is_none() {
        return Err(error_response(StatusCode::NOT_FOUND, "Proyecto no encontrado".to_string()));
    }

    let stats: ProjectProgress = sqlx::query_as::<_, ProjectProgress>(
        "SELECT \
         COUNT(*) as total_tasks, \
         SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done_tasks, \
         SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks, \
         SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks, \
         SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review_tasks, \
         SUM(CASE WHEN status = 'backlog' THEN 1 ELSE 0 END) as backlog_tasks, \
         COALESCE(SUM(estimate_hours), 0.0) as total_estimate_hours, \
         COALESCE(SUM(time_spent_hours), 0.0) as total_spent_hours, \
         CASE WHEN COUNT(*) = 0 THEN 0.0 ELSE ROUND(100.0 * SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / COUNT(*), 1) END as completion_pct \
         FROM tasks WHERE project_id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(stats))
}

pub fn public_router(state: Arc<AppState>) -> axum::Router {
    use axum::routing::get;

    axum::Router::new()
        .route("/api/projects/list/public", get(public_list_projects))
        .route("/api/projects/public/:slug", get(public_get_project_by_slug))
        .with_state(state)
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{get, patch, post},
    };

    let protected = axum::Router::new()
        .route("/api/projects", get(list_projects).post(create_project))
        .route("/api/projects/list", get(list_projects_simple))
        .route(
            "/api/projects/:id",
            get(get_project).patch(update_project).delete(delete_project),
        )
        .route("/api/projects/by-slug/:slug", get(get_project_by_slug))
        .route("/api/projects/:id/members", post(add_member))
        .route("/api/projects/:id/members/:uid",
            patch(update_member_role).delete(remove_member),
        )
        .route("/api/projects/:id/solicitudes", get(list_solicitudes))
        .route("/api/projects/:id/progress", get(get_project_progress))
        .route("/api/projects/:id/publish", post(set_published))
        .route("/api/projects/:id/reservado", post(set_reservado))
        // Alias profesional Portafolio — mismas handlers bajo /api/portfolio
        .route("/api/portfolio", get(list_projects).post(create_project))
        .route("/api/portfolio/list", get(list_projects_simple))
        .route(
            "/api/portfolio/:id",
            get(get_project).patch(update_project).delete(delete_project),
        )
        .route("/api/portfolio/by-slug/:slug", get(get_project_by_slug))
        .route("/api/portfolio/:id/members", post(add_member))
        .route("/api/portfolio/:id/members/:uid",
            patch(update_member_role).delete(remove_member),
        )
        .route("/api/portfolio/:id/solicitudes", get(list_solicitudes))
        .route("/api/portfolio/:id/progress", get(get_project_progress))
        .route("/api/portfolio/:id/publish", post(set_published))
        .route("/api/portfolio/:id/reservado", post(set_reservado))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth));

    // Combinar con públicas ya existentes
    protected.with_state(state)
}