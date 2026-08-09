/** Etiqueta superior pequeña, estilo uniforme en todo el sitio. */
export function Eyebrow({ children }) {
  return (
    <span className="text-sm font-semibold uppercase tracking-wide text-tivit-red">
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title }) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-1 text-3xl font-bold text-tivit-red-dark">{title}</h2>
    </div>
  );
}
