use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::sync::Arc;
use uuid::Uuid;

use crate::jql;
use crate::middleware::auth::require_auth;
use crate::models::Claims;
use crate::validation::{error_response, internal_error, validate_required};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SavedFilter {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub query: String,
    pub is_shared: i32,
    pub project_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSavedFilterRequest {
    pub name: String,
    pub query: String,
    pub is_shared: Option<bool>,
    pub project_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSavedFilterRequest {
    pub name: Option<String>,
    pub query: Option<String>,
    pub is_shared: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchTasksRequest {
    pub query: String,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct TaskSearchResult {
    pub id: String,
    pub code: String,
    pub title: String,
    pub status: String,
    pub priority: String,
    pub assignee_id: Option<String>,
    pub project_id: Option<String>,
}

pub async fn list_saved_filters(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<SavedFilter>>, Response> {
    let filters = sqlx::query_as::<_, SavedFilter>(
        "SELECT id, user_id, name, query, is_shared, project_id, created_at, updated_at \
         FROM saved_filters WHERE user_id = ? OR is_shared = 1 ORDER BY updated_at DESC"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(filters))
}

pub async fn create_saved_filter(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateSavedFilterRequest>,
) -> Result<(StatusCode, Json<SavedFilter>), Response> {
    validate_required("name", &payload.name, 100)?;
    validate_required("query", &payload.query, 1000)?;

    // Validate the JQL query
    jql::parse_jql(&payload.query).map_err(|e| error_response(
        StatusCode::BAD_REQUEST,
        format!("Query inválida: {}", e.message),
    ))?;

    let id = Uuid::new_v4().to_string();
    let is_shared = payload.is_shared.unwrap_or(false) as i32;

    sqlx::query(
        "INSERT INTO saved_filters (id, user_id, name, query, is_shared, project_id) \
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&claims.sub)
    .bind(&payload.name)
    .bind(&payload.query)
    .bind(is_shared)
    .bind(&payload.project_id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let filter = sqlx::query_as::<_, SavedFilter>(
        "SELECT id, user_id, name, query, is_shared, project_id, created_at, updated_at \
         FROM saved_filters WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(filter)))
}

pub async fn update_saved_filter(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateSavedFilterRequest>,
) -> Result<Json<SavedFilter>, Response> {
    // Verify ownership
    let existing: Option<(String,)> = sqlx::query_as(
        "SELECT user_id FROM saved_filters WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match existing {
        Some((owner,)) if owner == claims.sub => {}
        Some(_) => return Err(error_response(StatusCode::FORBIDDEN, "No autorizado".to_string())),
        None => return Err(error_response(StatusCode::NOT_FOUND, "Filtro no encontrado".to_string())),
    }

    // Validate new query if provided
    if let Some(q) = &payload.query {
        jql::parse_jql(q).map_err(|e| error_response(
            StatusCode::BAD_REQUEST,
            format!("Query inválida: {}", e.message),
        ))?;
    }

    let mut q_builder = sqlx::QueryBuilder::new("UPDATE saved_filters SET updated_at = datetime('now')");
    if let Some(name) = &payload.name {
        q_builder.push(", name = ").push_bind(name);
    }
    if let Some(query) = &payload.query {
        q_builder.push(", query = ").push_bind(query);
    }
    if let Some(shared) = payload.is_shared {
        q_builder.push(", is_shared = ").push_bind(shared as i32);
    }
    q_builder.push(" WHERE id = ").push_bind(&id);
    q_builder.build().execute(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let filter = sqlx::query_as::<_, SavedFilter>(
        "SELECT id, user_id, name, query, is_shared, project_id, created_at, updated_at \
         FROM saved_filters WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(filter))
}

pub async fn delete_saved_filter(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    // Verify ownership
    let existing: Option<(String,)> = sqlx::query_as(
        "SELECT user_id FROM saved_filters WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match existing {
        Some((owner,)) if owner == claims.sub => {}
        Some(_) => return Err(error_response(StatusCode::FORBIDDEN, "No autorizado".to_string())),
        None => return Err(error_response(StatusCode::NOT_FOUND, "Filtro no encontrado".to_string())),
    }

    sqlx::query("DELETE FROM saved_filters WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn execute_saved_filter(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<Vec<TaskSearchResult>>, Response> {
    let filter: Option<(String, i32)> = sqlx::query_as(
        "SELECT query, is_shared FROM saved_filters WHERE id = ? AND (user_id = ? OR is_shared = 1)"
    )
    .bind(&id)
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let (query, _) = match filter {
        Some(f) => f,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Filtro no encontrado".to_string())),
    };

    execute_jql_query(&state, &claims, &query, 100, 0).await
}

pub async fn search_tasks(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<SearchTasksRequest>,
) -> Result<Json<Vec<TaskSearchResult>>, Response> {
    let limit = payload.limit.unwrap_or(50);
    let offset = payload.offset.unwrap_or(0);
    execute_jql_query(&state, &claims, &payload.query, limit, offset).await
}

async fn execute_jql_query(
    state: &Arc<AppState>,
    _claims: &Claims,
    query: &str,
    limit: i64,
    offset: i64,
) -> Result<Json<Vec<TaskSearchResult>>, Response> {
    let parsed = jql::parse_jql(query).map_err(|e| error_response(
        StatusCode::BAD_REQUEST,
        format!("Query inválida: {}", e.message),
    ))?;

    let mut qb = sqlx::QueryBuilder::<sqlx::Sqlite>::new(
        "SELECT id, code, title, status, priority, assignee_id, project_id FROM tasks WHERE deleted_at IS NULL"
    );

    for cond in &parsed.conditions {
        let col = match cond.field.as_str() {
            "status" => "status",
            "assignee" | "assignee_id" => "assignee_id",
            "reporter" | "reporter_id" => "reporter_id",
            "priority" => "priority",
            "type" => "type",
            "project" | "project_id" => "project_id",
            "epic" | "epic_id" => "epic_id",
            "sprint" | "sprint_id" => "sprint_id",
            "story_points" => "story_points",
            "resolution" => "resolution",
            _ => continue,
        };

        match &cond.operator {
            jql::Operator::In | jql::Operator::NotIn => {
                if let jql::JqlValue::List(items) = &cond.value {
                    let op = cond.operator.to_sql();
                    qb.push(format!(" AND {} {} (", col, op));
                    let mut sep = qb.separated(", ");
                    for item in items {
                        sep.push_bind(item);
                    }
                    qb.push(")");
                }
            }
            jql::Operator::Eq => {
                qb.push(format!(" AND {} = ", col));
                match &cond.value {
                    jql::JqlValue::String(s) => qb.push_bind(s),
                    jql::JqlValue::Number(n) => qb.push_bind(*n),
                    jql::JqlValue::Boolean(b) => qb.push_bind(*b),
                    jql::JqlValue::CurrentUser => qb.push("(SELECT id FROM users WHERE id = 'unknown')"),
                    jql::JqlValue::Null => qb.push("NULL"),
                    jql::JqlValue::List(_) => qb.push("NULL"),
                };
            }
            jql::Operator::Ne => {
                qb.push(format!(" AND {} != ", col));
                match &cond.value {
                    jql::JqlValue::String(s) => qb.push_bind(s),
                    jql::JqlValue::Number(n) => qb.push_bind(*n),
                    jql::JqlValue::Boolean(b) => qb.push_bind(*b),
                    jql::JqlValue::CurrentUser => qb.push("(SELECT id FROM users WHERE id = 'unknown')"),
                    jql::JqlValue::Null => qb.push("NULL"),
                    jql::JqlValue::List(_) => qb.push("NULL"),
                };
            }
            jql::Operator::Gt => {
                qb.push(format!(" AND {} > ", col));
                qb.push_bind(match &cond.value {
                    jql::JqlValue::Number(n) => *n,
                    jql::JqlValue::String(s) => s.parse::<f64>().unwrap_or(0.0),
                    _ => 0.0,
                });
            }
            jql::Operator::Lt => {
                qb.push(format!(" AND {} < ", col));
                qb.push_bind(match &cond.value {
                    jql::JqlValue::Number(n) => *n,
                    jql::JqlValue::String(s) => s.parse::<f64>().unwrap_or(0.0),
                    _ => 0.0,
                });
            }
            jql::Operator::Gte => {
                qb.push(format!(" AND {} >= ", col));
                qb.push_bind(match &cond.value {
                    jql::JqlValue::Number(n) => *n,
                    jql::JqlValue::String(s) => s.parse::<f64>().unwrap_or(0.0),
                    _ => 0.0,
                });
            }
            jql::Operator::Lte => {
                qb.push(format!(" AND {} <= ", col));
                qb.push_bind(match &cond.value {
                    jql::JqlValue::Number(n) => *n,
                    jql::JqlValue::String(s) => s.parse::<f64>().unwrap_or(0.0),
                    _ => 0.0,
                });
            }
            jql::Operator::Contains => {
                qb.push(format!(" AND {} LIKE ", col));
                if let jql::JqlValue::String(s) = &cond.value {
                    qb.push_bind(format!("%{}%", s));
                }
            }
        }
    }

    // ORDER BY
    if let Some(order) = &parsed.order_by {
        let dir = parsed.order_dir.as_deref().unwrap_or("ASC");
        qb.push(format!(" ORDER BY {} {}", order, dir));
    } else {
        qb.push(" ORDER BY created_at DESC");
    }

    qb.push(format!(" LIMIT {} OFFSET {}", limit, offset));

    let rows = qb.build().fetch_all(&state.db).await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let results: Vec<TaskSearchResult> = rows.iter().map(|row| {
        TaskSearchResult {
            id: row.get("id"),
            code: row.get("code"),
            title: row.get("title"),
            status: row.get("status"),
            priority: row.get("priority"),
            assignee_id: row.try_get("assignee_id").ok().flatten(),
            project_id: row.try_get("project_id").ok().flatten(),
        }
    }).collect();

    Ok(Json(results))
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{middleware, routing::{delete, get, patch, post}};

    axum::Router::new()
        .route("/api/saved-filters", get(list_saved_filters).post(create_saved_filter))
        .route("/api/saved-filters/:id", patch(update_saved_filter).delete(delete_saved_filter))
        .route("/api/saved-filters/:id/execute", get(execute_saved_filter))
        .route("/api/tasks/search", post(search_tasks))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
