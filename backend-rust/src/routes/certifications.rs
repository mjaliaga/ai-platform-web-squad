use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::middleware::auth::require_auth;
use crate::models::Claims;
use crate::validation::{error_response, internal_error, require_admin, validate_required};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Certification {
    pub id: String,
    pub user_id: String,
    pub certification_name: String,
    pub issue_date: String,
    pub created_at: String,
    pub created_by: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_email: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCertificationRequest {
    pub user_id: String,
    pub certification_name: String,
    pub issue_date: String,
}

#[derive(Debug, Serialize)]
pub struct CertificationWithUser {
    pub id: String,
    pub user_id: String,
    pub user_name: String,
    pub user_email: String,
    pub certification_name: String,
    pub issue_date: String,
    pub created_at: String,
    pub created_by: String,
}

pub async fn list_certifications(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
) -> Result<Json<Vec<CertificationWithUser>>, Response> {
    let certifications = sqlx::query_as::<_, Certification>(
        "SELECT c.id, c.user_id, c.certification_name, c.issue_date, c.created_at, c.created_by, \
         u.name as user_name, u.email as user_email \
         FROM certifications c \
         JOIN users u ON c.user_id = u.id \
         ORDER BY c.issue_date ASC"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let result: Vec<CertificationWithUser> = certifications
        .into_iter()
        .map(|c| CertificationWithUser {
            id: c.id,
            user_id: c.user_id,
            user_name: c.user_name.unwrap_or_default(),
            user_email: c.user_email.unwrap_or_default(),
            certification_name: c.certification_name,
            issue_date: c.issue_date,
            created_at: c.created_at,
            created_by: c.created_by,
        })
        .collect();

    Ok(Json(result))
}

pub async fn create_certification(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateCertificationRequest>,
) -> Result<Json<CertificationWithUser>, Response> {
    require_admin(&claims)?;

    validate_required("user_id", &payload.user_id, 100)?;
    validate_required("certification_name", &payload.certification_name, 500)?;
    validate_required("issue_date", &payload.issue_date, 50)?;

    let user = sqlx::query_as::<_, (String, String, String)>(
        "SELECT id, name, email FROM users WHERE id = ?"
    )
    .bind(&payload.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let (user_name, user_email) = match user {
        Some((_, name, email)) => (name, email),
        None => {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "Usuario no encontrado".to_string(),
            ))
        }
    };

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO certifications (id, user_id, certification_name, issue_date, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.user_id)
    .bind(&payload.certification_name)
    .bind(&payload.issue_date)
    .bind(&now)
    .bind(&claims.sub)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(CertificationWithUser {
        id,
        user_id: payload.user_id,
        user_name,
        user_email,
        certification_name: payload.certification_name,
        issue_date: payload.issue_date,
        created_at: now,
        created_by: claims.sub,
    }))
}

pub async fn delete_certification(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    let result = sqlx::query("DELETE FROM certifications WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(StatusCode::NOT_FOUND, "Certificación no encontrada".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{delete, get, post},
    };

    axum::Router::new()
        .route("/api/certifications", get(list_certifications).post(create_certification))
        .route("/api/certifications/:id", delete(delete_certification))
        .layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
