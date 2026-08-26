-- Migration: Create certifications table for team member certifications
CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    certification_name TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_issue_date ON certifications(issue_date);
