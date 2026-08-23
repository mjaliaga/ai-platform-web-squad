-- Índices compuestos para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_tasks_status_deleted ON tasks(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_deleted ON tasks(assignee_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_status ON tasks(sprint_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_status ON tasks(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activity_task_created ON activity_log(task_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id, logged_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id) WHERE deleted_at IS NULL;