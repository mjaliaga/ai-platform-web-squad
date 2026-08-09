import { Link } from "react-router-dom";
import { Map, FolderOpen, Rocket } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Panel() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-tivit-red-light/30">
      <header className="border-b border-tivit-red-light bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/media/logos/logo-tivit-tile.png" alt="TIVIT — Almaviva Group" className="h-9 w-auto" />
            <span className="border-l border-tivit-red-light pl-3 text-sm font-semibold text-tivit-ink/70">
              Panel interno
            </span>
          </Link>
          <button
            onClick={logout}
            className="rounded-full border border-tivit-red px-4 py-2 text-sm font-semibold text-tivit-red transition hover:bg-tivit-red-light"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-tivit-red-dark">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tivit-red-light text-tivit-red">
            <span className="text-sm font-semibold">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </span>
          </span>
          Hola, {user?.name}
        </h1>
        <p className="mt-1 text-tivit-ink/60">
          Este es el panel interno del equipo — contenido de ejemplo, listo para
          reemplazarse con recursos reales (documentos, roadmap, proyectos internos, etc.).
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <PanelCard icon={Map} title="Roadmap del equipo" description="Próximos hitos y prioridades trimestrales." />
          <PanelCard icon={FolderOpen} title="Documentación interna" description="Guías técnicas, procesos y onboarding." />
          <PanelCard icon={Rocket} title="Proyectos internos" description="Detalle de iniciativas internas en curso." />
        </div>
      </main>
    </div>
  );
}

function PanelCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tivit-red-light text-tivit-red">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-semibold text-tivit-red-dark">{title}</h3>
      <p className="mt-2 text-sm text-tivit-ink/70">{description}</p>
    </div>
  );
}
