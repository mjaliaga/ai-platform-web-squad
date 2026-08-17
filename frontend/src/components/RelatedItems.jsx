import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cargarItems, getColeccion, itemsPublicados } from "../data/contenido";
import { ItemCard } from "./ItemCard";
import { Eyebrow } from "./SectionHeading";
import { Reveal } from "./Reveal";

/** Navegación de contexto al pie de una ficha: anterior/siguiente y contenido relacionado. */
export function RelatedItems({ ruta, slug }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let activo = true;
    cargarItems(getColeccion(ruta))
      .then((data) => activo && setItems(itemsPublicados(data)))
      .catch(() => activo && setItems([]));
    return () => {
      activo = false;
    };
  }, [ruta]);

  if (!items || items.length <= 1) return null;

  const indice = items.findIndex((item) => item.slug === slug);
  const anterior = indice > 0 ? items[indice - 1] : null;
  const siguiente = indice >= 0 && indice < items.length - 1 ? items[indice + 1] : null;
  const relacionados = items.filter((item) => item.slug !== slug).slice(0, 3);

  return (
    <div className="mt-16 border-t border-tivit-red-light pt-12">
      {(anterior || siguiente) && (
        <Reveal>
          <nav aria-label="Navegar entre elementos" className="grid gap-3 sm:grid-cols-2">
            {anterior ? (
              <Link
                to={`/${ruta}/${anterior.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-tivit-red-light bg-white p-4 transition hover:-translate-y-0.5 hover:border-tivit-red hover:shadow-md"
              >
                <ChevronLeft className="h-5 w-5 shrink-0 text-tivit-red transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-tivit-ink/50">Anterior</span>
                  <span className="block truncate font-semibold text-tivit-red-dark">{anterior.nombreComercial || anterior.name}</span>
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {siguiente ? (
              <Link
                to={`/${ruta}/${siguiente.slug}`}
                className="group flex items-center justify-end gap-3 rounded-2xl border border-tivit-red-light bg-white p-4 text-right transition hover:-translate-y-0.5 hover:border-tivit-red hover:shadow-md"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-tivit-ink/50">Siguiente</span>
                  <span className="block truncate font-semibold text-tivit-red-dark">{siguiente.nombreComercial || siguiente.name}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-tivit-red transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        </Reveal>
      )}

      {relacionados.length > 0 && (
        <Reveal>
          <section className="mt-12">
            <Eyebrow>Contenido relacionado</Eyebrow>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {relacionados.map((item) => (
                <ItemCard
                  key={item.slug}
                  item={item}
                  ruta={ruta}
                  almaviva={ruta === "almaviva"}
                  xms={ruta === "xms"}
                  casosExito={ruta === "casos-de-exito"}
                />
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}