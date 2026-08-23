import { useState } from "react";
import { Eyebrow } from "../SectionHeading";
import { Reveal } from "../Reveal";

/** Normaliza un item de galería que puede venir como string (datos estáticos)
 *  o como objeto `{url, alt}` (datos del CMS) a una URL + alt. */
function normalizarImagen(imagen) {
  if (imagen === null || imagen === undefined) return null;
  if (typeof imagen === "string") return { src: imagen, alt: "" };
  if (typeof imagen === "object") {
    if ("url" in imagen) return { src: String(imagen.url ?? ""), alt: String(imagen.alt ?? "") };
    if ("value" in imagen) return { src: String(imagen.value ?? ""), alt: "" };
  }
  return null;
}

export function Galeria({ imagenes }) {
  const items = (imagenes || []).map(normalizarImagen).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <Reveal>
      <section className="pt-14">
        <Eyebrow>Galería</Eyebrow>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {items.map((img, idx) => (
            <ImagenGaleria key={`${idx}-${img.src}`} src={img.src} alt={img.alt} />
          ))}
        </div>
      </section>
    </Reveal>
  );
}

function ImagenGaleria({ src, alt }) {
  const [visible, setVisible] = useState(true);
  if (!visible || !src) return null;

  return (
    <img
      src={src}
      alt={alt || ""}
      width={640}
      height={360}
      loading="lazy"
      onError={() => setVisible(false)}
      className="aspect-video w-full rounded-2xl object-cover shadow-sm"
    />
  );
}