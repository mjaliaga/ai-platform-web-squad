import { Link } from "react-router-dom";
import { Mail, ExternalLink } from "lucide-react";
import { listaColecciones } from "../data/contenido";

function LinkedInIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-label="LinkedIn"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="border-t border-[#2D3136] bg-tivit-ink text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-10 px-6 py-12 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-start gap-3 md:flex-1">
            <a
              href="https://latam.tivit.com/"
              target="_blank"
              rel="noreferrer"
              className="transition-opacity hover:opacity-90"
            >
              <img
                src="/media/logos/logo-tivit-blanco.png"
                alt="TIVIT — Almaviva Group"
                className="h-8 w-auto"
              />
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              Equipo de inteligencia artificial, software y datos de Almaviva
              Group.
            </p>
          </div>

          <nav aria-label="Secciones del sitio" className="md:flex-1 md:text-center">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Secciones
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {listaColecciones.map((coleccion) => (
                <li key={coleccion.ruta}>
                  <Link
                    to={`/${coleccion.ruta}`}
                    className="text-white/80 underline-offset-4 transition hover:text-white hover:underline"
                  >
                    {coleccion.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:flex md:flex-1 md:flex-col md:items-end">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Contacto
            </h3>
            <ul className="mt-3 flex flex-col gap-3 text-sm text-white/80">
              <li>
                <a
                  href="mailto:contacto@tivit.com"
                  className="group inline-flex items-center gap-2 underline-offset-4 transition hover:text-white hover:underline"
                >
                  <Mail className="h-4 w-4 text-white/60 transition group-hover:text-white" />
                  contacto@tivit.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.almaviva.it/en_GB"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 underline-offset-4 transition hover:text-white hover:underline"
                >
                  <ExternalLink className="h-4 w-4 text-white/60 transition group-hover:text-white" />
                  Almaviva Group
                </a>
              </li>
            </ul>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                Redes sociales
              </p>
              <a
                href="https://www.linkedin.com/company/tivit"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-tivit-red-dark py-3">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 text-sm text-white md:flex-row">
          <p className="font-medium">© {new Date().getFullYear()} Equipo TIVIT</p>
          <div className="flex items-center gap-6">
            <a
              href="https://latam.tivit.com/"
              target="_blank"
              rel="noreferrer"
              className="text-white/80 underline-offset-4 transition hover:text-white hover:underline"
            >
              Política de privacidad
            </a>
            <a
              href="https://www.almaviva.it/en_GB"
              target="_blank"
              rel="noreferrer"
              className="text-white/80 underline-offset-4 transition hover:text-white hover:underline"
            >
              Términos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
