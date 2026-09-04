use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::Response,
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::sync::Arc;
use uuid::Uuid;

use super::schemas;
use crate::middleware::auth::require_auth;
use crate::models::{Claims, CollectionInfo, ContentItem, ContentItemOut, FieldDef, PublicUser};
use crate::validation::{error_response, internal_error, require_admin, require_admin_or_editor};
use crate::AppState;

fn require_mutable(_collection: &str) -> Result<(), Response> {
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    #[serde(default)]
    pub q: Option<String>,
    #[serde(default)]
    pub published: Option<bool>,
    #[serde(default)]
    pub limit: Option<i64>,
    #[serde(default)]
    pub offset: Option<i64>,
    #[serde(default)]
    pub sort: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ContentListResponse {
    pub items: Vec<ContentItemOut>,
    pub total: i64,
    pub limit: i64,
    pub offset: i64,
}

pub async fn list_collections(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<CollectionInfo>>, Response> {
    let mut result = Vec::new();

    for ruta in schemas::all_collections() {
        let fields = schemas::schema_for(ruta).unwrap_or_default();

        let counts: (i64, i64, i64) = sqlx::query_as(
            "SELECT \
                COUNT(*) as total, \
                COALESCE(SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END), 0) as pub, \
                COALESCE(SUM(CASE WHEN published = 0 THEN 1 ELSE 0 END), 0) as draft \
             FROM content_items WHERE collection = ? AND deleted_at IS NULL",
        )
        .bind(*ruta)
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

        let info = collection_info(ruta, &fields, counts.0, counts.1, counts.2);
        result.push(info);
    }

    // Incluir "proyectos" aunque esté migrado a la tabla `projects`.
    // Esto evita que desaparezca del sidebar de Edición tras la migración 020.
    // Usamos la tabla `projects` para los conteos (published/reservado).
    {
        let ruta = "proyectos";
        let fields = schemas::schema_for(ruta).unwrap_or_default();
        let counts: (i64, i64, i64) = sqlx::query_as(
            "SELECT \
                COUNT(*) as total, \
                COALESCE(SUM(CASE WHEN published = 1 AND reservado = 0 THEN 1 ELSE 0 END), 0) as pub, \
                COALESCE(SUM(CASE WHEN published = 0 OR reservado = 1 THEN 1 ELSE 0 END), 0) as draft \
             FROM projects WHERE deleted_at IS NULL AND slug IS NOT NULL",
        )
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
        let info = collection_info(ruta, &fields, counts.0, counts.1, counts.2);
        // Insertar al principio para mantener orden esperado (Proyectos primero)
        result.insert(0, info);
    }

    let _ = claims;
    Ok(Json(result))
}

fn collection_info(
    ruta: &str,
    fields: &[FieldDef],
    total: i64,
    pub_: i64,
    draft: i64,
) -> CollectionInfo {
    let (nombre, titulo, intro) = match ruta {
        "proyectos" => (
            "Proyectos",
            "Lo que hemos construido",
            "Proyectos entregados para clientes externos e iniciativas internas del equipo.",
        ),
        "casos-de-exito" => (
            "Casos de éxito",
            "Casos de éxito en IA y Datos",
            "Casos de éxito implementados en clientes corporativos y sector público.",
        ),
        "laboratorio" => (
            "Tivit Labs",
            "Tivit Labs — Exploración e Innovación en IA",
            "Espacio para explorar, validar y compartir nuevas capacidades de IA.",
        ),
        "poc" => (
            "PoC",
            "Explorando nuevas ideas",
            "Pruebas de concepto para validar viabilidad técnica.",
        ),
        "almaviva" => (
            "Almaviva Group",
            "Soluciones de IA de Almaviva Group",
            "Portafolio de soluciones de inteligencia artificial del grupo.",
        ),
        "xms" => (
            "XMS",
            "Portafolio de Agentes de IA",
            "Agentes de IA para automatizar atención, operaciones y cumplimiento.",
        ),
        _ => (ruta, ruta, ""),
    };

    CollectionInfo {
        ruta: ruta.to_string(),
        nombre: nombre.to_string(),
        titulo: titulo.to_string(),
        intro: intro.to_string(),
        campos: fields.to_vec(),
        total_items: total,
        total_publicados: pub_,
        total_borradores: draft,
    }
}

pub async fn list_items(
    State(state): State<Arc<AppState>>,
    Path(collection): Path<String>,
    Extension(claims): Extension<Claims>,
    Query(q): Query<ListQuery>,
) -> Result<Json<ContentListResponse>, Response> {
    require_collection(&collection)?;
    let limit = q.limit.unwrap_or(50).clamp(1, 200);
    let offset = q.offset.unwrap_or(0).max(0);

    let mut sql = String::from(
        "SELECT id, collection, slug, data, published, created_by, updated_by, created_at, updated_at \
         FROM content_items WHERE collection = ? AND deleted_at IS NULL",
    );
    let mut count_sql = String::from(
        "SELECT COUNT(*) FROM content_items WHERE collection = ? AND deleted_at IS NULL",
    );
    let mut binds: Vec<String> = vec![collection.clone()];

    if let Some(search) = &q.q {
        if !search.trim().is_empty() {
            sql.push_str(" AND (slug LIKE ? OR data LIKE ?)");
            count_sql.push_str(" AND (slug LIKE ? OR data LIKE ?)");
            let pat = format!("%{}%", search.trim());
            binds.push(pat.clone());
            binds.push(pat);
        }
    }

    if let Some(pub_) = q.published {
        sql.push_str(if pub_ {
            " AND published = 1"
        } else {
            " AND published = 0"
        });
        count_sql.push_str(if pub_ {
            " AND published = 1"
        } else {
            " AND published = 0"
        });
    }

    let sort = q.sort.as_deref().unwrap_or("updated_desc");
    let order = match sort {
        "updated_asc" => "updated_at ASC",
        "created_asc" => "created_at ASC",
        "created_desc" => "created_at DESC",
        "slug_asc" => "slug ASC",
        "slug_desc" => "slug DESC",
        _ => "updated_at DESC",
    };
    sql.push_str(&format!(" ORDER BY {} LIMIT ? OFFSET ?", order));

    let total: (i64,) = sqlx::query_as(&count_sql)
        .bind(&collection)
        .fetch_one(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let mut query = sqlx::query_as::<_, ContentItem>(&sql);
    for b in &binds {
        query = query.bind(b);
    }
    query = query.bind(limit).bind(offset);
    let rows: Vec<ContentItem> = query
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    // Hidratar creators/updaters
    let users = batch_users_for_content(&state.db, &rows).await;
    let items: Vec<ContentItemOut> = rows
        .into_iter()
        .map(|row| {
            let creator = row
                .created_by
                .as_ref()
                .and_then(|id| users.get(id).cloned());
            let updater = row
                .updated_by
                .as_ref()
                .and_then(|id| users.get(id).cloned());
            let mut out: ContentItemOut = row.into();
            out.creator = creator;
            out.updater = updater;
            out
        })
        .collect();

    let _ = claims;
    Ok(Json(ContentListResponse {
        items,
        total: total.0,
        limit,
        offset,
    }))
}

pub async fn get_item(
    State(state): State<Arc<AppState>>,
    Extension(_claims): Extension<Claims>,
    Path((collection, slug)): Path<(String, String)>,
) -> Result<Json<ContentItemOut>, Response> {
    require_collection(&collection)?;

    let row: Option<ContentItem> = sqlx::query_as::<_, ContentItem>(
        "SELECT id, collection, slug, data, published, created_by, updated_by, created_at, updated_at \
         FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
    )
    .bind(&collection)
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let row = match row {
        Some(r) => r,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Item no encontrado".to_string(),
            ))
        }
    };

    let users = batch_users_for_content(&state.db, std::slice::from_ref(&row)).await;
    let creator = row
        .created_by
        .as_ref()
        .and_then(|id| users.get(id).cloned());
    let updater = row
        .updated_by
        .as_ref()
        .and_then(|id| users.get(id).cloned());
    let mut out: ContentItemOut = row.into();
    out.creator = creator;
    out.updater = updater;
    Ok(Json(out))
}

#[derive(Debug, Deserialize)]
pub struct UpsertRequest {
    pub slug: String,
    pub data: serde_json::Value,
    #[serde(default)]
    pub published: bool,
}

pub async fn create_item(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(collection): Path<String>,
    Json(payload): Json<UpsertRequest>,
) -> Result<(StatusCode, Json<ContentItemOut>), Response> {
    require_admin_or_editor(&claims)?;
    require_mutable(&collection)?;
    require_collection(&collection)?;
    schemas::validate_data(&collection, &payload.data)
        .map_err(|e| error_response(StatusCode::BAD_REQUEST, e))?;

    // Validar slug único
    let existing: Option<(String,)> = sqlx::query_as(
        "SELECT id FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
    )
    .bind(&collection)
    .bind(&payload.slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if existing.is_some() {
        return Err(error_response(
            StatusCode::CONFLICT,
            format!("Ya existe un item con el slug '{}'", payload.slug),
        ));
    }

    // Validar código único por colección (si se proporciona)
    if let Some(codigo) = payload.data.get("codigo").and_then(|v| v.as_str()) {
        if !codigo.is_empty() {
            let code_exists: Option<(String,)> =
                sqlx::query_as(
                    "SELECT id FROM content_items WHERE collection = ? AND json_extract(data, '$.codigo') = ? AND deleted_at IS NULL",
                )
                .bind(&collection)
                .bind(codigo)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
            if code_exists.is_some() {
                return Err(error_response(
                    StatusCode::CONFLICT,
                    format!(
                        "Ya existe un item con el código '{}' en la colección '{}'",
                        codigo, collection
                    ),
                ));
            }
        }
    }

    let id = Uuid::new_v4().to_string();
    let data_str = serde_json::to_string(&payload.data).unwrap_or_else(|_| "{}".to_string());
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO content_items (id, collection, slug, data, published, created_by, updated_by, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&collection)
    .bind(&payload.slug)
    .bind(&data_str)
    .bind(if payload.published { 1 } else { 0 })
    .bind(&claims.sub)
    .bind(&claims.sub)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    audit_content(
        &state.db,
        Some(&id),
        &collection,
        Some(&payload.slug),
        "created",
        &claims,
        None,
    )
    .await;

    let row: ContentItem = sqlx::query_as::<_, ContentItem>(
        "SELECT id, collection, slug, data, published, created_by, updated_by, created_at, updated_at \
         FROM content_items WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let users = batch_users_for_content(&state.db, std::slice::from_ref(&row)).await;
    let creator = row
        .created_by
        .as_ref()
        .and_then(|id| users.get(id).cloned());
    let updater = row
        .updated_by
        .as_ref()
        .and_then(|id| users.get(id).cloned());
    let mut out: ContentItemOut = row.into();
    out.creator = creator;
    out.updater = updater;

    Ok((StatusCode::CREATED, Json(out)))
}

pub async fn update_item(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((collection, slug)): Path<(String, String)>,
    Json(payload): Json<UpsertRequest>,
) -> Result<Json<ContentItemOut>, Response> {
    require_admin_or_editor(&claims)?;
    require_mutable(&collection)?;
    require_collection(&collection)?;
    schemas::validate_data(&collection, &payload.data)
        .map_err(|e| error_response(StatusCode::BAD_REQUEST, e))?;

    let existing: Option<ContentItem> = sqlx::query_as::<_, ContentItem>(
        "SELECT id, collection, slug, data, published, created_by, updated_by, created_at, updated_at \
         FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
    )
    .bind(&collection)
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let row = match existing {
        Some(r) => r,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Item no encontrado".to_string(),
            ))
        }
    };

    // Validar código único por colección (excluyendo el item actual)
    if let Some(codigo) = payload.data.get("codigo").and_then(|v| v.as_str()) {
        if !codigo.is_empty() {
            let code_exists: Option<(String,)> =
                sqlx::query_as(
                    "SELECT id FROM content_items WHERE collection = ? AND json_extract(data, '$.codigo') = ? AND id != ? AND deleted_at IS NULL",
                )
                .bind(&collection)
                .bind(codigo)
                .bind(&row.id)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?;
            if code_exists.is_some() {
                return Err(error_response(
                    StatusCode::CONFLICT,
                    format!(
                        "Ya existe otro item con el código '{}' en la colección '{}'",
                        codigo, collection
                    ),
                ));
            }
        }
    }

    let data_str = serde_json::to_string(&payload.data).unwrap_or_else(|_| "{}".to_string());
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "UPDATE content_items SET data = ?, published = ?, updated_by = ?, updated_at = ? WHERE id = ?",
    )
    .bind(&data_str)
    .bind(if payload.published { 1 } else { 0 })
    .bind(&claims.sub)
    .bind(&now)
    .bind(&row.id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    audit_content(
        &state.db,
        Some(&row.id),
        &collection,
        Some(&slug),
        "updated",
        &claims,
        Some(&format!("published={}", payload.published)),
    )
    .await;

    get_item(
        State(state),
        Extension(Claims {
            sub: claims.sub.clone(),
            email: claims.email.clone(),
            role: claims.role.clone(),
            exp: claims.exp,
        }),
        Path((collection, slug)),
    )
    .await
}

#[derive(Debug, Deserialize)]
pub struct PublishRequest {
    pub published: bool,
}

pub async fn set_published(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((collection, slug)): Path<(String, String)>,
    Json(payload): Json<PublishRequest>,
) -> Result<StatusCode, Response> {
    require_admin_or_editor(&claims)?;
    require_mutable(&collection)?;
    require_collection(&collection)?;

    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let result = sqlx::query(
        "UPDATE content_items SET published = ?, updated_by = ?, updated_at = ? \
         WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
    )
    .bind(if payload.published { 1 } else { 0 })
    .bind(&claims.sub)
    .bind(&now)
    .bind(&collection)
    .bind(&slug)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Item no encontrado".to_string(),
        ));
    }

    audit_content(
        &state.db,
        None,
        &collection,
        Some(&slug),
        if payload.published {
            "published"
        } else {
            "unpublished"
        },
        &claims,
        None,
    )
    .await;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete_item(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((collection, slug)): Path<(String, String)>,
) -> Result<StatusCode, Response> {
    require_admin_or_editor(&claims)?;
    require_mutable(&collection)?;
    require_collection(&collection)?;

    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let result = sqlx::query(
        "UPDATE content_items SET deleted_at = ? WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
    )
    .bind(&now)
    .bind(&collection)
    .bind(&slug)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Item no encontrado".to_string(),
        ));
    }

    audit_content(
        &state.db,
        None,
        &collection,
        Some(&slug),
        "deleted",
        &claims,
        None,
    )
    .await;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn duplicate_item(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path((collection, slug)): Path<(String, String)>,
) -> Result<(StatusCode, Json<ContentItemOut>), Response> {
    require_admin_or_editor(&claims)?;
    require_mutable(&collection)?;
    require_collection(&collection)?;

    let row: Option<ContentItem> = sqlx::query_as::<_, ContentItem>(
        "SELECT id, collection, slug, data, published, created_by, updated_by, created_at, updated_at \
         FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
    )
    .bind(&collection)
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let row = match row {
        Some(r) => r,
        None => {
            return Err(error_response(
                StatusCode::NOT_FOUND,
                "Item no encontrado".to_string(),
            ))
        }
    };

    // Generar slug único
    let new_slug = format!("{}-copy", row.slug);
    let mut final_slug = new_slug.clone();
    let mut counter = 1;
    loop {
        let exists: Option<(String,)> = sqlx::query_as(
            "SELECT id FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
        )
        .bind(&collection)
        .bind(&final_slug)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
        if exists.is_none() {
            break;
        }
        counter += 1;
        final_slug = format!("{}-copy-{}", row.slug, counter);
    }

    let new_id = Uuid::new_v4().to_string();
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO content_items (id, collection, slug, data, published, created_by, updated_by, created_at, updated_at) \
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)",
    )
    .bind(&new_id)
    .bind(&collection)
    .bind(&final_slug)
    .bind(&row.data)
    .bind(&claims.sub)
    .bind(&claims.sub)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    audit_content(
        &state.db,
        Some(&new_id),
        &collection,
        Some(&final_slug),
        "duplicated",
        &claims,
        Some(&format!("from={}", slug)),
    )
    .await;

    get_item(
        State(state),
        Extension(Claims {
            sub: claims.sub.clone(),
            email: claims.email.clone(),
            role: claims.role.clone(),
            exp: claims.exp,
        }),
        Path((collection, final_slug.clone())),
    )
    .await
    .map(|json| (StatusCode::CREATED, json))
}

/// Fila de auditoría de contenido (ver `list_audit`). Alias para el lint `type_complexity` de CI.
type ContentAuditRow = (
    String,
    Option<String>,
    String,
    Option<String>,
    String,
    Option<String>,
    Option<String>,
    String,
    Option<String>,
);

pub async fn list_audit(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, Response> {
    require_admin(&claims)?;
    let collection = params.get("collection").cloned().unwrap_or_default();
    let limit = params
        .get("limit")
        .and_then(|v| v.parse().ok())
        .unwrap_or(100)
        .clamp(1, 500);

    let rows: Vec<ContentAuditRow> = if collection.is_empty() {
        sqlx::query_as(
            "SELECT a.id, a.content_id, a.collection, a.slug, a.action, a.actor_id, a.details, a.created_at, u.name \
             FROM content_audit a LEFT JOIN users u ON u.id = a.actor_id \
             ORDER BY a.created_at DESC LIMIT ?"
        )
        .bind(limit)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as(
            "SELECT a.id, a.content_id, a.collection, a.slug, a.action, a.actor_id, a.details, a.created_at, u.name \
             FROM content_audit a LEFT JOIN users u ON u.id = a.actor_id \
             WHERE a.collection = ? ORDER BY a.created_at DESC LIMIT ?"
        )
        .bind(&collection)
        .bind(limit)
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let items: Vec<serde_json::Value> = rows
        .into_iter()
        .map(
            |(id, content_id, coll, slug, action, actor_id, details, created_at, actor_name)| {
                serde_json::json!({
                    "id": id,
                    "content_id": content_id,
                    "collection": coll,
                    "slug": slug,
                    "action": action,
                    "actor_id": actor_id,
                    "actor_name": actor_name,
                    "details": details,
                    "created_at": created_at,
                })
            },
        )
        .collect();

    Ok(Json(serde_json::json!({ "items": items })))
}

pub async fn get_schema(
    Path(collection): Path<String>,
    Extension(_claims): Extension<Claims>,
) -> Result<Json<Vec<FieldDef>>, Response> {
    let fields = schemas::schema_for(&collection).ok_or_else(|| {
        error_response(
            StatusCode::NOT_FOUND,
            format!("Colección '{}' no encontrada", collection),
        )
    })?;
    Ok(Json(fields))
}

// ============================================================================
// Helpers
// ============================================================================

fn require_collection(ruta: &str) -> Result<(), Response> {
    if schemas::schema_for(ruta).is_some() {
        Ok(())
    } else {
        Err(error_response(
            StatusCode::NOT_FOUND,
            format!("Colección '{}' no soportada", ruta),
        ))
    }
}

async fn batch_users_for_content(
    db: &SqlitePool,
    rows: &[ContentItem],
) -> std::collections::HashMap<String, PublicUser> {
    let mut ids: Vec<String> = Vec::new();
    for r in rows {
        if let Some(c) = &r.created_by {
            ids.push(c.clone());
        }
        if let Some(u) = &r.updated_by {
            ids.push(u.clone());
        }
    }
    ids.sort();
    ids.dedup();
    if ids.is_empty() {
        return std::collections::HashMap::new();
    }

    let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!(
        "SELECT id, name, email, password_hash, role, avatar_color, created_at, active \
         FROM users WHERE id IN ({})",
        placeholders
    );
    let mut q = sqlx::query_as::<_, crate::models::User>(&sql);
    for id in &ids {
        q = q.bind(id);
    }
    let users: Vec<crate::models::User> = q.fetch_all(db).await.unwrap_or_default();

    users
        .into_iter()
        .map(|u| (u.id.clone(), u.into()))
        .collect()
}

async fn audit_content(
    db: &SqlitePool,
    content_id: Option<&str>,
    collection: &str,
    slug: Option<&str>,
    action: &str,
    actor: &Claims,
    details: Option<&str>,
) {
    let id = Uuid::new_v4().to_string();
    let _ = sqlx::query(
        "INSERT INTO content_audit (id, content_id, collection, slug, action, actor_id, details) \
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(content_id)
    .bind(collection)
    .bind(slug)
    .bind(action)
    .bind(&actor.sub)
    .bind(details)
    .execute(db)
    .await;

    tracing::info!(
        target: "content_audit",
        content_id = ?content_id,
        collection = %collection,
        slug = ?slug,
        action = %action,
        actor_id = %actor.sub,
        details = ?details,
        "content audit"
    );
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{get, post},
    };

    axum::Router::new()
        .route("/api/content/collections", get(list_collections))
        .route("/api/content/audit", get(list_audit))
        .route("/api/content/schemas/:collection", get(get_schema))
        .route(
            "/api/content/:collection",
            get(list_items).post(create_item),
        )
        .route(
            "/api/content/:collection/:slug",
            get(get_item)
                .patch(update_item)
                .put(update_item)
                .delete(delete_item),
        )
        .route(
            "/api/content/:collection/:slug/publish",
            post(set_published),
        )
        .route(
            "/api/content/:collection/:slug/duplicate",
            post(duplicate_item),
        )
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
