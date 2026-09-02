use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::models::Claims;

pub const STATUSES: &[&str] = &["backlog", "todo", "in_progress", "review", "done"];
pub const SOLICITUD_STATUSES: &[&str] = &["pendiente", "en_revision", "aprobada", "rechazada", "resuelta"];
pub const PRIORITIES: &[&str] = &["low", "medium", "high", "urgent"];
pub const TYPES: &[&str] = &["tarea", "bug", "solicitud"];
pub const MAX_UPLOAD_BYTES: usize = 10 * 1024 * 1024;
// Tickets
pub const TICKET_STATUSES: &[&str] = &["abierto", "en_progreso", "resuelto", "cerrado"];
pub const TICKET_PRIORITIES: &[&str] = &["low", "medium", "high", "urgent"];
pub const TICKET_CATEGORIES: &[&str] = &["incidencia", "solicitud", "consulta"];
pub const TICKET_LEVELS: &[i64] = &[1, 2];

fn err(status: StatusCode, msg: String) -> Response {
    (status, Json(serde_json::json!({ "error": msg }))).into_response()
}

pub fn error_response(status: StatusCode, msg: String) -> Response {
    err(status, msg)
}

pub fn internal_error(context: &str) -> Response {
    tracing::error!("{context}");
    err(StatusCode::INTERNAL_SERVER_ERROR, "Error interno del servidor".to_string())
}

pub fn require_admin(claims: &Claims) -> Result<(), Response> {
    if claims.role == "admin" {
        Ok(())
    } else {
        Err(err(StatusCode::FORBIDDEN, "No tienes permisos de administrador".to_string()))
    }
}

/// Permite acceso a administradores, editores y miembros del equipo.
pub fn require_admin_or_editor(claims: &Claims) -> Result<(), Response> {
    if claims.role == "admin" || claims.role == "editor" || claims.role == "member" {
        Ok(())
    } else {
        Err(err(
            StatusCode::FORBIDDEN,
            "Se requiere rol de administrador, editor o miembro".to_string(),
        ))
    }
}

pub fn validate_enum(field: &str, value: &str, allowed: &[&str]) -> Result<(), Response> {
    if allowed.contains(&value) {
        Ok(())
    } else {
        Err(err(
            StatusCode::BAD_REQUEST,
            format!("Valor inválido para '{field}': '{value}'"),
        ))
    }
}

pub fn validate_required(field: &str, value: &str, max_len: usize) -> Result<(), Response> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(err(
            StatusCode::BAD_REQUEST,
            format!("'{field}' no puede estar vacío"),
        ));
    }
    if trimmed.chars().count() > max_len {
        return Err(err(
            StatusCode::BAD_REQUEST,
            format!("'{field}' supera el máximo de {max_len} caracteres"),
        ));
    }
    Ok(())
}

/// FIX-007: Real email validation — requires local part, "@", domain with at
/// least one dot, and rejects obvious garbage like "a@b" or whitespace.
pub fn validate_email(email: &str) -> Result<(), Response> {
    let trimmed = email.trim();
    if trimmed.is_empty() {
        return Err(err(StatusCode::BAD_REQUEST, "Email no puede estar vacío".to_string()));
    }
    if trimmed.len() > 254 {
        return Err(err(StatusCode::BAD_REQUEST, "Email demasiado largo".to_string()));
    }
    let parts: Vec<&str> = trimmed.split('@').collect();
    if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
        return Err(err(StatusCode::BAD_REQUEST, "Email inválido".to_string()));
    }
    let domain = parts[1];
    if !domain.contains('.') || domain.starts_with('.') || domain.ends_with('.') {
        return Err(err(StatusCode::BAD_REQUEST, "Email inválido".to_string()));
    }
    if trimmed.chars().any(|c| c.is_whitespace()) {
        return Err(err(StatusCode::BAD_REQUEST, "Email inválido".to_string()));
    }
    Ok(())
}

pub fn validate_hours(hours: f64) -> Result<(), Response> {
    if !hours.is_finite() || hours <= 0.0 || hours > 168.0 {
        return Err(err(
            StatusCode::BAD_REQUEST,
            "Las horas deben ser un número entre 0 y 168".to_string(),
        ));
    }
    Ok(())
}

pub fn validate_password(password: &str) -> Result<(), Response> {
    if password.len() < 8 {
        return Err(err(
            StatusCode::BAD_REQUEST,
            "La contraseña debe tener al menos 8 caracteres".to_string(),
        ));
    }
    if password.len() > 200 {
        return Err(err(
            StatusCode::BAD_REQUEST,
            "La contraseña no puede superar 200 caracteres".to_string(),
        ));
    }
    const WEAK: &[&str] = &[
        "tivit2026",
        "admin123",
        "password",
        "changeme",
        "12345678",
        "qwerty123",
        "tivit2026!",
        "password123",
    ];
    if WEAK.iter().any(|w| password.eq_ignore_ascii_case(w)) {
        return Err(err(
            StatusCode::BAD_REQUEST,
            "La contraseña es demasiado débil o común, elige otra".to_string(),
        ));
    }
    Ok(())
}

pub fn parse_duration_hours(input: &str, default: i64) -> i64 {
    let s = input.trim().to_lowercase();
    if let Some(n) = s.strip_suffix('h') {
        n.trim().parse::<i64>().ok().filter(|v| *v > 0).unwrap_or(default)
    } else if let Some(n) = s.strip_suffix('d') {
        n.trim()
            .parse::<i64>()
            .ok()
            .filter(|v| *v > 0)
            .and_then(|v| v.checked_mul(24))
            .unwrap_or(default)
    } else if let Some(n) = s.strip_suffix('m') {
        n.trim()
            .parse::<f64>()
            .ok()
            .filter(|v| *v > 0.0)
            .map(|v| (v / 60.0).ceil() as i64)
            .filter(|v| *v > 0)
            .unwrap_or(default)
    } else {
        default
    }
}