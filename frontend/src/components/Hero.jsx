import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getColeccion, cargarItems, itemsPublicados } from "../data/contenido";

export function Hero() {
  const [metricas, setMetricas] = useState(null);

  useEffect(() => {
    let activo = true;
    const colecciones = ["proyectos", "casos-de-exito", "laboratorio"];
    Promise.all(colecciones.map((ruta) => cargarItems(getColeccion(ruta))))
      .then((resultados) => {
        if (!activo) return;
        setMetricas([
          { valor: itemsPublicados(resultados[0]).length, etiqueta: "Proyectos", detalle: "Entregados para clientes y equipo" },
          { valor: itemsPublicados(resultados[1]).length, etiqueta: "Casos de éxito", detalle: "Problemas reales resueltos" },
          { valor: itemsPublicados(resultados[2]).length, etiqueta: "Publicaciones", detalle: "En nuestro laboratorio de IA" },
        ]);
      })
      .catch(() => activo && setMetricas([]));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <section id="top" className="relative overflow-hidden bg-white">
      <div className="hero-mesh" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-24">
        <span
          className="hero-anim inline-flex items-center gap-2 rounded-full border border-tivit-red/15 bg-tivit-red-light/60 px-4 py-1 text-sm font-semibold text-tivit-red-dark"
          style={{ animationDelay: "0ms" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tivit-red opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-tivit-red" />
          </span>
          Equipo TIVIT
        </span>
        <h1
          className="hero-anim mt-6 max-w-3xl text-4xl font-bold leading-[1.15] text-tivit-red-dark md:text-5xl"
          style={{ animationDelay: "100ms" }}
        >
          Construimos soluciones tecnológicas que <span className="text-tivit-red">impulsan</span> a nuestros clientes
        </h1>
        <p
          className="hero-anim mt-5 max-w-xl text-base leading-relaxed text-tivit-ink/70 md:text-lg"
          style={{ animationDelay: "200ms" }}
        >
          Somos el equipo detrás de proyectos de software, datos e inteligencia
          artificial para clientes internos y externos de Almaviva Group.
        </p>
        <div className="hero-anim mt-8 flex flex-wrap items-center gap-6" style={{ animationDelay: "300ms" }}>
          <a
            href="#equipo"
            className="rounded-full bg-tivit-red px-6 py-3 font-semibold text-white shadow-sm shadow-tivit-red/25 transition hover:bg-tivit-red-dark hover:shadow-md hover:shadow-tivit-red/30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2"
          >
            Conoce al equipo
          </a>
          <Link
            to="/proyectos"
            className="group inline-flex items-center gap-2 rounded-full border border-tivit-red/25 bg-white/70 px-6 py-3 font-semibold text-tivit-red backdrop-blur transition hover:border-tivit-red hover:bg-tivit-red-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2"
          >
            Ver proyectos
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        {metricas && (
          <dl className="hero-anim mt-12 grid max-w-3xl gap-3 sm:grid-cols-3" style={{ animationDelay: "400ms" }}>
            {metricas.map((metrica) => (
              <div
                key={metrica.etiqueta}
                className="rounded-2xl border border-tivit-red-light bg-white/80 p-4 shadow-sm backdrop-blur-sm"
              >
                <dd className="text-3xl font-bold text-tivit-red-dark">{metrica.valor}</dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-tivit-red">
                  {metrica.etiqueta}
                </dt>
                <p className="mt-1 text-xs text-tivit-ink/60">{metrica.detalle}</p>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}