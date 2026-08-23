# Static Media — Conventions and Deployment

This directory (`public/media/`) contains static assets served directly from the web server root at `/media/*`. Assets are referenced in the CMS or in content CSV files using relative paths of the form `/media/<collection>/<slug>/<filename>`.

## Directory Structure

```
public/media/
├── logos/                        # Site-wide brand assets
│   ├── logo-tivit.png
│   ├── logo-tivit-blanco.png
│   └── logo-tivit-tile.png
├── proyectos/                    # One subdirectory per project, keyed by slug
├── casos-de-exito/               # One subdirectory per success story
├── laboratorio/                  # One subdirectory per lab entry
│   └── <slug>/
│       ├── imagen-1.jpg
│       ├── imagen-2.jpg
│       └── demo.mp4              # Local video (optional — see note below)
└── poc/                          # One subdirectory per proof of concept
```

## Referencing Assets in Content

| Asset Type | Reference Format |
|---|---|
| Gallery image | `/media/<collection>/<slug>/filename.jpg` |
| Local video | `/media/<collection>/<slug>/filename.mp4` |
| YouTube video | Full URL (e.g., `https://youtube.com/watch?v=...`) |
| Vimeo video | Full URL (e.g., `https://vimeo.com/...`) |

When specifying a video in a CSV or JSON data field, use the pipe format:
- `youtube|https://youtube.com/watch?v=<id>` — streams from YouTube
- `vimeo|https://vimeo.com/<id>` — streams from Vimeo
- `archivo|/media/<collection>/<slug>/demo.mp4` — serves the local file

## Deployment Guidelines

**Do not commit large video files to the repository.** Prefer YouTube or Vimeo embeds. Large binary files in the Git history increase clone times and bloat container image layers.

**Images may be committed.** They are typically small and are copied directly into the Nginx image during build. Before committing, compress images (WebP or optimized JPEG is recommended).

**Local video files**, if strictly necessary, should be kept small (under 20 MB) and placed in the corresponding slug subfolder. They will be included in the container image and served by Nginx.

When the application is deployed with `docker compose up -d --build frontend`, all content under `public/` is copied into the Nginx image and served at the domain root.
