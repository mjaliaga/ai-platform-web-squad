ALTER TABLE sprints ADD COLUMN project_id TEXT;
ALTER TABLE announcements ADD COLUMN project_id TEXT;
ALTER TABLE wiki_pages ADD COLUMN project_id TEXT;

CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_announcements_project ON announcements(project_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_project ON wiki_pages(project_id);