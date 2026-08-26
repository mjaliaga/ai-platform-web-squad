use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use std::sync::Arc;

use crate::middleware::auth::require_auth;
use crate::models::{Claims, DependencyRef, Task};
use crate::validation::{error_response, internal_error};
use crate::AppState;

pub async fn list_dependencies(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<Json<Vec<DependencyRef>>, Response> {
    let rows: Vec<(String, String, String, String, String)> = sqlx::query_as(
        "SELECT t.id, t.code, t.title, t.status, t.type FROM task_dependencies d \
         JOIN tasks t ON t.id = d.depends_on_id WHERE d.task_id = ?"
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let deps: Vec<DependencyRef> = rows
        .into_iter()
        .map(|(id, code, title, status, task_type)| DependencyRef {
            id,
            code,
            title,
            status,
            task_type,
        })
        .collect();

    Ok(Json(deps))
}

pub async fn list_blocking(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<Json<Vec<DependencyRef>>, Response> {
    let rows: Vec<(String, String, String, String, String)> = sqlx::query_as(
        "SELECT t.id, t.code, t.title, t.status, t.type FROM task_dependencies d \
         JOIN tasks t ON t.id = d.task_id WHERE d.depends_on_id = ?"
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let deps: Vec<DependencyRef> = rows
        .into_iter()
        .map(|(id, code, title, status, task_type)| DependencyRef {
            id,
            code,
            title,
            status,
            task_type,
        })
        .collect();

    Ok(Json(deps))
}

#[derive(serde::Deserialize)]
pub struct AddDepRequest {
    pub depends_on_id: String,
}

pub async fn add_dependency(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
    Json(payload): Json<AddDepRequest>,
) -> Result<Json<DependencyRef>, Response> {
    if task_id == payload.depends_on_id {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "Una tarea no puede depender de sí misma".to_string(),
        ));
    }

    if !crate::routes::tasks::task_exists(&state.db, &task_id).await? {
        return Err(error_response(StatusCode::NOT_FOUND, "Tarea no encontrada".to_string()));
    }
    if !crate::routes::tasks::task_exists(&state.db, &payload.depends_on_id).await? {
        return Err(error_response(StatusCode::NOT_FOUND, "La tarea dependiente no existe".to_string()));
    }

    sqlx::query("INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_id) VALUES (?, ?)")
        .bind(&task_id)
        .bind(&payload.depends_on_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let dep: Task = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE id = ?"
    )
    .bind(&payload.depends_on_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    crate::routes::tasks::log_activity_pub(
        &state.db,
        &task_id,
        &claims.sub,
        "linked",
        Some("dependency"),
        None,
        Some(&dep.code),
        None,
    )
    .await?;

    Ok(Json(DependencyRef {
        id: dep.id,
        code: dep.code,
        title: dep.title,
        status: dep.status,
        task_type: dep.task_type,
    }))
}

pub async fn remove_dependency(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path((task_id, depends_on_id)): Path<(String, String)>,
) -> Result<StatusCode, Response> {
    sqlx::query("DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_id = ?")
        .bind(&task_id)
        .bind(&depends_on_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn search_tasks_for_dep(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    axum::extract::Query(q): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<DependencyRef>>, Response> {
    let search = q.get("q").cloned().unwrap_or_default();
    let exclude_id = q.get("exclude").cloned().unwrap_or_default();

    let pattern = format!("%{}%", search);
    let rows: Vec<(String, String, String, String, String)> = sqlx::query_as(
        "SELECT id, code, title, status, type FROM tasks \
         WHERE (title LIKE ? OR code LIKE ?) AND id != ? \
         ORDER BY code DESC LIMIT 20"
    )
    .bind(&pattern)
    .bind(&pattern)
    .bind(&exclude_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let deps: Vec<DependencyRef> = rows
        .into_iter()
        .map(|(id, code, title, status, task_type)| DependencyRef {
            id,
            code,
            title,
            status,
            task_type,
        })
        .collect();

    Ok(Json(deps))
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{middleware, routing::{delete, get}};

    axum::Router::new()
        .route("/api/tasks/:id/dependencies", get(list_dependencies).post(add_dependency))
        .route("/api/tasks/:id/blocking", get(list_blocking))
        .route("/api/tasks/:id/dependencies/:depends_on_id", delete(remove_dependency))
        .route("/api/tasks/search", get(search_tasks_for_dep))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}