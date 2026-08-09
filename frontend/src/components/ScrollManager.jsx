import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router no restaura el scroll por sí solo: al cambiar de ruta mantiene la
 * posición anterior y no salta a los anclas "#seccion". Este componente resuelve
 * ambos casos, respetando a quien prefiere no ver animaciones.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const sinAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = sinAnimacion ? "auto" : "smooth";

    if (hash) {
      const destino = document.querySelector(hash);
      if (destino) {
        destino.scrollIntoView({ behavior });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior });
  }, [pathname, hash]);

  return null;
}
