use axum::{
    extract::{Extension, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::middleware::auth::require_auth;
use crate::models::Claims;
use crate::validation::internal_error;
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct VelocityPoint {
    pub sprint_name: String,
    pub committed: f64,
    pub completed: f64,
}

#[derive(Debug, Serialize)]
pub struct WorkloadEntry {
    pub user_id: String,
    pub user_name: String,
    pub avatar_color: Option<String>,
    pub task_count: i64,
    pub story_points: Option<i64>,
    pub in_progress: i64,
    pub todo: i64,
    pub review: i64,
    pub done: i64,
}

#[derive(Debug, Serialize)]
pub struct BurndownPoint {
    pub date: String,
    pub remaining: f64,
    pub ideal: f64,
}

#[derive(Debug, Serialize)]
pub struct ProjectReports {
    pub velocity: Vec<VelocityPoint>,
    pub workload: Vec<WorkloadEntry>,
    pub burndown: Vec<BurndownPoint>,
    pub summary: ReportSummary,
}

#[derive(Debug, Serialize)]
pub struct ReportSummary {
    pub total_tasks: i64,
    pub done_tasks: i64,
    pub in_progress_tasks: i64,
    pub total_story_points: i64,
    pub completed_story_points: i64,
    pub avg_velocity: f64,
}

pub async fn get_project_reports(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<ProjectReports>, Response> {
    let project_id = params.get("project").cloned();

    // Velocity from last 5 sprints
    let mut velocity_sql = String::from(
        "SELECT s.name, \
                COALESCE(SUM(t.estimate_hours), 0) as committed, \
                COALESCE(SUM(CASE WHEN t.status = 'done' THEN t.estimate_hours ELSE 0 END), 0) as completed \
         FROM sprints s LEFT JOIN tasks t ON t.sprint_id = s.id AND t.deleted_at IS NULL"
    );
    let mut binds: Vec<String> = Vec::new();
    if let Some(pid) = &project_id {
        velocity_sql.push_str(" WHERE s.project_id = ?");
        binds.push(pid.clone());
    }
    velocity_sql.push_str(" GROUP BY s.id, s.name ORDER BY s.created_at DESC LIMIT 5");

    let mut vq = sqlx::query_as::<_, (String, f64, f64)>(&velocity_sql);
    for b in &binds {
        vq = vq.bind(b);
    }
    let velocity_rows = vq.fetch_all(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let velocity: Vec<VelocityPoint> = velocity_rows.into_iter().map(|(name, committed, completed)| {
        VelocityPoint { sprint_name: name, committed, completed }
    }).collect();

    // Workload distribution
    let mut workload_sql = String::from(
        "SELECT u.id, u.name, u.avatar_color, \
                COUNT(t.id) as task_count, \
                COALESCE(SUM(t.story_points), 0) as sp, \
                SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress, \
                SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo, \
                SUM(CASE WHEN t.status = 'review' THEN 1 ELSE 0 END) as review_count, \
                SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done \
         FROM users u LEFT JOIN tasks t ON t.assignee_id = u.id AND t.deleted_at IS NULL"
    );
    let mut w_binds: Vec<String> = Vec::new();
    if let Some(pid) = &project_id {
        workload_sql.push_str(" WHERE t.project_id = ?");
        w_binds.push(pid.clone());
    }
    workload_sql.push_str(" GROUP BY u.id, u.name, u.avatar_color ORDER BY task_count DESC LIMIT 20");

    let mut wq = sqlx::query_as::<_, (String, String, Option<String>, i64, Option<i64>, Option<i64>, Option<i64>, Option<i64>, Option<i64>)>(&workload_sql);
    for b in &w_binds {
        wq = wq.bind(b);
    }
    let workload_rows = wq.fetch_all(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let workload: Vec<WorkloadEntry> = workload_rows.into_iter().map(|(uid, uname, color, count, sp, ip, td, rv, dn)| {
        WorkloadEntry {
            user_id: uid,
            user_name: uname,
            avatar_color: color,
            task_count: count,
            story_points: sp,
            in_progress: ip.unwrap_or(0),
            todo: td.unwrap_or(0),
            review: rv.unwrap_or(0),
            done: dn.unwrap_or(0),
        }
    }).collect();

    // Burndown (last 14 days)
    let burndown_sql = if project_id.is_some() {
        "SELECT date(created_at) as d, COUNT(*) as remaining \
         FROM tasks WHERE deleted_at IS NULL AND project_id = ? \
         AND created_at >= date('now', '-14 days') \
         GROUP BY date(created_at) ORDER BY d"
    } else {
        "SELECT date(created_at) as d, COUNT(*) as remaining \
         FROM tasks WHERE deleted_at IS NULL \
         AND created_at >= date('now', '-14 days') \
         GROUP BY date(created_at) ORDER BY d"
    };
    let mut bq = sqlx::query_as::<_, (String, i64)>(burndown_sql);
    if let Some(pid) = &project_id {
        bq = bq.bind(pid);
    }
    let burndown_rows = bq.fetch_all(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    let total_tasks: i64 = if let Some(pid) = &project_id {
        sqlx::query_as::<_, (i64,)>("SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL AND project_id = ?")
            .bind(pid).fetch_one(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?.0
    } else {
        sqlx::query_as::<_, (i64,)>("SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL")
            .fetch_one(&state.db).await
            .map_err(|e| internal_error(&format!("db error: {e}")))?.0
    };
    let ideal_step = total_tasks as f64 / 14.0;
    let burndown: Vec<BurndownPoint> = burndown_rows.iter().enumerate().map(|(i, (_, remaining))| {
        BurndownPoint {
            date: burndown_rows.get(i).map(|(d, _)| d.clone()).unwrap_or_default(),
            remaining: *remaining as f64,
            ideal: (total_tasks as f64) - (ideal_step * (i as f64 + 1.0)),
        }
    }).collect();

    // Summary
    let summary_sql = if project_id.is_some() {
        "SELECT COUNT(*), \
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), \
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), \
                COALESCE(SUM(story_points), 0), \
                COALESCE(SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END), 0) \
         FROM tasks WHERE deleted_at IS NULL AND project_id = ?"
    } else {
        "SELECT COUNT(*), \
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), \
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), \
                COALESCE(SUM(story_points), 0), \
                COALESCE(SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END), 0) \
         FROM tasks WHERE deleted_at IS NULL"
    };
    let mut sq = sqlx::query_as::<_, (i64, Option<i64>, Option<i64>, Option<i64>, Option<i64>)>(summary_sql);
    if let Some(pid) = &project_id {
        sq = sq.bind(pid);
    }
    let (total, done, in_progress, total_sp, done_sp) = sq.fetch_one(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let avg_velocity = if velocity.is_empty() {
        0.0
    } else {
        velocity.iter().map(|v| v.completed).sum::<f64>() / velocity.len() as f64
    };

    let summary = ReportSummary {
        total_tasks: total,
        done_tasks: done.unwrap_or(0),
        in_progress_tasks: in_progress.unwrap_or(0),
        total_story_points: total_sp.unwrap_or(0),
        completed_story_points: done_sp.unwrap_or(0),
        avg_velocity,
    };

    Ok(Json(ProjectReports { velocity, workload, burndown, summary }))
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{middleware, routing::get};

    axum::Router::new()
        .route("/api/reports/project", get(get_project_reports))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
