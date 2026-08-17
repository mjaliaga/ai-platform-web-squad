CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_project_type ON tasks(project_id, type);
CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);
