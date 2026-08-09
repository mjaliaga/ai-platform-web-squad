import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section id="top" className="bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 py-16 md:py-24">
        <span
          className="hero-anim rounded-full bg-tivit-red-light px-4 py-1 text-sm font-semibold text-tivit-red-dark"
          style={{ animationDelay: "0ms" }}
        >
          Equipo TIVIT
        </span>
        <h1
          className="hero-anim max-w-2xl text-4xl font-bold leading-[1.2] text-tivit-red-dark md:text-5xl"
          style={{ animationDelay: "100ms" }}
        >
          Construimos soluciones tecnológicas que impulsan a nuestros clientes
        </h1>
        <p
          className="hero-anim max-w-xl text-base text-tivit-ink/70"
          style={{ animationDelay: "200ms" }}
        >
          Somos el equipo detrás de proyectos de software, datos e infraestructura
          para clientes internos y externos.
        </p>
        <div className="hero-anim flex items-center gap-6" style={{ animationDelay: "300ms" }}>
          <a
            href="#equipo"
            className="rounded-full bg-tivit-red px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-tivit-red-dark active:scale-95 focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2"
          >
            Conoce al equipo
          </a>
          <Link
            to="/proyectos"
            className="group inline-flex items-center gap-2 font-semibold text-tivit-red underline-offset-4 transition hover:text-tivit-red-dark hover:underline focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2"
          >
            Ver proyectos
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
