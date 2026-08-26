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
/// Acepta `?published=true` (default) o `?published=all` para incluir borradores
/// (esto último se usa desde el portal autenticado para preview).
pub async fn public_list_items(
    State(state): State<Arc<AppState>>,
    Path(collection): Path<String>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, Response> {
    // Special-case: 'proyectos' now lives in the projects table
    if collection == "proyectos" {
        return public_list_projects(State(state), params).await;
    }

    if schemas::schema_for(&collection).is_none() {
        return Err(crate::validation::error_response(
            StatusCode::NOT_FOUND,
            format!("Colección '{}' no soportada", collection),
        ));
    }

    let include_drafts = params.get("published").map(|s| s == "all").unwrap_or(false);

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

/// Public list for projects (migrated from content_items to projects table).
async fn public_list_projects(
    state: State<Arc<AppState>>,
    params: std::collections::HashMap<String, String>,
) -> Result<Json<serde_json::Value>, Response> {
    let include_drafts = params.get("published").map(|s| s == "all").unwrap_or(false);

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
    Path((collection, slug)): Path<(String, String)>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, Response> {
    // Special-case: 'proyectos' now lives in the projects table
    if collection == "proyectos" {
        return public_get_project(State(state), slug, params).await;
    }

    if schemas::schema_for(&collection).is_none() {
        return Err(crate::validation::error_response(
            StatusCode::NOT_FOUND,
            format!("Colección '{}' no soportada", collection),
        ));
    }

    let preview = params.get("preview").map(|s| s == "true").unwrap_or(false);
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

/// Public get for a single project by slug.
async fn public_get_project(
    state: State<Arc<AppState>>,
    slug: String,
    params: std::collections::HashMap<String, String>,
) -> Result<Json<serde_json::Value>, Response> {
    let preview = params.get("preview").map(|s| s == "true").unwrap_or(false);

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

#[allow(dead_code)]
pub fn public_router(state: Arc<AppState>) -> axum::Router {
    use axum::routing::get;

    axum::Router::new()
        .route("/api/public/content/:collection", get(public_list_items))
        .route(
            "/api/public/content/:collection/:slug",
            get(public_get_item),
        )
        .with_state(state)
}
