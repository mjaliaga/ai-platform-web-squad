use axum::{
    extract::{Extension, Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Serialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::auth::require_auth;
use crate::models::{Claims, NotificationWithActor};
use crate::pagination::PaginatedResponse;
use crate::validation::internal_error;
use crate::AppState;

pub async fn list_notifications(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<PaginatedResponse<NotificationWithActor>>, Response> {
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

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND deleted_at IS NULL"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let notifs = sqlx::query_as::<_, crate::models::Notification>(
        "SELECT id, user_id, type as notification_type, task_id, actor_id, message, is_read, created_at \
         FROM notifications WHERE user_id = ? AND deleted_at IS NULL \
         ORDER BY created_at DESC LIMIT ? OFFSET ?"
    )
    .bind(&claims.sub)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let actor_ids: Vec<&str> = notifs.iter().filter_map(|n| n.actor_id.as_deref()).collect();
    let actors = crate::routes::tasks::batch_users(&state.db, &actor_ids).await;

    let mut items = Vec::with_capacity(notifs.len());
    for n in notifs {
        let actor = n.actor_id.as_ref().and_then(|aid| actors.get(aid).cloned());
        items.push(NotificationWithActor { notification: n, actor });
    }

    Ok(Json(PaginatedResponse {
        items,
        total: total.0,
        limit,
        offset,
    }))
}

#[derive(Debug, Serialize)]
pub struct UnreadCount {
    pub count: i64,
}

pub async fn unread_count(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<UnreadCount>, Response> {
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0 AND deleted_at IS NULL"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(UnreadCount { count: count.0 }))
}

pub async fn mark_read(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<StatusCode, Response> {
    sqlx::query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND deleted_at IS NULL")
        .bind(&claims.sub)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn create_notification(
    db: &sqlx::SqlitePool,
    user_id: &str,
    notification_type: &str,
    task_id: Option<&str>,
    actor_id: Option<&str>,
    message: &str,
) -> Result<(), sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO notifications (id, user_id, type, task_id, actor_id, message) \
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(user_id)
    .bind(notification_type)
    .bind(task_id)
    .bind(actor_id)
    .bind(message)
    .execute(db)
    .await?;
    Ok(())
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{middleware, routing::{get, post}};

    axum::Router::new()
        .route("/api/notifications", get(list_notifications))
        .route("/api/notifications/unread", get(unread_count))
        .route("/api/notifications/read", post(mark_read))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}