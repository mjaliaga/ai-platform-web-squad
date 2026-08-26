use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::auth::require_auth;
use crate::models::Claims;
use crate::validation::{error_response, internal_error, validate_required};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Todo {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTodoRequest {
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTodoRequest {
    pub title: Option<String>,
    pub completed: Option<bool>,
}

pub async fn list_todos(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Todo>>, Response> {
    let todos = sqlx::query_as::<_, Todo>(
        "SELECT id, user_id, title, completed, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY created_at DESC"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(todos))
}

pub async fn create_todo(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTodoRequest>,
) -> Result<Json<Todo>, Response> {
    validate_required("title", &payload.title, 500)?;

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO todos (id, user_id, title, completed, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)"
    )
    .bind(&id)
    .bind(&claims.sub)
    .bind(&payload.title)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let todo = Todo {
        id,
        user_id: claims.sub,
        title: payload.title,
        completed: false,
        created_at: now.clone(),
        updated_at: now,
    };

    Ok(Json(todo))
}

pub async fn update_todo(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateTodoRequest>,
) -> Result<Json<Todo>, Response> {
    let existing = sqlx::query_as::<_, Todo>(
        "SELECT id, user_id, title, completed, created_at, updated_at FROM todos WHERE id = ? AND user_id = ?"
    )
    .bind(&id)
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let existing = match existing {
        Some(t) => t,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Todo no encontrado".to_string())),
    };

    let title = payload.title.unwrap_or(existing.title);
    let completed = payload.completed.unwrap_or(existing.completed);
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query("UPDATE todos SET title = ?, completed = ?, updated_at = ? WHERE id = ?")
        .bind(&title)
        .bind(completed)
        .bind(&now)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(Todo {
        id,
        user_id: existing.user_id,
        title,
        completed,
        created_at: existing.created_at,
        updated_at: now,
    }))
}

pub async fn delete_todo(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    let result = sqlx::query("DELETE FROM todos WHERE id = ? AND user_id = ?")
        .bind(&id)
        .bind(&claims.sub)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(StatusCode::NOT_FOUND, "Todo no encontrado".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{delete, get, patch, post},
    };

    axum::Router::new()
        .route("/api/todos", get(list_todos).post(create_todo))
        .route("/api/todos/:id", patch(update_todo).delete(delete_todo))
        .layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
