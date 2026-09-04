use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::auth::require_auth;
use crate::models::{Claims, TimeEntryWithUser, User};
use crate::validation::{error_response, internal_error, validate_hours};
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct LogTimeRequest {
    pub hours: f64,
    pub description: Option<String>,
    pub logged_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct EditTimeRequest {
    pub hours: Option<f64>,
    pub description: Option<String>,
}

pub async fn list_time_entries(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<Json<Vec<TimeEntryWithUser>>, Response> {
    let entries = sqlx::query_as::<_, crate::models::TimeEntry>(
        "SELECT id, task_id, user_id, hours, description, logged_at, created_at \
         FROM time_entries WHERE task_id = ? ORDER BY logged_at DESC, created_at DESC",
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user_ids: Vec<&str> = entries.iter().map(|e| e.user_id.as_str()).collect();
    let users = crate::routes::tasks::batch_users(&state.db, &user_ids).await;

    let mut result = Vec::with_capacity(entries.len());
    for entry in entries {
        if let Some(user) = users.get(&entry.user_id) {
            result.push(TimeEntryWithUser {
                entry,
                user: user.clone(),
            });
        }
    }
    Ok(Json(result))
}

pub async fn log_time(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
    Json(payload): Json<LogTimeRequest>,
) -> Result<(StatusCode, Json<TimeEntryWithUser>), Response> {
    validate_hours(payload.hours)?;
    if !crate::routes::tasks::task_exists(&state.db, &task_id).await? {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Tarea no encontrada".to_string(),
        ));
    }

    let id = Uuid::new_v4().to_string();
    let logged_at = payload
        .logged_at
        .unwrap_or_else(|| chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string());

    sqlx::query(
        "INSERT INTO time_entries (id, task_id, user_id, hours, description, logged_at) \
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&task_id)
    .bind(&claims.sub)
    .bind(payload.hours)
    .bind(&payload.description)
    .bind(&logged_at)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE tasks SET time_spent_hours = time_spent_hours + ?, updated_at = datetime('now') WHERE id = ?")
        .bind(payload.hours)
        .bind(&task_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    crate::routes::tasks::log_activity_pub(
        &state.db,
        &task_id,
        &claims.sub,
        "time_logged",
        Some("hours"),
        None,
        Some(&format!("{}h", payload.hours)),
        None,
    )
    .await?;

    let entry = sqlx::query_as::<_, crate::models::TimeEntry>(
        "SELECT id, task_id, user_id, hours, description, logged_at, created_at \
         FROM time_entries WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user: User = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((
        StatusCode::CREATED,
        Json(TimeEntryWithUser {
            entry,
            user: user.into(),
        }),
    ))
}

pub async fn delete_time_entry(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path((task_id, entry_id)): Path<(String, String)>,
) -> Result<StatusCode, Response> {
    let entry: Option<crate::models::TimeEntry> = sqlx::query_as::<_, crate::models::TimeEntry>(
        "SELECT id, task_id, user_id, hours, description, logged_at, created_at \
         FROM time_entries WHERE id = ?",
    )
    .bind(&entry_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let entry = match entry {
        Some(e) => e,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Registro de tiempo no encontrado".to_string(),
            ))
        }
    };
    if entry.task_id != task_id {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "El registro de tiempo no pertenece a esta tarea".to_string(),
        ));
    }

    sqlx::query("UPDATE tasks SET time_spent_hours = MAX(0, time_spent_hours - ?), updated_at = datetime('now') WHERE id = ?")
        .bind(entry.hours)
        .bind(&task_id)
        .execute(&state.db)
        .await
        .map_err(|er| internal_error(&format!("db error: {er}")))?;

    sqlx::query("DELETE FROM time_entries WHERE id = ?")
        .bind(&entry_id)
        .execute(&state.db)
        .await
        .map_err(|er| internal_error(&format!("db error: {er}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn edit_time_entry(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((task_id, entry_id)): Path<(String, String)>,
    Json(payload): Json<EditTimeRequest>,
) -> Result<Json<TimeEntryWithUser>, Response> {
    let entry: Option<crate::models::TimeEntry> = sqlx::query_as::<_, crate::models::TimeEntry>(
        "SELECT id, task_id, user_id, hours, description, logged_at, created_at \
         FROM time_entries WHERE id = ?",
    )
    .bind(&entry_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let entry = match entry {
        Some(e) => e,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Registro de tiempo no encontrado".to_string(),
            ))
        }
    };
    if entry.task_id != task_id {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "El registro de tiempo no pertenece a esta tarea".to_string(),
        ));
    }
    if entry.user_id != claims.sub {
        return Err(error_response(
            StatusCode::FORBIDDEN,
            "Solo puedes editar tus propios registros de tiempo".to_string(),
        ));
    }

    let new_hours = payload.hours.unwrap_or(entry.hours);
    validate_hours(new_hours)?;
    let new_description = payload.description.clone().or(entry.description);

    let hours_diff = new_hours - entry.hours;

    sqlx::query("UPDATE time_entries SET hours = ?, description = ? WHERE id = ?")
        .bind(new_hours)
        .bind(new_description)
        .bind(&entry_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if (hours_diff).abs() > f64::EPSILON {
        sqlx::query(
            "UPDATE tasks SET time_spent_hours = MAX(0, time_spent_hours + ?), updated_at = datetime('now') WHERE id = ?"
        )
        .bind(hours_diff)
        .bind(&task_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let updated = sqlx::query_as::<_, crate::models::TimeEntry>(
        "SELECT id, task_id, user_id, hours, description, logged_at, created_at \
         FROM time_entries WHERE id = ?",
    )
    .bind(&entry_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user: User = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(TimeEntryWithUser {
        entry: updated,
        user: user.into(),
    }))
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{delete, get},
    };

    axum::Router::new()
        .route("/api/tasks/:id/time", get(list_time_entries).post(log_time))
        .route(
            "/api/tasks/:id/time/:entry_id",
            delete(delete_time_entry).patch(edit_time_entry),
        )
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
