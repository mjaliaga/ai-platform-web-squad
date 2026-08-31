use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use std::sync::Arc;

use crate::models::{ContentItem, ContentItemOut, Project};
use crate::validation::internal_error;
use crate::AppState;

use super::schemas;

/// Endpoint PÚBLICO (sin auth) para que el sitio público lea items publicados.
/// `?published=all` y `?preview=true` requieren autenticación (verificados por header/cookie JWT).
pub async fn public_list_items(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(collection): Path<String>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, Response> {
    let want_drafts = params.get("published").map(|s| s == "all").unwrap_or(false);
    if want_drafts && !is_authenticated(&headers, &state).await {
        return Err(crate::validation::error_response(
            StatusCode::UNAUTHORIZED,
            "Autenticación requerida para ver borradores".to_string(),
        ));
    }
    let include_drafts = want_drafts;

    // Special-case: 'proyectos' now lives in the projects table
    if collection == "proyectos" {
        return public_list_projects_inner(state, params, include_drafts).await;
    }

    if schemas::schema_for(&collection).is_none() {
        return Err(crate::validation::error_response(
            StatusCode::NOT_FOUND,
            format!("Colección '{}' no soportada", collection),
        ));
    }

    let sql = "SELECT id, collection, slug, data, published, created_by, updated_by, created_at, updated_at \
               FROM content_items WHERE collection = ? AND deleted_at IS NULL \
               {drafts} ORDER BY updated_at DESC LIMIT ? OFFSET ?";
    let count_sql = "SELECT COUNT(*) FROM content_items WHERE collection = ? AND deleted_at IS NULL {drafts}";

    let drafts_filter = if include_drafts {
        ""
    } else {
        "AND published = 1 AND (json_extract(data, '$.reservado') IS NULL OR json_extract(data, '$.reservado') != 1)"
    };

    let sql = sql.replace("{drafts}", drafts_filter);
    let count_sql = count_sql.replace("{drafts}", drafts_filter);

    let limit: i64 = params
        .get("limit")
        .and_then(|v| v.parse().ok())
        .unwrap_or(500)
        .min(2000);
    let offset: i64 = params
        .get("offset")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0)
        .max(0);

    let total: (i64,) = sqlx::query_as(&count_sql)
        .bind(&collection)
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let mut q = sqlx::query_as::<_, ContentItem>(&sql);
    q = q.bind(&collection).bind(limit).bind(offset);
    let rows: Vec<ContentItem> = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let items: Vec<ContentItemOut> = rows.into_iter().map(Into::into).collect();

    Ok(Json(serde_json::json!({
        "items": items,
        "total": total.0,
        "limit": limit,
        "offset": offset,
    })))
}

async fn public_list_projects(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, Response> {
    let want_drafts = params.get("published").map(|s| s == "all").unwrap_or(false);
    if want_drafts && !is_authenticated(&headers, &state).await {
        return Err(crate::validation::error_response(
            StatusCode::UNAUTHORIZED,
            "Autenticación requerida para ver borradores".to_string(),
        ));
    }
    let include_drafts = want_drafts;
    public_list_projects_inner(state, params, include_drafts).await
}

async fn public_list_projects_inner(
    state: Arc<AppState>,
    params: std::collections::HashMap<String, String>,
    include_drafts: bool,
) -> Result<Json<serde_json::Value>, Response> {

    let limit: i64 = params
        .get("limit")
        .and_then(|v| v.parse().ok())
        .unwrap_or(500)
        .min(2000);
    let offset: i64 = params
        .get("offset")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0)
        .max(0);

    let (total,): (i64,) = if include_drafts {
        sqlx::query_as("SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL AND slug IS NOT NULL")
    } else {
        sqlx::query_as("SELECT COUNT(*) FROM projects WHERE published = 1 AND reservado = 0 AND deleted_at IS NULL AND slug IS NOT NULL")
    }
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let rows: Vec<Project> = if include_drafts {
        sqlx::query_as::<_, Project>(
            "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, \
             slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, \
             descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, \
             galeria, video_promocional, video_tecnico, documento_drive, documentacion, \
             url_proyecto, video_placeholder, updated_at \
             FROM projects WHERE deleted_at IS NULL AND slug IS NOT NULL ORDER BY name LIMIT ? OFFSET ?"
        )
    } else {
        sqlx::query_as::<_, Project>(
            "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, \
             slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, \
             descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, \
             galeria, video_promocional, video_tecnico, documento_drive, documentacion, \
             url_proyecto, video_placeholder, updated_at \
             FROM projects WHERE published = 1 AND reservado = 0 AND deleted_at IS NULL AND slug IS NOT NULL ORDER BY name LIMIT ? OFFSET ?"
        )
    }
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(serde_json::json!({
        "items": rows,
        "total": total,
        "limit": limit,
        "offset": offset,
    })))
}

/// Endpoint PÚBLICO para obtener un item por slug. Solo devuelve publicados
/// salvo que `?preview=true` (entonces requiere auth).
pub async fn public_get_item(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path((collection, slug)): Path<(String, String)>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, Response> {
    let preview = params.get("preview").map(|s| s == "true").unwrap_or(false);
    if preview && !is_authenticated(&headers, &state).await {
        return Err(crate::validation::error_response(
            StatusCode::UNAUTHORIZED,
            "Autenticación requerida para preview".to_string(),
        ));
    }

    // Special-case: 'proyectos' now lives in the projects table
    if collection == "proyectos" {
        return public_get_project_inner(state, slug, preview).await;
    }

    if schemas::schema_for(&collection).is_none() {
        return Err(crate::validation::error_response(
            StatusCode::NOT_FOUND,
            format!("Colección '{}' no soportada", collection),
        ));
    }

    let sql = if preview {
        "SELECT id, collection, slug, data, published, created_by, updated_by, created_at, updated_at \
         FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL"
    } else {
        "SELECT id, collection, slug, data, published, created_by, updated_by, created_at, updated_at \
         FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL AND published = 1"
    };

    let row: Option<ContentItem> = sqlx::query_as::<_, ContentItem>(sql)
        .bind(&collection)
        .bind(&slug)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let row = match row {
        Some(r) => r,
        None => {
            return Err(crate::validation::error_response(
                StatusCode::NOT_FOUND,
                "Item no encontrado".to_string(),
            ))
        }
    };

    let out: ContentItemOut = row.into();
    Ok(Json(serde_json::json!(out)))
}

async fn public_get_project(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(slug): Path<String>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, Response> {
    let preview = params.get("preview").map(|s| s == "true").unwrap_or(false);
    if preview && !is_authenticated(&headers, &state).await {
        return Err(crate::validation::error_response(
            StatusCode::UNAUTHORIZED,
            "Autenticación requerida para preview".to_string(),
        ));
    }
    public_get_project_inner(state, slug, preview).await
}

async fn public_get_project_inner(
    state: Arc<AppState>,
    slug: String,
    preview: bool,
) -> Result<Json<serde_json::Value>, Response> {

    let sql = if preview {
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, \
         slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, \
         descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, \
         galeria, video_promocional, video_tecnico, documento_drive, documentacion, \
         url_proyecto, video_placeholder, updated_at \
         FROM projects WHERE slug = ? AND deleted_at IS NULL"
    } else {
        "SELECT id, name, description, color, status, sector, code, po_user_id, created_at, deleted_at, \
         slug, published, reservado, tipo, version, tipo_solucion, cliente, nombre_comercial, \
         descripcion_larga, equipo, stack, problemas, que_hicimos, resultados, highlights, \
         galeria, video_promocional, video_tecnico, documento_drive, documentacion, \
         url_proyecto, video_placeholder, updated_at \
         FROM projects WHERE slug = ? AND deleted_at IS NULL AND published = 1"
    };

    let row: Option<Project> = sqlx::query_as::<_, Project>(sql)
        .bind(&slug)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match row {
        Some(p) => Ok(Json(serde_json::json!(p))),
        None => Err(crate::validation::error_response(
            StatusCode::NOT_FOUND,
            "Item no encontrado".to_string(),
        )),
    }
}

async fn is_authenticated(headers: &axum::http::HeaderMap, state: &AppState) -> bool {
    let token = headers
        .get(axum::http::header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .and_then(|c| extract_token_from_cookie(c))
        .or_else(|| {
            headers
                .get(axum::http::header::AUTHORIZATION)
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.strip_prefix("Bearer "))
                .map(|s| s.to_string())
        });
    let token = match token {
        Some(t) => t,
        None => return false,
    };
    let mut validation = jsonwebtoken::Validation::default();
    validation.leeway = 60;
    let claims = match jsonwebtoken::decode::<crate::models::Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &validation,
    ) {
        Ok(d) => d.claims,
        Err(_) => return false,
    };
    let active: Option<(i32, Option<String>)> =
        sqlx::query_as("SELECT active, deleted_at FROM users WHERE id = ?")
            .bind(&claims.sub)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();
    matches!(active, Some((1, None)))
}

fn extract_token_from_cookie(cookies: &str) -> Option<String> {
    for pair in cookies.split(';') {
        let pair = pair.trim();
        if let Some((k, v)) = pair.split_once('=') {
            if k == "tivit_token" {
                return Some(v.to_string());
            }
        }
    }
    None
}

#[allow(dead_code)]
pub fn public_router(state: Arc<AppState>) -> axum::Router {
    use axum::routing::get;

    axum::Router::new()
        .route("/api/public/content/:collection", get(public_list_items))
        .route("/api/public/content/:collection/:slug", get(public_get_item))
        .route("/api/public/content/proyectos/:slug", get(public_get_project))
        .with_state(state)
}
