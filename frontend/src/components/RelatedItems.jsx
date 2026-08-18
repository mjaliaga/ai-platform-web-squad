import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cargarItems, getColeccion, itemsPublicados } from "../data/contenido";
import { ItemCard } from "./ItemCard";
import { Eyebrow } from "./SectionHeading";
import { Reveal } from "./Reveal";

/** Acentos de navegación relacionada según la colección de marca. */
const ACENTOS_MARCA = {
  xms: {
    bordeTop: "border-xms-blue-light",
    borde: "border-xms-blue-light hover:border-xms-blue",
    icono: "text-xms-blue",
    titulo: "text-xms-blue-dark",
    eyebrow: "text-xms-blue",
  },
  almaviva: {
    bordeTop: "border-almaviva-blue-light",
    borde: "border-almaviva-blue-light hover:border-almaviva-blue",
    icono: "text-almaviva-blue",
    titulo: "text-almaviva-blue-dark",
    eyebrow: "text-almaviva-blue",
  },
  "casos-de-exito": {
    bordeTop: "border-exito-green-light",
    borde: "border-exito-green-light hover:border-exito-green",
    icono: "text-exito-green",
    titulo: "text-exito-green-dark",
    eyebrow: "text-exito-green",
  },
  laboratorio: {
    bordeTop: "border-labs-celeste-light",
    borde: "border-labs-celeste-light hover:border-labs-celeste",
    icono: "text-labs-celeste",
    titulo: "text-labs-celeste-dark",
    eyebrow: "text-labs-celeste",
  },
  proyectos: {
    bordeTop: "border-proyectos-orange-light",
    borde: "border-proyectos-orange-light hover:border-proyectos-orange",
    icono: "text-proyectos-orange",
    titulo: "text-proyectos-orange-dark",
    eyebrow: "text-proyectos-orange",
  },
  poc: {
    bordeTop: "border-poc-blue-light",
    borde: "border-poc-blue-light hover:border-poc-blue",
    icono: "text-poc-blue",
    titulo: "text-poc-blue-dark",
    eyebrow: "text-poc-blue",
  },
};

/** Navegación de contexto al pie de una ficha: anterior/siguiente y contenido relacionado. */
export function RelatedItems({ ruta, slug }) {
  const acento = ACENTOS_MARCA[ruta] ?? null;
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
    <div className={`mt-16 border-t pt-12 ${acento?.bordeTop ?? "border-tivit-red-light"}`}>
      {(anterior || siguiente) && (
        <Reveal>
          <nav aria-label="Navegar entre elementos" className="grid gap-3 sm:grid-cols-2">
            {anterior ? (
              <Link
                to={`/${ruta}/${anterior.slug}`}
                className={`group flex items-center gap-3 rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md ${acento?.borde ?? "border-tivit-red-light hover:border-tivit-red"}`}
              >
                <ChevronLeft className={`h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1 ${acento?.icono ?? "text-tivit-red"}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-tivit-ink/50">Anterior</span>
                  <span className={`block truncate font-semibold ${acento?.titulo ?? "text-tivit-red-dark"}`}>{anterior.nombreComercial || anterior.name}</span>
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {siguiente ? (
              <Link
                to={`/${ruta}/${siguiente.slug}`}
                className={`group flex items-center justify-end gap-3 rounded-2xl border bg-white p-4 text-right transition hover:-translate-y-0.5 hover:shadow-md ${acento?.borde ?? "border-tivit-red-light hover:border-tivit-red"}`}
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-tivit-ink/50">Siguiente</span>
                  <span className={`block truncate font-semibold ${acento?.titulo ?? "text-tivit-red-dark"}`}>{siguiente.nombreComercial || siguiente.name}</span>
                </span>
                <ChevronRight className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 ${acento?.icono ?? "text-tivit-red"}`} aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        </Reveal>
      )}

      {relacionados.length > 0 && (
        <Reveal>
          <section className="mt-12">
            {acento ? (
              <span className={`text-sm font-semibold uppercase tracking-wide ${acento.eyebrow}`}>
                Contenido relacionado
              </span>
            ) : (
              <Eyebrow>Contenido relacionado</Eyebrow>
            )}
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {relacionados.map((item) => (
                <ItemCard
                  key={item.slug}
                  item={item}
                  ruta={ruta}
                  almaviva={ruta === "almaviva"}
                  xms={ruta === "xms"}
                  casosExito={ruta === "casos-de-exito"}
                  labs={ruta === "laboratorio"}
                  proyectos={ruta === "proyectos"}
                />
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}