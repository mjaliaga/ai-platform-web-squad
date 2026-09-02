import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { enlacesExternos } from "../data/contenido";
import { Reveal } from "./Reveal";

/** Banda de cierre con llamadas a la acción antes del footer. */
export function CtaFinal() {
  const repositorio = enlacesExternos[0]?.url;

  return (
    <section className="relative overflow-hidden bg-tivit-ink py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-tivit-red/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-exito-green/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <span className="text-sm font-semibold uppercase tracking-wide text-tivit-red-light">
            ¿Siguiente paso?
          </span>
          <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">
            ¿Listo para explorar lo que construimos?
          </h2>
          <p className="mt-3 text-white/70">
            Accede al repositorio compartido, revisa nuestros proyectos o entra al portal del equipo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {repositorio && (
              <a
                href={repositorio}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-tivit-red-dark shadow-sm transition hover:bg-tivit-red-light active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-tivit-ink"
              >
                Repositorio
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            <Link
              to="/proyectos"
              className="inline-flex items-center gap-2 rounded-full bg-tivit-red px-6 py-3 font-semibold text-white shadow-sm shadow-tivit-red/30 transition hover:bg-tivit-red-dark active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2 focus-visible:ring-offset-tivit-ink"
            >
              Ver proyectos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/portal"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:border-white hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-tivit-ink"
            >
              Portal del equipo
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}