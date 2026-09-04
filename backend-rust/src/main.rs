use std::sync::Arc;
use std::time::Duration;
use tivit_portal_backend::{build_router, db, AppState};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn,tower_http=info")),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://data/portal.db".to_string());

    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| {
        tracing::error!("JWT_SECRET no está configurado. Generá uno con: openssl rand -hex 64");
        std::process::exit(1);
    });

    if jwt_secret.len() < 32 {
        tracing::error!(
            "JWT_SECRET es demasiado corto ({}). Usá al menos 32 caracteres (recomendado 64+).",
            jwt_secret.len()
        );
        std::process::exit(1);
    }

    if jwt_secret == "dev-secret-change-me" || jwt_secret == "change-me-in-production" {
        tracing::error!("JWT_SECRET tiene el valor por defecto inseguro. Configurá un valor real.");
        std::process::exit(1);
    }

    let redis_url = std::env::var("REDIS_URL").ok();

    let pool = db::create_pool(&database_url).await?;
    db::run_migrations(&pool).await?;
    db::seed_admin(&pool).await?;

    let rate_limiter = tivit_portal_backend::ratelimit_redis::create_rate_limiter(
        redis_url.as_deref(),
        Duration::from_secs(15 * 60),
        10,
    )
    .await;

    let state = Arc::new(AppState {
        db: pool,
        jwt_secret,
        rate_limiter,
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
