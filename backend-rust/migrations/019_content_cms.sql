-- CMS de contenido público: items editables por editores/admins
CREATE TABLE IF NOT EXISTS content_items (
    id TEXT PRIMARY KEY NOT NULL,
    collection TEXT NOT NULL,
    slug TEXT NOT NULL,
    data TEXT NOT NULL DEFAULT '{}',
    published INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    updated_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(collection, slug, deleted_at)
);

CREATE INDEX IF NOT EXISTS idx_content_collection ON content_items(collection);
CREATE INDEX IF NOT EXISTS idx_content_published ON content_items(published);
CREATE INDEX IF NOT EXISTS idx_content_deleted_at ON content_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_content_collection_pub ON content_items(collection, published, deleted_at);

-- Media (imágenes, videos, documentos) subidos al CMS
CREATE TABLE IF NOT EXISTS content_media (
    id TEXT PRIMARY KEY NOT NULL,
    filename TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    uploaded_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_media_uploader ON content_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_deleted_at ON content_media(deleted_at);

-- Audit log del CMS (cambios a items)
CREATE TABLE IF NOT EXISTS content_audit (
    id TEXT PRIMARY KEY NOT NULL,
    content_id TEXT,
    collection TEXT NOT NULL,
    slug TEXT,
    action TEXT NOT NULL,
    actor_id TEXT,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_content_audit_content ON content_audit(content_id);
CREATE INDEX IF NOT EXISTS idx_content_audit_collection ON content_audit(collection, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_audit_actor ON content_audit(actor_id);
