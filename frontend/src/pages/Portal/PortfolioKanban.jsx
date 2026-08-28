import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar } from "./components/Badges";
import { STAGES, STAGE_COLORS, STAGE_DOT, getNextStages } from "../../lib/portfolioFields";
import { FolderKanban, GripVertical } from "lucide-react";

export function PortfolioKanban() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragged, setDragged] = useState(null);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.listProjects({});
      const items = Array.isArray(data) ? data : (data?.items || []);
      setProjects(items);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function moveStage(project, nextStage) {
    try {
      // Obtener portfolio_data actual para validar
      const currentData = (() => {
        try { return JSON.parse(project.portfolio_data || "{}"); } catch { return {}; }
      })();
      // Intentar transición vía PATCH stage + portfolio_data
      await api.updateProject(project.id, { stage: nextStage, portfolio_data: currentData });
      await refresh();
    } catch (e) {
      alert(e.message || "No se pudo mover. Verifica permisos y criterios de salida.");
    }
  }

  function onDragStart(e, proj) { setDragged(proj); e.dataTransfer.effectAllowed = "move"; }
  function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
  function onDrop(e, stage) {
    e.preventDefault();
    if (dragged && dragged.stage !== stage) {
      const allowed = getNextStages(dragged.stage || "Backlog");
      if (allowed.includes(stage) || isAdmin) {
        // Para Evaluación→Proyecto skip, el backend valida complejidad Baja
        moveStage(dragged, stage);
      } else {
        alert(`Transición no permitida de ${dragged.stage} a ${stage}. Permitidas: ${allowed.join(", ")}`);
      }
    }
    setDragged(null);
  }

  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando portafolio…</div>;
  if (error) return <div className="py-8 text-center text-sm text-alert">{error}</div>;

  const byStage = {};
  STAGES.forEach(s => byStage[s] = projects.filter(p => (p.stage || "Backlog") === s));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tivit-ink">Portafolio — Tablero Kanban</h1>
        <p className="mt-1 text-sm text-tivit-ink/60">Cada tarjeta es un proyecto entero. Arrastra entre etapas si tienes permiso (Sponsor/Tech Lead/Admin). Tareas técnicas viven dentro de la etapa Proyecto.</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <div key={stage} onDragOver={onDragOver} onDrop={(e)=>onDrop(e, stage)} className={`w-72 shrink-0 rounded-xl border p-3 ${STAGE_COLORS[stage]}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-tivit-ink">
                <span className={`h-2 w-2 rounded-full ${STAGE_DOT[stage]}`} /> {stage}
              </h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm">{byStage[stage]?.length||0}</span>
            </div>
            <div className="space-y-2 min-h-32">
              {byStage[stage]?.map(proj => (
                <div key={proj.id} draggable onDragStart={(e)=>onDragStart(e, proj)} className={`group cursor-grab rounded-lg border border-black/10 bg-white p-3 shadow-sm hover:shadow-md ${dragged?.id===proj.id?"opacity-50":""}`}>
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-gray-300 opacity-0 group-hover:opacity-100" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/portal/portfolio/${proj.id}`} className="block truncate text-sm font-semibold text-tivit-ink hover:text-tivit-red">{proj.name}</Link>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${STAGE_COLORS[proj.stage||"Backlog"]}`}>{proj.stage||"Backlog"}</span>
                        {proj.tipo_proyecto && <span className="rounded-full bg-tivit-ink/10 px-1.5 py-0.5 text-[10px]">{proj.tipo_proyecto}</span>}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-tivit-ink/50">
                        <span className="font-mono">{proj.code}</span>
                        {proj.sponsor_id && <span className="truncate">Sponsor</span>}
                      </div>
                      {proj.members?.length>0 && <div className="mt-2 flex gap-1">{proj.members.slice(0,3).map(m=><UserAvatar key={m.user_id} user={{name:m.name, avatar_color:m.avatar_color}} size="xs"/>)}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {byStage[stage]?.length===0 && <div className="rounded-lg border-2 border-dashed border-black/10 p-4 text-center text-xs text-gray-400">Vacío</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Reglas:</strong> Backlog→Evaluación solo Sponsor. Evaluación→PoC solo Tech Lead/Arquitecto. PoC→Proyecto requiere Go + doble firma. Evaluación→Proyecto directo solo si Complejidad Baja. Proyecto→Producción requiere QA+UAT.
      </div>
    </div>
  );
}
