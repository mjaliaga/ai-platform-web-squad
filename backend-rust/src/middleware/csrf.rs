use axum::{
    extract::{Request, State},
    http::{header, Method, StatusCode},
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

use crate::AppState;

const CSRF_HEADER: &str = "x-csrf-token";
const CSRF_COOKIE: &str = "csrf_token";

/// SEC-004: CSRF protection is ALWAYS enforced for mutating methods.
/// Tests should use a real CSRF token from the login flow, not disable CSRF.
/// `cfg(test)` allows unit tests to bypass the middleware by structuring
/// tests differently (or by adding a dedicated test-only handler).
pub async fn csrf_protect(
    State(_state): State<Arc<AppState>>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Read-only methods don't need CSRF.
    if matches!(req.method(), &Method::GET | &Method::HEAD | &Method::OPTIONS) {
        return Ok(next.run(req).await);
    }

    let header_token = req
        .headers()
        .get(CSRF_HEADER)
        .and_then(|v| v.to_str().ok());

    let cookie_token = req
        .headers()
        .get(header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .and_then(|c| extract_cookie(c, CSRF_COOKIE));

    match (header_token, cookie_token) {
        (Some(h), Some(c)) if h == c && !h.is_empty() => Ok(next.run(req).await),
        _ => Err(StatusCode::FORBIDDEN),
    }
}

pub fn generate_csrf_token() -> String {
    use uuid::Uuid;
    Uuid::new_v4().to_string()
}

pub fn set_csrf_cookie(headers: &mut axum::http::HeaderMap, token: &str, secure: bool) {
    let cookie = format!(
        "{}={}; SameSite=Lax; Path=/; Max-Age=86400{}",
        CSRF_COOKIE,
        token,
        if secure { "; Secure" } else { "" }
    );
    if let Ok(val) = cookie.parse() {
        headers.append(header::SET_COOKIE, val);
    }
}

fn extract_cookie(cookies: &str, name: &str) -> Option<String> {
    for pair in cookies.split(';') {
        let pair = pair.trim();
        if let Some((k, v)) = pair.split_once('=') {
            if k == name {
                return Some(v.to_string());
            }
        }
    }
    None
}