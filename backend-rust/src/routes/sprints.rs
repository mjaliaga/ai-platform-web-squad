use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::auth::require_auth;
use crate::models::{Claims, Sprint, Task};
use crate::validation::{error_response, internal_error, require_admin, validate_required};
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateSprintRequest {
    pub name: String,
    #[serde(default)]
    pub goals: Option<Vec<String>>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub project_id: Option<String>,
    #[serde(default)]
    pub risks: Option<String>,
    #[serde(default)]
    pub team_dependencies: Option<String>,
    #[serde(default)]
    pub third_party_dependencies: Option<String>,
}

fn goals_to_json(goals: &Option<Vec<String>>) -> Option<String> {
    goals.as_ref().map(|g| serde_json::to_string(g).unwrap_or_else(|_| "[]".to_string()))
}

/// Fetch stats for a single sprint. Used by single-sprint endpoints;
/// batch listings use an inline GROUP BY for performance.
async fn sprint_stats(
    db: &sqlx::SqlitePool,
    sprint_id: &str,
) -> Result<(i64, i64, f64, f64), Response> {
    sqlx::query_as(
        "SELECT COUNT(*), \
                COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0), \
                COALESCE(SUM(estimate_hours), 0.0), \
                COALESCE(SUM(time_spent_hours), 0.0) \
         FROM tasks WHERE sprint_id = ?"
    )
    .bind(sprint_id)
    .fetch_one(db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))
}

#[derive(Debug, Serialize)]
pub struct SprintWithStats {
    #[serde(flatten)]
    pub sprint: Sprint,
    pub total_tasks: i64,
    pub done_tasks: i64,
    pub total_estimate: f64,
    pub total_spent: f64,
}

pub async fn list_sprints(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<SprintWithStats>>, Response> {
    if let Some(pid) = params.get("project") {
        if claims.role != "admin" {
            let member: Option<(String,)> = sqlx::query_as("SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?").bind(pid).bind(&claims.sub).fetch_optional(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?;
            if member.is_none() {
                let assigned: Option<(String,)> = sqlx::query_as("SELECT id FROM tasks WHERE project_id = ? AND assignee_id = ? AND deleted_at IS NULL LIMIT 1").bind(pid).bind(&claims.sub).fetch_optional(&state.db).await.map_err(|e| internal_error(&format!("db error: {e}")))?;
                if assigned.is_none() { return Err(error_response(StatusCode::FORBIDDEN, "No tienes acceso a este proyecto".to_string())); }
            }
        }
    }
    // FIX-024: SQLite does NOT support NULLS LAST. Use a CASE-based sort
    // to keep NULL start_dates at the end of the DESC ordering.
    let order_clause =
        "ORDER BY (start_date IS NULL) ASC, start_date DESC, created_at DESC";

    let (sql, binds): (String, Vec<String>) = if let Some(pid) = params.get("project") {
        (
            format!(
                "SELECT id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies, created_at \
                 FROM sprints WHERE project_id = ? {}",
                order_clause
            ),
            vec![pid.clone()],
        )
    } else {
        (
            format!(
                "SELECT id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies, created_at \
                 FROM sprints {}",
                order_clause
            ),
            vec![],
        )
    };

    let mut q = sqlx::query_as::<_, Sprint>(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    let sprints: Vec<Sprint> = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if sprints.is_empty() {
        return Ok(Json(vec![]));
    }

    // PERF-001: Batch-load all sprint stats in a single GROUP BY query
    // instead of N+1 per-sprint queries.
    let sprint_ids: Vec<String> = sprints.iter().map(|s| s.id.clone()).collect();
    let placeholders = vec!["?"; sprint_ids.len()].join(",");
    let stats_sql = format!(
        "SELECT sprint_id, COUNT(*) AS total, \
         COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) AS done, \
         COALESCE(SUM(estimate_hours), 0.0) AS estimate, \
         COALESCE(SUM(time_spent_hours), 0.0) AS spent \
         FROM tasks WHERE sprint_id IN ({}) \
         GROUP BY sprint_id",
        placeholders
    );
    let mut stats_q = sqlx::query_as::<_, (String, i64, i64, f64, f64)>(&stats_sql);
    for id in &sprint_ids {
        stats_q = stats_q.bind(id);
    }
    let stats_rows = stats_q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let mut stats_map: std::collections::HashMap<String, (i64, i64, f64, f64)> =
        std::collections::HashMap::with_capacity(stats_rows.len());
    for (id, total, done, estimate, spent) in stats_rows {
        stats_map.insert(id, (total, done, estimate, spent));
    }

    let result: Vec<SprintWithStats> = sprints
        .into_iter()
        .map(|s| {
            let (total_tasks, done_tasks, total_estimate, total_spent) = stats_map
                .get(&s.id)
                .copied()
                .unwrap_or((0, 0, 0.0, 0.0));
            SprintWithStats {
                sprint: s,
                total_tasks,
                done_tasks,
                total_estimate,
                total_spent,
            }
        })
        .collect();

    Ok(Json(result))
}

pub async fn get_active_sprint(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
) -> Result<Json<Option<SprintWithStats>>, Response> {
    let sprint: Option<Sprint> = sqlx::query_as::<_, Sprint>(
        "SELECT id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies, created_at \
         FROM sprints WHERE is_active = 1 LIMIT 1"
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let s = match sprint {
        Some(s) => s,
        None => return Ok(Json(None)),
    };

    let (total_tasks, done_tasks, total_estimate, total_spent) = sprint_stats(&state.db, &s.id).await?;

    Ok(Json(Some(SprintWithStats {
        sprint: s,
        total_tasks,
        done_tasks,
        total_estimate,
        total_spent,
    })))
}

pub async fn create_sprint(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Json(payload): Json<CreateSprintRequest>,
) -> Result<(StatusCode, Json<Sprint>), Response> {
    validate_required("name", &payload.name, 200)?;
    validate_dates(&payload.start_date, &payload.end_date)?;

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO sprints (id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies) \
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(goals_to_json(&payload.goals))
    .bind(&payload.start_date)
    .bind(&payload.end_date)
    .bind(&payload.project_id)
    .bind(payload.risks.as_deref().unwrap_or(""))
    .bind(payload.team_dependencies.as_deref().unwrap_or(""))
    .bind(payload.third_party_dependencies.as_deref().unwrap_or(""))
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let sprint: Sprint = sqlx::query_as::<_, Sprint>(
        "SELECT id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies, created_at FROM sprints WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(sprint)))
}

pub async fn activate_sprint(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<Sprint>, Response> {
    sqlx::query("UPDATE sprints SET is_active = 0")
        .execute(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE sprints SET is_active = 1 WHERE id = ?")
        .bind(&id)
        .execute(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let sprint: Sprint = sqlx::query_as::<_, Sprint>(
        "SELECT id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies, created_at FROM sprints WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(sprint))
}

pub async fn get_sprint(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<SprintWithStats>, Response> {
    let sprint: Sprint = sqlx::query_as::<_, Sprint>(
        "SELECT id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies, created_at FROM sprints WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?
    .ok_or_else(|| error_response(StatusCode::NOT_FOUND, "sprint not found".to_string()))?;

    let (total_tasks, done_tasks, total_estimate, total_spent) = sprint_stats(&state.db, &sprint.id).await?;

    Ok(Json(SprintWithStats {
        sprint,
        total_tasks,
        done_tasks,
        total_estimate,
        total_spent,
    }))
}

#[derive(Debug, Deserialize)]
pub struct UpdateSprintRequest {
    pub name: Option<String>,
    #[serde(default)]
    pub goals: Option<Vec<String>>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub project_id: Option<Option<String>>,
    pub risks: Option<String>,
    pub team_dependencies: Option<String>,
    pub third_party_dependencies: Option<String>,
}

pub async fn update_sprint(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateSprintRequest>,
) -> Result<Json<Sprint>, Response> {
    if let Some(v) = &payload.name {
        validate_required("name", v, 200)?;
    }
    validate_dates(&payload.start_date, &payload.end_date)?;

    if let Some(v) = &payload.name {
        sqlx::query("UPDATE sprints SET name = ? WHERE id = ?").bind(v).bind(&id)
            .execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.goals {
        let json = serde_json::to_string(v).unwrap_or_else(|_| "[]".to_string());
        sqlx::query("UPDATE sprints SET goal = ? WHERE id = ?").bind(json).bind(&id)
            .execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.start_date {
        sqlx::query("UPDATE sprints SET start_date = ? WHERE id = ?").bind(v).bind(&id)
            .execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.end_date {
        sqlx::query("UPDATE sprints SET end_date = ? WHERE id = ?").bind(v).bind(&id)
            .execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.project_id {
        sqlx::query("UPDATE sprints SET project_id = ? WHERE id = ?").bind(v.as_deref()).bind(&id)
            .execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.risks {
        sqlx::query("UPDATE sprints SET risks = ? WHERE id = ?").bind(v).bind(&id)
            .execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.team_dependencies {
        sqlx::query("UPDATE sprints SET team_dependencies = ? WHERE id = ?").bind(v).bind(&id)
            .execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    if let Some(v) = &payload.third_party_dependencies {
        sqlx::query("UPDATE sprints SET third_party_dependencies = ? WHERE id = ?").bind(v).bind(&id)
            .execute(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let sprint: Sprint = sqlx::query_as::<_, Sprint>(
        "SELECT id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies, created_at FROM sprints WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(sprint))
}

pub async fn delete_sprint(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    sqlx::query("UPDATE tasks SET sprint_id = NULL WHERE sprint_id = ?")
        .bind(&id)
        .execute(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("DELETE FROM sprints WHERE id = ?")
        .bind(&id)
        .execute(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct AssignTasksRequest {
    pub task_ids: Vec<String>,
}

pub async fn assign_tasks_to_sprint(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<AssignTasksRequest>,
) -> Result<StatusCode, Response> {
    if !sprint_exists(&state.db, &id).await? {
        return Err(error_response(StatusCode::NOT_FOUND, "Sprint no encontrado".to_string()));
    }
    for tid in &payload.task_ids {
        if !crate::routes::tasks::task_exists(&state.db, tid).await? {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                format!("La tarea '{tid}' no existe"),
            ));
        }
        sqlx::query("UPDATE tasks SET sprint_id = ? WHERE id = ?")
            .bind(&id)
            .bind(tid)
            .execute(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn sprint_exists(db: &sqlx::SqlitePool, id: &str) -> Result<bool, Response> {
    let row: Option<(String,)> = sqlx::query_as("SELECT id FROM sprints WHERE id = ?")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    Ok(row.is_some())
}

fn validate_dates(start: &Option<String>, end: &Option<String>) -> Result<(), Response> {
    if let (Some(s), Some(e)) = (start, end) {
        if e < s {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "La fecha de fin no puede ser anterior a la de inicio".to_string(),
            ));
        }
    }
    Ok(())
}

#[derive(Debug, Serialize)]
pub struct SprintBoardResponse {
    pub sprint: Option<SprintWithStats>,
    pub columns: Vec<crate::routes::tasks::BoardColumn>,
}

pub async fn get_sprint_board(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<SprintBoardResponse>, Response> {
    let sprint: Option<Sprint> = sqlx::query_as::<_, Sprint>(
        "SELECT id, name, goal, start_date, end_date, is_active, project_id, risks, team_dependencies, third_party_dependencies, created_at FROM sprints WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let sprint_with_stats = match sprint {
        None => return Ok(Json(SprintBoardResponse { sprint: None, columns: vec![] })),
        Some(s) => {
            let (total_tasks, done_tasks, total_estimate, total_spent) = sprint_stats(&state.db, &s.id).await?;

            SprintWithStats {
                sprint: s,
                total_tasks,
                done_tasks,
                total_estimate,
                total_spent,
            }
        }
    };

    let statuses = [
        ("todo", "Por hacer"),
        ("in_progress", "En progreso"),
        ("review", "En revisión"),
        ("done", "Completado"),
    ];

    // Una sola query para todas las columnas del board del sprint.
    let placeholders = statuses.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!(
        "SELECT id, code, title, description, type as task_type, status, priority, \
         assignee_id, reporter_id, parent_id, epic_id, sprint_id, project_id, \
         estimate_hours, time_spent_hours, due_date, deliverable, position, created_at, updated_at, story_points, resolution \
         FROM tasks WHERE status IN ({placeholders}) AND sprint_id = ? AND parent_id IS NULL AND deleted_at IS NULL \
         ORDER BY status ASC, position ASC, created_at DESC"
    );
    let mut q = sqlx::query_as::<_, Task>(&sql);
    for (status, _) in statuses.iter() {
        q = q.bind(*status);
    }
    q = q.bind(&id);
    let all_tasks: Vec<Task> = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let all_details = crate::routes::tasks::batch_load_task_details(&state.db, all_tasks).await?;

    let mut by_status: std::collections::HashMap<String, Vec<crate::models::TaskWithDetails>> = std::collections::HashMap::new();
    for d in all_details {
        by_status.entry(d.task.status.clone()).or_default().push(d);
    }

    let mut columns = Vec::with_capacity(statuses.len());
    for (status, title) in statuses {
        let tasks = by_status.remove(status).unwrap_or_default();
        columns.push(crate::routes::tasks::BoardColumn {
            status: status.to_string(),
            title: title.to_string(),
            tasks,
        });
    }

    Ok(Json(SprintBoardResponse {
        sprint: Some(sprint_with_stats),
        columns,
    }))
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{middleware, routing::{get, post}};

    axum::Router::new()
        .route("/api/sprints", get(list_sprints).post(create_sprint))
        .route("/api/sprints/active", get(get_active_sprint))
        .route("/api/sprints/:id", get(get_sprint).patch(update_sprint).delete(delete_sprint))
        .route("/api/sprints/:id/board", get(get_sprint_board))
        .route("/api/sprints/:id/activate", post(activate_sprint))
        .route("/api/sprints/:id/tasks", post(assign_tasks_to_sprint))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}