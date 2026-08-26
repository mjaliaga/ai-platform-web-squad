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
use crate::models::{Claims, PublicUser, User};
use crate::validation::{error_response, internal_error, validate_required};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Epic {
    pub id: String,
    pub name: String,
    pub summary: Option<String>,
    pub color: Option<String>,
    pub owner_id: Option<String>,
    pub project_id: Option<String>,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct EpicWithOwner {
    pub epic: Epic,
    pub owner: Option<PublicUser>,
    pub task_count: i64,
    pub done_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateEpicRequest {
    pub name: String,
    pub summary: Option<String>,
    pub color: Option<String>,
    pub owner_id: Option<String>,
    pub project_id: Option<String>,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEpicRequest {
    pub name: Option<String>,
    pub summary: Option<String>,
    pub color: Option<String>,
    pub owner_id: Option<Option<String>>,
    pub start_date: Option<Option<String>>,
    pub due_date: Option<Option<String>>,
    pub status: Option<String>,
}

pub async fn list_epics(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<EpicWithOwner>>, Response> {
    let mut sql = String::from(
        "SELECT id, name, summary, color, owner_id, project_id, start_date, due_date, status, created_at \
         FROM epics WHERE deleted_at IS NULL"
    );
    let mut binds: Vec<String> = Vec::new();

    if let Some(project_id) = params.get("project") {
        sql.push_str(" AND project_id = ?");
        binds.push(project_id.clone());
    }
    sql.push_str(" ORDER BY created_at DESC");

    let mut q = sqlx::query_as::<_, Epic>(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    let epics = q.fetch_all(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?;

    let mut result = Vec::with_capacity(epics.len());
    for epic in epics {
        let owner = if let Some(ref oid) = epic.owner_id {
            sqlx::query_as::<_, User>(
                "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, deleted_at FROM users WHERE id = ?"
            )
            .bind(oid)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?
            .map(PublicUser::from)
        } else {
            None
        };

        let stats: (i64, i64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) FROM tasks WHERE epic_id = ? AND deleted_at IS NULL"
        )
        .bind(&epic.id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

        result.push(EpicWithOwner {
            epic,
            owner,
            task_count: stats.0,
            done_count: stats.1,
        });
    }

    Ok(Json(result))
}

pub async fn create_epic(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateEpicRequest>,
) -> Result<(StatusCode, Json<Epic>), Response> {
    validate_required("name", &payload.name, 200)?;

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO epics (id, name, summary, color, owner_id, project_id, start_date, due_date) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.summary)
    .bind(payload.color.as_deref().unwrap_or("#6366f1"))
    .bind(&payload.owner_id)
    .bind(&payload.project_id)
    .bind(&payload.start_date)
    .bind(&payload.due_date)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let epic = sqlx::query_as::<_, Epic>(
        "SELECT id, name, summary, color, owner_id, project_id, start_date, due_date, status, created_at \
         FROM epics WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(epic)))
}

pub async fn get_epic(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<EpicWithOwner>, Response> {
    let epic = sqlx::query_as::<_, Epic>(
        "SELECT id, name, summary, color, owner_id, project_id, start_date, due_date, status, created_at \
         FROM epics WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let epic = match epic {
        Some(e) => e,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Epic no encontrado".to_string())),
    };

    let owner = if let Some(ref oid) = epic.owner_id {
        sqlx::query_as::<_, User>(
            "SELECT id, name, email, password_hash, role, avatar_color, created_at, active FROM users WHERE id = ?"
        )
        .bind(oid)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?
        .map(PublicUser::from)
    } else {
        None
    };

    let stats: (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*), COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) FROM tasks WHERE epic_id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(EpicWithOwner {
        epic,
        owner,
        task_count: stats.0,
        done_count: stats.1,
    }))
}

pub async fn update_epic(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateEpicRequest>,
) -> Result<Json<Epic>, Response> {
    let mut sets: Vec<&str> = Vec::new();
    let mut bindings: Vec<serde_json::Value> = Vec::new();

    if let Some(name) = &payload.name {
        sets.push("name = ?");
        bindings.push(serde_json::json!(name));
    }
    if let Some(summary) = &payload.summary {
        sets.push("summary = ?");
        bindings.push(serde_json::json!(summary));
    }
    if let Some(color) = &payload.color {
        sets.push("color = ?");
        bindings.push(serde_json::json!(color));
    }
    if let Some(owner) = &payload.owner_id {
        sets.push("owner_id = ?");
        bindings.push(serde_json::json!(owner));
    }
    if let Some(start) = &payload.start_date {
        sets.push("start_date = ?");
        bindings.push(serde_json::json!(start));
    }
    if let Some(due) = &payload.due_date {
        sets.push("due_date = ?");
        bindings.push(serde_json::json!(due));
    }
    if let Some(status) = &payload.status {
        const STATUSES: &[&str] = &["open", "in_progress", "done"];
        if !STATUSES.contains(&status.as_str()) {
            return Err(error_response(StatusCode::BAD_REQUEST, format!("Status inválido '{}'. Debe ser: {}", status, STATUSES.join(", "))));
        }
        sets.push("status = ?");
        bindings.push(serde_json::json!(status));
    }

    if sets.is_empty() {
        return Err(error_response(StatusCode::BAD_REQUEST, "Sin cambios".to_string()));
    }

    let sql = format!("UPDATE epics SET {} WHERE id = ?", sets.join(", "));
    let mut q = sqlx::query(&sql);
    if let Some(name) = &payload.name { q = q.bind(name); }
    if let Some(summary) = &payload.summary { q = q.bind(summary); }
    if let Some(color) = &payload.color { q = q.bind(color); }
    if let Some(owner) = &payload.owner_id { q = q.bind(owner); }
    if let Some(start) = &payload.start_date { q = q.bind(start); }
    if let Some(due) = &payload.due_date { q = q.bind(due); }
    if let Some(status) = &payload.status { q = q.bind(status); }
    q = q.bind(&id);
    q.execute(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?;

    let epic = sqlx::query_as::<_, Epic>(
        "SELECT id, name, summary, color, owner_id, project_id, start_date, due_date, status, created_at \
         FROM epics WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(epic))
}

pub async fn delete_epic(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    sqlx::query("UPDATE epics SET deleted_at = datetime('now') WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE tasks SET epic_id = NULL WHERE epic_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{middleware, routing::{delete, get, patch, post}};

    axum::Router::new()
        .route("/api/epics", get(list_epics).post(create_epic))
        .route("/api/epics/:id", get(get_epic).patch(update_epic).delete(delete_epic))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
