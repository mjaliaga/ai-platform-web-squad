# Frontend TIVIT — Sitio público

Sitio de React 19 + Vite 8 + Tailwind 4. Se sirve como estático con nginx.

## Estructura relevante

```
frontend/
├── public/media/            → imágenes y videos (servidos en /media/...)
├── data/                    → CSVs fuente (proyectos.csv, casos-de-exito.csv, laboratorio.csv)
├── scripts/cargar_proyectos.py → convierte CSV → src/data/items.json
├── src/data/contenido.js    → colecciones y helpers de lectura
├── src/data/items.json      → datos generados (no editar a mano)
├── src/components/          → componentes UI
└── src/pages/               → rutas del sitio y portal
```

## Cargar o actualizar contenido

```bash
python3 scripts/cargar_proyectos.py --prune                  # proyectos.csv
python3 scripts/cargar_proyectos.py --archivo data/casos-de-exito.csv --prune
python3 scripts/cargar_proyectos.py --archivo data/laboratorio.csv --prune
```

`--prune` elimina los items de la colección que ya no estén en el CSV.
Sin él, conserva lo existente y solo agrega/actualiza (merge por slug).
La colección se detecta por el nombre del archivo o con `--coleccion <nombre>`.

## Medios (imágenes y videos)

Ver `public/media/LEEME.md`. En resumen: videos pesados en YouTube/Vimeo,
imágenes pequeñas en `public/media/proyectos/<slug>/`.

## Comandos

```bash
npm ci
npm run dev        # desarrollo
npm run build      # build de producción → dist/
npm run lint       # oxlint
```
