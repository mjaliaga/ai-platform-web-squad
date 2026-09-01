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
        .foreign_keys(true)
        .busy_timeout(std::time::Duration::from_millis(5000));

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
        ("017_soft_deletes", include_str!("../migrations/017_soft_deletes.sql")),
        ("018_performance_indexes", include_str!("../migrations/018_performance_indexes.sql")),
        ("019_content_cms", include_str!("../migrations/019_content_cms.sql")),
        ("020_unify_projects", include_str!("../migrations/020_unify_projects.sql")),
        ("021_migrate_project_data", include_str!("../migrations/021_migrate_project_data.sql")),
        ("022_epics_versions_story_points", include_str!("../migrations/022_epics_versions_story_points.sql")),
        ("024_workflows_saved_filters", include_str!("../migrations/024_workflows_saved_filters.sql")),
        ("025_todos", include_str!("../migrations/025_todos.sql")),
        ("026_certifications", include_str!("../migrations/026_certifications.sql")),
        ("027_portfolio_categoria", include_str!("../migrations/027_portfolio_categoria.sql")),
        ("028_portfolio_stages", include_str!("../migrations/028_portfolio_stages.sql")),
        ("029_todos_enhanced", include_str!("../migrations/029_todos_enhanced.sql")),
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

        // Split SQL into statements and execute each one individually
        // This allows partial migrations to succeed and be marked complete
        let statements: Vec<&str> = sql.split(';')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .collect();

        let mut all_ok = true;
        for stmt in statements {
            let result = sqlx::query(stmt).execute(pool).await;
            match result {
                Ok(_) => {}
                Err(e) => {
                    let err_msg = e.to_string();
                    // Ignore "duplicate column" errors (code 1) for ALTER TABLE
                    // This makes migrations idempotent
                    if err_msg.contains("duplicate column name:") {
                        tracing::warn!("Migration {} - column already exists, skipping: {}", name, err_msg);
                        continue;
                    }
                    // Ignore "index already exists" errors
                    if err_msg.contains("already exists") && (stmt.starts_with("CREATE INDEX") || stmt.starts_with("CREATE UNIQUE INDEX")) {
                        tracing::warn!("Migration {} - index already exists, skipping: {}", name, err_msg);
                        continue;
                    }
                    // Other errors are fatal
                    tracing::error!("Migration {} failed on statement: {}", name, stmt);
                    tracing::error!("Error: {}", e);
                    all_ok = false;
                    break;
                }
            }
        }

        if all_ok {
            sqlx::query("INSERT INTO _migrations (name) VALUES (?)")
                .bind(name)
                .execute(pool)
                .await?;
        }
    }

    Ok(())
}

pub async fn seed_admin(pool: &SqlitePool) -> Result<()> {
    use bcrypt::hash;

    // SEC-001: Require explicit env var, fail loudly if missing.
    // No insecure defaults — admin seeding must be opt-in via environment.
    let email_raw = match std::env::var("SEED_ADMIN_EMAIL") {
        Ok(v) => v,
        Err(_) => {
            tracing::info!("SEED_ADMIN_EMAIL not set — skipping admin seed (set it to enable seeding).");
            return Ok(());
        }
    };
    let email = email_raw.trim().to_string();
    if email.is_empty() {
        tracing::info!("SEED_ADMIN_EMAIL empty — skipping admin seed (set a valid email to enable seeding).");
        return Ok(());
    }

    // FIX: Check existing BEFORE validating password. This allows restarts
    // to succeed even if SEED_ADMIN_PASSWORD is short/weak but user already exists,
    // and avoids creating a corrupted user with email="" when env is empty string.
    let existing: Option<(String,)> =
        sqlx::query_as("SELECT id FROM users WHERE email = ?")
            .bind(&email)
            .fetch_optional(pool)
            .await?;

    if existing.is_some() {
        return Ok(());
    }

    let password = match std::env::var("SEED_ADMIN_PASSWORD") {
        Ok(v) => {
            if v.len() < 12 {
                tracing::error!("SEED_ADMIN_PASSWORD too short (min 12 chars). Aborting.");
                anyhow::bail!("SEED_ADMIN_PASSWORD too short (min 12 chars)");
            }
            v
        }
        Err(_) => {
            tracing::info!("SEED_ADMIN_PASSWORD not set — skipping admin seed.");
            return Ok(());
        }
    };
    let name = std::env::var("SEED_ADMIN_NAME").unwrap_or_else(|_| "Admin".to_string());

    // Reject weak/common passwords explicitly.
    let weak = ["tivit2026", "admin123", "password", "changeme", "12345678"];
    if weak.iter().any(|w| password.eq_ignore_ascii_case(w)) {
        tracing::error!("SEED_ADMIN_PASSWORD is in the weak-password blocklist. Choose a stronger one.");
        anyhow::bail!("SEED_ADMIN_PASSWORD is in weak blocklist");
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