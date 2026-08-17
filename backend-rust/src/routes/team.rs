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
use crate::models::{Claims, PublicUser};
use crate::validation::{
    error_response, internal_error, require_admin, validate_required,
};
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Announcement {
    pub id: String,
    pub author_id: String,
    pub title: String,
    pub body: String,
    pub pinned: i32,
    pub project_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnouncementWithAuthor {
    #[serde(flatten)]
    pub announcement: Announcement,
    pub author: PublicUser,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WikiPage {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub body: String,
    pub author_id: String,
    pub project_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WikiPageWithAuthor {
    #[serde(flatten)]
    pub page: WikiPage,
    pub author: PublicUser,
}

pub async fn list_announcements(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<AnnouncementWithAuthor>>, Response> {
    let (sql, binds): (String, Vec<String>) = if let Some(pid) = params.get("project") {
        // Verify membership (admin bypasses)
        if claims.role != "admin" {
            let member: Option<(String,)> = sqlx::query_as(
                "SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?"
            )
            .bind(pid)
            .bind(&claims.sub)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| internal_error(&format!("db error: {e}")))?;
            if member.is_none() {
                return Err(error_response(
                    StatusCode::FORBIDDEN,
                    "No eres miembro de este proyecto".to_string(),
                ));
            }
        }
        (
            "SELECT id, author_id, title, body, pinned, project_id, created_at FROM announcements \
             WHERE project_id = ? ORDER BY pinned DESC, created_at DESC LIMIT 50"
                .to_string(),
            vec![pid.clone()],
        )
    } else {
        (
            "SELECT id, author_id, title, body, pinned, project_id, created_at FROM announcements \
             WHERE project_id IS NULL ORDER BY pinned DESC, created_at DESC LIMIT 50"
                .to_string(),
            vec![],
        )
    };

    let mut q = sqlx::query_as::<_, Announcement>(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    let rows: Vec<Announcement> = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let author_ids: Vec<&str> = rows.iter().map(|a| a.author_id.as_str()).collect();
    let authors = crate::routes::tasks::batch_users(&state.db, &author_ids).await;

    let mut result = Vec::with_capacity(rows.len());
    for a in rows {
        let author = authors.get(&a.author_id).cloned().unwrap_or_else(|| PublicUser {
            id: a.author_id.clone(),
            name: "Desconocido".to_string(),
            email: String::new(),
            role: "member".to_string(),
            avatar_color: None,
            active: 1,
            created_at: None,
            phone: None,
            linkedin: None,
            github: None,
        });
        result.push(AnnouncementWithAuthor {
            announcement: a,
            author,
        });
    }

    Ok(Json(result))
}

#[derive(Debug, Deserialize)]
pub struct CreateAnnouncementRequest {
    pub title: String,
    pub body: String,
    #[serde(default)]
    pub pinned: Option<i32>,
    #[serde(default)]
    pub project_id: Option<String>,
}

pub async fn create_announcement(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateAnnouncementRequest>,
) -> Result<(StatusCode, Json<Announcement>), Response> {
    validate_required("title", &payload.title, 200)?;
    validate_required("body", &payload.body, 10000)?;

    let id = Uuid::new_v4().to_string();
    let pinned = if payload.pinned.unwrap_or(0) == 1 { 1 } else { 0 };

    sqlx::query(
        "INSERT INTO announcements (id, author_id, title, body, pinned, project_id) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&claims.sub)
    .bind(&payload.title)
    .bind(&payload.body)
    .bind(pinned)
    .bind(&payload.project_id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let row = sqlx::query_as::<_, Announcement>(
        "SELECT id, author_id, title, body, pinned, project_id, created_at FROM announcements WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(row)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateAnnouncementRequest {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub pinned: Option<i32>,
}

async fn can_edit_announcement(
    db: &sqlx::SqlitePool,
    id: &str,
    claims: &Claims,
) -> Result<Announcement, Response> {
    let row: Option<Announcement> = sqlx::query_as::<_, Announcement>(
        "SELECT id, author_id, title, body, pinned, project_id, created_at FROM announcements WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match row {
        Some(a) => {
            if a.author_id == claims.sub || claims.role == "admin" {
                Ok(a)
            } else {
                Err(error_response(
                    StatusCode::FORBIDDEN,
                    "No tienes permisos para editar este anuncio".to_string(),
                ))
            }
        }
        None => Err(error_response(
            StatusCode::NOT_FOUND,
            "Anuncio no encontrado".to_string(),
        )),
    }
}

pub async fn update_announcement(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateAnnouncementRequest>,
) -> Result<Json<Announcement>, Response> {
    if let Some(title) = &payload.title {
        validate_required("title", title, 200)?;
    }
    if let Some(body) = &payload.body {
        validate_required("body", body, 10000)?;
    }

    can_edit_announcement(&state.db, &id, &claims).await?;

    let mut sets: Vec<&str> = Vec::new();
    let mut bindings: Vec<serde_json::Value> = Vec::new();
    if let Some(title) = &payload.title {
        sets.push("title = ?");
        bindings.push(serde_json::json!(title));
    }
    if let Some(body) = &payload.body {
        sets.push("body = ?");
        bindings.push(serde_json::json!(body));
    }
    if let Some(pinned) = payload.pinned {
        sets.push("pinned = ?");
        bindings.push(serde_json::json!(if pinned == 1 { 1 } else { 0 }));
    }

    if !sets.is_empty() {
        let sql = format!("UPDATE announcements SET {} WHERE id = ?", sets.join(", "));
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

    let row = sqlx::query_as::<_, Announcement>(
        "SELECT id, author_id, title, body, pinned, project_id, created_at FROM announcements WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(row))
}

pub async fn delete_announcement(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, Response> {
    can_edit_announcement(&state.db, &id, &claims).await?;

    sqlx::query("DELETE FROM announcements WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_wiki(
    State(state): State<Arc<AppState>>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<WikiPageWithAuthor>>, Response> {
    let (sql, binds): (String, Vec<String>) = if let Some(pid) = params.get("project") {
        (
            "SELECT id, slug, title, body, author_id, project_id, created_at, updated_at FROM wiki_pages \
             WHERE project_id = ? ORDER BY title ASC"
                .to_string(),
            vec![pid.clone()],
        )
    } else {
        (
            "SELECT id, slug, title, body, author_id, project_id, created_at, updated_at FROM wiki_pages \
             ORDER BY title ASC"
                .to_string(),
            vec![],
        )
    };

    let mut q = sqlx::query_as::<_, WikiPage>(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    let rows: Vec<WikiPage> = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let author_ids: Vec<&str> = rows.iter().map(|p| p.author_id.as_str()).collect();
    let authors = crate::routes::tasks::batch_users(&state.db, &author_ids).await;

    let mut result = Vec::with_capacity(rows.len());
    for p in rows {
        let author = authors.get(&p.author_id).cloned().unwrap_or_else(|| PublicUser {
            id: p.author_id.clone(),
            name: "Desconocido".to_string(),
            email: String::new(),
            role: "member".to_string(),
            avatar_color: None,
            active: 1,
            created_at: None,
            phone: None,
            linkedin: None,
            github: None,
        });
        result.push(WikiPageWithAuthor { page: p, author });
    }

    Ok(Json(result))
}

pub async fn get_wiki(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<WikiPageWithAuthor>, Response> {
    let page: Option<WikiPage> = sqlx::query_as::<_, WikiPage>(
        "SELECT id, slug, title, body, author_id, project_id, created_at, updated_at FROM wiki_pages WHERE slug = ?"
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match page {
        Some(p) => {
            let author = crate::routes::tasks::batch_users(&state.db, &[p.author_id.as_str()])
                .await
                .remove(&p.author_id)
                .unwrap_or_else(|| PublicUser {
                    id: p.author_id.clone(),
                    name: "Desconocido".to_string(),
                    email: String::new(),
                    role: "member".to_string(),
                    avatar_color: None,
                    active: 1,
                    created_at: None,
                    phone: None,
                    linkedin: None,
                    github: None,
                });
            Ok(Json(WikiPageWithAuthor { page: p, author }))
        }
        None => Err(error_response(
            StatusCode::NOT_FOUND,
            "Página no encontrada".to_string(),
        )),
    }
}

fn slugify(input: &str) -> String {
    let normalized: String = input
        .trim()
        .to_lowercase()
        .chars()
        .map(|c| match c {
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
            'ü' => 'u',
            'ñ' => 'n',
            'à' => 'a',
            'è' => 'e',
            'ì' => 'i',
            'ò' => 'o',
            'ù' => 'u',
            _ => c,
        })
        .collect();

    let mut slug = String::new();
    let mut prev_dash = false;
    for c in normalized.chars() {
        if c.is_alphanumeric() {
            slug.push(c);
            prev_dash = false;
        } else if !prev_dash && !slug.is_empty() {
            slug.push('-');
            prev_dash = true;
        }
    }
    let slug = slug.trim_matches('-').to_string();
    if slug.is_empty() {
        "pagina".to_string()
    } else {
        slug
    }
}

async fn unique_slug(db: &sqlx::SqlitePool, base: &str, exclude_id: Option<&str>) -> Result<String, Response> {
    let mut candidate = base.to_string();
    let mut n = 1;
    loop {
        let existing: Option<(String,)> = if let Some(id) = exclude_id {
            sqlx::query_as("SELECT id FROM wiki_pages WHERE slug = ? AND id != ?")
                .bind(&candidate)
                .bind(id)
                .fetch_optional(db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?
        } else {
            sqlx::query_as("SELECT id FROM wiki_pages WHERE slug = ?")
                .bind(&candidate)
                .fetch_optional(db)
                .await
                .map_err(|e| internal_error(&format!("db error: {e}")))?
        };
        if existing.is_none() {
            return Ok(candidate);
        }
        n += 1;
        candidate = format!("{base}-{n}");
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateWikiRequest {
    pub title: String,
    pub body: String,
    #[serde(default)]
    pub slug: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
}

pub async fn create_wiki(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateWikiRequest>,
) -> Result<(StatusCode, Json<WikiPage>), Response> {
    validate_required("title", &payload.title, 200)?;
    validate_required("body", &payload.body, 50000)?;

    let base = match &payload.slug {
        Some(s) if !s.trim().is_empty() => slugify(s),
        _ => slugify(&payload.title),
    };
    let slug = unique_slug(&state.db, &base, None).await?;

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO wiki_pages (id, slug, title, body, author_id, project_id) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&slug)
    .bind(&payload.title)
    .bind(&payload.body)
    .bind(&claims.sub)
    .bind(&payload.project_id)
    .execute(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let row = sqlx::query_as::<_, WikiPage>(
        "SELECT id, slug, title, body, author_id, project_id, created_at, updated_at FROM wiki_pages WHERE id = ?"
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok((StatusCode::CREATED, Json(row)))
}

async fn can_edit_wiki(
    db: &sqlx::SqlitePool,
    slug: &str,
    claims: &Claims,
) -> Result<WikiPage, Response> {
    let row: Option<WikiPage> = sqlx::query_as::<_, WikiPage>(
        "SELECT id, slug, title, body, author_id, project_id, created_at, updated_at FROM wiki_pages WHERE slug = ?"
    )
    .bind(slug)
    .fetch_optional(db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    match row {
        Some(p) => {
            if p.author_id == claims.sub || claims.role == "admin" {
                Ok(p)
            } else {
                Err(error_response(
                    StatusCode::FORBIDDEN,
                    "No tienes permisos para editar esta página".to_string(),
                ))
            }
        }
        None => Err(error_response(
            StatusCode::NOT_FOUND,
            "Página no encontrada".to_string(),
        )),
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateWikiRequest {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub slug: Option<String>,
}

pub async fn update_wiki(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(slug): Path<String>,
    Json(payload): Json<UpdateWikiRequest>,
) -> Result<Json<WikiPage>, Response> {
    if let Some(title) = &payload.title {
        validate_required("title", title, 200)?;
    }
    if let Some(body) = &payload.body {
        validate_required("body", body, 50000)?;
    }

    let page = can_edit_wiki(&state.db, &slug, &claims).await?;

    let mut sets: Vec<&str> = Vec::new();
    let mut bindings: Vec<serde_json::Value> = Vec::new();
    if let Some(title) = &payload.title {
        sets.push("title = ?");
        bindings.push(serde_json::json!(title));
    }
    if let Some(body) = &payload.body {
        sets.push("body = ?");
        bindings.push(serde_json::json!(body));
    }
    let new_slug = match &payload.slug {
        Some(s) if !s.trim().is_empty() => Some(unique_slug(&state.db, &slugify(s), Some(&page.id)).await?),
        _ => None,
    };
    if let Some(s) = &new_slug {
        sets.push("slug = ?");
        bindings.push(serde_json::json!(s));
    }
    sets.push("updated_at = datetime('now')");

    let sql = format!("UPDATE wiki_pages SET {} WHERE id = ?", sets.join(", "));
    let mut q = sqlx::query(&sql);
    for b in &bindings {
        if let Some(s) = b.as_str() {
            q = q.bind(s);
        } else if let Some(i) = b.as_i64() {
            q = q.bind(i);
        }
    }
    q = q.bind(&page.id);
    q.execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    let final_slug = new_slug.unwrap_or_else(|| slug.clone());
    let row = sqlx::query_as::<_, WikiPage>(
        "SELECT id, slug, title, body, author_id, project_id, created_at, updated_at FROM wiki_pages WHERE slug = ?"
    )
    .bind(&final_slug)
    .fetch_one(&state.db)
    .await
    .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(Json(row))
}

pub async fn delete_wiki(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(slug): Path<String>,
) -> Result<StatusCode, Response> {
    require_admin(&claims)?;

    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM wiki_pages WHERE slug = ?")
        .bind(&slug)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;
    if exists.is_none() {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            "Página no encontrada".to_string(),
        ));
    }

    sqlx::query("DELETE FROM wiki_pages WHERE slug = ?")
        .bind(&slug)
        .execute(&state.db)
        .await
        .map_err(|e| internal_error(&format!("db error: {e}")))?;

    Ok(StatusCode::NO_CONTENT)
}

#[allow(dead_code)]
pub fn router(state: Arc<AppState>) -> axum::Router {
    use axum::{
        middleware,
        routing::{get, patch},
    };

    axum::Router::new()
        .route("/api/announcements", get(list_announcements).post(create_announcement))
        .route(
            "/api/announcements/:id",
            patch(update_announcement).delete(delete_announcement),
        )
        .route("/api/wiki", get(list_wiki).post(create_wiki))
        .route(
            "/api/wiki/:slug",
            get(get_wiki).patch(update_wiki).delete(delete_wiki),
        )
        .route_layer(middleware::from_fn_with_state(state.clone(), require_auth))
        .with_state(state)
}