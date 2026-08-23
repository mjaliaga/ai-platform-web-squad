use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::sync::Arc;

use crate::models::Claims;
use crate::AppState;

pub async fn require_auth(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = req
        .headers()
        .get(header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .and_then(|c| extract_cookie(c, "tivit_token"))
        .or_else(|| {
            req.headers()
                .get(header::AUTHORIZATION)
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.strip_prefix("Bearer "))
                .map(|s| s.to_string())
        });

    let token = match token {
        Some(t) => t,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let mut validation = Validation::default();
    validation.leeway = 60;

    let claims = decode::<Claims>(
        &token,
        &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &validation,
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?
    .claims;

    let active: Option<(i32, Option<String>)> = sqlx::query_as(
        "SELECT active, deleted_at FROM users WHERE id = ?"
    )
        .bind(&claims.sub)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();

    match active {
        Some((1, None)) => {}
        Some((1, Some(_))) => return Err(StatusCode::UNAUTHORIZED),
        Some(_) => return Err(StatusCode::FORBIDDEN),
        None => return Err(StatusCode::UNAUTHORIZED),
    }

    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
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