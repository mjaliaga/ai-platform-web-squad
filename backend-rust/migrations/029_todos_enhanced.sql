-- Migration: Enhanced todos table with due dates, priority, category, position
ALTER TABLE todos ADD COLUMN description TEXT;
ALTER TABLE todos ADD COLUMN due_date TEXT;
ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE todos ADD COLUMN category TEXT DEFAULT 'general';
ALTER TABLE todos ADD COLUMN position INTEGER DEFAULT 0;

CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_category ON todos(category);
CREATE INDEX idx_todos_position ON todos(position);
