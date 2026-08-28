-- Migración 028: Portafolio 5 etapas profesional (SQLite)
-- Unifica 6 categorias → 5 stages + JSON portfolio_data + sponsor
-- Estapas: Backlog, Evaluación técnica, PoC, Proyecto, Producción, Cerrado

ALTER TABLE projects ADD COLUMN stage TEXT NOT NULL DEFAULT 'Backlog';
ALTER TABLE projects ADD COLUMN portfolio_data TEXT NOT NULL DEFAULT '{}';
ALTER TABLE projects ADD COLUMN sponsor_id TEXT REFERENCES users(id);
ALTER TABLE projects ADD COLUMN tipo_proyecto TEXT CHECK(tipo_proyecto IN ('interno','comercial'));

CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_projects_stage_status ON projects(stage, status);
CREATE INDEX IF NOT EXISTS idx_projects_sponsor ON projects(sponsor_id);

-- Migrar 6 categorias legacy → 5 stages + tipo_proyecto
UPDATE projects SET stage = 'Backlog', tipo_proyecto = 'interno', portfolio_data = json_set(COALESCE(portfolio_data,'{}'), '$.tipo_proyecto', 'interno') WHERE categoria = 'Backlog de Propuestas Internas';
UPDATE projects SET stage = 'Backlog', tipo_proyecto = 'comercial', portfolio_data = json_set(COALESCE(portfolio_data,'{}'), '$.tipo_proyecto', 'comercial') WHERE categoria = 'Backlog de Propuestas Comerciales';
UPDATE projects SET stage = 'Evaluación técnica' WHERE categoria = 'Evaluación técnica';
UPDATE projects SET stage = 'PoC' WHERE categoria = 'PoC';
UPDATE projects SET stage = 'Proyecto' WHERE categoria = 'Proyecto';
UPDATE projects SET stage = 'Producción' WHERE categoria = 'Producción';

-- Públicos (slug NOT NULL) → Producción (son Proyectos publicados, decisión profesional)
UPDATE projects SET stage = 'Producción', tipo_proyecto = COALESCE(tipo_proyecto,'comercial') WHERE slug IS NOT NULL AND stage = 'Backlog';

-- Backfill stage para antiguos sin categoria (default Backlog)
UPDATE projects SET stage = 'Backlog' WHERE stage IS NULL OR stage = '';
