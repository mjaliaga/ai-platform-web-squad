import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { listaColecciones } from "../data/contenido";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-tivit-red-light bg-white/90 backdrop-blur transition-shadow ${
        scrolled ? "border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img src="/media/logos/logo-tivit-tile.png" alt="TIVIT — Almaviva Group" className="h-9 w-auto" />
          <span className="hidden border-l border-tivit-red-light pl-3 text-sm font-semibold text-tivit-ink/70 xl:inline">
            Equipo Digital
          </span>
        </Link>

        <nav className="hidden gap-7 text-sm font-semibold text-tivit-ink lg:flex">
          {listaColecciones.map((coleccion) => (
            <NavLink
              key={coleccion.ruta}
              to={`/${coleccion.ruta}`}
              className={({ isActive }) =>
                `underline-offset-8 transition hover:text-tivit-red hover:underline ${
                  isActive ? "text-tivit-red" : ""
                }`
              }
            >
              {coleccion.nombre}
            </NavLink>
          ))}
          <NavLink
            to="/almaviva"
            className={({ isActive }) =>
              `underline-offset-8 transition hover:text-tivit-red hover:underline ${
                isActive ? "text-tivit-red" : ""
              }`
            }
          >
            Almaviva
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
