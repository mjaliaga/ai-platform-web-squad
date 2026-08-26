# Flujo de contenido: BD CMS ↔ Sitio público

## Resumen

El sitio web `/proyectos`, `/poc`, `/casos-de-exito` y `/laboratorio` muestra items que vienen de **dos fuentes posibles**:

1. **Base de datos (BD)** — `content_items` en SQLite (`/app/data/portal.db`)
2. **Fallback estático** — archivos JSON en `frontend/src/data/`

La estrategia híbrida prioriza la BD, pero cae al fallback si la BD está vacía para una colección.

---

## Dónde están los datos

| Fuente | Origen | Se usa cuando |
|---|---|---|
| BD SQLite | `GET /api/public/content/{collection}` | La BD tiene items publicados para la colección |
| `items.json` | `frontend/src/data/items.json` (proyectos + laboratorio) | La BD está vacía para esa colección |
| `casosExito.js` | `frontend/src/data/casosExito.js` (casos de éxito) | La BD está vacía |
| `poc.js` | `frontend/src/data/poc.js` (PoC) | La BD está vacía |

La lógica híbrida está en `frontend/src/data/contenido.js:352-418` (función `fetchFromApi` + `loadStaticFallback`).

---

## Estructura de datos

### items.json (proyectos + laboratorio)
Cada item tiene un campo `coleccion` que lo clasifica:
```json
{
  "slug": "prj-008-tivit-soc",
  "coleccion": "proyectos",
  "codigo": "PRJ-008",
  ...
}
```

### casosExito.js, poc.js
Archivos JS que exportan arrays. Cada colección tiene su archivo.

---

## Cómo funciona el seed

`seed_content` (binario Rust en `backend-rust/src/bin/seed_content.rs`) migra los datos estáticos a la BD:

```bash
# Desde el host (requiere acceso al contenedor):
docker compose exec backend seed_content --force

# O dentro del contenedor:
seed_content --force
```

**Flags**:
- Sin `--force`: solo inserta items que no existen (por collection + slug)
- Con `--force`: sobrescribe items existentes con los datos del JSON

**Variables de entorno**:
- `DATABASE_URL` — conexión a SQLite (default: `sqlite://data/portal.db`)
- `SEED_DATA_DIR` — directorio de datos (default: `../frontend/src/data`)

En Docker, el `SEED_DATA_DIR` se configura en `docker-compose.yml` y el ENTRYPOINT ejecuta `seed_content --force` automáticamente en cada arranque.

---

## Diferencia entre rutas del portal

| Ruta | Qué es | Tabla |
|---|---|---|
| `/portal/projects` | **Proyectos internos del equipo** (gestión de tareas/sprints) | `projects` |
| `/portal/cms/proyectos` | **CMS del sitio público** — editor de items | `content_items` |
| `/proyectos` (público) | **Sitio público** — lista de proyectos | `content_items` → fallback `items.json` |

⚠️ **No confundir** `/portal/projects` con `/portal/cms/proyectos`. Son dominios distintos.

---

## Cómo sincronizar

### Si cambiás `items.json` / `casosExito.js` / `poc.js`
1. Reconstruir la imagen del backend:
   ```bash
   docker compose build backend
   ```
2. Reiniciar el backend (el ENTRYPOINT ejecutará `seed_content --force`):
   ```bash
   docker compose up -d backend
   ```

### Si editás desde el CMS (`/portal/cms`)
Los cambios se guardan directamente en la BD. No hace falta seed.

### Para un deploy nuevo
El ENTRYPOINT ejecuta `seed_content --force` automáticamente al arrancar el contenedor.

---

## Diferencia entre `git push` y `seed_content`

| Acción | Qué sincroniza | Qué NO sincroniza |
|---|---|---|
| `git push` | Código fuente, Dockerfile, JSON de datos | BD, volúmenes, cache del navegador |
| `seed_content --force` | Datos estáticos → BD | Código fuente |

Para que un cambio en `items.json` se refleje en la BD, hay que:
1. `git push` (sincroniza el JSON)
2. `docker compose build backend` (copia el JSON a la imagen)
3. `docker compose up -d backend` (reinicia, ejecuta seed)

---

## Filtros del sitio público

El endpoint `GET /api/public/content/{collection}` excluye:
- Items con `published = 0` (borradores)
- Items con `deleted_at IS NOT NULL` (eliminados)
- Items con `data.reservado = true` (ocultos del público, visibles solo en CMS)

---

## Archivos clave

| Archivo | Función |
|---|---|
| `frontend/src/data/contenido.js` | Lógica híbrida (BD → fallback) |
| `frontend/src/data/items.json` | Datos estáticos de proyectos y laboratorio |
| `frontend/src/data/casosExito.js` | Datos estáticos de casos de éxito |
| `frontend/src/data/poc.js` | Datos estáticos de PoC |
| `backend-rust/src/bin/seed_content.rs` | Binario que migra JSON → BD |
| `backend-rust/src/content/schemas.rs` | Schema declarativo de cada colección |
| `backend-rust/src/content/public.rs` | Endpoints públicos (con filtro reservado) |
| `backend-rust/Dockerfile` | ENTRYPOINT ejecuta seed al arrancar |
| `backend-rust/docker-entrypoint.sh` | Script de arranque |
| `frontend/src/pages/Portal/PortalLayout.jsx` | Menú del portal (rinombrado: "Proyectos internos") |
