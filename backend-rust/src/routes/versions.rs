use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::auth::require_auth;
use crate::models::Claims;
use crate::validation::{error_response, internal_error, validate_required};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Version {
    pub id: String,
    pub name: String,
    pub project_id: Option<String>,
    pub description: Option<String>,
    pub release_date: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct VersionWithStats {
    pub version: Version,
    pub fix_count: i64,
    pub affects_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateVersionRequest {
    pub name: String,
    pub project_id: Option<String>,
    pub description: Option<String>,
    pub release_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateVersionRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub release_date: Option<Option<String>>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AssignVersionRequest {
    pub task_id: String,
    pub relationship: Option<String>,
}

pub async fn list_versions(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<VersionWithStats>>, Response> {
    let mut sql = String::from(
        "SELECT id, name, project_id, description, release_date, status, created_at \
         FROM versions WHERE deleted_at IS NULL",
    );
    let mut binds: Vec<String> = Vec::new();

    if let Some(project_id) = params.get("project") {
        sql.push_str(" AND project_id = ?");
        binds.push(project_id.clone());
    }
    sql.push_str(" ORDER BY created_at DESC");

    let mut q = sqlx::query_as::<_, Version>(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    let versions = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let mut result = Vec::with_capacity(versions.len());
    for version in versions {
        let stats: (i64, i64) = sqlx::query_as(
            "SELECT \
             COALESCE(SUM(CASE WHEN relationship = 'fix' THEN 1 ELSE 0 END), 0), \
             COALESCE(SUM(CASE WHEN relationship = 'affects' THEN 1 ELSE 0 END), 0) \
             FROM task_versions WHERE version_id = ?",
        )
        .bind(&version.id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

        result.push(VersionWithStats {
            version,
            fix_count: stats.0,
            affects_count: stats.1,
        });
    }

    Ok(Json(result))
}

pub async fn create_version(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Json(payload): Json<CreateVersionRequest>,
) -> Result<(StatusCode, Json<Version>), Response> {
    validate_required("name", &payload.name, 100)?;

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO versions (id, name, project_id, description, release_date) \
         VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.project_id)
    .bind(&payload.description)
    .bind(&payload.release_date)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let version = sqlx::query_as::<_, Version>(
        "SELECT id, name, project_id, description, release_date, status, created_at \
         FROM versions WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(version)))
}

pub async fn get_version(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<VersionWithStats>, Response> {
    let version = sqlx::query_as::<_, Version>(
        "SELECT id, name, project_id, description, release_date, status, created_at \
         FROM versions WHERE id = ? AND deleted_at IS NULL",
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let version = match version {
        Some(v) => v,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Versión no encontrada".to_string(),
            ))
        }
    };

    let stats: (i64, i64) = sqlx::query_as(
        "SELECT \
         COALESCE(SUM(CASE WHEN relationship = 'fix' THEN 1 ELSE 0 END), 0), \
         COALESCE(SUM(CASE WHEN relationship = 'affects' THEN 1 ELSE 0 END), 0) \
         FROM task_versions WHERE version_id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(VersionWithStats {
        version,
        fix_count: stats.0,
        affects_count: stats.1,
    }))
}

pub async fn update_version(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateVersionRequest>,
) -> Result<Json<Version>, Response> {
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
    if let Some(release) = &payload.release_date {
        sets.push("release_date = ?");
        bindings.push(serde_json::json!(release));
    }
    if let Some(status) = &payload.status {
        const STATUSES: &[&str] = &["unreleased", "released", "archived"];
        if !STATUSES.contains(&status.as_str()) {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                format!(
                    "Status inválido '{}'. Debe ser: {}",
                    status,
                    STATUSES.join(", ")
                ),
            ));
        }
        sets.push("status = ?");
        bindings.push(serde_json::json!(status));
    }

    if sets.is_empty() {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "Sin cambios".to_string(),
        ));
    }

    let sql = format!("UPDATE versions SET {} WHERE id = ?", sets.join(", "));
    let mut q = sqlx::query(&sql);
    if let Some(name) = &payload.name {
        q = q.bind(name);
    }
    if let Some(desc) = &payload.description {
        q = q.bind(desc);
    }
    if let Some(release) = &payload.release_date {
        q = q.bind(release);
    }
    if let Some(status) = &payload.status {
        q = q.bind(status);
    }
    q = q.bind(&id);
    q.execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let version = sqlx::query_as::<_, Version>(
        "SELECT id, name, project_id, description, release_date, status, created_at \
         FROM versions WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(version))
}

pub async fn delete_version(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    sqlx::query("UPDATE versions SET deleted_at = datetime('now') WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("DELETE FROM task_versions WHERE version_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn assign_version(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<AssignVersionRequest>,
) -> Result<StatusCode, Response> {
    let relationship = payload.relationship.unwrap_or_else(|| "fix".to_string());
    if relationship != "fix" && relationship != "affects" {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "relationship debe ser 'fix' o 'affects'".to_string(),
        ));
    }

    sqlx::query(
        "INSERT OR IGNORE INTO task_versions (task_id, version_id, relationship) VALUES (?, ?, ?)",
    )
    .bind(&payload.task_id)
    .bind(&id)
    .bind(&relationship)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::CREATED)
}

pub async fn unassign_version(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path((id, task_id)): Path<(String, String)>,
) -> Result<StatusCode, Response> {
    sqlx::query("DELETE FROM task_versions WHERE version_id = ? AND task_id = ?")
        .bind(&id)
        .bind(&task_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{delete, get, post},
    };

    axum::Router::new()
        .route("/api/versions", get(list_versions).post(create_version))
        .route(
            "/api/versions/:id",
            get(get_version)
                .patch(update_version)
                .delete(delete_version),
        )
        .route("/api/versions/:id/assign", post(assign_version))
        .route("/api/versions/:id/tasks/:task_id", delete(unassign_version))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
