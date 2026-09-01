import { useOutletContext } from "react-router-dom";
import { FolderKanban, FileText, Tag, Building2, Calendar, User, Mail, Globe, FileText as DocIcon, AlertTriangle, Wrench, FlaskConical, FolderOpen, Rocket, Check } from "lucide-react";
import { formatDate } from "./components/Badges";

const TIPO_PROYECTO_LABELS = {
  interno: "Interno",
  comercial: "Comercial",
};

const PRIORIDAD_LABELS = {
  Alta: { label: "Alta", color: "bg-red-50 text-red-700", icon: AlertTriangle },
  Media: { label: "Media", color: "bg-yellow-50 text-yellow-700", icon: AlertTriangle },
  Baja: { label: "Baja", color: "bg-green-50 text-green-700", icon: AlertTriangle },
};

const PAIS_LABELS = {
  Argentina: "🇦🇷 Argentina",
  Brasil: "🇧🇷 Brasil",
  Chile: "🇨🇱 Chile",
  Colombia: "🇨🇴 Colombia",
  México: "🇲🇽 México",
  Perú: "🇵🇪 Perú",
  Uruguay: "🇺🇾 Uruguay",
  Ecuador: "🇪🇨 Ecuador",
  Venezuela: "🇻🇪 Venezuela",
  Bolivia: "🇧🇴 Bolivia",
  Paraguay: "🇵🇾 Paraguay",
  "Costa Rica": "🇨🇷 Costa Rica",
  Panamá: "🇵🇦 Panamá",
  Guatemala: "🇬🇹 Guatemala",
  "El Salvador": "🇸🇻 El Salvador",
  Honduras: "🇭🇳 Honduras",
  Nicaragua: "🇳🇮 Nicaragua",
  "República Dominicana": "🇩🇴 República Dominicana",
  España: "🇪🇸 España",
  "Estados Unidos": "🇺🇸 Estados Unidos",
  Portugal: "🇵🇹 Portugal",
};

const STAGE_LABELS = {
  "Backlog de Propuestas Internas": "Backlog Propuestas Internas",
  "Backlog de Propuestas Comerciales": "Backlog Propuestas Comerciales",
  "Evaluación técnica": "Evaluación Técnica",
  "PoC": "PoC",
  "Proyecto": "Proyecto",
  "Producción": "Producción",
  Backlog: "Backlog",
};

const TSHIRT_LABELS = {
  S: { label: "S", desc: "< 2 semanas" },
  M: { label: "M", desc: "2-4 semanas" },
  L: { label: "L", desc: "1-2 meses" },
  XL: { label: "XL", desc: "> 2 meses" },
};

const ESTADO_DEV_LABELS = {
  "To Do": "Por hacer",
  "In Progress": "En progreso",
  "Code Review": "Revisión de código",
  "Testing": "Pruebas",
  "Planeamiento": "Planeamiento",
  "Desarrollo": "Desarrollo",
  "Desplegado": "Desplegado",
};

function parsePortfolioData(data) {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try {
    let parsed = JSON.parse(data);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch {
    return {};
  }
}

export function ProjectSummary() {
  const { project } = useOutletContext();

  if (!project) {
    return <div className="text-center py-8 text-sm text-tivit-ink/50">Cargando...</div>;
  }

  const portfolioData = parsePortfolioData(project.portfolio_data);

  const tipoLabel = TIPO_PROYECTO_LABELS[project.tipo_proyecto] || project.tipo_proyecto;
  const currentStage = project.stage || project.categoria;
  const stageLabel = STAGE_LABELS[project.categoria] || STAGE_LABELS[project.stage] || project.categoria || project.stage;
  const prioridadInfo = PRIORIDAD_LABELS[portfolioData.prioridad];
  const PrioridadIcon = prioridadInfo?.icon;
  const isEvaluacionTecnica = currentStage === "Evaluación técnica";
  const isPoC = currentStage === "PoC";
  const isProyecto = currentStage === "Proyecto";
  const isProduccion = currentStage === "Producción";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-black/5 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Información del Proyecto</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField icon={FolderKanban} label="Nombre" value={project.name} />
          <InfoField icon={FileText} label="Código" value={project.code || "Sin código"} />
          <InfoField icon={Tag} label="Tipo" value={tipoLabel} />
          <InfoField icon={FileText} label="Stage" value={stageLabel} />
          <InfoField icon={Building2} label="Sector" value={project.sector || "Sin sector"} />
          {prioridadInfo && (
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-lg p-2 ${prioridadInfo.color || "bg-gray-50 text-gray-600"}`}>
                {PrioridadIcon && <PrioridadIcon className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Prioridad</p>
                <p className="mt-0.5 font-medium text-tivit-ink">{prioridadInfo.label}</p>
              </div>
            </div>
          )}
          {portfolioData.country && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">País</p>
                <p className="mt-0.5 font-medium text-tivit-ink">{PAIS_LABELS[portfolioData.country] || portfolioData.country}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isEvaluacionTecnica && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-tivit-ink">
            <Wrench className="h-5 w-5 text-amber-600" />
            Información de Evaluación Técnica
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioData.ingeniero_encargado ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Ingeniero Encargado</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.ingeniero_encargado}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Ingeniero Encargado</p>
                  <p className="mt-0.5 font-medium text-tivit-ink/40">No definido</p>
                </div>
              </div>
            )}
            {portfolioData.tshirt ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Tamaño Estimado</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">
                    {TSHIRT_LABELS[portfolioData.tshirt]?.label || portfolioData.tshirt} — {TSHIRT_LABELS[portfolioData.tshirt]?.desc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Tamaño Estimado</p>
                  <p className="mt-0.5 font-medium text-tivit-ink/40">No definido</p>
                </div>
              </div>
            )}
            {portfolioData.documentacion_drive ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                  <DocIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Documentación Drive</p>
                  <a
                    href={portfolioData.documentacion_drive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Ver documento
                  </a>
                </div>
              </div>
            ) : null}
          </div>
          {portfolioData.riesgos_dependencias ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-tivit-ink">Riesgos y Dependencias</h3>
              <p className="text-sm leading-relaxed text-tivit-ink/70 whitespace-pre-wrap">
                {portfolioData.riesgos_dependencias}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-tivit-ink">Riesgos y Dependencias</h3>
              <p className="text-sm leading-relaxed text-tivit-ink/40 italic">
                No definidos
              </p>
            </div>
          )}
        </div>
      )}

      {isPoC && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-tivit-ink">
            <FlaskConical className="h-5 w-5 text-purple-600" />
            Información de PoC
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioData.hipotesis && (
              <div className="md:col-span-2">
                <h3 className="mb-2 text-sm font-medium text-tivit-ink">Hipótesis a Validar</h3>
                <p className="text-sm leading-relaxed text-tivit-ink/70 whitespace-pre-wrap">{portfolioData.hipotesis}</p>
              </div>
            )}
            {portfolioData.criterios_exito && (
              <div className="md:col-span-2">
                <h3 className="mb-2 text-sm font-medium text-tivit-ink">Criterios de Éxito</h3>
                <p className="text-sm leading-relaxed text-tivit-ink/70 whitespace-pre-wrap">{portfolioData.criterios_exito}</p>
              </div>
            )}
            {(portfolioData.fecha_inicio || portfolioData.fecha_fin) && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-purple-100 p-2 text-purple-700">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Fechas PoC</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">
                    {portfolioData.fecha_inicio || "?"} → {portfolioData.fecha_fin || "?"}
                  </p>
                </div>
              </div>
            )}
            {portfolioData.sponsor_aprueba && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-purple-100 p-2 text-purple-700">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Sponsor Aprueba</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.sponsor_aprueba}</p>
                </div>
              </div>
            )}
            {portfolioData.recursos && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-purple-100 p-2 text-purple-700">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Recursos</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.recursos}</p>
                </div>
              </div>
            )}
            {portfolioData.documentacion_drive && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-purple-100 p-2 text-purple-700">
                  <DocIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Documentación Drive</p>
                  <a
                    href={portfolioData.documentacion_drive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Ver documento
                  </a>
                </div>
              </div>
            )}
          </div>
          {portfolioData.resultados && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-tivit-ink">Resultados / Hallazgos</h3>
              <p className="text-sm leading-relaxed text-tivit-ink/70 whitespace-pre-wrap">{portfolioData.resultados}</p>
            </div>
          )}
        </div>
      )}

      {isProyecto && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-tivit-ink">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            Información del Proyecto
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioData.pm_scrum_master ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-700">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">PM / Scrum Master</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.pm_scrum_master}</p>
                </div>
              </div>
            ) : null}
            {portfolioData.presupuesto ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Presupuesto</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.moneda || ""} {portfolioData.presupuesto}</p>
                </div>
              </div>
            ) : null}
            {portfolioData.estado_dev ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Estado Desarrollo</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{ESTADO_DEV_LABELS[portfolioData.estado_dev] || portfolioData.estado_dev}</p>
                </div>
              </div>
            ) : null}
            {portfolioData.documentacion ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-700">
                  <DocIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Documentación</p>
                  <a
                    href={portfolioData.documentacion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Ver documento
                  </a>
                </div>
              </div>
            ) : null}
          </div>
          {portfolioData.cronograma && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-tivit-ink">Cronograma</h3>
              {(() => {
                let cronogramaObj = portfolioData.cronograma;
                if (typeof cronogramaObj === 'string') {
                  try { cronogramaObj = JSON.parse(cronogramaObj); } catch { return null; }
                }
                if (!cronogramaObj || typeof cronogramaObj !== 'object') return null;
                return (
                  <div className="space-y-3 text-sm">
                    {cronogramaObj.num_sprints && (
                      <p className="font-medium text-tivit-ink">
                        <span className="text-tivit-ink/50">N° Sprints:</span> {cronogramaObj.num_sprints}
                      </p>
                    )}
                    {cronogramaObj.objetivo && (
                      <p className="font-medium text-tivit-ink">
                        <span className="text-tivit-ink/50">Objetivo:</span> {cronogramaObj.objetivo}
                      </p>
                    )}
                    {cronogramaObj.objetivos_secundarios && Array.isArray(cronogramaObj.objetivos_secundarios) && cronogramaObj.objetivos_secundarios.filter(o => o).length > 0 && (
                      <div>
                        <span className="text-tivit-ink/50">Objetivos Secundarios:</span>
                        <ul className="mt-1 space-y-1 pl-4">
                          {cronogramaObj.objetivos_secundarios.filter(o => o).map((obj, i) => (
                            <li key={i} className="list-disc text-tivit-ink/70">• {obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cronogramaObj.sprints && Array.isArray(cronogramaObj.sprints) && cronogramaObj.sprints.length > 0 && (
                      <div>
                        <span className="text-tivit-ink/50">Sprints:</span>
                        <div className="mt-2 space-y-3 pl-4">
                          {cronogramaObj.sprints.filter(s => s && s.num).map((sprint, i) => (
                            <div key={i} className="rounded-lg border border-blue-100 bg-blue-50/30 p-3">
                              <p className="font-semibold text-tivit-ink mb-1">Sprint {sprint.num}</p>
                              {sprint.tareas && Array.isArray(sprint.tareas) && sprint.tareas.filter(t => t).length > 0 && (
                                <ul className="space-y-1 pl-4">
                                  {sprint.tareas.filter(t => t).map((tarea, j) => (
                                    <li key={j} className="list-disc text-tivit-ink/70 text-xs">• {tarea}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {portfolioData.equipo && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-tivit-ink">Equipo</h3>
              {(() => {
                let equipoArr = portfolioData.equipo;
                if (typeof equipoArr === 'string') {
                  try { equipoArr = JSON.parse(equipoArr); } catch { return null; }
                }
                if (!Array.isArray(equipoArr) || equipoArr.length === 0) return null;
                return (
                  <div className="space-y-2">
                    {equipoArr.filter(m => m && (m.usuario_id || m.rol)).map((miembro, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50/30 p-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-tivit-ink">{miembro.usuario_id}</span>
                        {miembro.rol && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {miembro.rol}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {isProduccion && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-tivit-ink">
            <Rocket className="h-5 w-5 text-emerald-600" />
            Información de Producción
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioData.fecha_deploy ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Fecha Deploy</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.fecha_deploy}</p>
                </div>
              </div>
            ) : null}
            {portfolioData.url_produccion ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">URL Producción</p>
                  <a
                    href={portfolioData.url_produccion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                  >
                    Abrir producción
                  </a>
                </div>
              </div>
            ) : null}
            {portfolioData.estado_aceptacion ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Estado Aceptación</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.estado_aceptacion}</p>
                </div>
              </div>
            ) : null}
            {portfolioData.documentacion_final ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Documentación Final</p>
                  <a
                    href={portfolioData.documentacion_final}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                  >
                    Ver documento
                  </a>
                </div>
              </div>
            ) : null}
          </div>
          {portfolioData.notas_release && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-tivit-ink">Notas Release</h3>
              <p className="text-sm leading-relaxed text-tivit-ink/70 whitespace-pre-wrap">{portfolioData.notas_release}</p>
            </div>
          )}
        </div>
      )}

      {portfolioData.nombre_idea && (
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-tivit-ink">Nombre de la Idea</h2>
          <p className="text-sm leading-relaxed text-tivit-ink/70">{portfolioData.nombre_idea}</p>
        </div>
      )}

      {(portfolioData.area || portfolioData.cliente) && (
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-tivit-ink">
            {portfolioData.area ? "Área" : "Cliente"}
          </h2>
          <p className="text-sm leading-relaxed text-tivit-ink/70">
            {portfolioData.area || portfolioData.cliente}
          </p>
        </div>
      )}

      {(portfolioData.usuario_interesado || portfolioData.rol_interesado || portfolioData.correo_interesado) && (
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Usuario Interesado</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {portfolioData.usuario_interesado && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Nombre</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.usuario_interesado}</p>
                </div>
              </div>
            )}
            {portfolioData.rol_interesado && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-purple-50 p-2 text-purple-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Rol</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.rol_interesado}</p>
                </div>
              </div>
            )}
            {portfolioData.correo_interesado && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">Correo</p>
                  <p className="mt-0.5 font-medium text-tivit-ink">{portfolioData.correo_interesado}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {portfolioData.descripcion_problema && (
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-tivit-ink">Descripción del Problema/Necesidad</h2>
          <p className="text-sm leading-relaxed text-tivit-ink/70 whitespace-pre-wrap">
            {portfolioData.descripcion_problema}
          </p>
        </div>
      )}

      {portfolioData.valor_esperado && (
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-tivit-ink">Valor Esperado (ROI / Impacto)</h2>
          <p className="text-sm leading-relaxed text-tivit-ink/70 whitespace-pre-wrap">
            {portfolioData.valor_esperado}
          </p>
        </div>
      )}

      {!isEvaluacionTecnica && !isPoC && portfolioData.documentacion_drive && (
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-tivit-ink">Documentación</h2>
          <a
            href={portfolioData.documentacion_drive}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            <DocIcon className="h-4 w-4" />
            {portfolioData.documentacion_drive}
          </a>
        </div>
      )}

      {project.description && (
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-tivit-ink">Descripción General</h2>
          <p className="text-sm leading-relaxed text-tivit-ink/70 whitespace-pre-wrap">
            {project.description}
          </p>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Color del Proyecto</h2>
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: project.color || "#dc2626" }}
            >
              <FolderKanban className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-tivit-ink">Color asignado</p>
              <p className="mt-0.5 font-mono text-xs text-tivit-ink/50">
                {project.color || "#dc2626"}
              </p>
            </div>
          </div>
        </div>

        {project.created_at && (
          <div className="rounded-xl border border-black/5 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Fecha de Creación</h2>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-50 p-2 text-gray-600">
                <Calendar className="h-4 w-4" />
              </div>
              <p className="font-medium text-tivit-ink">
                {formatDate(project.created_at)}
              </p>
            </div>
          </div>
        )}
      </div>

      {project.members && project.members.length > 0 && (
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Equipo del Proyecto</h2>
          <div className="flex flex-wrap gap-2">
            {project.members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm"
              >
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{member.name || member.user_id}</span>
                <span className="text-xs text-gray-500">({member.role})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-tivit-ink/50">{label}</p>
        <p className="mt-0.5 font-medium text-tivit-ink">{value}</p>
      </div>
    </div>
  );
}
