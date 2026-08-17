import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Botón flotante para volver al inicio de la página tras hacer scroll. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className="fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-tivit-red text-white shadow-lg shadow-tivit-red/30 transition hover:bg-tivit-red-dark hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}