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
          {
            valor: itemsPublicados(resultados[0]).length,
            etiqueta: "Proyectos",
            detalle: "Entregados para clientes y equipo",
            numero: "text-proyectos-orange-dark",
            etiquetaColor: "text-proyectos-orange",
            borde: "border-proyectos-orange-light",
          },
          {
            valor: itemsPublicados(resultados[1]).length,
            etiqueta: "Casos de éxito",
            detalle: "Problemas reales resueltos",
            numero: "text-exito-green-dark",
            etiquetaColor: "text-exito-green",
            borde: "border-exito-green-light",
          },
          {
            valor: itemsPublicados(resultados[2]).length,
            etiqueta: "Publicaciones",
            detalle: "En Tivit Labs",
            numero: "text-labs-celeste-dark",
            etiquetaColor: "text-labs-celeste",
            borde: "border-labs-celeste-light",
          },
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
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div>
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
          </div>

          <div className="hidden lg:block">
            <HeroVisual />
          </div>
        </div>

        {metricas && (
          <dl className="hero-anim mt-12 grid max-w-3xl gap-3 sm:grid-cols-3" style={{ animationDelay: "400ms" }}>
            {metricas.map((metrica) => (
              <div
                key={metrica.etiqueta}
                className={`rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm ${metrica.borde}`}
              >
                <dd className={`text-3xl font-bold ${metrica.numero}`}>{metrica.valor}</dd>
                <dt className={`mt-1 text-xs font-semibold uppercase tracking-wide ${metrica.etiquetaColor}`}>
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

/** Tarjeta visual del Hero: logo TIVIT y chips de las áreas con su color de marca. */
function HeroVisual() {
  const areas = [
    { nombre: "Proyectos", clase: "bg-proyectos-orange-light text-proyectos-orange-dark", dot: "bg-proyectos-orange" },
    { nombre: "Casos", clase: "bg-exito-green-light text-exito-green-dark", dot: "bg-exito-green" },
    { nombre: "Labs", clase: "bg-labs-celeste-light text-labs-celeste-dark", dot: "bg-labs-celeste" },
    { nombre: "PoC", clase: "bg-poc-blue-light text-poc-blue-dark", dot: "bg-poc-blue" },
    { nombre: "Almaviva", clase: "bg-almaviva-blue-light text-almaviva-blue-dark", dot: "bg-almaviva-blue" },
    { nombre: "XMS", clase: "bg-xms-blue-light text-xms-blue-dark", dot: "bg-xms-blue" },
  ];

  return (
    <div
      className="hero-anim relative rounded-3xl border border-tivit-red-light bg-white/90 p-6 shadow-xl backdrop-blur"
      style={{ animationDelay: "250ms" }}
    >
      <img src="/media/logos/logo-tivit.png" alt="TIVIT — Almaviva Group" className="h-12 w-auto" />
      <p className="mt-4 text-sm font-medium text-tivit-ink/70">
        Inteligencia artificial, software y datos.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {areas.map((area) => (
          <div
            key={area.nombre}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold ${area.clase}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${area.dot}`} aria-hidden="true" />
            <span className="truncate">{area.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );
}