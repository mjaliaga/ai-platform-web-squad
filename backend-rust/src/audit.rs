use serde::Serialize;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::models::Claims;

#[derive(Debug, Clone, Serialize)]
pub struct AuditEvent {
    pub event_type: String,
    pub user_id: Option<String>,
    pub actor_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub details: Option<String>,
    pub success: bool,
}

impl AuditEvent {
    pub fn new(event_type: &str) -> Self {
        Self {
            event_type: event_type.to_string(),
            user_id: None,
            actor_id: None,
            ip_address: None,
            user_agent: None,
            details: None,
            success: true,
        }
    }

    pub fn with_actor(mut self, claims: &Claims) -> Self {
        self.actor_id = Some(claims.sub.clone());
        self
    }

    pub fn with_user(mut self, user_id: &str) -> Self {
        self.user_id = Some(user_id.to_string());
        self
    }

    pub fn with_ip(mut self, ip: Option<String>) -> Self {
        self.ip_address = ip;
        self
    }

    pub fn with_user_agent(mut self, ua: Option<String>) -> Self {
        self.user_agent = ua;
        self
    }

    pub fn with_details(mut self, details: &str) -> Self {
        self.details = Some(details.to_string());
        self
    }

    pub fn failed(mut self) -> Self {
        self.success = false;
        self
    }
}

pub async fn log_audit_event(pool: &SqlitePool, event: AuditEvent) {
    let id = Uuid::new_v4().to_string();
    let result = sqlx::query(
        "INSERT INTO security_audit_log \
         (id, event_type, user_id, actor_id, ip_address, user_agent, details, success) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&event.event_type)
    .bind(&event.user_id)
    .bind(&event.actor_id)
    .bind(&event.ip_address)
    .bind(&event.user_agent)
    .bind(&event.details)
    .bind(if event.success { 1 } else { 0 })
    .execute(pool)
    .await;

    if let Err(e) = result {
        tracing::error!("Failed to write audit log: {e}");
    }

    if event.success {
        tracing::info!(
            target: "audit",
            event_type = %event.event_type,
            user_id = ?event.user_id,
            actor_id = ?event.actor_id,
            "audit event"
        );
    } else {
        tracing::warn!(
            target: "audit",
            event_type = %event.event_type,
            user_id = ?event.user_id,
            actor_id = ?event.actor_id,
            details = ?event.details,
            "audit event (failed)"
        );
    }
}

pub async fn log_login_success(
    pool: &SqlitePool,
    user_id: &str,
    ip: Option<String>,
    ua: Option<String>,
) {
    log_audit_event(
        pool,
        AuditEvent::new("login_success")
            .with_user(user_id)
            .with_ip(ip)
            .with_user_agent(ua),
    )
    .await;
}

pub async fn log_login_failure(
    pool: &SqlitePool,
    email: &str,
    ip: Option<String>,
    ua: Option<String>,
    reason: &str,
) {
    log_audit_event(
        pool,
        AuditEvent::new("login_failure")
            .with_user(email)
            .with_ip(ip)
            .with_user_agent(ua)
            .with_details(reason)
            .failed(),
    )
    .await;
}

pub async fn log_logout(pool: &SqlitePool, user_id: &str) {
    log_audit_event(
        pool,
        AuditEvent::new("logout").with_user(user_id),
    )
    .await;
}

pub async fn log_role_change(
    pool: &SqlitePool,
    actor: &Claims,
    target_user_id: &str,
    new_role: &str,
) {
    log_audit_event(
        pool,
        AuditEvent::new("role_change")
            .with_actor(actor)
            .with_user(target_user_id)
            .with_details(&format!("role changed to {new_role}")),
    )
    .await;
}

pub async fn log_user_deactivated(
    pool: &SqlitePool,
    actor: &Claims,
    target_user_id: &str,
) {
    log_audit_event(
        pool,
        AuditEvent::new("user_deactivated")
            .with_actor(actor)
            .with_user(target_user_id),
    )
    .await;
}

pub async fn log_password_change(pool: &SqlitePool, user_id: &str) {
    log_audit_event(
        pool,
        AuditEvent::new("password_change").with_user(user_id),
    )
    .await;
}

use axum::http::HeaderMap;

pub fn extract_ip(headers: &HeaderMap) -> Option<String> {
    headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim().to_string())
        .or_else(|| {
            headers
                .get("x-real-ip")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string())
        })
}

pub fn extract_user_agent(headers: &HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}
