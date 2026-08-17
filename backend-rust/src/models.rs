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
    created_at: String,
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

#[allow(dead_code)]
pub type DateTimeUtc = DateTime<Utc>;