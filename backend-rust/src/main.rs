use std::sync::Arc;
use tivit_portal_backend::{build_router, db, AppState};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn,tower_http=info")))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://data/portal.db".to_string());
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "dev-secret-change-me".to_string());

    let pool = db::create_pool(&database_url).await?;
    db::run_migrations(&pool).await?;
    db::seed_admin(&pool).await?;

    let state = Arc::new(AppState {
        db: pool,
        jwt_secret,
    });

    let app = build_router(state).await;

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse()
        .unwrap_or(3000);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    tracing::info!("tivit-portal-backend listening on :{port}");

    axum::serve(listener, app).await?;

    Ok(())
}