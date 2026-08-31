# TIVIT AI Platform — Web Squad

Internal platform for the TIVIT AI team, providing a public-facing portfolio site and a content management system (CMS) for managing projects, research labs, proof-of-concepts, and success stories.

## Architecture

The system is composed of three services orchestrated via Docker Compose:

| Service | Technology | Description |
|---|---|---|
| `backend` | Rust, Axum, SQLite | REST API with JWT authentication, CSRF protection, and Redis-backed rate limiting |
| `frontend` | React 19, Vite, Nginx | Static site with an embedded CMS portal |
| `redis` | Redis 7 | Distributed session and rate-limit store |

```
ai-platform-web-squad/
├── backend-rust/          # Rust API server
├── frontend/              # React frontend and Nginx static server
├── test/                  # Automated test suite (unit + end-to-end)
├── docker-compose.yml     # Production and local service orchestration
└── .env                   # Environment overrides (not committed)
```

## Prerequisites

- Docker >= 24 and Docker Compose >= 2.20
- Python 3.10+ (for running the test suite)

## Quick Start

```bash
# 1. Copy and configure environment variables
cp .env.example .env

# 2. Build and start all services
docker compose up -d --build

# 3. Access the application
# Public site and CMS portal: http://localhost:8080
```

The backend applies database migrations and seeds the initial admin user automatically on first startup.

## Environment Variables

The following variables can be set in the root `.env` file. All values shown are the defaults used by `docker-compose.yml` when no override is provided.

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | *(random hex in compose)* | Secret key for signing JWTs. Must be overridden in production. |
| `JWT_EXPIRES_IN` | `8h` | Token expiration duration. Accepts `Xh`, `Xd`, `Xm` formats. |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed CORS origins, comma-separated. |
| `COOKIE_SECURE` | `false` | Set to `true` in HTTPS/production environments. |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string for distributed rate limiting. |
| `SEED_ADMIN_EMAIL` | `manuel.aliaga@tivit.com` | Email for the auto-seeded admin account. |
| `SEED_ADMIN_PASSWORD` | `tivit2026` | Password for the auto-seeded admin account. **Valor de ejemplo no usar en producción, generar con `openssl rand -hex 32`**. |
| `PORT` | `8080` | Host port exposed by the frontend container. |
| `VITE_API_URL` | `/api` | Base URL the frontend uses to reach the API. |

## Running Tests

The test suite covers both pure logic (unit) and live API behavior (end-to-end). E2E tests require the Docker stack to be running.

```bash
# Run the full suite (unit + E2E)
python3 test/run_tests.py

# Run only unit tests (no Docker required)
python3 -m unittest discover -s test/unit

# Run a specific E2E module
python3 -m unittest test.e2e.test_cms_proyectos_e2e
```

See [`test/README.md`](test/README.md) for the full test suite reference.

## Services

- **Backend API reference**: [`backend-rust/README.md`](backend-rust/README.md)
- **Frontend and CMS guide**: [`frontend/README.md`](frontend/README.md)
- **Media and static assets**: [`frontend/docs/MEDIA.md`](frontend/docs/MEDIA.md)

## Deployment

The stack is designed to run on any Docker-capable host or a managed container platform (e.g., Railway). Each service has its own `railway.toml` for platform-specific configuration. The frontend Nginx configuration includes reverse-proxy rules that forward `/api/*` requests to the backend container.

```bash
# Rebuild and restart a single service without downtime
docker compose up -d --no-deps --build backend
docker compose up -d --no-deps --build frontend
```

Persistent data is stored in named Docker volumes (`tivit-db`, `tivit-media`) and survives container restarts and rebuilds.
