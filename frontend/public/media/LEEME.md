# Medios del sitio (imágenes y videos)

Aquí se alojan los archivos estáticos que se sirven desde la raíz del sitio.
Se referencia desde el CSV (o `items.json`) con rutas `/media/...`.

## Estructura

```
public/media/
├── logos/                    → marcas del sitio (logo-tivit.png, logo-tivit-blanco.png, logo-tivit-tile.png)
├── proyectos/                → una carpeta por proyecto (slug)
├── casos-de-exito/           → una carpeta por caso de éxito (slug)
├── laboratorio/              → una carpeta por producto/investigación (slug)
│   └── <slug>/
│       ├── imagen-1.jpg      → imágenes de la galería
│       ├── imagen-2.jpg
│       └── demo.mp4          → video local (opcional, ver abajo)
└── poc/                      → reservado para esa colección
```

## Cómo referenciar en el CSV

- **Imágenes de galería**: `/media/<coleccion>/<slug>/archivo.jpg`
- **Video local** (`archivo`): `/media/<coleccion>/<slug>/archivo.mp4`
- **Video YouTube/Vimeo**: URL completa, sin guardar archivo.

## Recomendaciones para Railway

- **Videos pesados: NO los subas al repositorio.** Prefiere YouTube o Vimeo y
  usa `youtube|URL` / `vimeo|URL` en el CSV. Así no inflas la imagen de
  despliegue ni el repo de Git.
- Si un video debe ser local, mantenlo pequeño (< 20 MB aprox.) y en su carpeta
  de proyecto. Recuerda que va dentro de la imagen del contenedor.
- Las **imágenes** sí pueden ir en el repo: son livianas. Reutilízalas y
  comprímelas antes de subirlas (WebP/JPEG optimizado).
- Al desplegar con `docker compose up -d --build frontend`, todo `public/` se
  copia dentro de la imagen y se sirve con el dominio.
