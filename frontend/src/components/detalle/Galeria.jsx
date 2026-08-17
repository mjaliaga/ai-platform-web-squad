import { useState } from "react";
import { Eyebrow } from "../SectionHeading";
import { Reveal } from "../Reveal";

export function Galeria({ imagenes }) {
  return (
    <Reveal>
      <section className="pt-14">
        <Eyebrow>Galería</Eyebrow>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {imagenes.map((imagen) => (
            <ImagenGaleria key={imagen} src={imagen} />
          ))}
        </div>
      </section>
    </Reveal>
  );
}

function ImagenGaleria({ src }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <img
      src={src}
      alt=""
      width={640}
      height={360}
      loading="lazy"
      onError={() => setVisible(false)}
      className="aspect-video w-full rounded-2xl object-cover shadow-sm"
    />
  );
}