-- Migración 021: Migrar datos de content_items → projects
-- Ejecuta después de que 020 crea las columnas

-- Migrar datos de content_items collection='proyectos' a projects
-- Solo items no soft-deleted
INSERT INTO projects (
  id, slug, code, name, description, sector, status, published, reservado,
  tipo, version, tipo_solucion, cliente, nombre_comercial, descripcion_larga,
  equipo, stack, problemas, que_hicimos, resultados, highlights, galeria,
  video_promocional, video_tecnico, documento_drive, documentacion,
  url_proyecto, video_placeholder, color, created_at, updated_at
)
SELECT
  ci.id,
  ci.slug,
  json_extract(ci.data, '$.codigo'),
  json_extract(ci.data, '$.nombreComercial'),
  json_extract(ci.data, '$.descripcion'),
  CASE
    WHEN json_extract(ci.data, '$.sector') = 'Laboratorio' THEN 'Laboratorio'
    WHEN json_extract(ci.data, '$.sector') = 'PoC' THEN 'PoC'
    ELSE 'Proyecto'
  END,
  'active',
  ci.published,
  COALESCE(json_extract(ci.data, '$.reservado'), 0),
  json_extract(ci.data, '$.tipo'),
  json_extract(ci.data, '$.version'),
  json_extract(ci.data, '$.tipoSolucion'),
  json_extract(ci.data, '$.cliente'),
  json_extract(ci.data, '$.nombreComercial'),
  json_extract(ci.data, '$.descripcionLarga'),
  COALESCE(json_extract(ci.data, '$.equipo'), '[]'),
  COALESCE(json_extract(ci.data, '$.stack'), '[]'),
  COALESCE(json_extract(ci.data, '$.problemas'), '[]'),
  COALESCE(json_extract(ci.data, '$.queHicimos'), '[]'),
  COALESCE(json_extract(ci.data, '$.resultados'), '[]'),
  COALESCE(json_extract(ci.data, '$.highlights'), '[]'),
  COALESCE(json_extract(ci.data, '$.galeria'), '[]'),
  json_extract(ci.data, '$.videoPromocional'),
  json_extract(ci.data, '$.videoTecnico'),
  json_extract(ci.data, '$.documentoDrive'),
  json_extract(ci.data, '$.documentacion'),
  json_extract(ci.data, '$.urlProyecto'),
  COALESCE(json_extract(ci.data, '$.videoPlaceholder'), 0),
  '#9333ea',
  ci.created_at,
  CASE WHEN ci.updated_at IS NOT NULL THEN ci.updated_at ELSE datetime('now') END
FROM content_items ci
WHERE ci.collection = 'proyectos'
  AND ci.deleted_at IS NULL
  AND ci.id NOT IN (SELECT id FROM projects WHERE slug IS NOT NULL);

-- Marcar content_items de proyectos como deprecated
UPDATE content_items
SET deleted_at = datetime('now')
WHERE collection = 'proyectos'
  AND deleted_at IS NULL;
