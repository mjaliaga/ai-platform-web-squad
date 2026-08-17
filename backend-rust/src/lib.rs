use std::sync::Arc;
use axum::extract::DefaultBodyLimit;
use axum::http::{header::HeaderValue, Method};
use axum::Router;
use sqlx::SqlitePool;
use tower_http::cors::{Any, CorsLayer};

pub mod db;
pub mod middleware;
pub mod models;
pub mod ratelimit;
pub mod routes;
pub mod validation;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub jwt_secret: String,
}

pub async fn build_router(state: Arc<AppState>) -> Router {
    let public = routes::auth::public_router(state.clone());
    let protected = routes::auth::protected_router(state.clone())
        .merge(routes::tasks::router(state.clone()))
        .merge(routes::sprints::router(state.clone()))
        .merge(routes::deps::router(state.clone()))
        .merge(routes::time::router(state.clone()))
        .merge(routes::watchers::router(state.clone()))
        .merge(routes::notifications::router(state.clone()))
        .merge(routes::team::router(state.clone()))
        .merge(routes::projects::router(state.clone()));

    let cors_origins: Vec<String> = std::env::var("CORS_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:8080".to_string())
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let cors = if cors_origins.is_empty() {
        CorsLayer::new().allow_origin(Any)
    } else {
        let origins: Vec<HeaderValue> = cors_origins
            .iter()
            .filter_map(|o| o.parse().ok())
            .collect();
        CorsLayer::new()
            .allow_origin(origins)
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PATCH,
                Method::DELETE,
                Method::OPTIONS,
            ])
            .allow_headers([
                axum::http::header::CONTENT_TYPE,
                axum::http::header::AUTHORIZATION,
                axum::http::header::COOKIE,
            ])
            .allow_credentials(true)
    };

    public
        .merge(protected)
        .layer(cors)
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024))
        .layer(tower_http::trace::TraceLayer::new_for_http())
}