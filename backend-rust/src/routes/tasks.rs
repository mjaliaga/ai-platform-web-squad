use axum::{
    extract::{Extension, Multipart, Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::auth::require_auth;
use crate::models::{
    ActivityLog, ActivityWithUser, AssigneeCount, Attachment,
    AttachmentWithUploader, Claims, Comment, CommentWithAuthor, DashboardStats,
    PriorityCount, PublicUser, StatusCount, Task, TaskWithDetails, User,
};
use crate::validation::{
    error_response, internal_error, require_admin, validate_enum, validate_hours,
    validate_required, MAX_UPLOAD_BYTES, PRIORITIES, SOLICITUD_STATUSES, STATUSES, TYPES,
};
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct ListTasksQuery {
    pub status: Option<String>,
    pub assignee: Option<String>,
    pub priority: Option<String>,
    pub r#type: Option<String>,
    pub epic: Option<String>,
    pub sprint: Option<String>,
    pub project: Option<String>,
    pub parent: Option<String>,
    pub q: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn list_tasks(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ListTasksQuery>,
) -> Result<Json<Vec<TaskWithDetails>>, Response> {
    // Portafolio: solo miembros pueden listar tareas de un proyecto
    if let Some(proj) = &query.project {
        if claims.role != "admin" {
            let member: Option<(String,)> = sqlx::query_as(
                "SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?",
            )
            .bind(proj)
            .bind(&claims.sub)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
            if member.is_none() {
                // también permitir si tiene tareas asignadas en ese proyecto
                let assigned: Option<(String,)> = sqlx::query_as(
                    "SELECT id FROM tasks WHERE project_id = ? AND assignee_id = ? AND deleted_at IS NULL LIMIT 1",
                )
                .bind(proj)
                .bind(&claims.sub)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
                if assigned.is_none() {
                    return Err(error_response(
                        StatusCode::FORBIDDEN,
                        "No tienes acceso a este proyecto".to_string(),
                    ));
                }
            }
        }
    }
    let mut sql = String::from(
        "SELECT t.id, t.code, t.title, t.description, t.type as task_type, t.status, t.priority, \
         t.assignee_id, t.reporter_id, t.parent_id, t.epic_id, t.sprint_id, project_id, \
         t.estimate_hours, t.time_spent_hours, t.due_date, t.deliverable, t.position, t.created_at, t.updated_at, t.story_points, t.resolution \
         FROM tasks t WHERE 1=1"
    );
    let mut params: Vec<String> = Vec::new();

    if let Some(s) = &query.status {
        sql.push_str(" AND t.status = ?");
        params.push(s.clone());
    }
    if let Some(a) = &query.assignee {
        sql.push_str(" AND t.assignee_id = ?");
        params.push(a.clone());
    }
    if let Some(p) = &query.priority {
        sql.push_str(" AND t.priority = ?");
        params.push(p.clone());
    }
    if let Some(t) = &query.r#type {
        sql.push_str(" AND t.type = ?");
        params.push(t.clone());
    }
    if let Some(e) = &query.epic {
        sql.push_str(" AND t.epic_id = ?");
        params.push(e.clone());
    }
    if let Some(sp) = &query.sprint {
        sql.push_str(" AND t.sprint_id = ?");
        params.push(sp.clone());
    }
    if let Some(proj) = &query.project {
        sql.push_str(" AND t.project_id = ?");
        params.push(proj.clone());
    }
    if let Some(p) = &query.parent {
        sql.push_str(" AND t.parent_id = ?");
        params.push(p.clone());
    }
    if let Some(q) = &query.q {
        sql.push_str(" AND (t.title LIKE ? OR t.description LIKE ?)");
        let pat = format!("%{}%", q);
        params.push(pat.clone());
        params.push(pat);
    }

    sql.push_str(" ORDER BY t.position ASC, t.created_at DESC");

    let limit = query.limit.unwrap_or(100).clamp(1, 500);
    let offset = query.offset.unwrap_or(0).max(0);
    sql.push_str(" LIMIT ? OFFSET ?");

    let mut q = sqlx::query_as::<_, Task>(&sql);
    for p in &params {
        q = q.bind(p);
    }
    q = q.bind(limit).bind(offset);
    let tasks = q.fetch_all(&state.db).await.map_err(|e| {
        internal_error(&format!("db error: {e}"))
    })?;

    let result = batch_load_task_details(&state.db, tasks).await?;

    Ok(Json(result))
}

pub async fn get_task(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<TaskWithDetails>, Response> {
    let task: Task = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?
    .ok_or_else(|| error_response(StatusCode::NOT_FOUND, "task not found".to_string()))?;
    if let Some(pid) = &task.project_id {
        if claims.role != "admin" {
            let member: Option<(String,)> = sqlx::query_as(
                "SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?",
            )
            .bind(pid)
            .bind(&claims.sub)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
            if member.is_none() {
                let assigned: Option<(String,)> = sqlx::query_as(
                    "SELECT id FROM tasks WHERE project_id = ? AND assignee_id = ? AND deleted_at IS NULL LIMIT 1",
                )
                .bind(pid)
                .bind(&claims.sub)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
                if assigned.is_none() {
                    return Err(error_response(
                        StatusCode::FORBIDDEN,
                        "No tienes acceso a este proyecto".to_string(),
                    ));
                }
            }
        }
    }

    let details = load_task_details(&state.db, task).await?;
    Ok(Json(details))
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    #[serde(default = "default_type")]
    pub r#type: String,
    #[serde(default = "default_priority")]
    pub priority: String,
    #[serde(default = "default_status")]
    pub status: String,
    pub assignee_id: Option<String>,
    pub parent_id: Option<String>,
    pub epic_id: Option<String>,
    pub sprint_id: Option<String>,
    pub project_id: Option<String>,
    pub estimate_hours: Option<f64>,
    pub due_date: Option<String>,
    #[serde(default)]
    pub deliverable: Option<String>,
    pub labels: Option<Vec<String>>,
    pub story_points: Option<i64>,
    pub resolution: Option<String>,
}

fn default_type() -> String { "tarea".to_string() }
fn default_priority() -> String { "medium".to_string() }
fn default_status() -> String { "backlog".to_string() }

pub async fn create_task(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTaskRequest>,
) -> Result<(StatusCode, Json<TaskWithDetails>), Response> {
    validate_required("title", &payload.title, 200)?;
    let allowed_statuses = if payload.r#type == "solicitud" {
        SOLICITUD_STATUSES
    } else {
        STATUSES
    };
    validate_enum("status", &payload.status, allowed_statuses)?;
    validate_enum("priority", &payload.priority, PRIORITIES)?;
    validate_enum("type", &payload.r#type, TYPES)?;

    if let Some(aid) = &payload.assignee_id {
        if !user_exists(&state.db, aid).await? {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "El usuario asignado no existe".to_string(),
            ));
        }
    }
    for (field, tid) in [("parent", &payload.parent_id)] {
        if let Some(tid) = tid {
            if !task_exists(&state.db, tid).await? {
                return Err(error_response(
                    StatusCode::BAD_REQUEST,
                    format!("El {field} indicado no existe"),
                ));
            }
        }
    }
    if let Some(eid) = &payload.epic_id {
        if !epic_exists(&state.db, eid).await? {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "El epic indicado no existe".to_string(),
            ));
        }
    }
    if let Some(sid) = &payload.sprint_id {
        if !sprint_exists(&state.db, sid).await? {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "El sprint indicado no existe".to_string(),
            ));
        }
    }

    let id = Uuid::new_v4().to_string();

    let mut conn = state.db.acquire().await.map_err(|e| internal_error(&format!("db error: {e}")))?;
    sqlx::query("BEGIN IMMEDIATE")
        .execute(&mut *conn)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let write_result: Result<(), Response> = (async {
        let code: (String,) = sqlx::query_as(
            "SELECT 'TIV-' || printf('%04d', COALESCE(MAX(CAST(SUBSTR(code, 5) AS INTEGER)), 0) + 1) \
             FROM tasks WHERE code LIKE 'TIV-%'"
        )
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

        let max_pos: (i32,) = sqlx::query_as(
            "SELECT COALESCE(MAX(position), 0) FROM tasks WHERE status = ?"
        )
        .bind(&payload.status)
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

        sqlx::query(
            "INSERT INTO tasks (id, code, title, description, type, status, priority, \
             assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
             estimate_hours, due_date, deliverable, position, story_points, resolution) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&code.0)
        .bind(&payload.title)
        .bind(&payload.description)
        .bind(&payload.r#type)
        .bind(&payload.status)
        .bind(&payload.priority)
        .bind(&payload.assignee_id)
        .bind(&claims.sub)
        .bind(&payload.parent_id)
        .bind(&payload.epic_id)
        .bind(&payload.sprint_id)
        .bind(&payload.project_id)
        .bind(payload.estimate_hours)
        .bind(&payload.due_date)
        .bind(payload.deliverable.as_deref().unwrap_or(""))
        .bind(max_pos.0 + 1)
        .bind(&payload.story_points)
        .bind(&payload.resolution)
        .execute(&mut *conn)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

        if let Some(labels) = &payload.labels {
            for label in labels {
                sqlx::query("INSERT OR IGNORE INTO task_labels (task_id, label) VALUES (?, ?)")
                    .bind(&id)
                    .bind(label)
                    .execute(&mut *conn)
                    .await
                    .map_err(|e| internal_error(&format!("db error: {e}")))?;
            }
        }

        Ok(())
    })
    .await;

    if let Err(resp) = write_result {
        let _ = sqlx::query("ROLLBACK").execute(&mut *conn).await;
        return Err(resp);
    }

    sqlx::query("COMMIT")
        .execute(&mut *conn)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    log_activity(&state.db, &id, &claims.sub, "created", None, None, None, None).await?;

    let task: Task = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let details = load_task_details(&state.db, task).await?;
    Ok((StatusCode::CREATED, Json(details)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub r#type: Option<String>,
    pub priority: Option<String>,
    pub assignee_id: Option<Option<String>>,
    pub parent_id: Option<Option<String>>,
    pub epic_id: Option<Option<String>>,
    pub sprint_id: Option<Option<String>>,
    pub project_id: Option<Option<String>>,
    pub estimate_hours: Option<Option<f64>>,
    pub due_date: Option<Option<String>>,
    pub deliverable: Option<String>,
    pub labels: Option<Vec<String>>,
    pub story_points: Option<Option<i64>>,
    pub resolution: Option<Option<String>>,
}

pub async fn update_task(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateTaskRequest>,
) -> Result<Json<TaskWithDetails>, Response> {
    if let Some(v) = &payload.title {
        validate_required("title", v, 200)?;
    }
    if let Some(v) = &payload.r#type {
        validate_enum("type", v, TYPES)?;
    }
    if let Some(v) = &payload.priority {
        validate_enum("priority", v, PRIORITIES)?;
    }
    if let Some(v) = &payload.estimate_hours {
        if let Some(hours) = *v {
            validate_hours(hours)?;
        }
    }

    let existing: Task = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?
    .ok_or_else(|| error_response(StatusCode::NOT_FOUND, "task not found".to_string()))?;

    if let Some(v) = &payload.title {
        if v != &existing.title {
            log_activity(&state.db, &id, &claims.sub, "updated", Some("title"), Some(&existing.title), Some(v), None).await?;
            sqlx::query("UPDATE tasks SET title = ?, updated_at = datetime('now') WHERE id = ?")
                .bind(v).bind(&id).execute(&state.db).await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
        }
    }
    if let Some(v) = &payload.description {
        let old = existing.description.clone().unwrap_or_default();
        if v != &old {
            log_activity(&state.db, &id, &claims.sub, "updated", Some("description"), Some(&old), Some(v), None).await?;
            sqlx::query("UPDATE tasks SET description = ?, updated_at = datetime('now') WHERE id = ?")
                .bind(v).bind(&id).execute(&state.db).await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
        }
    }
    if let Some(v) = &payload.r#type {
        if v != &existing.task_type {
            log_activity(&state.db, &id, &claims.sub, "updated", Some("type"), Some(&existing.task_type), Some(v), None).await?;
            sqlx::query("UPDATE tasks SET type = ?, updated_at = datetime('now') WHERE id = ?")
                .bind(v).bind(&id).execute(&state.db).await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
        }
    }
    if let Some(v) = &payload.priority {
        if v != &existing.priority {
            log_activity(&state.db, &id, &claims.sub, "updated", Some("priority"), Some(&existing.priority), Some(v), None).await?;
            sqlx::query("UPDATE tasks SET priority = ?, updated_at = datetime('now') WHERE id = ?")
                .bind(v).bind(&id).execute(&state.db).await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
        }
    }
    if let Some(v) = &payload.assignee_id {
        let new_val = v.as_deref();
        let old_val = existing.assignee_id.as_deref();
        if new_val != old_val {
            let new_user = if let Some(uid) = new_val { get_user_name(&state.db, uid).await.ok() } else { None };
            let old_user = if let Some(uid) = old_val { get_user_name(&state.db, uid).await.ok() } else { None };
            log_activity(&state.db, &id, &claims.sub, "assigned", Some("assignee"), old_user.as_deref(), new_user.as_deref(), None).await?;
            sqlx::query("UPDATE tasks SET assignee_id = ?, updated_at = datetime('now') WHERE id = ?")
                .bind(new_val).bind(&id).execute(&state.db).await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;

            if let Some(new_uid) = new_val {
                if new_uid != claims.sub {
                    let actor_name: Option<String> = sqlx::query_as::<_, (String,)>(
                        "SELECT name FROM users WHERE id = ?"
                    )
                    .bind(&claims.sub)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten()
                    .map(|(n,)| n);

                    let _ = crate::routes::notifications::create_notification(
                        &state.db,
                        new_uid,
                        "assigned",
                        Some(&id),
                        Some(&claims.sub),
                        &format!("{} te asignó la tarea {}", actor_name.unwrap_or_default(), existing.code),
                    ).await;
                }
            }
        }
    }
    if let Some(v) = &payload.parent_id {
        sqlx::query("UPDATE tasks SET parent_id = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(v.as_deref()).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.epic_id {
        sqlx::query("UPDATE tasks SET epic_id = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(v.as_deref()).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.sprint_id {
        sqlx::query("UPDATE tasks SET sprint_id = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(v.as_deref()).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.project_id {
        sqlx::query("UPDATE tasks SET project_id = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(v.as_deref()).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.estimate_hours {
        sqlx::query("UPDATE tasks SET estimate_hours = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(*v).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.due_date {
        sqlx::query("UPDATE tasks SET due_date = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(v.as_deref()).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.deliverable {
        sqlx::query("UPDATE tasks SET deliverable = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(v).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(labels) = &payload.labels {
        sqlx::query("DELETE FROM task_labels WHERE task_id = ?").bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
        for label in labels {
            sqlx::query("INSERT OR IGNORE INTO task_labels (task_id, label) VALUES (?, ?)")
                .bind(&id).bind(label).execute(&state.db).await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
        }
    }
    if let Some(v) = &payload.story_points {
        sqlx::query("UPDATE tasks SET story_points = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(v).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.resolution {
        sqlx::query("UPDATE tasks SET resolution = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(v).bind(&id).execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let task: Task = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let details = load_task_details(&state.db, task).await?;
    Ok(Json(details))
}

#[derive(Debug, Deserialize)]
pub struct UpdateStatusRequest {
    pub status: String,
    pub position: Option<i32>,
    #[serde(default)]
    pub justification: Option<String>,
}

pub async fn update_task_status(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<Json<TaskWithDetails>, Response> {
    let existing: Task = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?
    .ok_or_else(|| error_response(StatusCode::NOT_FOUND, "task not found".to_string()))?;

    let allowed_statuses = if existing.task_type == "solicitud" {
        crate::validation::SOLICITUD_STATUSES
    } else {
        crate::validation::STATUSES
    };
    validate_enum("status", &payload.status, allowed_statuses)?;

    let new_position = payload.position.unwrap_or(existing.position);

    if payload.status != existing.status {
        log_activity(&state.db, &id, &claims.sub, "moved", Some("status"), Some(&existing.status), Some(&payload.status), payload.justification.as_deref()).await?;
    }

    sqlx::query("UPDATE tasks SET status = ?, position = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(&payload.status)
        .bind(new_position)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let task: Task = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let details = load_task_details(&state.db, task).await?;
    Ok(Json(details))
}

pub async fn delete_task(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    let existing: Option<(String,)> = sqlx::query_as(
        "SELECT id FROM tasks WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if existing.is_none() {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Tarea no encontrada".to_string(),
        ));
    }

    let now_ts = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let mut tx = state.db.begin().await.map_err(|e| {
        internal_error(&format!("db error: {e}"))
    })?;

    sqlx::query("UPDATE tasks SET deleted_at = ? WHERE id = ?")
        .bind(&now_ts)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE comments SET deleted_at = ? WHERE task_id = ?")
        .bind(&now_ts)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE attachments SET deleted_at = ? WHERE task_id = ?")
        .bind(&now_ts)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE time_entries SET deleted_at = ? WHERE task_id = ?")
        .bind(&now_ts)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE activity_log SET deleted_at = ? WHERE task_id = ?")
        .bind(&now_ts)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    tx.commit().await.map_err(|e| {
        internal_error(&format!("db error: {e}"))
    })?;

    log_activity(
        &state.db,
        &id,
        &claims.sub,
        "deleted",
        None,
        None,
        None,
        None,
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Serialize)]
pub struct BoardResponse {
    pub columns: Vec<BoardColumn>,
}

#[derive(Debug, Serialize)]
pub struct BoardColumn {
    pub status: String,
    pub title: String,
    pub tasks: Vec<TaskWithDetails>,
}

pub async fn get_board(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<BoardResponse>, Response> {
    let mine = params.get("scope").map(|s| s.as_str()) == Some("mine");
    let project = params.get("project").map(|s| s.as_str());
    let statuses = [
        ("todo", "Por hacer"),
        ("in_progress", "En progreso"),
        ("review", "En revisión"),
        ("done", "Completado"),
    ];

    // 1) Traer todas las tareas que matchean en una sola query.
    let mut where_parts = vec![
        "parent_id IS NULL".to_string(),
        "deleted_at IS NULL".to_string(),
    ];
    let mut binds: Vec<String> = Vec::new();
    let placeholders = statuses.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    where_parts.push(format!("status IN ({})", placeholders));
    for (status, _) in statuses {
        binds.push(status.to_string());
    }
    if mine {
        where_parts.push("assignee_id = ?".to_string());
        binds.push(claims.sub.clone());
    }
    if let Some(pid) = project {
        where_parts.push("project_id = ?".to_string());
        binds.push(pid.to_string());
    }

    let sql = format!(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE {} ORDER BY status ASC, position ASC, created_at DESC",
        where_parts.join(" AND ")
    );

    let mut q = sqlx::query_as::<_, Task>(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    let all_tasks: Vec<Task> = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    // 2) Batch load de detalles.
    let all_details = batch_load_task_details(&state.db, all_tasks).await?;

    // 3) Agrupar por status.
    let mut by_status: HashMap<String, Vec<TaskWithDetails>> = HashMap::new();
    for d in all_details {
        by_status.entry(d.task.status.clone()).or_default().push(d);
    }

    let mut columns = Vec::with_capacity(statuses.len());
    for (status, title) in statuses {
        let tasks = by_status.remove(status).unwrap_or_default();
        columns.push(BoardColumn {
            status: status.to_string(),
            title: title.to_string(),
            tasks,
        });
    }

    Ok(Json(BoardResponse { columns }))
}

#[derive(Debug, Serialize)]
pub struct BacklogResponse {
    pub tasks: Vec<TaskWithDetails>,
}

pub async fn get_backlog(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<BacklogResponse>, Response> {
    let mine = params.get("scope").map(|s| s.as_str()) == Some("mine");
    let project = params.get("project").map(|s| s.as_str());

    let base_cols = "id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at";

    let mut where_parts = vec![
        "status = 'backlog'".to_string(),
        "parent_id IS NULL".to_string(),
        "deleted_at IS NULL".to_string(),
    ];
    let mut binds: Vec<String> = Vec::new();
    if mine { where_parts.push("assignee_id = ?".to_string()); binds.push(claims.sub.clone()); }
    if let Some(pid) = project { where_parts.push("project_id = ?".to_string()); binds.push(pid.to_string()); }

    let sql = format!("SELECT {} FROM tasks WHERE {} ORDER BY position ASC, created_at DESC", base_cols, where_parts.join(" AND "));
    let mut q = sqlx::query_as::<_, Task>(&sql);
    for b in &binds { q = q.bind(b); }
    let rows: Vec<Task> = q.fetch_all(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let details = batch_load_task_details(&state.db, rows).await?;

    Ok(Json(BacklogResponse { tasks: details }))
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub body: String,
}

pub async fn list_comments(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<Json<Vec<CommentWithAuthor>>, Response> {
    let comments: Vec<Comment> = sqlx::query_as::<_, Comment>(
        "SELECT id, task_id, author_id, body, created_at, updated_at, story_points, resolution \
         FROM comments WHERE task_id = ? ORDER BY created_at ASC"
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let author_ids: Vec<&str> = comments.iter().map(|c| c.author_id.as_str()).collect();
    let users = batch_users(&state.db, &author_ids).await;

    let comment_ids: Vec<&str> = comments.iter().map(|c| c.id.as_str()).collect();
    let mut mention_rows: Vec<(String, String)> = Vec::new();
    if !comment_ids.is_empty() {
        let placeholders: Vec<String> = comment_ids.iter().map(|_| "?".to_string()).collect();
        let sql = format!(
            "SELECT comment_id, user_id FROM comment_mentions WHERE comment_id IN ({})",
            placeholders.join(",")
        );
        let mut q = sqlx::query_as::<_, (String, String)>(&sql);
        for cid in &comment_ids {
            q = q.bind(cid);
        }
        mention_rows = q
            .fetch_all(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let mention_user_ids: Vec<&str> = mention_rows.iter().map(|(_, uid)| uid.as_str()).collect();
    let mention_users = batch_users(&state.db, &mention_user_ids).await;

    let mut mentions_by_comment: HashMap<String, Vec<PublicUser>> = HashMap::new();
    for (cid, uid) in mention_rows {
        if let Some(u) = mention_users.get(&uid) {
            mentions_by_comment.entry(cid).or_default().push(u.clone());
        }
    }

    let mut result = Vec::with_capacity(comments.len());
    for c in comments {
        let author = users
            .get(&c.author_id)
            .cloned()
            .ok_or_else(|| error_response(StatusCode::INTERNAL_SERVER_ERROR, "Autor no encontrado".to_string()))?;
        let mentions = mentions_by_comment.remove(&c.id).unwrap_or_default();
        result.push(CommentWithAuthor { comment: c, author, mentions });
    }

    Ok(Json(result))
}

pub async fn create_comment(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
    Json(payload): Json<CreateCommentRequest>,
) -> Result<(StatusCode, Json<CommentWithAuthor>), Response> {
    validate_required("body", &payload.body, 5000)?;
    if !task_exists(&state.db, &task_id).await? {
        return Err(error_response(StatusCode::NOT_FOUND, "Tarea no encontrada".to_string()));
    }

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO comments (id, task_id, author_id, body) VALUES (?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&task_id)
    .bind(&claims.sub)
    .bind(&payload.body)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let mentions = extract_mentions(&payload.body);
    for username in &mentions {
        let user: Option<User> = sqlx::query_as::<_, User>(
            "SELECT id, name, email, password_hash, role, avatar_color, created_at, active FROM users WHERE name = ? OR email LIKE ?"
        )
        .bind(username)
        .bind(format!("{}%", username))
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

        if let Some(u) = user {
            if u.id != claims.sub {
                sqlx::query("INSERT OR IGNORE INTO comment_mentions (comment_id, user_id) VALUES (?, ?)")
                    .bind(&id)
                    .bind(&u.id)
                    .execute(&state.db)
                    .await
                    .map_err(|e| internal_error(&format!("db error: {e}")))?;

                let _ = crate::routes::notifications::create_notification(
                    &state.db,
                    &u.id,
                    "mentioned",
                    Some(&task_id),
                    Some(&claims.sub),
                    &format!("{} te mencionó en un comentario", claims.email),
                ).await;
            }
        }
    }

    log_activity(&state.db, &task_id, &claims.sub, "commented", None, None, None, None).await?;

    let task_info: Option<(String, Option<String>)> = sqlx::query_as(
        "SELECT code, assignee_id FROM tasks WHERE id = ?"
    )
    .bind(&task_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if let Some((code, Some(assignee_id))) = task_info {
        if assignee_id != claims.sub {
            let _ = crate::routes::notifications::create_notification(
                &state.db,
                &assignee_id,
                "commented",
                Some(&task_id),
                Some(&claims.sub),
                &format!("{} comentó en la tarea {}", claims.email, code),
            ).await;
        }
    }

    let comment: Comment = sqlx::query_as::<_, Comment>(
        "SELECT id, task_id, author_id, body, created_at, updated_at FROM comments WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let author: User = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(CommentWithAuthor {
        comment,
        author: author.into(),
        mentions: vec![],
    })))
}

#[derive(Debug, Deserialize)]
pub struct EditCommentRequest {
    pub body: String,
}

pub async fn edit_comment(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((task_id, comment_id)): Path<(String, String)>,
    Json(payload): Json<EditCommentRequest>,
) -> Result<Json<CommentWithAuthor>, Response> {
    validate_required("body", &payload.body, 5000)?;
    let comment: Option<Comment> = sqlx::query_as::<_, Comment>(
        "SELECT id, task_id, author_id, body, created_at, updated_at FROM comments WHERE id = ? AND task_id = ?"
    )
    .bind(&comment_id)
    .bind(&task_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let comment = match comment {
        Some(c) => c,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Comentario no encontrado".to_string())),
    };
    if comment.author_id != claims.sub {
        return Err(error_response(StatusCode::FORBIDDEN, "Solo puedes editar tus propios comentarios".to_string()));
    }

    sqlx::query("UPDATE comments SET body = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(&payload.body)
        .bind(&comment_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let updated: Comment = sqlx::query_as::<_, Comment>(
        "SELECT id, task_id, author_id, body, created_at, updated_at FROM comments WHERE id = ?"
    )
    .bind(&comment_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let author: User = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active FROM users WHERE id = ?"
    )
    .bind(&updated.author_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(CommentWithAuthor {
        comment: updated,
        author: author.into(),
        mentions: vec![],
    }))
}

pub async fn delete_comment(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((task_id, comment_id)): Path<(String, String)>,
) -> Result<StatusCode, Response> {
    let comment: Option<Comment> = sqlx::query_as::<_, Comment>(
        "SELECT id, task_id, author_id, body, created_at, updated_at FROM comments WHERE id = ? AND task_id = ?"
    )
    .bind(&comment_id)
    .bind(&task_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let comment = match comment {
        Some(c) => c,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Comentario no encontrado".to_string())),
    };
    if comment.author_id != claims.sub && claims.role != "admin" {
        return Err(error_response(StatusCode::FORBIDDEN, "No tienes permiso para eliminar este comentario".to_string()));
    }

    sqlx::query("DELETE FROM comment_mentions WHERE comment_id = ?")
        .bind(&comment_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("DELETE FROM comments WHERE id = ?")
        .bind(&comment_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_activity(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<Json<Vec<ActivityWithUser>>, Response> {
    let activities: Vec<ActivityLog> = sqlx::query_as::<_, ActivityLog>(
        "SELECT id, task_id, user_id, action, field_changed, old_value, new_value, metadata, created_at \
         FROM activity_log WHERE task_id = ? ORDER BY created_at DESC LIMIT 200"
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user_ids: Vec<&str> = activities.iter().map(|a| a.user_id.as_str()).collect();
    let users = batch_users(&state.db, &user_ids).await;

    let mut result = Vec::with_capacity(activities.len());
    for a in activities {
        if let Some(user) = users.get(&a.user_id) {
            result.push(ActivityWithUser { activity: a, user: user.clone() });
        }
    }

    Ok(Json(result))
}

pub async fn list_attachments(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> Result<Json<Vec<AttachmentWithUploader>>, Response> {
    let attachments: Vec<Attachment> = sqlx::query_as::<_, Attachment>(
        "SELECT id, task_id, uploader_id, filename, stored_path, mime_type, size_bytes, created_at \
         FROM attachments WHERE task_id = ? ORDER BY created_at DESC"
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let uploader_ids: Vec<&str> = attachments.iter().map(|a| a.uploader_id.as_str()).collect();
    let users = batch_users(&state.db, &uploader_ids).await;

    let mut result = Vec::with_capacity(attachments.len());
    for a in attachments {
        if let Some(uploader) = users.get(&a.uploader_id) {
            result.push(AttachmentWithUploader { attachment: a, uploader: uploader.clone() });
        }
    }

    Ok(Json(result))
}

pub async fn upload_attachment(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<AttachmentWithUploader>), Response> {
    let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "data/uploads".to_string());
    std::fs::create_dir_all(&upload_dir).ok();

    if !task_exists(&state.db, &task_id).await? {
        return Err(error_response(StatusCode::NOT_FOUND, "Tarea no encontrada".to_string()));
    }

    let field = multipart
        .next_field()
        .await
        .map_err(|e| error_response(StatusCode::BAD_REQUEST, format!("multipart error: {e}")))?
        .ok_or_else(|| error_response(StatusCode::BAD_REQUEST, "no file provided".to_string()))?;

    let filename = field
        .file_name()
        .unwrap_or("upload")
        .to_string();
    let mime_type = field.content_type().map(|m| m.to_string());
    let data = field
        .bytes()
        .await
        .map_err(|e| error_response(StatusCode::BAD_REQUEST, format!("read error: {e}")))?;

    if data.is_empty() {
        return Err(error_response(StatusCode::BAD_REQUEST, "El archivo está vacío".to_string()));
    }
    if data.len() > MAX_UPLOAD_BYTES {
        return Err(error_response(
            StatusCode::PAYLOAD_TOO_LARGE,
            format!("El archivo supera el límite de {} MB", MAX_UPLOAD_BYTES / (1024 * 1024)),
        ));
    }

    let id = Uuid::new_v4().to_string();
    let stored_name = format!("{}_{}", id, sanitize_filename(&filename));
    let stored_path = format!("{}/{}", upload_dir, stored_name);

    std::fs::write(&stored_path, &data)
        .map_err(|e| internal_error(&format!("write error: {e}")))?;

    let size_bytes = data.len() as i64;

    sqlx::query(
        "INSERT INTO attachments (id, task_id, uploader_id, filename, stored_path, mime_type, size_bytes) \
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&task_id)
    .bind(&claims.sub)
    .bind(&filename)
    .bind(&stored_path)
    .bind(&mime_type)
    .bind(size_bytes)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    log_activity(&state.db, &task_id, &claims.sub, "attached", None, None, Some(&filename), None).await?;

    let attachment: Attachment = sqlx::query_as::<_, Attachment>(
        "SELECT id, task_id, uploader_id, filename, stored_path, mime_type, size_bytes, created_at \
         FROM attachments WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let uploader: User = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(AttachmentWithUploader { attachment, uploader: uploader.into() })))
}

#[derive(Debug, Deserialize)]
pub struct ToggleSubtaskRequest {
    pub completed: bool,
}

pub async fn list_subtasks(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(parent_id): Path<String>,
) -> Result<Json<Vec<TaskWithDetails>>, Response> {
    let tasks: Vec<Task> = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE parent_id = ? AND deleted_at IS NULL ORDER BY position ASC, created_at ASC"
    )
    .bind(&parent_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let result = batch_load_task_details(&state.db, tasks).await?;
    Ok(Json(result))
}

pub async fn toggle_subtask(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<ToggleSubtaskRequest>,
) -> Result<Json<TaskWithDetails>, Response> {
    if !task_exists(&state.db, &id).await? {
        return Err(error_response(StatusCode::NOT_FOUND, "Tarea no encontrada".to_string()));
    }

    let new_status = if payload.completed { "done" } else { "todo" };
    sqlx::query("UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(new_status)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    log_activity(&state.db, &id, &claims.sub, "toggled", Some("completed"), None, Some(if payload.completed { "true" } else { "false" }), None).await?;

    let task: Task = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let details = load_task_details(&state.db, task).await?;
    Ok(Json(details))
}

pub async fn get_dashboard(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
) -> Result<Json<DashboardStats>, Response> {
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tasks")
        .fetch_one(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let by_status: Vec<StatusCount> = sqlx::query_as(
        "SELECT status, COUNT(*) as count FROM tasks GROUP BY status"
    )
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let by_priority: Vec<PriorityCount> = sqlx::query_as(
        "SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority"
    )
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let by_assignee: Vec<AssigneeCount> = sqlx::query_as(
        "SELECT u.id as assignee_id, u.name as assignee_name, COUNT(t.id) as count \
         FROM users u LEFT JOIN tasks t ON t.assignee_id = u.id \
         GROUP BY u.id ORDER BY count DESC"
    )
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let upcoming_due: Vec<Task> = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks \
         WHERE due_date IS NOT NULL AND due_date >= date('now') AND status != 'done' \
         ORDER BY due_date ASC LIMIT 10"
    )
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let recent_activity: Vec<ActivityLog> = sqlx::query_as::<_, ActivityLog>(
        "SELECT id, task_id, user_id, action, field_changed, old_value, new_value, metadata, created_at \
         FROM activity_log ORDER BY created_at DESC LIMIT 20"
    )
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let activity_user_ids: Vec<&str> = recent_activity.iter().map(|a| a.user_id.as_str()).collect();
    let activity_users = batch_users(&state.db, &activity_user_ids).await;

    let mut activity_with_users = Vec::with_capacity(recent_activity.len());
    for a in recent_activity {
        if let Some(u) = activity_users.get(&a.user_id) {
            activity_with_users.push(ActivityWithUser { activity: a, user: u.clone() });
        }
    }

    Ok(Json(DashboardStats {
        total_tasks: total.0,
        by_status,
        by_priority,
        by_assignee,
        upcoming_due,
        recent_activity: activity_with_users,
    }))
}

pub async fn get_dashboard_me(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<DashboardStats>, Response> {
    let uid = &claims.sub;

    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tasks WHERE assignee_id = ?")
        .bind(uid)
        .fetch_one(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let by_status: Vec<StatusCount> = sqlx::query_as(
        "SELECT status, COUNT(*) as count FROM tasks WHERE assignee_id = ? GROUP BY status"
    )
    .bind(uid)
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let by_priority: Vec<PriorityCount> = sqlx::query_as(
        "SELECT priority, COUNT(*) as count FROM tasks WHERE assignee_id = ? GROUP BY priority"
    )
    .bind(uid)
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let by_assignee: Vec<AssigneeCount> = sqlx::query_as(
        "SELECT u.id as assignee_id, u.name as assignee_name, COUNT(t.id) as count \
         FROM users u LEFT JOIN tasks t ON t.assignee_id = u.id \
         WHERE u.id = ? GROUP BY u.id"
    )
    .bind(uid)
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let upcoming_due: Vec<Task> = sqlx::query_as::<_, Task>(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks \
         WHERE assignee_id = ? AND due_date IS NOT NULL AND due_date >= date('now') AND status != 'done' \
         ORDER BY due_date ASC LIMIT 10"
    )
    .bind(uid)
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let recent_activity: Vec<ActivityLog> = sqlx::query_as::<_, ActivityLog>(
        "SELECT a.id, a.task_id, a.user_id, a.action, a.field_changed, a.old_value, a.new_value, a.metadata, a.created_at \
         FROM activity_log a INNER JOIN tasks t ON a.task_id = t.id \
         WHERE t.assignee_id = ? \
         ORDER BY a.created_at DESC LIMIT 20"
    )
    .bind(uid)
    .fetch_all(&state.db).await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let activity_user_ids: Vec<&str> = recent_activity.iter().map(|a| a.user_id.as_str()).collect();
    let activity_users = batch_users(&state.db, &activity_user_ids).await;

    let mut activity_with_users = Vec::with_capacity(recent_activity.len());
    for a in recent_activity {
        if let Some(u) = activity_users.get(&a.user_id) {
            activity_with_users.push(ActivityWithUser { activity: a, user: u.clone() });
        }
    }

    Ok(Json(DashboardStats {
        total_tasks: total.0,
        by_status,
        by_priority,
        by_assignee,
        upcoming_due,
        recent_activity: activity_with_users,
    }))
}

pub async fn load_task_details(db: &SqlitePool, task: Task) -> Result<TaskWithDetails, Response> {
    let mut ids: Vec<&str> = Vec::new();
    if let Some(aid) = &task.assignee_id {
        ids.push(aid);
    }
    ids.push(&task.reporter_id);

    let users = batch_users(db, &ids).await;
    let assignee = task.assignee_id.as_ref().and_then(|aid| users.get(aid).cloned());
    let reporter = users.get(&task.reporter_id).cloned().ok_or_else(|| {
        error_response(StatusCode::INTERNAL_SERVER_ERROR, "Reporter no encontrado".to_string())
    })?;

    let labels: Vec<(String,)> = sqlx::query_as("SELECT label FROM task_labels WHERE task_id = ?")
        .bind(&task.id)
        .fetch_all(db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let labels: Vec<String> = labels.into_iter().map(|(l,)| l).collect();

    let (subtask_count, completed_subtask_count): (i64, i64) =
        sqlx::query_as("SELECT COUNT(*), COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) FROM tasks WHERE parent_id = ?")
            .bind(&task.id).fetch_one(db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let (comment_count, attachment_count): (i64, i64) =
        sqlx::query_as("SELECT (SELECT COUNT(*) FROM comments WHERE task_id = ?), (SELECT COUNT(*) FROM attachments WHERE task_id = ?)")
            .bind(&task.id).bind(&task.id).fetch_one(db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(TaskWithDetails {
        task,
        assignee,
        reporter,
        labels,
        subtask_count,
        completed_subtask_count,
        comment_count,
        attachment_count,
    })
}

/// Carga los detalles (assignee, reporter, labels, contadores) para un lote de
/// tareas en un número fijo de queries, evitando el patrón N+1 de
/// `load_task_details`.
pub async fn batch_load_task_details(
    db: &SqlitePool,
    tasks: Vec<Task>,
) -> Result<Vec<TaskWithDetails>, Response> {
    if tasks.is_empty() {
        return Ok(Vec::new());
    }

    let task_ids: Vec<&str> = tasks.iter().map(|t| t.id.as_str()).collect();

    // 1) Usuarios (assignee + reporter) en una sola query
    let mut user_ids: Vec<&str> = Vec::new();
    for t in &tasks {
        if let Some(aid) = &t.assignee_id {
            user_ids.push(aid);
        }
        user_ids.push(&t.reporter_id);
    }
    let users = batch_users(db, &user_ids).await;

    // 2) Labels en una sola query (WHERE task_id IN (...))
    let placeholders: Vec<String> = task_ids.iter().map(|_| "?".to_string()).collect();
    let labels_sql = format!(
        "SELECT task_id, label FROM task_labels WHERE task_id IN ({}) AND task_id NOT IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL)",
        placeholders.join(",")
    );
    let mut q = sqlx::query_as::<_, (String, String)>(&labels_sql);
    for tid in &task_ids {
        q = q.bind(tid);
    }
    let labels_rows: Vec<(String, String)> = q.fetch_all(db).await.unwrap_or_default();
    let mut labels_by_task: HashMap<String, Vec<String>> = HashMap::new();
    for (tid, label) in labels_rows {
        labels_by_task.entry(tid).or_default().push(label);
    }

    // 3) Conteos de subtareas agrupados por parent
    let subtask_sql = format!(
        "SELECT parent_id, \
                COUNT(*) AS total, \
                COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) AS done \
         FROM tasks WHERE parent_id IN ({}) AND deleted_at IS NULL \
         GROUP BY parent_id",
        placeholders.join(",")
    );
    let mut q = sqlx::query_as::<_, (String, i64, i64)>(&subtask_sql);
    for tid in &task_ids {
        q = q.bind(tid);
    }
    let subtask_rows: Vec<(String, i64, i64)> = q.fetch_all(db).await.unwrap_or_default();
    let mut subtasks_by_task: HashMap<String, (i64, i64)> = HashMap::new();
    for (pid, total, done) in subtask_rows {
        subtasks_by_task.insert(pid, (total, done));
    }

    // 4) Conteos de comentarios
    let comments_sql = format!(
        "SELECT task_id, COUNT(*) FROM comments WHERE task_id IN ({}) AND deleted_at IS NULL GROUP BY task_id",
        placeholders.join(",")
    );
    let mut q = sqlx::query_as::<_, (String, i64)>(&comments_sql);
    for tid in &task_ids {
        q = q.bind(tid);
    }
    let comments_rows: Vec<(String, i64)> = q.fetch_all(db).await.unwrap_or_default();
    let mut comments_by_task: HashMap<String, i64> = HashMap::new();
    for (tid, c) in comments_rows {
        comments_by_task.insert(tid, c);
    }

    // 5) Conteos de adjuntos
    let attachments_sql = format!(
        "SELECT task_id, COUNT(*) FROM attachments WHERE task_id IN ({}) AND deleted_at IS NULL GROUP BY task_id",
        placeholders.join(",")
    );
    let mut q = sqlx::query_as::<_, (String, i64)>(&attachments_sql);
    for tid in &task_ids {
        q = q.bind(tid);
    }
    let attachments_rows: Vec<(String, i64)> = q.fetch_all(db).await.unwrap_or_default();
    let mut attachments_by_task: HashMap<String, i64> = HashMap::new();
    for (tid, a) in attachments_rows {
        attachments_by_task.insert(tid, a);
    }

    // 6) Ensamblar el resultado
    let mut result = Vec::with_capacity(tasks.len());
    for task in tasks {
        let assignee = task
            .assignee_id
            .as_ref()
            .and_then(|aid| users.get(aid).cloned());
        let reporter = users
            .get(&task.reporter_id)
            .cloned()
            .ok_or_else(|| {
                error_response(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Reporter no encontrado".to_string(),
                )
            })?;
        let labels = labels_by_task.remove(&task.id).unwrap_or_default();
        let (subtask_count, completed_subtask_count) =
            subtasks_by_task.get(&task.id).copied().unwrap_or((0, 0));
        let comment_count = comments_by_task.get(&task.id).copied().unwrap_or(0);
        let attachment_count = attachments_by_task.get(&task.id).copied().unwrap_or(0);

        result.push(TaskWithDetails {
            task,
            assignee,
            reporter,
            labels,
            subtask_count,
            completed_subtask_count,
            comment_count,
            attachment_count,
        });
    }

    Ok(result)
}

pub async fn batch_users(db: &SqlitePool, ids: &[&str]) -> HashMap<String, PublicUser> {
    let mut unique: Vec<&str> = Vec::new();
    for id in ids {
        if !id.is_empty() && !unique.contains(id) {
            unique.push(id);
        }
    }
    if unique.is_empty() {
        return HashMap::new();
    }

    let placeholders: Vec<String> = unique.iter().map(|_| "?".to_string()).collect();
    let sql = format!(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active \
         FROM users WHERE id IN ({})",
        placeholders.join(",")
    );

    let mut q = sqlx::query_as::<_, User>(&sql);
    for id in &unique {
        q = q.bind(id);
    }

    match q.fetch_all(db).await {
        Ok(users) => users.into_iter().map(|u| (u.id.clone(), u.into())).collect(),
        Err(_) => HashMap::new(),
    }
}

pub async fn task_exists(db: &SqlitePool, id: &str) -> Result<bool, Response> {
    let row: Option<(String,)> = sqlx::query_as("SELECT id FROM tasks WHERE id = ?")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(row.is_some())
}

pub async fn epic_exists(db: &SqlitePool, id: &str) -> Result<bool, Response> {
    let row: Option<(String,)> = sqlx::query_as("SELECT id FROM epics WHERE id = ? AND deleted_at IS NULL")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(row.is_some())
}

pub async fn user_exists(db: &SqlitePool, id: &str) -> Result<bool, Response> {
    let row: Option<(String,)> = sqlx::query_as("SELECT id FROM users WHERE id = ?")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(row.is_some())
}

pub async fn sprint_exists(db: &SqlitePool, id: &str) -> Result<bool, Response> {
    let row: Option<(String,)> = sqlx::query_as("SELECT id FROM sprints WHERE id = ?")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(row.is_some())
}

pub async fn download_attachment(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Response, Response> {
    let attachment: Option<Attachment> = sqlx::query_as::<_, Attachment>(
        "SELECT id, task_id, uploader_id, filename, stored_path, mime_type, size_bytes, created_at \
         FROM attachments WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let attachment = match attachment {
        Some(a) => a,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Adjunto no encontrado".to_string())),
    };

    let data = tokio::fs::read(&attachment.stored_path)
        .await
        .map_err(|e| internal_error(&format!("read error: {e}")))?;

    let content_type = attachment
        .mime_type
        .clone()
        .unwrap_or_else(|| "application/octet-stream".to_string());
    let ascii_name: String = attachment
        .filename
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let disposition = format!(
        "attachment; filename=\"{}\"; filename*=UTF-8''{}",
        ascii_name,
        urlencode(&attachment.filename)
    );

    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, content_type),
            (header::CONTENT_DISPOSITION, disposition),
            (header::CONTENT_LENGTH, data.len().to_string()),
        ],
        data,
    )
        .into_response())
}

fn urlencode(input: &str) -> String {
    let mut out = String::new();
    for b in input.as_bytes() {
        if b.is_ascii_alphanumeric() || *b == b'-' || *b == b'_' || *b == b'.' || *b == b'~' {
            out.push(*b as char);
        } else {
            out.push_str(&format!("%{:02X}", b));
        }
    }
    out
}

pub async fn log_activity_pub(
    db: &SqlitePool,
    task_id: &str,
    user_id: &str,
    action: &str,
    field: Option<&str>,
    old_value: Option<&str>,
    new_value: Option<&str>,
    metadata: Option<&str>,
) -> Result<(), Response> {
    log_activity(db, task_id, user_id, action, field, old_value, new_value, metadata).await
}

async fn log_activity(
    db: &SqlitePool,
    task_id: &str,
    user_id: &str,
    action: &str,
    field: Option<&str>,
    old_value: Option<&str>,
    new_value: Option<&str>,
    metadata: Option<&str>,
) -> Result<(), Response> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO activity_log (id, task_id, user_id, action, field_changed, old_value, new_value, metadata) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(task_id)
    .bind(user_id)
    .bind(action)
    .bind(field)
    .bind(old_value)
    .bind(new_value)
    .bind(metadata)
    .execute(db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(())
}

async fn get_user_name(db: &SqlitePool, user_id: &str) -> Result<String, sqlx::Error> {
    let row: (String,) = sqlx::query_as("SELECT name FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(db)
        .await?;
    Ok(row.0)
}

fn extract_mentions(body: &str) -> Vec<String> {
    let mut mentions = Vec::new();
    let mut chars = body.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '@' {
            let mut name = String::new();
            while let Some(&nc) = chars.peek() {
                if nc.is_alphanumeric() || nc == '_' || nc == '.' || nc == '-' {
                    name.push(nc);
                    chars.next();
                } else {
                    break;
                }
            }
            if !name.is_empty() {
                mentions.push(name);
            }
        }
    }
    mentions
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect()
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{get, patch},
    };

    axum::Router::new()
        .route("/api/tasks", get(list_tasks).post(create_task))
        .route("/api/tasks/:id", get(get_task).delete(delete_task).patch(update_task))
        .route("/api/tasks/:id/status", patch(update_task_status))
        .route("/api/tasks/:id/comments", get(list_comments).post(create_comment))
        .route("/api/tasks/:id/comments/:comment_id", patch(edit_comment).delete(delete_comment))
        .route("/api/tasks/:id/activity", get(list_activity))
        .route("/api/tasks/:id/attachments", get(list_attachments).post(upload_attachment))
        .route("/api/tasks/:id/subtasks", get(list_subtasks))
        .route("/api/subtasks/:id/toggle", patch(toggle_subtask))
        .route("/api/attachments/:id", get(download_attachment))
        .route("/api/board", get(get_board))
        .route("/api/backlog", get(get_backlog))
        .route("/api/dashboard/me", get(get_dashboard_me))
        .route("/api/dashboard", get(get_dashboard))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}