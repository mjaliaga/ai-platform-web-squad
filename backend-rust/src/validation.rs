use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::models::Claims;

pub const STATUSES: &[&str] = &["backlog", "todo", "in_progress", "review", "done"];
pub const SOLICITUD_STATUSES: &[&str] = &["pendiente", "en_revision", "aprobada", "rechazada", "resuelta"];
pub const PRIORITIES: &[&str] = &["low", "medium", "high", "urgent"];
pub const TYPES: &[&str] = &["tarea", "bug", "solicitud"];
pub const MAX_UPLOAD_BYTES: usize = 10 * 1024 * 1024;

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

pub fn validate_hours(hours: f64) -> Result<(), Response> {
    if !hours.is_finite() || hours <= 0.0 || hours > 168.0 {
        return Err(err(
            StatusCode::BAD_REQUEST,
            "Las horas deben ser un número entre 0 y 168".to_string(),
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