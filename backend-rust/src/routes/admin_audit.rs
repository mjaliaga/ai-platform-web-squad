use axum::{
    extract::{Extension, Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use std::sync::Arc;

use crate::middleware::auth::require_auth;
use crate::models::Claims;
use crate::validation::{internal_error, require_admin};
use crate::AppState;

#[derive(Debug, serde::Deserialize)]
pub struct AuditQuery {
    pub limit: Option<i64>,
    pub event_type: Option<String>,
}

pub async fn list_security_audit(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(q): Query<AuditQuery>,
) -> Result<Json<serde_json::Value>, Response> {
    require_admin(&claims)?;
    let limit = q.limit.unwrap_or(100).clamp(1, 500);

    let rows: Vec<(String, String, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, i64, String)> =
        if let Some(ref ev) = q.event_type {
            sqlx::query_as(
                "SELECT id, event_type, user_id, actor_id, ip_address, user_agent, details, success, created_at \
                 FROM security_audit_log WHERE event_type = ? ORDER BY created_at DESC LIMIT ?",
            )
            .bind(ev)
            .bind(limit)
            .fetch_all(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?
        } else {
            sqlx::query_as(
                "SELECT id, event_type, user_id, actor_id, ip_address, user_agent, details, success, created_at \
                 FROM security_audit_log ORDER BY created_at DESC LIMIT ?",
            )
            .bind(limit)
            .fetch_all(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?
        };

    let items: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|(id, event_type, user_id, actor_id, ip_address, user_agent, details, success, created_at)| {
            serde_json::json!({
                "id": id,
                "event_type": event_type,
                "user_id": user_id,
                "actor_id": actor_id,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "details": details,
                "success": success != 0,
                "created_at": created_at,
            })
        })
        .collect();

    Ok(Json(serde_json::json!({ "items": items })))
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::routing::get;
    axum::Router::new()
        .route("/api/admin/audit/security", get(list_security_audit))
        .route_layer(axum::middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
