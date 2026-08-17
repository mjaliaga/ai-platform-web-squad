use anyhow::Result;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::Path;
use std::str::FromStr;

pub async fn create_pool(database_url: &str) -> Result<SqlitePool> {
    if let Some(path) = database_url.strip_prefix("sqlite://") {
        if let Some(dir) = Path::new(path).parent() {
            if !dir.as_os_str().is_empty() {
                std::fs::create_dir_all(dir).ok();
            }
        }
    }

    let options = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect_with(options)
        .await?;

    Ok(pool)
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))"
    )
    .execute(pool)
    .await?;

    let migrations: &[(&str, &str)] = &[
        ("001_users", include_str!("../migrations/001_users.sql")),
        ("002_tasks", include_str!("../migrations/002_tasks.sql")),
        ("003_comments", include_str!("../migrations/003_comments.sql")),
        ("004_attachments", include_str!("../migrations/004_attachments.sql")),
        ("005_activity", include_str!("../migrations/005_activity.sql")),
        ("006_dependencies", include_str!("../migrations/006_dependencies.sql")),
        ("007_team", include_str!("../migrations/007_team.sql")),
        ("008_projects", include_str!("../migrations/008_projects.sql")),
        ("009_project_members", include_str!("../migrations/009_project_members.sql")),
        ("010_sprint_project", include_str!("../migrations/010_sprint_project.sql")),
        ("011_simplify_types", include_str!("../migrations/011_simplify_types.sql")),
        ("012_project_fields", include_str!("../migrations/012_project_fields.sql")),
        ("013_sprint_task_fields", include_str!("../migrations/013_sprint_task_fields.sql")),
        ("014_users_phone", include_str!("../migrations/014_users_phone.sql")),
        ("015_indexes", include_str!("../migrations/015_indexes.sql")),
        ("016_social", include_str!("../migrations/016_social.sql")),
    ];

    for (name, sql) in migrations {
        let applied: Option<(String,)> =
            sqlx::query_as("SELECT name FROM _migrations WHERE name = ?")
                .bind(name)
                .fetch_optional(pool)
                .await?;
        if applied.is_some() {
            continue;
        }
        sqlx::query(sql).execute(pool).await.map_err(|e| {
            anyhow::anyhow!("Migration {name} failed: {e}")
        })?;
        sqlx::query("INSERT INTO _migrations (name) VALUES (?)")
            .bind(name)
            .execute(pool)
            .await?;
    }

    Ok(())
}

pub async fn seed_admin(pool: &SqlitePool) -> Result<()> {
    use bcrypt::hash;

    let email = std::env::var("SEED_ADMIN_EMAIL")
        .unwrap_or_else(|_| "admin@tivit.com".to_string());
    let password = std::env::var("SEED_ADMIN_PASSWORD")
        .unwrap_or_else(|_| "tivit2026".to_string());
    let name = std::env::var("SEED_ADMIN_NAME")
        .unwrap_or_else(|_| "Admin".to_string());

    let existing: Option<(String,)> =
        sqlx::query_as("SELECT id FROM users WHERE email = ?")
            .bind(&email)
            .fetch_optional(pool)
            .await?;

    if existing.is_some() {
        return Ok(());
    }

    let id = uuid::Uuid::new_v4().to_string();
    let password_hash = hash(&password, bcrypt::DEFAULT_COST)?;

    sqlx::query(
        "INSERT INTO users (id, name, email, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, 'admin', '#dc2626')"
    )
    .bind(&id)
    .bind(&name)
    .bind(&email)
    .bind(&password_hash)
    .execute(pool)
    .await?;

    tracing::info!("Seeded admin user: {}", email);

    Ok(())
}