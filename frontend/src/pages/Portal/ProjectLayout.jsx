import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { FolderKanban, ArrowLeft, Calendar, Settings, LayoutList, Globe } from "lucide-react";
import { api } from "../../lib/api";

const tabs = [
  { to: "", label: "Backlog", end: true },
  { to: "calendar", label: "Calendario", icon: Calendar },
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

  if (error) {
    const isForbidden = error.includes("acceso") || error.includes("FORBIDDEN") || error.includes("403");
    if (isForbidden) {
      return (
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="text-sm text-alert">Acceso restringido</div>
          <p className="mt-1 text-sm text-tivit-ink/60">{error}</p>
          <Link to="/portal/portfolio" className="mt-4 inline-flex text-sm font-semibold text-tivit-red hover:underline">Volver al Portafolio</Link>
        </div>
      );
    }
    return <div className="py-8 text-center text-sm text-alert">{error}</div>;
  }
  if (!project) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando elemento del portafolio…</div>;

  let portfolioData = {};
  try {
    portfolioData = project.portfolio_data ? JSON.parse(project.portfolio_data) : {};
  } catch (e) {
    portfolioData = {};
  }
  const country = portfolioData.country;

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/portfolio" className="inline-flex items-center gap-1.5 text-xs font-semibold text-tivit-red hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Portafolio
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: project.color }}>
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-tivit-ink">{project.name}</h1>
              {project.code && <span className="font-mono text-xs text-tivit-ink/50">{project.code}</span>}
              {project.categoria && <span className="rounded-full border bg-white px-2 py-0.5 text-[10px] font-semibold text-tivit-ink/60">{project.categoria}</span>}
              <span className="rounded-full bg-tivit-ink/10 px-2 py-0.5 text-[10px] font-semibold text-tivit-ink/60">{project.sector}</span>
              {country && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <Globe className="h-3 w-3" />
                  {country}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-black/5 pb-px text-sm font-medium">
        {tabs.map((t) => {
          const to = t.to === "" ? `/portal/portfolio/${id}` : `/portal/portfolio/${id}/${t.to}`;
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