import { Link } from "react-router-dom";
import { FolderKanban, ChevronRight, Trash2 } from "lucide-react";
import { UserAvatar } from "./Badges";
import { STAGES, STAGE_COLORS, STAGE_DOT } from "../../../lib/portfolioFields";

/**
 * PortfolioGrid — grilla del portafolio (extraído de Projects.jsx god-component)
 * Responsabilidades:
 * - buscador, filtros por sector/stage (chips)
 * - vista agrupada por etapa (sin filtro) y vista filtrada/búsqueda
 * Mantiene clases Tailwind originales para no romper responsividad.
 */
// eslint-disable-next-line import/prefer-default-export
export function PortfolioGrid({
  projects = [],
  allItems = [],
  groupedByStage = [],
  searchQuery = "",
  setSearchQuery,
  filterSector = "all",
  setFilterSector,
  filterStage = "all",
  setFilterStage,
  isAdmin = false,
  handleDeleteProject,
}) {
  return (
    <>
      {/* Search and filters — Portafolio */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar en portafolio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-tivit-red-light bg-white px-3.5 py-2 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
          />
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="rounded-lg border border-tivit-red-light bg-white px-2 py-1.5 text-xs font-medium text-tivit-ink outline-none focus:border-tivit-red"
          >
            <option value="all">Todos los sectores</option>
            <option value="Proyecto">Proyecto</option>
            <option value="PoC">PoC</option>
            <option value="Laboratorio">Laboratorio</option>
          </select>
        </div>
        {/* Chips de etapas — Stage profesional */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStage("all")}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filterStage === "all" ? "bg-tivit-ink text-white border-tivit-ink" : "bg-white text-tivit-ink/70 border-black/10 hover:border-tivit-red/30"}`}
          >
            Todas ({projects.length})
          </button>
          {STAGES.map((st) => {
            const count = projects.filter((p) => (p.stage || (p.categoria?.startsWith("Backlog") ? "Backlog" : p.categoria) || "Backlog") === st).length;
            return (
              <button
                key={st}
                onClick={() => setFilterStage(st)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${filterStage === st ? "bg-tivit-red text-white border-tivit-red" : `${STAGE_COLORS[st]} border`}`}
              >
                <span className={`h-2 w-2 rounded-full ${STAGE_DOT[st]}`} /> {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Vista agrupada por etapa cuando no hay filtro específico */}
      {!groupedByStage.length ? null : null}
      {filterStage === "all" && !searchQuery && filterSector === "all" && groupedByStage.length > 0 && (
        <div className="mt-8 space-y-8">
          {groupedByStage.map(({ stage, items }) => (
            <section key={stage}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STAGE_DOT[stage]}`} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-tivit-ink">{stage}</h2>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STAGE_COLORS[stage]}`}>{items.length}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => {
                  const pct = item.task_count ? Math.round((item.done_count / item.task_count) * 100) : 0;
                  return (
                    <Link
                      key={`g-${stage}-i-${item.id}`}
                      to={`/portal/portfolio/${item.id}`}
                      className="group relative rounded-2xl border border-black/5 bg-white p-5 transition hover:border-tivit-red/20 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: item.color }}>
                          <FolderKanban className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-tivit-ink">{item.name}</h3>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STAGE_COLORS[item.stage] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                              {item.stage === "Backlog" ? (item.tipo_proyecto === "comercial" ? "Comercial" : "Interno") : item.stage}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-tivit-ink/50">
                            {item.code && <span className="font-mono">{item.code}</span>}
                            <span>·</span>
                            <span>{item.task_count} tareas</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteProject(e, item.id, item.name)}
                              title="Eliminar elemento"
                              className="rounded-lg p-1.5 text-tivit-ink/30 transition hover:bg-alert/10 hover:text-alert"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <ChevronRight className="h-4 w-4 text-tivit-ink/30" />
                        </div>
                      </div>
                      {item.members?.length > 0 && (
                        <div className="mt-3 flex gap-1">
                          {item.members.slice(0, 4).map((m) => (
                            <UserAvatar key={m.user_id} user={{ name: m.name, avatar_color: m.avatar_color }} size="sm" />
                          ))}
                        </div>
                      )}
                      {item.task_count > 0 && (
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
                          <div className="h-full rounded-full bg-tivit-red" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Grid para vista filtrada / búsqueda */}
      {(filterStage !== "all" || searchQuery || filterSector !== "all") && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {allItems.map((item) => {
            const pct = item.task_count ? Math.round((item.done_count / item.task_count) * 100) : 0;
            return (
              <Link
                key={`i-${item.id}`}
                to={`/portal/portfolio/${item.id}`}
                className="group relative rounded-2xl border border-black/5 bg-white p-5 transition hover:border-tivit-red/20 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: item.color }}>
                    <FolderKanban className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold text-tivit-ink">{item.name}</h2>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STAGE_COLORS[item.stage] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {item.stage === "Backlog" ? (item.tipo_proyecto === "comercial" ? "Comercial" : "Interno") : item.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.code && <span className="font-mono text-xs text-tivit-ink/50">{item.code}</span>}
                      {item.sector && <span className="rounded-full bg-tivit-ink/10 px-2 py-0.5 text-xs font-semibold text-tivit-ink/60">{item.sector}</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-tivit-ink/50">{item.task_count} tarea{item.task_count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(e, item.id, item.name)}
                        title="Eliminar elemento"
                        className="rounded-lg p-1.5 text-tivit-ink/30 transition hover:bg-alert/10 hover:text-alert"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronRight className="h-5 w-5 shrink-0 text-tivit-ink/30" aria-hidden="true" />
                  </div>
                </div>
                {item.members && item.members.length > 0 && (
                  <div className="mt-3 flex items-center gap-1">
                    {item.members.slice(0, 4).map((m) => (
                      <UserAvatar key={m.user_id} user={{ name: m.name, avatar_color: m.avatar_color }} size="sm" />
                    ))}
                    {item.members.length > 4 && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-tivit-ink/10 text-xs font-bold text-tivit-ink/60">
                        +{item.members.length - 4}
                      </span>
                    )}
                  </div>
                )}
                {item.task_count > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-tivit-ink/60">
                      <span>{item.done_count} completadas</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5">
                      <div className="h-full rounded-full bg-tivit-red" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
