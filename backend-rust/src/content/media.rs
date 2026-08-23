use axum::{
    extract::{Extension, Multipart, Path, State},
    http::StatusCode,
    response::{Response, Json},
};
use chrono::Utc;
use std::sync::Arc;
use uuid::Uuid;

use crate::middleware::auth::require_auth;
use crate::models::{Claims, ContentMedia, ContentMediaOut};
use crate::validation::{error_response, internal_error, require_admin_or_editor};
use crate::AppState;

const ALLOWED_IMAGE_TYPES: &[&str] = &["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const ALLOWED_VIDEO_TYPES: &[&str] = &["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_DOC_TYPES: &[&str] = &["application/pdf"];
const MAX_BYTES: usize = 25 * 1024 * 1024; // 25 MB

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

fn classify_mime(mime: &str) -> Result<&'static str, String> {
    if ALLOWED_IMAGE_TYPES.contains(&mime) {
        Ok("image")
    } else if ALLOWED_VIDEO_TYPES.contains(&mime) {
        Ok("video")
    } else if ALLOWED_DOC_TYPES.contains(&mime) {
        Ok("document")
    } else {
        Err(format!("Tipo MIME no permitido: {}", mime))
    }
}

pub async fn upload_media(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<ContentMediaOut>), Response> {
    require_admin_or_editor(&claims)?;

    let upload_dir = std::env::var("MEDIA_DIR")
        .unwrap_or_else(|_| "data/media".to_string());
    std::fs::create_dir_all(&upload_dir).ok();

    let mut filename = String::new();
    let mut mime_type: Option<String> = None;
    let mut alt_text: Option<String> = None;
    let mut bytes: Option<Vec<u8>> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| error_response(StatusCode::BAD_REQUEST, format!("multipart error: {e}")))?
    {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "file" => {
                filename = field.file_name().unwrap_or("upload").to_string();
                mime_type = field.content_type().map(|m| m.to_string());
                let data = field
                    .bytes()
                    .await
                    .map_err(|e| error_response(StatusCode::BAD_REQUEST, format!("read error: {e}")))?;
                bytes = Some(data.to_vec());
            }
            "alt" => {
                let v = field
                    .text()
                    .await
                    .map_err(|e| error_response(StatusCode::BAD_REQUEST, format!("read error: {e}")))?;
                alt_text = Some(v);
            }
            _ => {
                let _ = field.bytes().await;
            }
        }
    }

    let bytes = bytes.ok_or_else(|| error_response(StatusCode::BAD_REQUEST, "Falta el archivo".to_string()))?;
    let mime = mime_type.ok_or_else(|| error_response(StatusCode::BAD_REQUEST, "Falta mime type".to_string()))?;
    let kind = classify_mime(&mime).map_err(|e| error_response(StatusCode::BAD_REQUEST, e))?;

    if bytes.is_empty() {
        return Err(error_response(StatusCode::BAD_REQUEST, "Archivo vacío".to_string()));
    }
    if bytes.len() > MAX_BYTES {
        return Err(error_response(
            StatusCode::PAYLOAD_TOO_LARGE,
            format!("El archivo supera {} MB", MAX_BYTES / (1024 * 1024)),
        ));
    }

    let id = Uuid::new_v4().to_string();
    let extension = std::path::Path::new(&filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    let stored_name = if extension.is_empty() {
        format!("{id}_{}", sanitize_filename(&filename))
    } else {
        format!("{id}_{}.{}", sanitize_filename(filename.trim_end_matches(&format!(".{extension}"))), extension)
    };
    let stored_path = format!("{}/{}", upload_dir, stored_name);

    std::fs::write(&stored_path, &bytes)
        .map_err(|e| internal_error(&format!("write error: {e}")))?;

    // Dimensiones si es imagen
    let (width, height) = if kind == "image" && mime != "image/svg+xml" {
        image_dimensions(&bytes).unwrap_or((None, None))
    } else {
        (None, None)
    };

    let size_bytes = bytes.len() as i64;
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO content_media (id, filename, stored_path, mime_type, size_bytes, width, height, alt_text, uploaded_by, created_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&stored_name)
    .bind(&stored_path)
    .bind(&mime)
    .bind(size_bytes)
    .bind(width)
    .bind(height)
    .bind(&alt_text)
    .bind(&claims.sub)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let media: ContentMedia = sqlx::query_as::<_, ContentMedia>(
        "SELECT id, filename, stored_path, mime_type, size_bytes, width, height, alt_text, uploaded_by, created_at \
         FROM content_media WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let uploader = crate::routes::tasks::batch_users(&state.db, &[claims.sub.as_str()])
        .await
        .get(&claims.sub)
        .cloned();

    Ok((StatusCode::CREATED, Json(media.to_out(uploader))))
}

pub async fn list_media(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, Response> {
    require_admin_or_editor(&claims)?;

    let limit = params
        .get("limit")
        .and_then(|v| v.parse().ok())
        .unwrap_or(50)
        .clamp(1, 200);
    let offset = params
        .get("offset")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0)
        .max(0);
    let kind_filter = params.get("kind").cloned();

    let rows: Vec<ContentMedia> = sqlx::query_as::<_, ContentMedia>(
        "SELECT id, filename, stored_path, mime_type, size_bytes, width, height, alt_text, uploaded_by, created_at \
         FROM content_media WHERE deleted_at IS NULL \
         ORDER BY created_at DESC LIMIT ? OFFSET ?",
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM content_media WHERE deleted_at IS NULL",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let filtered: Vec<ContentMedia> = if let Some(k) = kind_filter {
        rows.into_iter()
            .filter(|m| {
                let mime = m.mime_type.as_deref().unwrap_or("");
                match k.as_str() {
                    "image" => ALLOWED_IMAGE_TYPES.contains(&mime),
                    "video" => ALLOWED_VIDEO_TYPES.contains(&mime),
                    "document" => ALLOWED_DOC_TYPES.contains(&mime),
                    _ => true,
                }
            })
            .collect()
    } else {
        rows
    };

    let user_ids: Vec<&str> = filtered.iter().filter_map(|m| m.uploaded_by.as_deref()).collect();
    let users = crate::routes::tasks::batch_users(&state.db, &user_ids).await;

    let items: Vec<ContentMediaOut> = filtered
        .into_iter()
        .map(|m| {
            let uploader = m.uploaded_by.as_ref().and_then(|id| users.get(id).cloned());
            m.to_out(uploader)
        })
        .collect();

    Ok(Json(serde_json::json!({
        "items": items,
        "total": total.0,
        "limit": limit,
        "offset": offset,
    })))
}

pub async fn delete_media(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    require_admin_or_editor(&claims)?;

    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let result = sqlx::query(
        "UPDATE content_media SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
    )
    .bind(&now)
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    if result.rows_affected() == 0 {
        return Err(error_response(StatusCode::NOT_FOUND, "Archivo no encontrado".to_string()));
    }

    tracing::info!(target: "media_audit", actor_id = %claims.sub, media_id = %id, "media deleted");
    Ok(StatusCode::NO_CONTENT)
}

pub async fn update_media(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ContentMediaOut>, Response> {
    require_admin_or_editor(&claims)?;
    let alt = payload
        .get("alt_text")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    sqlx::query("UPDATE content_media SET alt_text = ? WHERE id = ? AND deleted_at IS NULL")
        .bind(&alt)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let media: ContentMedia = sqlx::query_as::<_, ContentMedia>(
        "SELECT id, filename, stored_path, mime_type, size_bytes, width, height, alt_text, uploaded_by, created_at \
         FROM content_media WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let user_ids: Vec<&str> = media.uploaded_by.as_deref().into_iter().collect();
    let users = crate::routes::tasks::batch_users(&state.db, &user_ids).await;
    let uploader = media.uploaded_by.as_ref().and_then(|id| users.get(id).cloned());
    Ok(Json(media.to_out(uploader)))
}

/// Detecta dimensiones leyendo el header de PNG/JPEG/WebP.
/// Devuelve `None` si no se puede determinar.
fn image_dimensions(bytes: &[u8]) -> Result<(Option<i32>, Option<i32>), ()> {
    if bytes.len() < 24 {
        return Err(());
    }
    // PNG
    if bytes.starts_with(&[0x89, b'P', b'N', b'G', 0x0d, 0x0a, 0x1a, 0x0a]) {
        let w = u32::from_be_bytes([bytes[16], bytes[17], bytes[18], bytes[19]]);
        let h = u32::from_be_bytes([bytes[20], bytes[21], bytes[22], bytes[23]]);
        return Ok((Some(w as i32), Some(h as i32)));
    }
    // JPEG
    if bytes.starts_with(&[0xff, 0xd8, 0xff]) {
        let mut i = 2;
        while i + 9 < bytes.len() {
            if bytes[i] != 0xff {
                return Err(());
            }
            let marker = bytes[i + 1];
            i += 2;
            if marker == 0xd8 || marker == 0xd9 || (0xd0..=0xd7).contains(&marker) {
                continue;
            }
            let seg_len = u16::from_be_bytes([bytes[i], bytes[i + 1]]) as usize;
            if marker == 0xc0 || marker == 0xc1 || marker == 0xc2 {
                let h = u16::from_be_bytes([bytes[i + 4], bytes[i + 5]]) as i32;
                let w = u16::from_be_bytes([bytes[i + 6], bytes[i + 7]]) as i32;
                return Ok((Some(w), Some(h)));
            }
            i += seg_len;
        }
    }
    // WebP
    if bytes.starts_with(b"RIFF") && bytes.len() > 16 && &bytes[8..12] == b"WEBP" {
        if &bytes[12..16] == b"VP8 " {
            let h = u16::from_le_bytes([bytes[25], bytes[26]]) as i32 & 0x3fff;
            let w = u16::from_le_bytes([bytes[27], bytes[28]]) as i32 & 0x3fff;
            return Ok((Some(w), Some(h)));
        }
        if &bytes[12..16] == b"VP8L" {
            let b0 = bytes[21] as i32;
            let b1 = bytes[22] as i32;
            let b2 = bytes[23] as i32;
            let b3 = bytes[24] as i32;
            let w = (b0 | ((b1 & 0x3f) << 8)) + 1;
            let h = (((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10))) + 1;
            return Ok((Some(w), Some(h)));
        }
    }
    Err(())
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{middleware, routing::{delete, get, patch}};

    axum::Router::new()
        .route("/api/media", get(list_media).post(upload_media))
        .route("/api/media/:id", patch(update_media).delete(delete_media))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}
