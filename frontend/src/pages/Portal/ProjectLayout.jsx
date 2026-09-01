import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { FolderKanban, ArrowLeft, Calendar, Settings, Globe, LayoutDashboard, ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import { STAGES } from "../../lib/portfolioFields";
import { ProjectSummary } from "./ProjectSummary";
import { ModalEvaluacionTecnica } from "./ModalEvaluacionTecnica";
import { ModalPoC } from "./ModalPoC";
import { ModalProyecto } from "./ModalProyecto";
import { ModalProduccion } from "./ModalProduccion";

const tabs = [
  { to: "summary", label: "Resumen", icon: LayoutDashboard },
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
  const [showMoveToET, setShowMoveToET] = useState(false);
  const [showMoveToPoC, setShowMoveToPoC] = useState(false);
  const [showMoveToProyecto, setShowMoveToProyecto] = useState(false);
  const [showMoveToProduccion, setShowMoveToProduccion] = useState(false);

  useEffect(() => {
    api
      .getProject(id)
      .then((proj) => {
        setProject(proj);
        if (proj.stage && proj.categoria && proj.stage !== proj.categoria) {
          api.updateProject(proj.id, { categoria: proj.stage }).catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
  }, [id]);

  function handleMoveToETSuccess() {
    api.getProject(id).then(setProject).catch(() => {});
  }

  function handleMoveToPoCSuccess() {
    api.getProject(id).then(setProject).catch(() => {});
  }

  function handleMoveToProyectoSuccess() {
    api.getProject(id).then(setProject).catch(() => {});
  }

  function handleMoveToProduccionSuccess() {
    api.getProject(id).then(setProject).catch(() => {});
  }

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
  // Single source of truth: STAGES de portfolioFields.js + legacy categorias para compatibilidad
  const VALID_STAGES = [...new Set([...STAGES, "Backlog de Propuestas Internas", "Backlog de Propuestas Comerciales"])];
  const rawStage = project.stage || project.categoria || "Backlog";
  const currentStage = VALID_STAGES.includes(rawStage) ? rawStage : (project.categoria || "Backlog");
  const isBacklog = currentStage === "Backlog" || (project.categoria && project.categoria.includes("Backlog"));
  const isEvaluacionTecnica = currentStage === "Evaluación técnica";
  const isPoC = currentStage === "PoC";
  const isProyecto = currentStage === "Proyecto";
  const isProduccion = currentStage === "Producción";

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/portfolio" className="inline-flex items-center gap-1.5 text-xs font-semibold text-tivit-red hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Portafolio
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: project.color }}>
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 truncate text-lg font-bold text-tivit-ink sm:text-xl">{project.name}</h1>
                {project.code && <span className="font-mono text-xs text-tivit-ink/50">{project.code}</span>}
                {currentStage && <span className="rounded-full border bg-white px-2 py-0.5 text-[10px] font-semibold text-tivit-ink/60">{currentStage}</span>}
                {country && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <Globe className="h-3 w-3" />
                    {country}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isBacklog && (
              <button
                onClick={() => setShowMoveToET(true)}
                className="flex items-center gap-2 rounded-xl bg-tivit-red px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-tivit-red-dark sm:px-4 sm:text-sm"
              >
                <ArrowRight className="h-4 w-4" />
                <span className="hidden sm:inline">Mover a ET</span>
                <span className="sm:hidden">ET</span>
              </button>
            )}
            {isEvaluacionTecnica && (
              <>
                <button
                  onClick={() => setShowMoveToPoC(true)}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 sm:px-4 sm:text-sm"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span className="hidden sm:inline">Mover a PoC</span>
                  <span className="sm:hidden">PoC</span>
                </button>
                <button
                  onClick={() => setShowMoveToProyecto(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-4 sm:text-sm"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span className="hidden sm:inline">Mover a Proyecto</span>
                  <span className="sm:hidden">Proyecto</span>
                </button>
              </>
            )}
            {isPoC && (
              <button
                onClick={() => setShowMoveToProyecto(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-4 sm:text-sm"
              >
                <ArrowRight className="h-4 w-4" />
                <span className="hidden sm:inline">Mover a Proyecto</span>
                <span className="sm:hidden">Proyecto</span>
              </button>
            )}
            {isProyecto && (
              <button
                onClick={() => setShowMoveToProduccion(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:px-4 sm:text-sm"
              >
                <ArrowRight className="h-4 w-4" />
                <span className="hidden sm:inline">Mover a Producción</span>
                <span className="sm:hidden">Producción</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <nav
          aria-label="Navegación del proyecto"
          className="flex snap-x gap-1 overflow-x-auto border-b border-black/5 pb-px text-sm font-medium scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent scrollbar-none"
        >
          {tabs.map((t) => {
            const to = t.to === "" ? `/portal/portfolio/${id}` : `/portal/portfolio/${id}/${t.to}`;
            const Icon = t.icon;
            return (
              <NavLink
                key={t.to}
                to={to}
                end={t.end}
                aria-label={t.label}
                className={({ isActive }) =>
                  `flex snap-start items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-1 ${
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-8 bg-gradient-to-l from-white to-transparent sm:block"
        />
      </div>

      <Outlet context={{ project, setProject }} />

      <ModalEvaluacionTecnica
        isOpen={showMoveToET}
        onClose={() => setShowMoveToET(false)}
        project={project}
        onSuccess={handleMoveToETSuccess}
      />

      <ModalPoC
        isOpen={showMoveToPoC}
        onClose={() => setShowMoveToPoC(false)}
        project={project}
        onSuccess={handleMoveToPoCSuccess}
      />

      <ModalProyecto
        isOpen={showMoveToProyecto}
        onClose={() => setShowMoveToProyecto(false)}
        project={project}
        onSuccess={handleMoveToProyectoSuccess}
      />

      <ModalProduccion
        isOpen={showMoveToProduccion}
        onClose={() => setShowMoveToProduccion(false)}
        project={project}
        onSuccess={handleMoveToProduccionSuccess}
      />
    </div>
  );
}
