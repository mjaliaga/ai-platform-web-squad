/** Iniciales (máx. 2) a partir de un nombre completo. */
export function iniciales(nombre) {
  return (nombre || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

/** Detección de videos marcadores (demo pendiente) por su URL. */
export function esVideoPlaceholder(video) {
  const url = typeof video === "string" ? video : video?.url;
  return !url || /assistdev-demo|auditia-demo/.test(url);
}