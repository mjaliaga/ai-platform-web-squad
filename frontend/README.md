# Frontend — React / Vite / Nginx

Public-facing portfolio site and embedded CMS portal for the TIVIT AI team. Built with React 19 and Vite, served as a compiled static bundle via Nginx. The Nginx configuration also acts as a reverse proxy, forwarding `/api/*` requests to the backend container.

## Technology Stack

| Component | Version | Role |
|---|---|---|
| React | 19 | UI rendering |
| Vite | 8 | Build toolchain and development server |
| Tailwind CSS | 4 | Utility-first styling |
| Nginx | — | Static file server and API reverse proxy |
| oxlint | — | JavaScript linter |

## Project Structure

```
frontend/
├── Dockerfile                    # Multi-stage build: Node -> Nginx
├── nginx.conf                    # Nginx server block with SPA routing and API proxy
├── index.html                    # Application entry point
├── vite.config.js                # Vite configuration
├── package.json
├── public/
│   └── media/                    # Static media served at /media/* (images, logos)
│       ├── logos/                # Brand assets
│       ├── proyectos/            # One subfolder per project (keyed by slug)
│       ├── casos-de-exito/       # One subfolder per success story
│       ├── laboratorio/          # One subfolder per lab entry
│       └── poc/                  # One subfolder per proof of concept
├── data/                         # Source CSV files for content ingestion
│   ├── proyectos.csv
│   ├── casos-de-exito.csv
│   └── laboratorio.csv
├── scripts/
│   └── cargar_proyectos.py       # CSV-to-JSON content ingestion script
├── docs/
│   └── MEDIA.md                  # Static media conventions and deployment notes
└── src/
    ├── main.jsx                  # React application bootstrap
    ├── App.jsx                   # Root component and route definitions
    ├── index.css                 # Global styles
    ├── components/               # Reusable UI components
    ├── pages/                    # Route-level page components (public site + CMS portal)
    ├── context/                  # React context providers (auth, notifications)
    ├── lib/                      # Utility functions and API client helpers
    └── data/
        ├── contenido.js          # Collection definitions and data-access helpers
        └── items.json            # Generated content file — do not edit manually
```

## Development

```bash
npm ci
npm run dev       # Starts the Vite development server at http://localhost:5173
npm run build     # Produces an optimized bundle in dist/
npm run lint      # Runs oxlint on the src/ directory
```

During development, the Vite proxy forwards `/api/*` requests to `http://localhost:3000` (the backend). See `vite.config.js` for proxy configuration.

## Content Management

Content can be managed through the CMS portal at `/portal` (requires authentication), or ingested in bulk from CSV files using the provided script.

### CSV Ingestion Script

```bash
# Ingest projects
python3 scripts/cargar_proyectos.py --prune

# Ingest success stories
python3 scripts/cargar_proyectos.py --archivo data/casos-de-exito.csv --prune

# Ingest lab entries
python3 scripts/cargar_proyectos.py --archivo data/laboratorio.csv --prune
```

The `--prune` flag removes items from the collection that are no longer present in the CSV. Without it, the script performs an additive merge, keyed by slug.

The target collection is inferred from the filename or can be specified explicitly with `--coleccion <name>`.

## Static Media

Static assets in `public/media/` are copied into the Nginx image at build time and served directly from the root domain. See [`docs/MEDIA.md`](docs/MEDIA.md) for naming conventions and deployment guidelines.

## Docker Build

```bash
# Build and start via Docker Compose
docker compose up -d --build frontend

# Rebuild the frontend image only
docker compose build frontend
```

The build accepts the following Docker build arguments, which are embedded into the compiled bundle at build time:

| Argument | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL for API requests |
| `VITE_SHOW_DEMO_CREDENTIALS` | `false` | Show demo login credentials on the login page |
