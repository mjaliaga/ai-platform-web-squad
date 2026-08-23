-- Add soft delete columns to main tables
ALTER TABLE users ADD COLUMN deleted_at TEXT;
ALTER TABLE tasks ADD COLUMN deleted_at TEXT;
ALTER TABLE projects ADD COLUMN deleted_at TEXT;
ALTER TABLE sprints ADD COLUMN deleted_at TEXT;
ALTER TABLE comments ADD COLUMN deleted_at TEXT;
ALTER TABLE attachments ADD COLUMN deleted_at TEXT;
ALTER TABLE time_entries ADD COLUMN deleted_at TEXT;
ALTER TABLE notifications ADD COLUMN deleted_at TEXT;
ALTER TABLE activity_log ADD COLUMN deleted_at TEXT;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sprints_deleted_at ON sprints(deleted_at);

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id TEXT PRIMARY KEY NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT,
    actor_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    success INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_actor ON security_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_event ON security_audit_log(event_type);