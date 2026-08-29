use axum::{
    extract::{Extension, Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::extract::cookie::{Cookie, SameSite};
use bcrypt::verify;
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::audit;
use crate::middleware::auth::require_auth;
use crate::middleware::csrf::{generate_csrf_token, set_csrf_cookie};
use crate::models::{Claims, PublicUser, User};
use crate::pagination::PaginatedResponse;
use crate::utils;
use crate::validation::{error_response, internal_error, parse_duration_hours, require_admin, validate_email, validate_required};
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub user: PublicUser,
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (StatusCode::BAD_REQUEST, Json(self)).into_response()
    }
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<LoginRequest>,
) -> Result<Response, Response> {
    let ip = utils::extract_ip(&headers);
    let user_agent = utils::extract_user_agent(&headers);

    let rate_key = payload.email.trim().to_lowercase();
    if !state.rate_limiter.allow(&rate_key).await {
        audit::log_login_failure(
            &state.db,
            &payload.email,
            ip.clone(),
            user_agent.clone(),
            "rate_limited",
        )
        .await;
        return Err((
            StatusCode::TOO_MANY_REQUESTS,
            Json(ApiError { error: "Demasiados intentos de acceso, inténtalo más tarde".to_string() }),
        )
            .into_response());
    }

    let user: Option<User> = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE email = ? AND deleted_at IS NULL"
    )
    .bind(&payload.email)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user = match user {
        Some(u) => u,
        None => {
            audit::log_login_failure(
                &state.db,
                &payload.email,
                ip.clone(),
                user_agent.clone(),
                "user_not_found",
            )
            .await;
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(ApiError { error: "credenciales inválidas".to_string() }),
            )
                .into_response());
        }
    };

    if user.active != 1 {
        audit::log_login_failure(
            &state.db,
            &payload.email,
            ip.clone(),
            user_agent.clone(),
            "account_disabled",
        )
        .await;
        return Err((
            StatusCode::FORBIDDEN,
            Json(ApiError { error: "Tu cuenta está desactivada. Contacta a un administrador.".to_string() }),
        )
            .into_response());
    }

    let valid = verify(&payload.password, &user.password_hash).map_err(|e| {
        internal_error(&format!("bcrypt error: {e}"))
    })?;

    if !valid {
        audit::log_login_failure(
            &state.db,
            &payload.email,
            ip.clone(),
            user_agent.clone(),
            "bad_password",
        )
        .await;
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ApiError { error: "credenciales inválidas".to_string() }),
        )
            .into_response());
    }

    state.rate_limiter.reset(&rate_key).await;
    audit::log_login_success(&state.db, &user.id, ip, user_agent).await;

    let expires_in_hours: i64 = parse_duration_hours(
        &std::env::var("JWT_EXPIRES_IN").unwrap_or_else(|_| "8h".to_string()),
        8,
    );

    let exp = (Utc::now() + Duration::hours(expires_in_hours)).timestamp() as usize;

    let claims = Claims {
        sub: user.id.clone(),
        email: user.email.clone(),
        role: user.role.clone(),
        exp,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_bytes()),
    )
    .map_err(|e| internal_error(&format!("jwt error: {e}")))?;

    // SEC-003: Default to secure cookies in production. The cookie is only
    // sent over HTTPS unless explicitly opted out via COOKIE_SECURE=false.
    let cookie_secure = match std::env::var("COOKIE_SECURE") {
        Ok(v) => matches!(v.to_lowercase().as_str(), "true" | "1" | "yes"),
        // Default to true when no override is provided — safer for production.
        Err(_) => true,
    };
    // Loud warning if the operator is using an insecure configuration.
    if !cookie_secure {
        tracing::warn!(
            "COOKIE_SECURE is disabled — auth cookies may be transmitted over HTTP. \
             This should only happen in local development."
        );
    }

    let max_age_secs = expires_in_hours * 3600;

    let cookie = Cookie::build(("tivit_token", token.clone()))
        .http_only(true)
        .same_site(SameSite::Strict)
        .secure(cookie_secure)
        .path("/")
        .max_age(cookie::time::Duration::seconds(max_age_secs))
        .build();

    let csrf_token = generate_csrf_token();
    let mut response = (
        StatusCode::OK,
        [(axum::http::header::SET_COOKIE, cookie.to_string())],
        Json(LoginResponse { user: user.into() }),
    )
        .into_response();

    set_csrf_cookie(response.headers_mut(), &csrf_token, cookie_secure);

    Ok(response)
}

pub async fn logout(
    Extension(claims): Extension<Claims>,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    audit::log_logout(&state.db, &claims.sub).await;

    let cookie = Cookie::build(("tivit_token", ""))
        .http_only(true)
        .same_site(SameSite::Strict)
        .path("/")
        .max_age(cookie::time::Duration::seconds(0))
        .build();

    let csrf_cookie = Cookie::build(("csrf_token", ""))
        .http_only(true)
        .same_site(SameSite::Strict)
        .path("/")
        .max_age(cookie::time::Duration::seconds(0))
        .build();

    (
        StatusCode::OK,
        [
            (axum::http::header::SET_COOKIE, cookie.to_string()),
            (axum::http::header::SET_COOKIE, csrf_cookie.to_string()),
        ],
        Json(serde_json::json!({ "ok": true })),
    )
}

pub async fn me(
    Extension(claims): Extension<Claims>,
    State(state): State<Arc<AppState>>,
) -> Result<Response, Response> {
    let user: Option<User> = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match user {
        Some(u) => {
            let csrf_token = generate_csrf_token();
            let cookie_secure = match std::env::var("COOKIE_SECURE") {
                Ok(v) => matches!(v.to_lowercase().as_str(), "true" | "1" | "yes"),
                Err(_) => true,
            };
            let mut response = (StatusCode::OK, Json(PublicUser::from(u))).into_response();
            set_csrf_cookie(response.headers_mut(), &csrf_token, cookie_secure);
            Ok(response)
        }
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError { error: "user not found".to_string() }),
        )
            .into_response()),
    }
}

pub async fn health() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

pub async fn list_users(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<PaginatedResponse<PublicUser>>, Response> {
    let limit: i64 = params
        .get("limit")
        .and_then(|v| v.parse().ok())
        .unwrap_or(50)
        .clamp(1, 200);
    let offset: i64 = params
        .get("offset")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0)
        .max(0);

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let users: Vec<User> = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github \
         FROM users WHERE deleted_at IS NULL ORDER BY name LIMIT ? OFFSET ?"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(PaginatedResponse {
        items: users.into_iter().map(Into::into).collect(),
        total: total.0,
        limit,
        offset,
    }))
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    #[serde(default)]
    pub role: Option<String>,
}

fn avatar_palette(key: &str) -> String {
    const COLORS: [&str; 8] = [
        "#dc2626", "#2563eb", "#16a34a", "#9333ea",
        "#ea580c", "#0891b2", "#db2777", "#65a30d",
    ];
    let hash: u32 = key.bytes().fold(0u32, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u32));
    COLORS[(hash as usize) % COLORS.len()].to_string()
}

pub async fn create_user(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<PublicUser>), Response> {
    require_admin(&claims)?;

    validate_required("name", &payload.name, 100)?;
    validate_required("email", &payload.email, 200)?;
    validate_required("password", &payload.password, 200)?;
    validate_email(&payload.email)?;

    let role = payload.role.as_deref().unwrap_or("member");
    if !matches!(role, "admin" | "member" | "editor") {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "Rol inválido: debe ser 'admin', 'editor' o 'member'".to_string(),
        ));
    }

    let existing: Option<(String,)> = sqlx::query_as("SELECT id FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if existing.is_some() {
        return Err(error_response(
            StatusCode::CONFLICT,
            "Ya existe un usuario con ese email".to_string(),
        ));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let password_hash = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST)
        .map_err(|e| internal_error(&format!("bcrypt error: {e}")))?;
    let avatar_color = avatar_palette(&id);

    sqlx::query(
        "INSERT INTO users (id, name, email, password_hash, role, avatar_color) \
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(role)
    .bind(&avatar_color)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user = PublicUser {
        id,
        name: payload.name,
        email: payload.email,
        role: role.to_string(),
        avatar_color: Some(avatar_color),
        active: 1,
        created_at: None,
        phone: None,
        linkedin: None,
        github: None,
    };

    Ok((StatusCode::CREATED, Json(user)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub avatar_color: Option<String>,
    #[serde(default)]
    pub linkedin: Option<String>,
    #[serde(default)]
    pub github: Option<String>,
}

pub async fn update_profile(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<PublicUser>, Response> {
    if let Some(name) = &payload.name {
        validate_required("name", name, 100)?;
    }

    let mut sets: Vec<&str> = Vec::new();
    let mut bindings: Vec<String> = Vec::new();
    if let Some(name) = &payload.name {
        sets.push("name = ?");
        bindings.push(name.clone());
    }
    if let Some(phone) = &payload.phone {
        sets.push("phone = ?");
        bindings.push(phone.clone());
    }
    if let Some(linkedin) = &payload.linkedin {
        sets.push("linkedin = ?");
        bindings.push(linkedin.clone());
    }
    if let Some(github) = &payload.github {
        sets.push("github = ?");
        bindings.push(github.clone());
    }
    if let Some(color) = &payload.avatar_color {
        if !color.starts_with('#') || color.len() != 7 {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "avatar_color debe ser un color hex (#rrggbb)".to_string(),
            ));
        }
        sets.push("avatar_color = ?");
        bindings.push(color.clone());
    }

    if !sets.is_empty() {
        let sql = format!(
            "UPDATE users SET {} WHERE id = ?",
            sets.join(", ")
        );
        let mut q = sqlx::query(&sql);
        for b in &bindings {
            q = q.bind(b);
        }
        q = q.bind(&claims.sub);
        q.execute(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let user: Option<User> = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match user {
        Some(u) => Ok(Json(u.into())),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError { error: "user not found".to_string() }),
        )
            .into_response()),
    }
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

pub async fn change_password(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<Response, Response> {
    validate_required("new_password", &payload.new_password, 200)?;
    if payload.new_password.len() < 8 {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "La nueva contraseña debe tener al menos 8 caracteres".to_string(),
        ));
    }

    let user: Option<User> = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user = match user {
        Some(u) => u,
        None => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(ApiError { error: "user not found".to_string() }),
            )
                .into_response());
        }
    };

    let valid = verify(&payload.current_password, &user.password_hash)
        .map_err(|e| internal_error(&format!("bcrypt error: {e}")))?;
    if !valid {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "La contraseña actual es incorrecta".to_string(),
        ));
    }

    let password_hash = bcrypt::hash(&payload.new_password, bcrypt::DEFAULT_COST)
        .map_err(|e| internal_error(&format!("bcrypt error: {e}")))?;
    sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(&password_hash)
        .bind(&claims.sub)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    audit::log_password_change(&state.db, &claims.sub).await;

    Ok(Json(serde_json::json!({ "ok": true })).into_response())
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub active: Option<i32>,
}

pub async fn update_user(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<PublicUser>, Response> {
    require_admin(&claims)?;

    if let Some(name) = &payload.name {
        validate_required("name", name, 100)?;
    }
    if let Some(email) = &payload.email {
        validate_required("email", email, 200)?;
        validate_email(email)?;
    }
    if let Some(role) = &payload.role {
        if !matches!(role.as_str(), "admin" | "member" | "editor") {
            return Err(error_response(
                StatusCode::BAD_REQUEST,
                "Rol inválido: debe ser 'admin', 'editor' o 'member'".to_string(),
            ));
        }
    }

    let existing: Option<(String,)> =
        sqlx::query_as("SELECT id FROM users WHERE id = ?")
            .bind(&id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if existing.is_none() {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Usuario no encontrado".to_string(),
        ));
    }

    if let Some(email) = &payload.email {
        let dup: Option<(String,)> =
            sqlx::query_as("SELECT id FROM users WHERE email = ? AND id != ?")
                .bind(email)
                .bind(&id)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
        if dup.is_some() {
            return Err(error_response(
                StatusCode::CONFLICT,
                "Ya existe un usuario con ese email".to_string(),
            ));
        }
    }

    let mut sets: Vec<&str> = Vec::new();
    let mut bindings: Vec<serde_json::Value> = Vec::new();
    if let Some(name) = &payload.name {
        sets.push("name = ?");
        bindings.push(serde_json::json!(name));
    }
    if let Some(email) = &payload.email {
        sets.push("email = ?");
        bindings.push(serde_json::json!(email));
    }
    if let Some(role) = &payload.role {
        sets.push("role = ?");
        bindings.push(serde_json::json!(role));
        audit::log_role_change(&state.db, &claims, &id, role).await;
    }
    if let Some(active) = payload.active {
        sets.push("active = ?");
        bindings.push(serde_json::json!(active));
        if active == 0 {
            audit::log_user_deactivated(&state.db, &claims, &id).await;
        }
    }

    if !sets.is_empty() {
        let sql = format!("UPDATE users SET {} WHERE id = ?", sets.join(", "));
        let mut q = sqlx::query(&sql);
        for b in &bindings {
            if let Some(s) = b.as_str() {
                q = q.bind(s);
            } else if let Some(i) = b.as_i64() {
                q = q.bind(i);
            }
        }
        q = q.bind(&id);
        q.execute(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
    }

    let user: Option<User> = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match user {
        Some(u) => Ok(Json(u.into())),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError { error: "user not found".to_string() }),
        )
            .into_response()),
    }
}

pub async fn delete_user(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    if claims.sub == id {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "No puedes eliminar tu propio usuario".to_string(),
        ));
    }

    let existing: Option<(String,)> = sqlx::query_as(
        "SELECT id FROM users WHERE id = ? AND deleted_at IS NULL"
    )
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if existing.is_none() {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Usuario no encontrado".to_string(),
        ));
    }

    let now_ts = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let mut tx = state.db.begin().await.map_err(|e| {
        internal_error(&format!("db error: {e}"))
    })?;

    sqlx::query("UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    // Reasignamos las tareas reportadas por el usuario al admin que ejecuta la
    // acción para no perder trabajo. El soft delete mantiene el historial.
    sqlx::query("UPDATE tasks SET reporter_id = ? WHERE reporter_id = ?")
        .bind(&claims.sub)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    sqlx::query("UPDATE projects SET po_user_id = NULL WHERE po_user_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    // Soft delete: en vez de borrar al usuario (y con él todas sus referencias
    // históricas), lo marcamos como eliminado. Las queries ya filtran
    // `deleted_at IS NULL`.
    sqlx::query("UPDATE users SET deleted_at = ?, active = 0 WHERE id = ?")
        .bind(&now_ts)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    // Limpiamos las membresías de proyecto del usuario eliminado.
    sqlx::query("DELETE FROM project_members WHERE user_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    // Soft delete de las notificaciones del usuario.
    sqlx::query("UPDATE notifications SET deleted_at = ? WHERE user_id = ?")
        .bind(&now_ts)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    tx.commit().await.map_err(|e| {
        internal_error(&format!("db error: {e}"))
    })?;

    audit::log_user_deactivated(&state.db, &claims, &id).await;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Serialize)]
pub struct UserStats {
    pub user: PublicUser,
    pub task_counts: Vec<StatusCount>,
    pub total_tasks: i64,
    pub total_estimate: f64,
    pub total_spent: f64,
    pub overdue_count: i64,
    pub projects: Vec<UserProjectMembership>,
    pub recent_activity: Vec<crate::models::ActivityWithUser>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct UserProjectMembership {
    pub project_id: String,
    pub project_name: String,
    pub project_color: String,
    pub role: String,
}

pub async fn get_user_stats(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    axum::extract::Path(user_id): axum::extract::Path<String>,
) -> Result<Json<UserStats>, Response> {
    let user_row: Option<User> = sqlx::query_as::<_, User>(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active, phone, linkedin, github FROM users WHERE id = ?"
    )
    .bind(&user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user = match user_row {
        Some(u) => u,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Usuario no encontrado".to_string())),
    };

    let task_counts: Vec<StatusCount> = sqlx::query_as(
        "SELECT status, COUNT(*) as count FROM tasks WHERE assignee_id = ? GROUP BY status"
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let total_tasks: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tasks WHERE assignee_id = ?"
    )
    .bind(&user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let totals: (Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT SUM(estimate_hours), SUM(time_spent_hours) FROM tasks WHERE assignee_id = ?"
    )
    .bind(&user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let overdue_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND due_date IS NOT NULL AND due_date < date('now') AND status != 'done'"
    )
    .bind(&user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let project_rows: Vec<(String, String, String, String)> = sqlx::query_as(
        "SELECT p.id, p.name, p.color, pm.role FROM project_members pm \
         INNER JOIN projects p ON p.id = pm.project_id WHERE pm.user_id = ? AND p.status = 'active'"
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let projects: Vec<UserProjectMembership> = project_rows
        .into_iter()
        .map(|(id, name, color, role)| UserProjectMembership {
            project_id: id,
            project_name: name,
            project_color: color,
            role,
        })
        .collect();

    let activity: Vec<crate::models::ActivityLog> = sqlx::query_as(
        "SELECT a.id, a.task_id, a.user_id, a.action, a.field_changed, a.old_value, a.new_value, a.metadata, a.created_at \
         FROM activity_log a WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 10"
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let activity_user_ids: Vec<&str> = activity.iter().map(|a| a.user_id.as_str()).collect();
    let activity_users = crate::routes::tasks::batch_users(&state.db, &activity_user_ids).await;
    let mut recent_activity = Vec::with_capacity(activity.len());
    for a in activity {
        if let Some(u) = activity_users.get(&a.user_id) {
            recent_activity.push(crate::models::ActivityWithUser { activity: a, user: u.clone() });
        }
    }

    Ok(Json(UserStats {
        user: user.into(),
        task_counts,
        total_tasks: total_tasks.0,
        total_estimate: totals.0.unwrap_or(0.0),
        total_spent: totals.1.unwrap_or(0.0),
        overdue_count: overdue_count.0,
        projects,
        recent_activity,
    }))
}

pub fn public_router(state: Arc<AppState>) -> axum::Router {
    use axum::routing::{get, post};

    axum::Router::new()
        .route("/api/auth/login", post(login))
        .route("/api/health", get(health))
        .with_state(state)
}

pub fn protected_router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{get, patch, post},
    };

    axum::Router::new()
        .route("/api/auth/logout", post(logout))
        .route("/api/auth/me", get(me))
        .route("/api/auth/profile", patch(update_profile))
        .route("/api/auth/password", patch(change_password))
        .route("/api/users", get(list_users).post(create_user))
        .route("/api/users/:id", patch(update_user).delete(delete_user))
        .route("/api/users/:id/stats", get(get_user_stats))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}