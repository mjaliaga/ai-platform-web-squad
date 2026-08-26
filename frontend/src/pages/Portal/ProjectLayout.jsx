import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { FolderKanban, ArrowLeft, LayoutGrid, Calendar, Activity, Settings, Clock } from "lucide-react";
import { api } from "../../lib/api";

const tabs = [
  { to: "", label: "Resumen", end: true },
  { to: "board", label: "Board", icon: LayoutGrid },
  { to: "time-tracking", label: "Tiempo", icon: Clock },
  { to: "calendar", label: "Calendario", icon: Calendar },
  { to: "activity", label: "Actividad", icon: Activity },
  { to: "sprints", label: "Sprints" },
  { to: "feed", label: "Anuncios" },
  { to: "solicitudes", label: "Solicitudes" },
  { to: "team", label: "Equipo" },
  { to: "settings", label: "Configuración", icon: Settings },
];

export function ProjectLayout() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getProject(id)
      .then(setProject)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="py-8 text-center text-sm text-alert">{error}</div>;
  if (!project) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando proyecto…</div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-tivit-red hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Proyectos
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: project.color }}>
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-tivit-ink">{project.name}</h1>
              {project.code && <span className="font-mono text-xs text-tivit-ink/50">{project.code}</span>}
              <span className="rounded-full bg-tivit-ink/10 px-2 py-0.5 text-[10px] font-semibold text-tivit-ink/60">{project.sector}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-black/5 pb-px text-sm font-medium">
        {tabs.map((t) => {
          const to = t.to === "" ? `/portal/projects/${id}` : `/portal/projects/${id}/${t.to}`;
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={to}
              end={t.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 transition ${
                  isActive
                    ? "border-tivit-red text-tivit-red"
                    : "border-transparent text-tivit-ink/60 hover:border-tivit-ink/20 hover:text-tivit-ink"
                }`
              }
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              {t.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet context={{ project, setProject }} />
    </div>
  );
}