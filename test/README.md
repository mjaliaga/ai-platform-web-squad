# Automated Test Suite — Unit and End-to-End

Automated test suite covering pure logic (unit tests) and live API behavior (end-to-end tests). The suite uses the Python standard library `unittest` module with no external test runner dependencies.

## Directory Structure

```
test/
├── README.md                          # This file
├── run_tests.py                       # Interactive test runner with colored console output
├── run.sh                             # Shell wrapper for run_tests.py
├── unit/                              # Unit tests — no Docker or network required
│   ├── test_cms_normalizer.py         # Data normalization logic: {value} array flattening
│   └── test_schema_validators.py      # Slug validation matching backend Rust schema
└── e2e/                               # End-to-end tests against the running Docker stack
    ├── helpers.py                     # HTTP client with cookie jar, CSRF injection, and auth helpers
    ├── test_auth_e2e.py               # Login, logout, /auth/me, and CSRF token lifecycle
    ├── test_cms_proyectos_e2e.py      # Projects: full CRUD cycle and team member management
    ├── test_cms_laboratorio_e2e.py    # Lab entries: authors, lifecycle fields, and Drive links
    ├── test_cms_casos_exito_e2e.py    # Success stories: industry fields, profile, and tech stack
    ├── test_cms_poc_e2e.py            # Proof of Concepts: highlights, videos, and demos
    └── test_public_content_e2e.py     # Unauthenticated public endpoints
```

## Prerequisites

- Python 3.10 or later
- For end-to-end tests: the Docker Compose stack must be running and healthy

```bash
docker compose up -d
```

## Running the Tests

### Full suite (unit + E2E)

```bash
python3 test/run_tests.py

# Alternatively, using the shell wrapper
./test/run.sh
```

### Unit tests only (no Docker required)

```bash
python3 -m unittest discover -s test/unit -v
```

### A specific E2E module

```bash
python3 -m unittest test.e2e.test_cms_proyectos_e2e -v
```

## Test Design

### Unit Tests

Unit tests operate on pure Python functions that mirror backend logic. They carry no external dependencies and are safe to run in any environment.

| Module | Coverage |
|---|---|
| `test_cms_normalizer.py` | `normalizarItemApi` — flattens `[{value: '...'}]` arrays to `['...']` (mitigates React rendering error #31) |
| `test_schema_validators.py` | `is_valid_slug` — validates slug format matching the Rust backend schema definition |

### End-to-End Tests

E2E tests send real HTTP requests to the API at `http://localhost:8080/api` (configurable via `TEST_API_URL`). Each test class follows this pattern:

- **setUp**: Authenticates a client session. Performs a pre-emptive DELETE of any fixture data to guarantee idempotency across repeated runs.
- **test_***: Executes the scenario under test.
- **tearDown**: Removes all fixture data created by the test.

This design ensures the suite can be run multiple times without manual database cleanup.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TEST_API_URL` | `http://localhost:8080/api` | Base URL for E2E test requests |
| `TEST_API_URL` | `http://localhost:8080/api` | Base URL for E2E test requests (`http://localhost:${PORT}/api` si `PORT` cambia) |
| `TEST_ADMIN_EMAIL` | `admin@tivit.com` (CI) | Admin account used for authenticated tests — setea `SEED_ADMIN_EMAIL` / `TEST_ADMIN_EMAIL` vía env |
| `TEST_ADMIN_PASSWORD` | *(leer de `SEED_ADMIN_PASSWORD` o `TEST_ADMIN_PASSWORD` env)* | Admin account password — **Mín 12 chars, no usar `tivit2026`. Generar con `openssl rand -base64 24`. En CI: `tivit2026SuperSegura!2026` vía env** |
