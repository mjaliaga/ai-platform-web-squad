/**
 * Reproductor del video demo de un proyecto.
 * Soporta YouTube, Vimeo y archivos de video locales; si no hay video definido
 * muestra un marcador con la indicación de cómo agregarlo.
 */

function urlEmbedYoutube(url) {
  // Acepta https://youtu.be/ID, https://www.youtube.com/watch?v=ID y /embed/ID
  const porId = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/);
  return porId ? `https://www.youtube-nocookie.com/embed/${porId[1]}` : url;
}

function urlEmbedVimeo(url) {
  const porId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return porId ? `https://player.vimeo.com/video/${porId[1]}` : url;
}

function urlEmbedDrive(url) {
  // Acepta https://drive.google.com/file/d/ID y /drive/folders/ID
  const porArchivo = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (porArchivo) return `https://drive.google.com/file/d/${porArchivo[1]}/preview`;
  const porCarpeta = url.match(/drive\.google\.com\/drive\/folders\/([\w-]+)/);
  if (porCarpeta) return `https://drive.google.com/embeddedfolderview?id=${porCarpeta[1]}`;
  return url;
}

export function DemoVideo({ demo, titulo }) {
  if (!demo) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-tivit-red-light bg-tivit-red-light/30 px-6 text-center">
        <svg
          className="h-12 w-12 text-tivit-red/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
        </svg>
        <p className="font-semibold text-tivit-red-dark">Video demo pendiente</p>
        <p className="max-w-md text-sm text-tivit-ink/60">
          Para agregarlo, define el campo <code className="rounded bg-white px-1 py-0.5 text-xs">demo</code> de
          esta entrada en <code className="rounded bg-white px-1 py-0.5 text-xs">src/data/contenido.js</code>.
        </p>
      </div>
    );
  }

  if (demo.tipo === "mp4" || demo.tipo === "archivo") {
    return (
      <video
        controls
        preload="metadata"
        poster={demo.poster}
        className="aspect-video w-full rounded-2xl bg-black shadow-sm"
      >
        <source src={demo.url} type="video/mp4" />
        Tu navegador no puede reproducir este video.
      </video>
    );
  }

  if (demo.tipo === "drive") {
    return (
      <iframe
        src={urlEmbedDrive(demo.url)}
        title={`Video demo de ${titulo}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-2xl border-0 bg-black shadow-sm"
      />
    );
  }

  const src = demo.tipo === "vimeo" ? urlEmbedVimeo(demo.url) : urlEmbedYoutube(demo.url);

  return (
    <iframe
      src={src}
      title={`Video demo de ${titulo}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-2xl border-0 bg-black shadow-sm"
    />
  );
}
