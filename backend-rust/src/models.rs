use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub avatar_color: Option<String>,
    pub created_at: String,
    pub active: i32,
    #[sqlx(default)]
    pub phone: Option<String>,
    #[sqlx(default)]
    pub linkedin: Option<String>,
    #[sqlx(default)]
    pub github: Option<String>,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicUser {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub avatar_color: Option<String>,
    pub active: i32,
    pub created_at: Option<String>,
    pub phone: Option<String>,
    pub linkedin: Option<String>,
    pub github: Option<String>,
}

impl From<User> for PublicUser {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar_color: u.avatar_color,
            active: u.active,
            created_at: Some(u.created_at),
            phone: u.phone,
            linkedin: u.linkedin,
            github: u.github,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Task {
    pub id: String,
    pub code: String,
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub task_type: String,
    pub status: String,
    pub priority: String,
    pub assignee_id: Option<String>,
    pub reporter_id: String,
    pub parent_id: Option<String>,
    pub epic_id: Option<String>,
    pub sprint_id: Option<String>,
    pub project_id: Option<String>,
    pub estimate_hours: Option<f64>,
    pub time_spent_hours: f64,
    pub due_date: Option<String>,
    pub deliverable: String,
    pub position: i32,
    pub created_at: String,
    pub updated_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
    #[sqlx(default)]
    pub story_points: Option<i64>,
    #[sqlx(default)]
    pub resolution: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Sprint {
    pub id: String,
    pub name: String,
    pub goal: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub is_active: i32,
    pub project_id: Option<String>,
    pub risks: String,
    pub team_dependencies: String,
    pub third_party_dependencies: String,
    pub created_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub color: String,
    pub status: String,
    pub sector: String,
    pub code: String,
    pub po_user_id: Option<String>,
    pub created_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
    // CMS fields
    #[sqlx(default)]
    pub slug: Option<String>,
    #[sqlx(default)]
    pub published: Option<i64>,
    #[sqlx(default)]
    pub reservado: Option<i64>,
    #[sqlx(default)]
    pub tipo: Option<String>,
    #[sqlx(default)]
    pub version: Option<String>,
    #[sqlx(default)]
    pub tipo_solucion: Option<String>,
    #[sqlx(default)]
    pub cliente: Option<String>,
    #[sqlx(default)]
    pub nombre_comercial: Option<String>,
    #[sqlx(default)]
    pub descripcion_larga: Option<String>,
    #[sqlx(default)]
    pub equipo: Option<String>,
    #[sqlx(default)]
    pub stack: Option<String>,
    #[sqlx(default)]
    pub problemas: Option<String>,
    #[sqlx(default)]
    pub que_hicimos: Option<String>,
    #[sqlx(default)]
    pub resultados: Option<String>,
    #[sqlx(default)]
    pub highlights: Option<String>,
    #[sqlx(default)]
    pub galeria: Option<String>,
    #[sqlx(default)]
    pub video_promocional: Option<String>,
    #[sqlx(default)]
    pub video_tecnico: Option<String>,
    #[sqlx(default)]
    pub documento_drive: Option<String>,
    #[sqlx(default)]
    pub documentacion: Option<String>,
    #[sqlx(default)]
    pub url_proyecto: Option<String>,
    #[sqlx(default)]
    pub video_placeholder: Option<i64>,
    #[sqlx(default)]
    pub updated_at: Option<String>,
    #[sqlx(default)]
    pub categoria: Option<String>,
    #[sqlx(default)]
    pub stage: Option<String>,
    #[sqlx(default)]
    pub portfolio_data: Option<String>,
    #[sqlx(default)]
    pub sponsor_id: Option<String>,
    #[sqlx(default)]
    pub tipo_proyecto: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectWithStats {
    #[serde(flatten)]
    pub project: Project,
    pub task_count: i64,
    pub done_count: i64,
    pub members: Vec<ProjectMemberWithUser>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectMember {
    pub project_id: String,
    pub user_id: String,
    pub role: String,
    pub joined_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectMemberWithUser {
    pub user_id: String,
    pub role: String,
    pub name: String,
    pub email: String,
    pub avatar_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TimeEntry {
    pub id: String,
    pub task_id: String,
    pub user_id: String,
    pub hours: f64,
    pub description: Option<String>,
    pub logged_at: String,
    pub created_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: String,
    pub user_id: String,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub task_id: Option<String>,
    pub actor_id: Option<String>,
    pub message: String,
    pub is_read: i32,
    pub created_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationWithActor {
    #[serde(flatten)]
    pub notification: Notification,
    pub actor: Option<PublicUser>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyRef {
    pub id: String,
    pub code: String,
    pub title: String,
    pub status: String,
    #[serde(rename = "type")]
    pub task_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeEntryWithUser {
    #[serde(flatten)]
    pub entry: TimeEntry,
    pub user: PublicUser,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Comment {
    pub id: String,
    pub task_id: String,
    pub author_id: String,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Attachment {
    pub id: String,
    pub task_id: String,
    pub uploader_id: String,
    pub filename: String,
    pub stored_path: String,
    pub mime_type: Option<String>,
    pub size_bytes: i64,
    pub created_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ActivityLog {
    pub id: String,
    pub task_id: String,
    pub user_id: String,
    pub action: String,
    pub field_changed: Option<String>,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub exp: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskWithDetails {
    #[serde(flatten)]
    pub task: Task,
    pub assignee: Option<PublicUser>,
    pub reporter: PublicUser,
    pub labels: Vec<String>,
    pub subtask_count: i64,
    pub completed_subtask_count: i64,
    pub comment_count: i64,
    pub attachment_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentWithAuthor {
    #[serde(flatten)]
    pub comment: Comment,
    pub author: PublicUser,
    pub mentions: Vec<PublicUser>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityWithUser {
    #[serde(flatten)]
    pub activity: ActivityLog,
    pub user: PublicUser,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentWithUploader {
    #[serde(flatten)]
    pub attachment: Attachment,
    pub uploader: PublicUser,
}

#[derive(Debug, Clone, Serialize)]
pub struct DashboardStats {
    pub total_tasks: i64,
    pub by_status: Vec<StatusCount>,
    pub by_priority: Vec<PriorityCount>,
    pub by_assignee: Vec<AssigneeCount>,
    pub upcoming_due: Vec<Task>,
    pub recent_activity: Vec<ActivityWithUser>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct PriorityCount {
    pub priority: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct AssigneeCount {
    pub assignee_id: Option<String>,
    pub assignee_name: Option<String>,
    pub count: i64,
}

// ============================================================================
// Tickets — Zona de Tickets asociada a portfolio
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Ticket {
    pub id: String,
    pub code: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub level: i64,
    pub category: Option<String>,
    pub project_id: String,
    pub reporter_id: String,
    pub assignee_id: Option<String>,
    pub due_date: Option<String>,
    pub resolution: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub closed_at: Option<String>,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketWithDetails {
    #[serde(flatten)]
    pub ticket: Ticket,
    pub reporter: PublicUser,
    pub assignee: Option<PublicUser>,
    pub project_name: Option<String>,
    pub project_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TicketLevelConfig {
    pub level: i64,
    pub user_id: String,
    pub updated_by: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketLevelConfigWithUser {
    pub level: i64,
    pub user_id: String,
    pub user_name: String,
    pub user_email: String,
    pub updated_by: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TicketActivity {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub action: String,
    pub field_changed: Option<String>,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketActivityWithUser {
    #[serde(flatten)]
    pub activity: TicketActivity,
    pub user: PublicUser,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TicketComment {
    pub id: String,
    pub ticket_id: String,
    pub author_id: String,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketCommentWithAuthor {
    #[serde(flatten)]
    pub comment: TicketComment,
    pub author: PublicUser,
}

// ============================================================================
// CMS de Contenido Público
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ContentItem {
    pub id: String,
    pub collection: String,
    pub slug: String,
    pub data: String,
    pub published: i32,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentItemOut {
    pub id: String,
    pub collection: String,
    pub slug: String,
    pub data: serde_json::Value,
    pub published: bool,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub creator: Option<PublicUser>,
    pub updater: Option<PublicUser>,
}

impl From<ContentItem> for ContentItemOut {
    fn from(item: ContentItem) -> Self {
        let data: serde_json::Value =
            serde_json::from_str(&item.data).unwrap_or_else(|_| serde_json::json!({}));
        Self {
            id: item.id,
            collection: item.collection,
            slug: item.slug,
            data,
            published: item.published != 0,
            created_by: item.created_by,
            updated_by: item.updated_by,
            created_at: item.created_at,
            updated_at: item.updated_at,
            creator: None,
            updater: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ContentMedia {
    pub id: String,
    pub filename: String,
    pub stored_path: String,
    pub mime_type: Option<String>,
    pub size_bytes: i64,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub alt_text: Option<String>,
    pub uploaded_by: Option<String>,
    pub created_at: String,
    #[sqlx(default)]
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ContentMediaOut {
    pub id: String,
    pub filename: String,
    pub url: String,
    pub mime_type: Option<String>,
    pub size_bytes: i64,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub alt_text: Option<String>,
    pub uploader: Option<PublicUser>,
    pub created_at: String,
}

impl ContentMedia {
    pub fn to_out(self, uploader: Option<PublicUser>) -> ContentMediaOut {
        // Las imágenes del CMS se sirven bajo /cms-media/ para no chocar con
        // las imágenes estáticas del sitio público que viven en /media/.
        let url = format!("/cms-media/{}", self.filename);
        ContentMediaOut {
            id: self.id,
            filename: self.filename,
            url,
            mime_type: self.mime_type,
            size_bytes: self.size_bytes,
            width: self.width,
            height: self.height,
            alt_text: self.alt_text,
            uploader,
            created_at: self.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct CollectionInfo {
    pub ruta: String,
    pub nombre: String,
    pub titulo: String,
    pub intro: String,
    pub campos: Vec<FieldDef>,
    pub total_items: i64,
    pub total_publicados: i64,
    pub total_borradores: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FieldDef {
    pub key: String,
    pub label: String,
    pub tipo: String,
    pub requerido: bool,
    pub descripcion: Option<String>,
    pub placeholder: Option<String>,
    pub opciones: Option<Vec<FieldOption>>,
    pub item_label: Option<String>,
    pub item_fields: Option<Vec<FieldDef>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FieldOption {
    pub value: String,
    pub label: String,
}

#[allow(dead_code)]
pub type DateTimeUtc = DateTime<Utc>;
