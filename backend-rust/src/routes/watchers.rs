use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use std::sync::Arc;

use crate::middleware::auth::require_auth;
use crate::models::{Claims, PublicUser, User};
use crate::validation::internal_error;
use crate::AppState;

pub async fn list_watchers(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<Json<Vec<PublicUser>>, Response> {
    let users: Vec<User> = sqlx::query_as::<_, User>(
        "SELECT u.id, u.name, u.email, u.password_hash, u.role, u.avatar_color, u.created_at, u.active \
         FROM task_watchers w JOIN users u ON u.id = w.user_id \
         WHERE w.task_id = ? ORDER BY u.name"
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(users.into_iter().map(Into::into).collect()))
}

pub async fn watch_task(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<Json<PublicUser>, Response> {
    sqlx::query("INSERT OR IGNORE INTO task_watchers (task_id, user_id) VALUES (?, ?)")
        .bind(&task_id)
        .bind(&claims.sub)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user: User = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(user.into()))
}

pub async fn unwatch_task(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<StatusCode, Response> {
    sqlx::query("DELETE FROM task_watchers WHERE task_id = ? AND user_id = ?")
        .bind(&task_id)
        .bind(&claims.sub)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(StatusCode::NO_CONTENT)
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{middleware, routing::{delete, get, post}};

    axum::Router::new()
        .route("/api/tasks/:id/watchers", get(list_watchers))
        .route("/api/tasks/:id/watch", post(watch_task))
        .route("/api/tasks/:id/watch", delete(unwatch_task))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}