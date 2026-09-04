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
use crate::models::Claims;
use crate::validation::{error_response, internal_error, validate_required};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_default: i32,
    pub project_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkflowStatus {
    pub id: String,
    pub workflow_id: String,
    pub name: String,
    pub category: String,
    pub color: Option<String>,
    pub position: i32,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkflowTransition {
    pub id: String,
    pub workflow_id: String,
    pub name: String,
    pub from_status_id: Option<String>,
    pub to_status_id: String,
    pub requires_role: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct WorkflowWithDetails {
    pub workflow: Workflow,
    pub statuses: Vec<WorkflowStatus>,
    pub transitions: Vec<WorkflowTransition>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
    pub project_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateStatusRequest {
    pub name: String,
    pub category: Option<String>,
    pub color: Option<String>,
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransitionRequest {
    pub name: String,
    pub from_status_id: Option<String>,
    pub to_status_id: String,
    pub requires_role: Option<String>,
}

pub async fn list_workflows(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
) -> Result<Json<Vec<Workflow>>, Response> {
    let workflows = sqlx::query_as::<_, Workflow>(
        "SELECT id, name, description, is_default, project_id, created_at \
         FROM workflows WHERE deleted_at IS NULL ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(workflows))
}

pub async fn get_workflow(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<WorkflowWithDetails>, Response> {
    let workflow = sqlx::query_as::<_, Workflow>(
        "SELECT id, name, description, is_default, project_id, created_at \
         FROM workflows WHERE id = ? AND deleted_at IS NULL",
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let workflow = match workflow {
        Some(w) => w,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Workflow no encontrado".to_string(),
            ))
        }
    };

    let statuses = sqlx::query_as::<_, WorkflowStatus>(
        "SELECT id, workflow_id, name, category, color, position, created_at \
         FROM workflow_statuses WHERE workflow_id = ? ORDER BY position",
    )
    .bind(&id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let transitions = sqlx::query_as::<_, WorkflowTransition>(
        "SELECT id, workflow_id, name, from_status_id, to_status_id, requires_role, created_at \
         FROM workflow_transitions WHERE workflow_id = ?",
    )
    .bind(&id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(WorkflowWithDetails {
        workflow,
        statuses,
        transitions,
    }))
}

pub async fn create_workflow(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Json(payload): Json<CreateWorkflowRequest>,
) -> Result<(StatusCode, Json<Workflow>), Response> {
    validate_required("name", &payload.name, 100)?;

    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO workflows (id, name, description, project_id) VALUES (?, ?, ?, ?)")
        .bind(&id)
        .bind(&payload.name)
        .bind(&payload.description)
        .bind(&payload.project_id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let workflow = sqlx::query_as::<_, Workflow>(
        "SELECT id, name, description, is_default, project_id, created_at FROM workflows WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(workflow)))
}

pub async fn add_status(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(workflow_id): Path<String>,
    Json(payload): Json<CreateStatusRequest>,
) -> Result<(StatusCode, Json<WorkflowStatus>), Response> {
    validate_required("name", &payload.name, 50)?;

    let id = Uuid::new_v4().to_string();
    let category = payload.category.unwrap_or_else(|| "todo".to_string());
    let position = payload.position.unwrap_or(0);

    sqlx::query(
        "INSERT INTO workflow_statuses (id, workflow_id, name, category, color, position) \
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&workflow_id)
    .bind(&payload.name)
    .bind(&category)
    .bind(&payload.color)
    .bind(position)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let status = sqlx::query_as::<_, WorkflowStatus>(
        "SELECT id, workflow_id, name, category, color, position, created_at \
         FROM workflow_statuses WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(status)))
}

pub async fn add_transition(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(workflow_id): Path<String>,
    Json(payload): Json<CreateTransitionRequest>,
) -> Result<(StatusCode, Json<WorkflowTransition>), Response> {
    validate_required("name", &payload.name, 100)?;
    validate_required("to_status_id", &payload.to_status_id, 50)?;

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO workflow_transitions (id, workflow_id, name, from_status_id, to_status_id, requires_role) \
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&workflow_id)
    .bind(&payload.name)
    .bind(&payload.from_status_id)
    .bind(&payload.to_status_id)
    .bind(&payload.requires_role)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let transition = sqlx::query_as::<_, WorkflowTransition>(
        "SELECT id, workflow_id, name, from_status_id, to_status_id, requires_role, created_at \
         FROM workflow_transitions WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(transition)))
}

pub async fn delete_workflow(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    sqlx::query(
        "UPDATE workflows SET deleted_at = datetime('now') WHERE id = ? AND is_default = 0",
    )
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{get, post},
    };

    axum::Router::new()
        .route("/api/workflows", get(list_workflows).post(create_workflow))
        .route(
            "/api/workflows/:id",
            get(get_workflow).delete(delete_workflow),
        )
        .route("/api/workflows/:id/statuses", post(add_status))
        .route("/api/workflows/:id/transitions", post(add_transition))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
