# Team Portal Backend (Rust + Axum + SQLx)

Backend reescrito en Rust para el portal del equipo. Reemplaza al backend Node/Express.

## Stack

- **Axum 0.7** (web framework async)
- **SQLx 0.7** con SQLite (compile-time queries)
- **JWT** via `jsonwebtoken`
- **bcrypt** para hash de contraseñas
- **Tower / Tower-HTTP** para CORS, tracing

## Estructura

```
backend-rust/
├── Cargo.toml
├── Dockerfile           # Multi-stage build (rust:1.83 → debian:bookworm-slim)
├── railway.toml
├── .env.example
├── migrations/
│   ├── 001_users.sql
│   ├── 002_tasks.sql
│   ├── 003_comments.sql
│   ├── 004_attachments.sql
│   └── 005_activity.sql
└── src/
    ├── main.rs          # Entry point
    ├── lib.rs           # build_router, AppState
    ├── db.rs            # Pool, migraciones, seed admin
    ├── models.rs        # User, Task, Comment, ActivityLog, etc.
    ├── middleware/
    │   ├── mod.rs
    │   └── auth.rs      # require_auth middleware (JWT en cookie tivit_token)
    └── routes/
        ├── mod.rs
        ├── auth.rs      # /api/auth/login, /logout, /me, /api/users, /api/health
        └── tasks.rs     # /api/tasks, /api/board, /api/backlog, /api/dashboard,
                         # /api/tasks/:id/comments, /activity, /attachments, /subtasks
```

## Configuración

Variables de entorno (ver `.env.example`):

| Variable | Default | Descripción |
|---|---|---|
| `DATABASE_URL` | `sqlite://data/portal.db` | Path al SQLite |
| `JWT_SECRET` | `dev-secret-change-me` | Secreto para firmar JWTs |
| `JWT_EXPIRES_IN` | `8h` | Expiración del token (`8h`, `1d`, `30m`) |
| `PORT` | `3000` | Puerto del servidor |
| `CORS_ORIGIN` | `http://localhost:8080` | Orígenes permitidos (separados por coma) |
| `COOKIE_SECURE` | `false` | `true` para HTTPS (producción) |
| `UPLOAD_DIR` | `data/uploads` | Carpeta para archivos adjuntos |
| `SEED_ADMIN_EMAIL` | `demo@tivit.com` | Email del admin seed |
| `SEED_ADMIN_PASSWORD` | `tivit2026` | Password del admin seed |
| `SEED_ADMIN_NAME` | `Admin` | Nombre del admin seed |

## Desarrollo local

```bash
cd backend-rust
cp .env.example .env
cargo run
```

El servidor queda en `http://localhost:3000`.

## Endpoints

### Auth (público)
- `POST /api/auth/login` — `{ email, password }` → cookie `tivit_token`
- `POST /api/auth/logout` — limpia cookie
- `GET /api/health` — health check

### Auth (protegido)
- `GET /api/auth/me` — usuario actual
- `GET /api/users` — lista de miembros
- `POST /api/users` — crear usuario (solo admin; `{ name, email, password, role? }`)

### Portal (protegido)
- `GET /api/dashboard` — stats agregadas
- `GET /api/board` — tareas agrupadas por columna Kanban
- `GET /api/backlog` — tareas en backlog (epics + standalone)
- `GET /api/tasks?status=&assignee=&priority=&type=&epic=&sprint=&q=&limit=&offset=` — filtros + paginación (`limit` default 100, máx 500)
- `POST /api/tasks` — crear (valida enums y referencias)
- `GET /api/tasks/:id` — detalle con relaciones
- `PATCH /api/tasks/:id` — editar
- `DELETE /api/tasks/:id` — eliminar (solo admin; purga archivos)
- `PATCH /api/tasks/:id/status` — mover en el board
- `GET /api/tasks/:id/comments` — listar
- `POST /api/tasks/:id/comments` — comentar (`@nombre` genera mención)
- `GET /api/tasks/:id/activity` — historial
- `GET /api/tasks/:id/attachments` — listar
- `POST /api/tasks/:id/attachments` — upload (multipart, máx 10 MB)
- `GET /api/attachments/:id` — descargar adjunto
- `GET /api/tasks/:id/subtasks` — listar subtareas
- `PATCH /api/subtasks/:id/toggle` — marcar/desmarcar subtarea

## Docker

```bash
docker compose up --build
```

El contenedor compila el binario en una imagen builder y luego copia solo el ejecutable a una imagen slim.

## Migraciones

Las migraciones se ejecutan automáticamente al iniciar el servidor. Cada archivo en `migrations/` se aplica en orden.

Para agregar una nueva migración: crear `006_xxx.sql` en la carpeta `migrations/`.

## Seed

Al iniciar por primera vez, crea el usuario admin con las variables `SEED_ADMIN_*`. Si el email ya existe, no hace nada.