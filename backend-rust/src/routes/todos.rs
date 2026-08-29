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

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Todo {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
    pub due_date: Option<String>,
    pub priority: String,
    pub category: String,
    pub position: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTodoRequest {
    pub title: String,
    pub description: Option<String>,
    pub due_date: Option<String>,
    pub priority: Option<String>,
    pub category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTodoRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
    pub due_date: Option<String>,
    pub priority: Option<String>,
    pub category: Option<String>,
    pub position: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct TodoStats {
    pub total: i32,
    pub completed: i32,
    pub active: i32,
    pub overdue: i32,
}

fn is_overdue(due_date: &Option<String>) -> bool {
    if let Some(date) = due_date {
        if let Ok(due) = chrono::DateTime::parse_from_rfc3339(date) {
            return due < chrono::Utc::now();
        }
        if let Ok(date_only) = chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d") {
            let today = chrono::Utc::now().date_naive();
            return date_only < today;
        }
    }
    false
}

pub async fn list_todos(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Todo>>, Response> {
    let todos = sqlx::query_as::<_, Todo>(
        "SELECT id, user_id, title, description, completed, due_date, priority, category, position, created_at, updated_at 
         FROM todos WHERE user_id = ? ORDER BY position ASC, created_at DESC"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(todos))
}

pub async fn get_todo_stats(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<TodoStats>, Response> {
    let todos = sqlx::query_as::<_, Todo>(
        "SELECT id, user_id, title, description, completed, due_date, priority, category, position, created_at, updated_at 
         FROM todos WHERE user_id = ?"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let total = todos.len() as i32;
    let completed = todos.iter().filter(|t| t.completed).count() as i32;
    let active = total - completed;
    let overdue = todos.iter().filter(|t| !t.completed && is_overdue(&t.due_date)).count() as i32;

    Ok(Json(TodoStats { total, completed, active, overdue }))
}

pub async fn create_todo(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTodoRequest>,
) -> Result<Json<Todo>, Response> {
    validate_required("title", &payload.title, 500)?;

    let priority = payload.priority.unwrap_or_else(|| "medium".to_string());
    let category = payload.category.unwrap_or_else(|| "general".to_string());

    let max_position: Option<(i32,)> = sqlx::query_as(
        "SELECT COALESCE(MAX(position), 0) FROM todos WHERE user_id = ?"
    )
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let position = max_position.map(|(p,)| p + 1).unwrap_or(0);

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO todos (id, user_id, title, description, completed, due_date, priority, category, position, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&claims.sub)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.due_date)
    .bind(&priority)
    .bind(&category)
    .bind(position)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let todo = Todo {
        id,
        user_id: claims.sub,
        title: payload.title,
        description: payload.description,
        completed: false,
        due_date: payload.due_date,
        priority,
        category,
        position,
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
        "SELECT id, user_id, title, description, completed, due_date, priority, category, position, created_at, updated_at 
         FROM todos WHERE id = ? AND user_id = ?"
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
    let description = payload.description.or(existing.description);
    let completed = payload.completed.unwrap_or(existing.completed);
    let due_date = payload.due_date.or(existing.due_date);
    let priority = payload.priority.unwrap_or(existing.priority);
    let category = payload.category.unwrap_or(existing.category);
    let position = payload.position.unwrap_or(existing.position);
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query("UPDATE todos SET title = ?, description = ?, completed = ?, due_date = ?, priority = ?, category = ?, position = ?, updated_at = ? WHERE id = ?")
        .bind(&title)
        .bind(&description)
        .bind(completed)
        .bind(&due_date)
        .bind(&priority)
        .bind(&category)
        .bind(position)
        .bind(&now)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(Todo {
        id,
        user_id: existing.user_id,
        title,
        description,
        completed,
        due_date,
        priority,
        category,
        position,
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

#[derive(Serialize)]
struct ClearCompletedResponse {
    deleted: i32,
}

pub async fn clear_completed_todos(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<ClearCompletedResponse>, Response> {
    let result = sqlx::query("DELETE FROM todos WHERE user_id = ? AND completed = 1")
        .bind(&claims.sub)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(ClearCompletedResponse { deleted: result.rows_affected() as i32 }))
}

pub async fn reorder_todos(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(todo_ids): Json<Vec<String>>,
) -> Result<Json<Vec<Todo>>, Response> {
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    for (position, id) in todo_ids.iter().enumerate() {
        sqlx::query("UPDATE todos SET position = ?, updated_at = ? WHERE id = ? AND user_id = ?")
            .bind(position as i32)
            .bind(&now)
            .bind(id)
            .bind(&claims.sub)
            .execute(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let todos = sqlx::query_as::<_, Todo>(
        "SELECT id, user_id, title, description, completed, due_date, priority, category, position, created_at, updated_at 
         FROM todos WHERE user_id = ? ORDER BY position ASC, created_at DESC"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(todos))
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{delete, get, patch, post},
    };

    axum::Router::new()
        .route("/api/todos", get(list_todos).post(create_todo))
        .route("/api/todos/stats", get(get_todo_stats))
        .route("/api/todos/reorder", post(reorder_todos))
        .route("/api/todos/clear-completed", delete(clear_completed_todos))
        .route("/api/todos/:id", patch(update_todo).delete(delete_todo))
        .layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
