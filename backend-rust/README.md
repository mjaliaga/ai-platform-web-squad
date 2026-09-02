# Backend — Rust / Axum / SQLite

REST API server for the TIVIT AI Platform. Provides authentication, content management, task tracking, team management, and file upload endpoints. Replaces the previous Node/Express implementation.

## Technology Stack

| Component | Version | Role |
|---|---|---|
| Axum | 0.7 | Async HTTP web framework |
| SQLx | 0.7 | Compile-time verified SQL queries against SQLite |
| SQLite | — | Embedded relational database (via SQLx) |
| jsonwebtoken | — | JWT generation and validation |
| bcrypt | — | Password hashing |
| Redis | 7 | Distributed rate limiting (optional; falls back to in-memory) |
| Tower / Tower-HTTP | — | Middleware stack: CORS, request tracing |

## Project Structure

```
backend-rust/
├── Cargo.toml
├── Dockerfile                    # Multi-stage build: rust:1.83 -> debian:bookworm-slim
├── .env.example                  # Reference configuration file
├── migrations/                   # Sequential SQL migration files (auto-applied on startup)
│   ├── 001_users.sql
│   ├── 002_tasks.sql
│   ├── 003_comments.sql
│   ├── 004_attachments.sql
│   ├── 005_activity.sql
│   ├── 006_dependencies.sql
│   ├── 007_team.sql
│   ├── 008_projects.sql
│   ├── 009_project_members.sql
│   ├── 010_sprint_project.sql
│   ├── 011_simplify_types.sql
│   ├── 012_project_fields.sql
│   ├── 013_sprint_task_fields.sql
│   ├── 014_users_phone.sql
│   ├── 015_indexes.sql
│   ├── 016_social.sql
│   ├── 017_soft_deletes.sql
│   ├── 018_performance_indexes.sql
│   └── 019_content_cms.sql
└── src/
    ├── main.rs                   # Entry point
    ├── lib.rs                    # Router composition, AppState
    ├── db.rs                     # Connection pool, migration runner, admin seed
    ├── models.rs                 # Domain structs: User, Task, Comment, ContentItem, etc.
    ├── audit.rs                  # Audit log helpers
    ├── pagination.rs             # Pagination query parameters and response types
    ├── ratelimit.rs              # In-memory rate limiter (single instance)
    ├── ratelimit_redis.rs        # Redis-backed rate limiter (distributed)
    ├── validation.rs             # Shared error response helpers and role guards
    ├── utils.rs                  # General utility functions
    ├── middleware/
    │   ├── mod.rs
    │   ├── auth.rs               # JWT cookie validation middleware
    │   └── csrf.rs               # Double-submit CSRF token middleware
    ├── routes/
    │   ├── mod.rs
    │   ├── auth.rs               # /api/auth/* and /api/users
    │   ├── tasks.rs              # /api/tasks, /api/board, /api/backlog, /api/dashboard
    │   ├── projects.rs           # /api/projects
    │   ├── sprints.rs            # /api/sprints
    │   ├── team.rs               # /api/team
    │   ├── time.rs               # /api/time
    │   ├── watchers.rs           # /api/tasks/:id/watchers
    │   ├── notifications.rs      # /api/notifications
    │   └── deps.rs               # /api/tasks/:id/dependencies
    └── content/
        ├── mod.rs
        ├── routes.rs             # /api/content/* — CMS CRUD and audit endpoints
        ├── schemas.rs            # Per-collection field definitions and validation
        ├── public.rs             # /api/public/* — unauthenticated read endpoints
        └── media.rs              # /api/media/* — CMS media upload and serving
```

## Configuration

Copy `.env.example` to `.env` and adjust the values before running locally.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite://data/portal.db` | SQLite database path |
| `JWT_SECRET` | *(requerido, sin default)* | HMAC secret for JWT signing. **Requerido** — generar con `openssl rand -hex 64`. Sin default; el binario falla si está vacío o `<32 chars`. |
| `JWT_EXPIRES_IN` | `8h` | Token TTL. Accepts `Xh`, `Xd`, `Xm`. |
| `PORT` | `3000` | Listening port |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed CORS origin(s), comma-separated. **Requerido en producción**. |
| `COOKIE_SECURE` | `false` (dev) | Set to `true` in production (HTTPS required). Default `true` si no se especifica. |
| `REDIS_URL` | *(unset)* | Redis connection string. Si `REDIS_PASSWORD` está seteado, usar `redis://:${REDIS_PASSWORD}@redis:6379`. Si unset, rate limiting es per-process. |
| `REDIS_PASSWORD` | *(unset)* | Contraseña Redis. Ver `docker-compose.yml`. |
| `UPLOAD_DIR` | `data/uploads` | Directory for file attachments |
| `MEDIA_DIR` | `data/media` | Directory for CMS media files |
| `SEED_ADMIN_EMAIL` | *(vacío — opt-in)* | Initial admin account email. Si vacío, no se crea admin. |
| `SEED_ADMIN_PASSWORD` | *(vacío — opt-in, mín 12)* | Initial admin account password. **Mín 12 chars, no en blocklist (`tivit2026`, `admin123`...). Generar con `openssl rand -base64 24`.** |
| `SEED_ADMIN_NAME` | `Admin` | Initial admin account display name |

## Local Development

```bash
cd backend-rust
cp .env.example .env
cargo run
```

The server starts at `http://localhost:3000`. Migrations are applied automatically on startup.

## API Reference

### Public Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with `{ email, password }`. Sets `tivit_token` cookie. |
| `POST` | `/api/auth/logout` | Clears the session cookie. |
| `GET` | `/api/health` | Health check. Returns `200 OK`. |
| `GET` | `/api/public/:collection` | List published CMS items for the given collection. |
| `GET` | `/api/public/:collection/:slug` | Get a single published CMS item by slug. |

### Authenticated Endpoints — Identity

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Returns the current authenticated user's profile. |
| `GET` | `/api/users` | List all team members. |
| `POST` | `/api/users` | Create a user (admin only). Body: `{ name, email, password, role? }`. |

### Authenticated Endpoints — Task Management

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Aggregated statistics for the dashboard view. |
| `GET` | `/api/board` | Tasks grouped by Kanban column. |
| `GET` | `/api/backlog` | Tasks in backlog view (epics and standalone items). |
| `GET` | `/api/tasks` | Filtered, paginated task list. Query params: `status`, `assignee`, `priority`, `type`, `epic`, `sprint`, `q`, `limit` (default 100, max 500), `offset`. |
| `POST` | `/api/tasks` | Create a task. Validates enums and foreign key references. |
| `GET` | `/api/tasks/:id` | Retrieve a task with all related data. |
| `PATCH` | `/api/tasks/:id` | Update task fields. |
| `DELETE` | `/api/tasks/:id` | Delete a task (admin only). Purges associated file attachments. |
| `PATCH` | `/api/tasks/:id/status` | Move a task to a different Kanban column. |
| `GET` | `/api/tasks/:id/comments` | List comments for a task. |
| `POST` | `/api/tasks/:id/comments` | Add a comment. Mentions via `@name` are recorded. |
| `GET` | `/api/tasks/:id/activity` | Full activity history for a task. |
| `GET` | `/api/tasks/:id/attachments` | List file attachments. |
| `POST` | `/api/tasks/:id/attachments` | Upload a file (multipart, max 10 MB). |
| `GET` | `/api/attachments/:id` | Download an attachment by ID. |
| `GET` | `/api/tasks/:id/subtasks` | List subtasks. |
| `PATCH` | `/api/subtasks/:id/toggle` | Toggle a subtask's completion state. |

### Authenticated Endpoints — Content Management

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/content/collections` | List all available CMS collections with counts. |
| `GET` | `/api/content/schemas/:collection` | Get the field schema for a collection. |
| `GET` | `/api/content/:collection` | List items. Query params: `q`, `published`, `limit`, `offset`, `sort`. |
| `POST` | `/api/content/:collection` | Create a new item. Validates against the collection schema. |
| `GET` | `/api/content/:collection/:slug` | Retrieve a single item by slug. |
| `PUT` | `/api/content/:collection/:slug` | Replace item data. |
| `PATCH` | `/api/content/:collection/:slug` | Partial item update. |
| `DELETE` | `/api/content/:collection/:slug` | Soft-delete an item. |
| `POST` | `/api/content/:collection/:slug/publish` | Set published state. Body: `{ published: bool }`. |
| `POST` | `/api/content/:collection/:slug/duplicate` | Duplicate an item with a generated slug. |
| `GET` | `/api/content/audit` | Retrieve the content audit log. |

## Database Migrations

Migrations in `migrations/` are applied sequentially and automatically on server startup via SQLx. Files follow the naming convention `NNN_description.sql`.

To add a new migration, create the next file in sequence (e.g., `020_new_feature.sql`). Do not modify existing migration files.

## Docker Build

The Dockerfile uses a multi-stage build. The first stage compiles the Rust binary using `rust:1.83`. The second stage copies only the compiled binary into `debian:bookworm-slim`, keeping the final image small.

```bash
# Build and start via Docker Compose (recommended)
docker compose up -d --build backend

# Rebuild the backend image only
docker compose build backend
```