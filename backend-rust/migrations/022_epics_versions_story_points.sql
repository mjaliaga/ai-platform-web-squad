-- Migration 022: Add epics, versions, story_points, resolution
-- This migration adds Jira-core features: Epics as first-class entities,
-- Versions/Releases, Story Points, and Resolution fields.

-- 1. Create epics table
CREATE TABLE IF NOT EXISTS epics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    summary TEXT,
    color TEXT DEFAULT '#6366f1',
    owner_id TEXT REFERENCES users(id),
    project_id TEXT REFERENCES projects(id),
    start_date TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'open',  -- open, in_progress, done
    created_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- 2. Create versions table
CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id),
    description TEXT,
    release_date TEXT,
    status TEXT DEFAULT 'unreleased',  -- unreleased, released, archived
    created_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- 3. Create task_versions junction table
CREATE TABLE IF NOT EXISTS task_versions (
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    version_id TEXT REFERENCES versions(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'fix',  -- fix, affects
    PRIMARY KEY (task_id, version_id, relationship)
);

-- 4. Add story_points and resolution columns to tasks
-- SQLite doesn't support IF NOT EXISTS for columns, so we handle errors gracefully
ALTER TABLE tasks ADD COLUMN story_points INTEGER;
ALTER TABLE tasks ADD COLUMN resolution TEXT;  -- fixed, wont_fix, duplicate, done, cannot_reproduce
ALTER TABLE tasks ADD COLUMN epic_id TEXT REFERENCES epics(id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_epics_project ON epics(project_id);
CREATE INDEX IF NOT EXISTS idx_epics_owner ON epics(owner_id);
CREATE INDEX IF NOT EXISTS idx_versions_project ON versions(project_id);
CREATE INDEX IF NOT EXISTS idx_task_versions_task ON task_versions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_versions_version ON task_versions(version_id);
CREATE INDEX IF NOT EXISTS idx_tasks_epic ON tasks(epic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_story_points ON tasks(story_points);
