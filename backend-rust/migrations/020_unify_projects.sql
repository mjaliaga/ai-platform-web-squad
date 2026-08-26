-- Migración 020: Unificar dominios de proyectos
-- Extiende la tabla projects con campos del CMS y migra datos de content_items

-- ============================================================================
-- 0. Asegurar que existen columnas base (updated_at si no existe)
-- ============================================================================
-- Nota: updated_at puede no existir en tablas viejas
-- SQLite no soporta ADD COLUMN IF NOT EXISTS, se maneja con error handling en Rust
-- SQLite no soporta funciones como default en ALTER TABLE, usamos string vacío
ALTER TABLE projects ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';

-- ============================================================================
-- 1. Agregar columnas nuevas a projects
-- ============================================================================

-- Visibilidad y publicación
ALTER TABLE projects ADD COLUMN slug TEXT;
ALTER TABLE projects ADD COLUMN published INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN reservado INTEGER NOT NULL DEFAULT 0;

-- Metadata del proyecto (CMS)
ALTER TABLE projects ADD COLUMN tipo TEXT NOT NULL DEFAULT 'Interno';
ALTER TABLE projects ADD COLUMN tipo_solucion TEXT;
ALTER TABLE projects ADD COLUMN version TEXT;
ALTER TABLE projects ADD COLUMN cliente TEXT;
ALTER TABLE projects ADD COLUMN nombre_comercial TEXT;

-- Contenido largo
ALTER TABLE projects ADD COLUMN descripcion_larga TEXT;
ALTER TABLE projects ADD COLUMN equipo TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN stack TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN problemas TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN que_hicimos TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN resultados TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN highlights TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN galeria TEXT NOT NULL DEFAULT '[]';

-- Multimedia
ALTER TABLE projects ADD COLUMN video_promocional TEXT;
ALTER TABLE projects ADD COLUMN video_tecnico TEXT;

-- Enlaces externos
ALTER TABLE projects ADD COLUMN documento_drive TEXT;
ALTER TABLE projects ADD COLUMN documentacion TEXT;
ALTER TABLE projects ADD COLUMN url_proyecto TEXT;
ALTER TABLE projects ADD COLUMN video_placeholder INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- 2. Crear índice único para slug (solo registros no eliminados)
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug) WHERE deleted_at IS NULL AND slug IS NOT NULL;

-- ============================================================================
-- 3. Migrar datos de content_items → projects
-- ============================================================================
-- Solo para collection='proyectos', no soft-deleted
-- Los items reservados también se migran (con reservado=1)

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
  json_extract(ci.data, '$.equipo'),
  json_extract(ci.data, '$.stack'),
  json_extract(ci.data, '$.problemas'),
  json_extract(ci.data, '$.queHicimos'),
  json_extract(ci.data, '$.resultados'),
  json_extract(ci.data, '$.highlights'),
  json_extract(ci.data, '$.galeria'),
  json_extract(ci.data, '$.videoPromocional'),
  json_extract(ci.data, '$.videoTecnico'),
  json_extract(ci.data, '$.documentoDrive'),
  json_extract(ci.data, '$.documentacion'),
  json_extract(ci.data, '$.urlProyecto'),
  COALESCE(json_extract(ci.data, '$.videoPlaceholder'), 0),
  '#9333ea',  -- Color morado para distinguir proyectos migrados del CMS
  ci.created_at,
  ci.updated_at
FROM content_items ci
WHERE ci.collection = 'proyectos'
  AND ci.deleted_at IS NULL
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  published = excluded.published,
  reservado = excluded.reservado,
  tipo = excluded.tipo,
  version = excluded.version,
  tipo_solucion = excluded.tipo_solucion,
  cliente = excluded.cliente,
  nombre_comercial = excluded.nombre_comercial,
  descripcion_larga = excluded.descripcion_larga,
  equipo = excluded.equipo,
  stack = excluded.stack,
  problemas = excluded.problemas,
  que_hicimos = excluded.que_hicimos,
  resultados = excluded.resultados,
  highlights = excluded.highlights,
  galeria = excluded.galeria,
  video_promocional = excluded.video_promocional,
  video_tecnico = excluded.video_tecnico,
  documento_drive = excluded.documento_drive,
  documentacion = excluded.documentacion,
  url_proyecto = excluded.url_proyecto,
  video_placeholder = excluded.video_placeholder,
  updated_at = datetime('now');

-- ============================================================================
-- 4. Marcar content_items de proyectos como deprecated
-- (no se eliminan, se marcan con deleted_at para mantener historial)
-- ============================================================================
UPDATE content_items
SET deleted_at = datetime('now')
WHERE collection = 'proyectos'
  AND deleted_at IS NULL;
