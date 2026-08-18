import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cargarItems, getColeccion, itemsPublicados } from "../data/contenido";
import { ItemCard } from "./ItemCard";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

/** Destacados de la home: dos proyectos y un caso de éxito recientes. */
export function Destacados() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      cargarItems(getColeccion("proyectos")),
      cargarItems(getColeccion("casos-de-exito")),
    ])
      .then(([proyectos, casos]) => {
        if (!activo) return;
        setItems([
          ...itemsPublicados(proyectos)
            .slice(0, 2)
            .map((item) => ({ item, ruta: "proyectos" })),
          ...itemsPublicados(casos)
            .slice(0, 1)
            .map((item) => ({ item, ruta: "casos-de-exito" })),
        ]);
      })
      .catch(() => {
        if (activo) setItems([]);
      });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <section id="destacados" className="bg-gray-50 py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Lo más reciente" title="Contenido destacado" />
            <Link
              to="/proyectos"
              className="group inline-flex items-center gap-2 text-sm font-bold text-tivit-red transition hover:text-tivit-red-dark"
            >
              Ver todos
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Reveal>
        {items === null ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {items.map(({ item, ruta }) => (
              <ItemCard
                key={item.slug}
                item={item}
                ruta={ruta}
                proyectos={ruta === "proyectos"}
                casosExito={ruta === "casos-de-exito"}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}