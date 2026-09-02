-- Zona de Tickets asociada a portfolio (proyecto)
-- Nivel 1 -> Manuel Aliaga, Nivel 2 -> Sergio Aguas (configurable por admin)

CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'abierto', -- abierto, en_progreso, resuelto, cerrado
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    level INTEGER NOT NULL DEFAULT 1 CHECK(level IN (1,2)),
    category TEXT, -- incidencia, solicitud, consulta
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    due_date TEXT,
    resolution TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT,
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tickets_level ON tickets(level);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_project ON tickets(project_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);

-- Configuración de niveles (quién atiende cada nivel)
CREATE TABLE IF NOT EXISTS ticket_level_config (
    level INTEGER PRIMARY KEY CHECK(level IN (1,2)),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Actividad de tickets (historial)
CREATE TABLE IF NOT EXISTS ticket_activity (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- created, updated, status_changed, level_changed, assigned
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ticket_activity_ticket ON ticket_activity(ticket_id, created_at DESC);

-- Comentarios de tickets (sin menciones por ahora, simple)
CREATE TABLE IF NOT EXISTS ticket_comments (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id, created_at DESC);
