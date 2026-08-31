-- encoding: UTF-8
-- Migración 027: Portafolio - nueva columna categoria para pipeline profesional
-- Categorías: Backlog de Propuestas Internas, Backlog de Propuestas Comerciales, Evaluación técnica, PoC, Proyecto, Producción
ALTER TABLE projects ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Proyecto';
CREATE INDEX IF NOT EXISTS idx_projects_categoria ON projects(categoria);
CREATE INDEX IF NOT EXISTS idx_projects_categoria_status ON projects(categoria, status);

-- Backfill inteligente desde sector legacy
UPDATE projects SET categoria = CASE
  WHEN sector = 'Laboratorio' THEN 'Evaluación técnica'
  WHEN sector = 'PoC' THEN 'PoC'
  WHEN sector = 'Proyecto' THEN 'Proyecto'
  ELSE 'Proyecto'
END WHERE categoria = 'Proyecto' OR categoria IS NULL;
