import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ExternalLink } from "lucide-react";
import { listaColecciones, enlacesExternos } from "../data/contenido";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur transition-shadow ${
        scrolled ? "border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]" : "border-tivit-red-light"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img src="/media/logos/logo-tivit-tile.png" alt="TIVIT — Almaviva Group" className="h-9 w-auto" />
          <span className="hidden border-l border-tivit-red-light pl-3 text-sm font-semibold text-tivit-ink/70 xl:inline">
            Equipo Digital
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-semibold text-tivit-ink lg:flex" aria-label="Secciones">
          {listaColecciones.map((coleccion) => (
            <NavLink
              key={coleccion.ruta}
              to={`/${coleccion.ruta}`}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-tivit-red-light text-tivit-red-dark"
                    : "text-tivit-ink/75 hover:bg-tivit-red-light/60 hover:text-tivit-red"
                }`
              }
            >
              {coleccion.nombre}
            </NavLink>
          ))}
          {enlacesExternos.map((enlace) => (
            <a
              key={enlace.nombre}
              href={enlace.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2 text-tivit-ink/75 hover:bg-tivit-red-light/60 hover:text-tivit-red"
            >
              {enlace.nombre}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ))}
          <NavLink
              to="/portal"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-tivit-red-light text-tivit-red-dark"
                    : "text-tivit-ink/75 hover:bg-tivit-red-light/60 hover:text-tivit-red"
                }`
              }
            >
              Portal
            </NavLink>
        </nav>

        <button
          type="button"
          onClick={() => setAbierto((actual) => !actual)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-tivit-red-light text-tivit-ink transition hover:bg-tivit-red-light/60 lg:hidden"
        >
          {abierto ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {abierto && (
        <div
          id="menu-movil"
          className="border-t border-tivit-red-light bg-white/95 backdrop-blur lg:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4" aria-label="Secciones en móvil">
            {listaColecciones.map((coleccion) => (
              <NavLink
                key={coleccion.ruta}
                to={`/${coleccion.ruta}`}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-tivit-red-light text-tivit-red-dark"
                      : "text-tivit-ink/75 hover:bg-tivit-red-light/60 hover:text-tivit-red"
                  }`
                }
              >
                {coleccion.nombre}
              </NavLink>
            ))}
            {enlacesExternos.map((enlace) => (
              <a
                key={enlace.nombre}
                href={enlace.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold transition text-tivit-ink/75 hover:bg-tivit-red-light/60 hover:text-tivit-red"
              >
                {enlace.nombre}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ))}
            <NavLink
              to="/portal"
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-tivit-red-light text-tivit-red-dark"
                    : "text-tivit-ink/75 hover:bg-tivit-red-light/60 hover:text-tivit-red"
                }`
              }
            >
              Portal
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}