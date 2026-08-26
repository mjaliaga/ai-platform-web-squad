-- Migration 024: Workflows engine, transitions, and saved filters
-- This migration adds Jira-like workflow configuration, custom transitions,
-- and saved filters for advanced task querying.

-- 1. Workflows table - defines a workflow (set of statuses + transitions)
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_default INTEGER DEFAULT 0,
    project_id TEXT REFERENCES projects(id),
    created_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- 2. Workflow statuses - statuses defined within a workflow
CREATE TABLE IF NOT EXISTS workflow_statuses (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'todo',  -- todo, in_progress, done
    color TEXT DEFAULT '#6b7280',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 3. Workflow transitions - allowed status changes
CREATE TABLE IF NOT EXISTS workflow_transitions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    from_status_id TEXT REFERENCES workflow_statuses(id),
    to_status_id TEXT NOT NULL REFERENCES workflow_statuses(id),
    requires_role TEXT,  -- comma-separated roles: admin,editor,member
    created_at TEXT DEFAULT (datetime('now'))
);

-- 4. Saved filters - user-saved task queries
CREATE TABLE IF NOT EXISTS saved_filters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query TEXT NOT NULL,  -- JQL-like query string
    is_shared INTEGER DEFAULT 0,
    project_id TEXT REFERENCES projects(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 5. Add workflow_id to projects
ALTER TABLE projects ADD COLUMN workflow_id TEXT REFERENCES workflows(id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_project ON workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_statuses_workflow ON workflow_statuses(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_workflow ON workflow_transitions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_project ON saved_filters(project_id);

-- 7. Seed default workflow
INSERT OR IGNORE INTO workflows (id, name, description, is_default)
VALUES ('default-workflow', 'Default Workflow', 'Workflow por defecto: backlog → todo → in_progress → review → done', 1);

INSERT OR IGNORE INTO workflow_statuses (id, workflow_id, name, category, color, position)
VALUES
    ('wf-backlog', 'default-workflow', 'Backlog', 'todo', '#6b7280', 0),
    ('wf-todo', 'default-workflow', 'Por hacer', 'todo', '#3b82f6', 1),
    ('wf-in-progress', 'default-workflow', 'En progreso', 'in_progress', '#f59e0b', 2),
    ('wf-review', 'default-workflow', 'En revisión', 'in_progress', '#8b5cf6', 3),
    ('wf-done', 'default-workflow', 'Completado', 'done', '#10b981', 4);

INSERT OR IGNORE INTO workflow_transitions (id, workflow_id, name, from_status_id, to_status_id, requires_role)
VALUES
    ('wf-trans-1', 'default-workflow', 'Mover a Por hacer', 'wf-backlog', 'wf-todo', NULL),
    ('wf-trans-2', 'default-workflow', 'Iniciar trabajo', 'wf-todo', 'wf-in-progress', NULL),
    ('wf-trans-3', 'default-workflow', 'Enviar a revisión', 'wf-in-progress', 'wf-review', NULL),
    ('wf-trans-4', 'default-workflow', 'Aprobar', 'wf-review', 'wf-done', 'admin,editor'),
    ('wf-trans-5', 'default-workflow', 'Rechazar', 'wf-review', 'wf-in-progress', NULL);
