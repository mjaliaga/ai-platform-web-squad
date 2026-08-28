import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, FolderKanban, ChevronRight, Edit3, Trash2, Archive, UserPlus, X, Globe, Clipboard, Check, AlertCircle, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { TypeBadge, StatusBadge, PriorityBadge, UserAvatar, formatDate, formatRelative } from "./components/Badges";
import { STAGES, STAGE_COLORS, STAGE_DOT, FIELD_DEFS, PAISES } from "../../lib/portfolioFields";

function parseGoals(goal) {
  if (!goal) return [];
  if (Array.isArray(goal)) return goal.filter(Boolean);
  try {
    const parsed = JSON.parse(goal);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [String(parsed)];
  } catch {
    return [goal];
  }
}

const PROJECT_COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#65a30d",
];

// Portafolio — pipeline profesional (single source of truth, sync con backend PORTFOLIO_CATEGORIAS)
export const PORTFOLIO_CATEGORIAS = [
  "Backlog de Propuestas Internas",
  "Backlog de Propuestas Comerciales",
  "Evaluación técnica",
  "PoC",
  "Proyecto",
  "Producción",
];

export const CATEGORIA_COLORS = {
  "Backlog de Propuestas Internas": "bg-slate-100 text-slate-700 border-slate-200",
  "Backlog de Propuestas Comerciales": "bg-blue-50 text-blue-700 border-blue-200",
  "Evaluación técnica": "bg-amber-50 text-amber-700 border-amber-200",
  "PoC": "bg-purple-50 text-purple-700 border-purple-200",
  "Proyecto": "bg-tivit-red/10 text-tivit-red border-tivit-red/20",
  "Producción": "bg-emerald-50 text-emerald-700 border-emerald-200",
};
export const CATEGORIA_DOT = {
  "Backlog de Propuestas Internas": "bg-slate-400",
  "Backlog de Propuestas Comerciales": "bg-blue-500",
  "Evaluación técnica": "bg-amber-500",
  "PoC": "bg-purple-500",
  "Proyecto": "bg-tivit-red",
  "Producción": "bg-emerald-500",
};

const ROLE_LABELS = {
  lead: "Líder",
  arquitecto: "Arquitecto",
  dev: "Desarrollador",
  design: "Diseño",
  qa: "QA",
  viewer: "Observador",
};

const ROLE_COLORS = {
  lead: "bg-tivit-red/10 text-tivit-red",
  arquitecto: "bg-indigo-100 text-indigo-700",
  dev: "bg-blue-100 text-blue-700",
  design: "bg-purple-100 text-purple-700",
  qa: "bg-amber-100 text-amber-700",
  viewer: "bg-gray-100 text-gray-600",
};

const ROLE_BORDER_COLORS = {
  lead: "border-l-tivit-red",
  arquitecto: "border-l-indigo-500",
  dev: "border-l-blue-500",
  design: "border-l-purple-500",
  qa: "border-l-amber-500",
  viewer: "border-l-gray-400",
};

const ROLE_HIERARCHY = { lead: 0, arquitecto: 1, dev: 2, design: 3, qa: 4, viewer: 5 };

function getCamposPendientes(item) {
  const d = item.data || {};
  const obligatorios = ["nombreComercial", "tipo", "estado", "descripcion"];
  const opcionalesClave = ["descripcionLarga", "equipo", "stack", "queHicimos", "resultados"];
  const faltantes = [];
  for (const k of obligatorios) {
    if (!d[k]) faltantes.push(k);
  }
  for (const k of opcionalesClave) {
    if (!d[k] || (Array.isArray(d[k]) && d[k].length === 0)) faltantes.push(k);
  }
  return faltantes;
}

export function Projects() {
  const { id } = useParams();
  const location = useLocation();
  const outletCtx = useOutletContext();
  const inProjectLayout = !!outletCtx;
  const isTeamTab = location.pathname.endsWith("/team");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [projects, setProjects] = useState([]);
  const [current, setCurrent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [projectSprint, setProjectSprint] = useState(null);
  const [projectAnnouncements, setProjectAnnouncements] = useState([]);
  const [pendingSolicitudes, setPendingSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#dc2626", sector: "Proyecto", code: "", po_user_id: "", categoria: "Backlog de Propuestas Internas", stage: "Backlog", tipo_proyecto: "interno", sponsor_id: "", portfolio_data: {} });
  const [teamSelection, setTeamSelection] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ user_id: "", role: "dev" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSector, setFilterSector] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterTipoProyecto, setFilterTipoProyecto] = useState("all");

  useEffect(() => {
    api.users().then((resp) => {
      setAllUsers(Array.isArray(resp) ? resp : (resp?.items || []));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    if (id) {
      Promise.all([
        api.getProject(id),
        api.listTasks({ project: id }),
        api.listSprints({ project: id }).catch(() => []),
        api.listAnnouncements({ project: id }).catch(() => []),
        api.getProjectSolicitudes(id).catch(() => []),
      ])
        .then(([proj, t, sprints, anns, sols]) => {
          setCurrent(proj);
          let pData = {};
          try { pData = proj.portfolio_data ? JSON.parse(proj.portfolio_data) : (proj.portfolio_data || {}); if (typeof pData === 'string') pData = JSON.parse(pData); } catch { pData = {}; }
          if (typeof pData !== 'object' || Array.isArray(pData)) pData = {};
          setForm({ name: proj.name, description: proj.description, color: proj.color, sector: proj.sector || "Proyecto", code: proj.code || "", po_user_id: proj.po_user_id || "", categoria: proj.categoria || "Backlog de Propuestas Internas", stage: proj.stage || "Backlog", tipo_proyecto: proj.tipo_proyecto || pData.tipo_proyecto || "interno", sponsor_id: proj.sponsor_id || pData.sponsor_id || "", portfolio_data: pData });
          setTasks(t);
          setProjectSprint(sprints.find((s) => s.is_active === 1) || null);
          setProjectAnnouncements(anns.slice(0, 3));
          setPendingSolicitudes(sols.filter((s) => s.status === "pendiente").slice(0, 5));
        })
        .catch((e) => setError(e.message || "Portafolio no encontrado"))
        .finally(() => setLoading(false));
    } else {
      const params = {};
      if (filterStage !== "all") params.stage = filterStage;
      if (filterTipoProyecto && filterTipoProyecto !== "all") params.tipo_proyecto = filterTipoProyecto;
      api
        .listProjects(params)
        .then(setProjects)
        .catch((e) => setError(e.message || "No se pudieron cargar los elementos del portafolio"))
        .finally(() => setLoading(false));
    }
  }, [id, filterStage, filterTipoProyecto]);

  function updatePortfolioField(key, value) {
    setForm(prev => ({ ...prev, portfolio_data: { ...prev.portfolio_data, [key]: value } }));
  }
  function getPortfolioField(key) {
    return form.portfolio_data?.[key] ?? "";
  }

  // Backlog: color siempre rojo y sin equipo (por ahora)
  useEffect(() => {
    if (form.stage === "Backlog" && form.color !== "#dc2626") {
      setForm(prev => ({ ...prev, color: "#dc2626" }));
    }
  }, [form.stage]);

  function cleanForm(formData) {
    const cleaned = { ...formData };
    for (const key of Object.keys(cleaned)) {
      const val = cleaned[key];
      if (val === "") {
        cleaned[key] = null;
      } else if (val && typeof val === "object" && !Array.isArray(val)) {
        cleaned[key] = cleanForm(val);
      }
    }
    return cleaned;
  }

  async function createProject(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const members = teamSelection.map((s) => ({ user_id: s.user_id, role: s.role }));
      const finalCategoria = form.stage === "Backlog"
        ? (form.tipo_proyecto === "comercial" ? "Backlog de Propuestas Comerciales" : "Backlog de Propuestas Internas")
        : form.stage;
      const payload = {
        ...cleanForm({
          ...form,
          categoria: finalCategoria,
          stage: form.stage || "Backlog",
        }),
        members,
      };
      console.log("createProject payload:", payload);
      const created = await api.createProject(payload);
      navigate(`/portal/portfolio/${created.id}`);
    } catch (err) {
      setError(err.message || "No se pudo crear");
    } finally {
      setSaving(false);
    }
  }

  async function updateProject(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.updateProject(current.id, cleanForm(form));
      const updated = await api.getProject(current.id);
      setCurrent(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function archiveProject() {
    if (!window.confirm("¿Archivar este elemento del portafolio?")) return;
    try {
      await api.updateProject(current.id, { status: "archived" });
      navigate("/portal/portfolio");
    } catch (err) {
      setError(err.message || "No se pudo archivar");
    }
  }

  async function deleteProject() {
    if (!window.confirm("¿Eliminar este elemento del portafolio? Las tareas quedarán sin proyecto.")) return;
    try {
      await api.deleteProject(current.id);
      navigate("/portal/portfolio");
    } catch (err) {
      setError(err.message || "No se pudo eliminar");
    }
  }

  async function handleDeleteProject(e, projectId, projectName) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar "${projectName || 'este elemento'}" del portafolio?`)) return;
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err.message || "No se pudo eliminar");
    }
  }

  async function addMember(e) {
    e.preventDefault();
    setError("");
    try {
      await api.addProjectMember(current.id, newMember);
      const updated = await api.getProject(current.id);
      setCurrent(updated);
      setNewMember({ user_id: "", role: "dev" });
      setShowAddMember(false);
    } catch (err) {
      setError(err.message || "No se pudo añadir el miembro");
    }
  }

  async function changeMemberRole(userId, role) {
    setError("");
    try {
      await api.updateProjectMemberRole(current.id, userId, role);
      const updated = await api.getProject(current.id);
      setCurrent(updated);
    } catch (err) {
      setError(err.message || "No se pudo cambiar el rol");
    }
  }

  async function removeMember(userId) {
    if (!window.confirm("¿Quitar este miembro del proyecto?")) return;
    setError("");
    try {
      await api.removeProjectMember(current.id, userId);
      const updated = await api.getProject(current.id);
      setCurrent(updated);
    } catch (err) {
      setError(err.message || "No se pudo quitar el miembro");
    }
  }

  function addToTeam() {
    if (!newMember.user_id) return;
    if (teamSelection.some((s) => s.user_id === newMember.user_id)) return;
    const u = allUsers.find((u) => u.id === newMember.user_id);
    setTeamSelection((prev) => [...prev, { ...newMember, name: u?.name, email: u?.email }]);
    setNewMember({ user_id: "", role: "dev" });
  }

  function removeFromTeam(userId) {
    setTeamSelection((prev) => prev.filter((s) => s.user_id !== userId));
  }

  const inputClass =
    "w-full rounded-xl border border-tivit-red-light bg-white px-3.5 py-2.5 outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20";
  const selectClass =
    "rounded-lg border border-tivit-red-light bg-white px-2 py-1.5 text-xs font-medium text-tivit-ink outline-none focus:border-tivit-red";

  const availableUsers = allUsers.filter(
    (u) => !(current?.members || []).some((m) => m.user_id === u.id)
  );

  // Detail view
  if (id) {
    if (loading) return <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando…</p>;
    if (error && !current) return <p className="py-8 text-center text-sm text-alert">{error}</p>;
    if (!current) return null;

    const pct = current.task_count ? Math.round((current.done_count / current.task_count) * 100) : 0;

    // Team tab: only show team management
    if (isTeamTab) {
      return <TeamSection {...{ current, isAdmin, showAddMember, setShowAddMember, newMember, setNewMember, availableUsers, addMember, changeMemberRole, removeMember, selectClass, ROLE_LABELS, ROLE_COLORS, UserAvatar, X, UserPlus }} />;
    }

    // Inside ProjectLayout (Resumen tab): skip header
    if (inProjectLayout) {
      return (
        <div>
          {error && <p className="mb-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

          {editing ? (
            <form onSubmit={updateProject} className="rounded-2xl border border-black/5 bg-white p-5">
              <div className="flex flex-col gap-3">
                {form.stage === "Backlog" ? (
                  /* ===== EDICIÓN UNIFICADA BACKLOG ===== */
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Stage
                        <select value={form.stage} onChange={(e) => {
                          const ns = e.target.value;
                          const nt = form.tipo_proyecto;
                          let ac = form.categoria;
                          if (ns === "Backlog") ac = nt === "comercial" ? "Backlog de Propuestas Comerciales" : "Backlog de Propuestas Internas";
                          else ac = ns;
                          setForm({ ...form, stage: ns, categoria: ac });
                        }} className={inputClass} required>
                          {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Tipo de Proyecto *
                        <select value={form.tipo_proyecto} onChange={(e) => {
                          const nt = e.target.value;
                          const ac = form.stage === "Backlog" ? (nt === "comercial" ? "Backlog de Propuestas Comerciales" : "Backlog de Propuestas Internas") : form.categoria;
                          setForm({ ...form, tipo_proyecto: nt, categoria: ac });
                          updatePortfolioField("tipo_proyecto", nt);
                        }} className={inputClass} required>
                          <option value="interno">Interno</option>
                          <option value="comercial">Comercial</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Código
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-tivit-ink px-2.5 py-2.5 text-xs font-bold text-white">IA-</span>
                          <input className={inputClass} placeholder="001" value={form.code.startsWith("IA-") ? form.code.slice(3) : form.code} onChange={(e) => {
                            const num = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                            setForm({ ...form, code: num ? `IA-${num}` : "" });
                          }} maxLength={6} />
                        </div>
                      </label>
                    </div>
                    <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Nombre de la Idea/Proyecto *
                      <input className={inputClass} placeholder="Título corto y descriptivo" value={form.portfolio_data?.nombre_idea || form.name} onChange={(e) => { updatePortfolioField("nombre_idea", e.target.value); setForm(prev => ({ ...prev, name: e.target.value })); }} required maxLength={100} />
                    </label>
                    {form.tipo_proyecto === "interno" ? (
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Área *
                        <input className={inputClass} placeholder="Ej: Operaciones, TI, Comercial" value={getPortfolioField("area")} onChange={(e)=>updatePortfolioField("area", e.target.value)} />
                      </label>
                    ) : (
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Cliente *
                        <input className={inputClass} placeholder="Nombre del cliente" value={getPortfolioField("cliente")} onChange={(e)=>updatePortfolioField("cliente", e.target.value)} />
                      </label>
                    )}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Usuario Interesado
                        <select className={inputClass} value={getPortfolioField("usuario_interesado")} onChange={(e)=>{updatePortfolioField("usuario_interesado", e.target.value); const u=allUsers.find(x=>x.id===e.target.value); if(u) updatePortfolioField("correo_interesado", u.email);}}>
                          <option value="">Seleccionar…</option>
                          {allUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Rol del Usuario Interesado
                        <select className={inputClass} value={getPortfolioField("rol_interesado")} onChange={(e)=>updatePortfolioField("rol_interesado", e.target.value)}>
                          <option value="">Seleccionar…</option>
                          <option value="Solicitante">Solicitante</option>
                          <option value="Sponsor">Sponsor</option>
                          <option value="Product Owner">Product Owner</option>
                          <option value="Usuario Final">Usuario Final</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Correo del Usuario Interesado
                        <input className={inputClass} placeholder="correo@empresa.com" value={getPortfolioField("correo_interesado")} onChange={(e)=>updatePortfolioField("correo_interesado", e.target.value)} />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Descripción del Problema/Necesidad *
                      <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="¿Qué problema resuelve? Solo negocio, no tecnología aún" value={getPortfolioField("descripcion_problema")} onChange={(e)=>updatePortfolioField("descripcion_problema", e.target.value)} required />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Valor Esperado (ROI / Impacto)
                      <textarea className={`${inputClass} min-h-[60px] resize-y`} placeholder="¿Genera ingresos, ahorra horas, reduce costos, mitiga riesgos?" value={getPortfolioField("valor_esperado")} onChange={(e)=>updatePortfolioField("valor_esperado", e.target.value)} />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Prioridad / Urgencia
                        <select className={inputClass} value={getPortfolioField("prioridad")} onChange={(e)=>updatePortfolioField("prioridad", e.target.value)}>
                          <option value="">Seleccionar…</option>
                          <option value="Alta">Alta</option>
                          <option value="Media">Media</option>
                          <option value="Baja">Baja</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Documentos Adjuntos
                        <input type="file" multiple className="w-full rounded-xl border border-dashed border-tivit-red-light bg-white px-3 py-2.5 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-tivit-red file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-tivit-red-dark" onChange={(e)=>{
                          const files=Array.from(e.target.files||[]).map(f=>f.name);
                          updatePortfolioField("documentos_adjuntos", files);
                        }} />
                        {getPortfolioField("documentos_adjuntos")?.length>0 && <span className="text-[10px] text-tivit-ink/60">{getPortfolioField("documentos_adjuntos").join(", ")}</span>}
                      </label>
                    </div>
                  </div>
                ) : (
                  /* ===== EDICIÓN OTRAS ETAPAS ===== */
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Stage *
                        <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={inputClass} required>
                          {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Tipo
                        <select value={form.tipo_proyecto} onChange={(e) => setForm({ ...form, tipo_proyecto: e.target.value })} className={inputClass}>
                          <option value="interno">Interno</option>
                          <option value="comercial">Comercial</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Sponsor
                        <select value={form.sponsor_id} onChange={(e) => setForm({ ...form, sponsor_id: e.target.value })} className={inputClass}>
                          <option value="">Sin sponsor</option>
                          {allUsers.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
                        </select>
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Categoría (legado)
                        <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputClass}>
                          {PORTFOLIO_CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Código
                        <input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PF-001" maxLength={30} />
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClass}>
                        <option value="Proyecto">Proyecto</option>
                        <option value="PoC">PoC</option>
                        <option value="Laboratorio">Laboratorio</option>
                      </select>
                      <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} placeholder="Nombre Comercial" />
                    </div>
                    <textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" />
                    <select value={form.po_user_id} onChange={(e) => setForm({ ...form, po_user_id: e.target.value })} className={inputClass}>
                      <option value="">Sin PO asignado</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {/* Campos por stage */}
                    <div className="rounded-xl border border-tivit-red/10 bg-tivit-red-light/20 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-tivit-ink/60">Campos de etapa: {form.stage}</h4>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {(FIELD_DEFS[form.stage] || []).map((field) => {
                          if (field.showIf && !field.showIf(form.portfolio_data || {})) return null;
                          const val = form.portfolio_data?.[field.key] ?? "";
                          if (field.type === "text") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} placeholder={field.placeholder} /></label>);
                          if (field.type === "textarea") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink sm:col-span-2">{field.label}<textarea className={`${inputClass} min-h-[60px]`} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} placeholder={field.placeholder} /></label>);
                          if (field.type === "select") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<select className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)}><option value="">Seleccionar…</option>{field.options.map(o=><option key={o} value={o}>{o}</option>)}</select></label>);
                          if (field.type === "user") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<select className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)}><option value="">Sin asignar</option>{allUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>);
                          if (field.type === "boolean") return (<label key={field.key} className="flex items-center gap-2 text-xs font-medium text-tivit-ink"><input type="checkbox" checked={!!val} onChange={(e)=>updatePortfolioField(field.key, e.target.checked)} /> {field.label}</label>);
                          if (field.type === "number") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="number" className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value ? Number(e.target.value) : "")} /></label>);
                          if (field.type === "date") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="date" className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} /></label>);
                          if (field.type === "file") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="file" multiple className="w-full rounded-xl border border-dashed border-tivit-red-light bg-white px-3 py-2 text-xs" onChange={(e)=>updatePortfolioField(field.key, Array.from(e.target.files||[]).map(f=>f.name))} />{Array.isArray(val) && val.length>0 && <span className="text-[10px] text-tivit-ink/60">{val.join(", ")}</span>}</label>);
                          return null;
                        })}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`h-7 w-7 rounded-full transition ${form.color === c ? "ring-2 ring-offset-2 ring-tivit-ink" : ""}`} style={{ background: c }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="rounded-full bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}</button>
                  <button type="button" onClick={() => { setEditing(false); let pData={}; try{pData=JSON.parse(current.portfolio_data||"{}")}catch{}; setForm({ name: current.name, description: current.description, color: current.color, sector: current.sector || "Proyecto", code: current.code || "", po_user_id: current.po_user_id || "", categoria: current.categoria || "Proyecto", stage: current.stage || "Backlog", tipo_proyecto: current.tipo_proyecto || "interno", sponsor_id: current.sponsor_id || "", portfolio_data: pData }); }} className="rounded-full border border-tivit-red-light px-4 py-2 text-sm font-semibold text-tivit-ink transition hover:bg-tivit-red-light">Cancelar</button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {current.code && <span className="font-mono text-sm text-tivit-ink/50">{current.code}</span>}
                  {current.stage && <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STAGE_COLORS[current.stage] || "bg-tivit-ink/10 text-tivit-ink/60"}`}><span className={`inline-block h-1.5 w-1.5 rounded-full ${STAGE_DOT[current.stage] || "bg-tivit-ink/30"} mr-1`} />{current.stage}</span>}
                  {current.tipo_proyecto && <span className="rounded-full bg-tivit-ink/10 px-2 py-0.5 text-xs font-semibold text-tivit-ink/60">{current.tipo_proyecto}</span>}
                  {current.categoria && <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${CATEGORIA_COLORS[current.categoria] || "bg-tivit-ink/10 text-tivit-ink/60"}`}><span className={`inline-block h-1.5 w-1.5 rounded-full ${CATEGORIA_DOT[current.categoria] || "bg-tivit-ink/30"} mr-1`} />{current.categoria}</span>}
                  <span className="rounded-full bg-tivit-ink/10 px-2 py-0.5 text-xs font-semibold text-tivit-ink/60">{current.sector}</span>
                </div>
                {current.description && <p className="mt-1 text-sm text-tivit-ink/60">{current.description}</p>}
                {current.po_user_id && (() => {
                  const po = allUsers.find((u) => u.id === current.po_user_id);
                  return po ? (
                    <p className="mt-1 text-xs text-tivit-ink/50">PO: {po.name}</p>
                  ) : null;
                })()}
              </div>
              {isAdmin && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => setEditing(true)} className="rounded-lg border border-tivit-red-light p-2 text-tivit-ink/60 transition hover:bg-tivit-red-light"><Edit3 className="h-4 w-4" /></button>
                  {current.slug && (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            const newPublished = current.published ? 0 : 1;
                            await api.setProjectPublished(current.id, newPublished);
                            setCurrent({ ...current, published: newPublished });
                          } catch (e) { setError(e.message); }
                        }}
                        title={current.published ? "Despublicar" : "Publicar"}
                        className={`rounded-lg border p-2 transition ${current.published ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" : "border-tivit-red-light text-tivit-ink/60 hover:bg-tivit-red-light"}`}
                      >
                        {current.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const newReservado = current.reservado ? 0 : 1;
                            await api.setProjectReservado(current.id, newReservado);
                            setCurrent({ ...current, reservado: newReservado });
                          } catch (e) { setError(e.message); }
                        }}
                        title={current.reservado ? "Quitar NDA" : "Marcar NDA"}
                        className={`rounded-lg border p-2 transition ${current.reservado ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-tivit-red-light text-tivit-ink/60 hover:bg-tivit-red-light"}`}
                      >
                        {current.reservado ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                    </>
                  )}
                  {current.status === "archived" ? (
                    <button
                      onClick={async () => {
                        try {
                          await api.updateProject(current.id, { status: "active" });
                          setCurrent({ ...current, status: "active" });
                        } catch (e) { setError(e.message); }
                      }}
                      title="Restaurar"
                      className="rounded-lg border border-green-300 bg-green-50 p-2 text-green-700 transition hover:bg-green-100"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={archiveProject} title="Archivar" className="rounded-lg border border-tivit-red-light p-2 text-tivit-ink/60 transition hover:bg-tivit-red-light"><Archive className="h-4 w-4" /></button>
                  )}
                  <button onClick={deleteProject} className="flex items-center gap-2 rounded-lg border-2 border-alert bg-white px-4 py-2 text-sm font-semibold text-alert transition hover:bg-alert hover:text-white">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4">
            <div className="text-sm text-tivit-ink/60">
              <span className="font-semibold text-tivit-ink">{current.task_count}</span> tareas · <span className="font-semibold text-green-700">{current.done_count}</span> completadas
            </div>
            <div className="flex-1 h-2 overflow-hidden rounded-full bg-black/5">
              <div className="h-full rounded-full bg-tivit-red" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-tivit-ink">{pct}%</span>
          </div>

          {/* Compact team preview */}
          {current.members && current.members.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              {current.members.slice(0, 5).map((m) => (
                <UserAvatar key={m.user_id} user={{ name: m.name, avatar_color: m.avatar_color }} size="sm" />
              ))}
              {current.members.length > 5 && (
                <span className="text-xs text-tivit-ink/50">+{current.members.length - 5}</span>
              )}
              <Link to={`/portal/portfolio/${id}/team`} className="ml-2 text-xs font-semibold text-tivit-red hover:underline">Ver equipo</Link>
            </div>
          )}

          {/* Active sprint */}
          {projectSprint && (
            <div className="mt-5 rounded-xl border border-tivit-red/20 bg-tivit-red/5 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tivit-red">
                Sprint activo
              </div>
              <h3 className="mt-1 text-base font-semibold text-tivit-ink">{projectSprint.name}</h3>
              {parseGoals(projectSprint.goal).length > 0 && (
                <ul className="mt-0.5 list-disc pl-4 text-sm text-tivit-ink/70">
                  {parseGoals(projectSprint.goal).map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              )}
              <div className="mt-2 flex items-center gap-4 text-xs text-tivit-ink/60">
                <span>{formatDate(projectSprint.start_date)} → {formatDate(projectSprint.end_date)}</span>
                <span>{projectSprint.done_tasks}/{projectSprint.total_tasks} tareas</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-tivit-red" style={{ width: `${projectSprint.total_tasks ? (projectSprint.done_tasks / projectSprint.total_tasks) * 100 : 0}%` }} />
              </div>
              {projectSprint.risks && <p className="mt-2 text-xs text-amber-700"><strong>Riesgos:</strong> {projectSprint.risks}</p>}
            </div>
          )}

          {/* Recent announcements */}
          {projectAnnouncements.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">Últimos anuncios</h2>
                <Link to={`/portal/portfolio/${id}/feed`} className="text-xs font-semibold text-tivit-red hover:underline">Ver todos</Link>
              </div>
              <div className="mt-2 space-y-2">
                {projectAnnouncements.map((a) => (
                  <div key={a.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="text-sm font-semibold text-tivit-ink">{a.title}</div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-tivit-ink/60">{a.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending solicitudes */}
          {isAdmin && pendingSolicitudes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Solicitudes pendientes ({pendingSolicitudes.length})
                </h2>
                <Link to={`/portal/portfolio/${id}/solicitudes`} className="text-xs font-semibold text-tivit-red hover:underline">Ver todas</Link>
              </div>
              <div className="mt-2 space-y-2">
                {pendingSolicitudes.map((s) => (
                  <Link
                    key={s.id}
                    to={`/portal/tasks/${s.id}`}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 transition hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-tivit-ink">{s.title}</span>
                        <PriorityBadge priority={s.priority} />
                      </div>
                      <div className="mt-0.5 text-xs text-tivit-ink/50">
                        {s.assignee?.name || "Sin asignar"} · {formatRelative(s.created_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tasks by status summary */}
          {tasks.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">Tareas por estado</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["in_progress", "todo", "review", "done"].map((status) => {
                  const cfg = {
                    in_progress: { label: "En progreso", color: "bg-yellow-100 text-yellow-700" },
                    todo: { label: "Por hacer", color: "bg-blue-100 text-blue-700" },
                    review: { label: "En revisión", color: "bg-purple-100 text-purple-700" },
                    done: { label: "Completadas", color: "bg-green-100 text-green-700" },
                  };
                  const count = tasks.filter((t) => t.status === status).length;
                  return (
                    <div key={status} className="rounded-xl border border-black/5 bg-white p-3 text-center">
                      <div className={`text-2xl font-bold ${cfg[status].color}`}>{count}</div>
                      <div className="mt-0.5 text-xs text-tivit-ink/60">{cfg[status].label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Standalone detail view (not inside ProjectLayout)
    if (error && (error.toLowerCase().includes("acceso") || error.includes("FORBIDDEN") || error.includes("403"))) {
      return (
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="mt-3 text-lg font-semibold text-tivit-ink">Acceso restringido</h2>
          <p className="mt-1 text-sm text-tivit-ink/60">Solo miembros del proyecto pueden ver esta información. Solicita al administrador que te agregue al equipo.</p>
          <Link to="/portal/portfolio" className="mt-4 inline-flex text-sm font-semibold text-tivit-red hover:underline">Volver al Portafolio</Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-4xl">
        <Link to="/portal/portfolio" className="inline-flex items-center gap-1.5 text-sm font-semibold text-tivit-red hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Portafolio
        </Link>

        {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: current.color }}>
                <FolderKanban className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-tivit-ink">{current.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {current.code && <span className="font-mono text-sm text-tivit-ink/50">{current.code}</span>}
                  {current.categoria && <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${CATEGORIA_COLORS[current.categoria] || "bg-tivit-ink/10 text-tivit-ink/60"}`}>{current.categoria}</span>}
                  <span className="rounded-full bg-tivit-ink/10 px-2 py-0.5 text-xs font-semibold text-tivit-ink/60">{current.sector}</span>
                </div>
                {current.description && <p className="mt-1 text-sm text-tivit-ink/60">{current.description}</p>}
                {current.po_user_id && (() => {
                  const po = allUsers.find((u) => u.id === current.po_user_id);
                  return po ? (
                    <p className="mt-1 text-xs text-tivit-ink/50">PO: {po.name}</p>
                  ) : null;
                })()}
              </div>
            </div>
            {isAdmin && (
              <div className="flex shrink-0 gap-1">
                <button onClick={archiveProject} title="Archivar" className="rounded-lg border border-tivit-red-light p-2 text-tivit-ink/60 transition hover:bg-tivit-red-light"><Archive className="h-4 w-4" /></button>
                <button onClick={deleteProject} className="flex items-center gap-2 rounded-lg border-2 border-alert bg-white px-4 py-2 text-sm font-semibold text-alert transition hover:bg-alert hover:text-white">
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="text-sm text-tivit-ink/60">
              <span className="font-semibold text-tivit-ink">{current.task_count}</span> tareas · <span className="font-semibold text-green-700">{current.done_count}</span> completadas
            </div>
            <div className="flex-1 h-2 overflow-hidden rounded-full bg-black/5">
              <div className="h-full rounded-full bg-tivit-red" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-tivit-ink">{pct}%</span>
          </div>
        </div>

        <TeamSection {...{ current, isAdmin, showAddMember, setShowAddMember, newMember, setNewMember, availableUsers, addMember, changeMemberRole, removeMember, selectClass, ROLE_LABELS, ROLE_COLORS, UserAvatar, X, UserPlus }} />

        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">Tareas del proyecto</h2>
          {tasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-tivit-ink/50">Sin tareas en este proyecto.</p>
          ) : (
            tasks.map((t) => (
              <Link key={t.id} to={`/portal/tasks/${t.id}`} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-3.5 transition hover:border-tivit-red/20 hover:shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <TypeBadge type={t.type} />
                  <span className="truncate text-sm font-medium text-tivit-ink">{t.title}</span>
                  <span className="font-mono text-xs text-tivit-ink/50">{t.code}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  {t.assignee && <UserAvatar user={t.assignee} size="sm" />}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  // List view - Portafolio canónico
  const allItems = projects.map((p) => {
    const stage = p.stage || (p.categoria?.startsWith("Backlog") ? "Backlog" : p.categoria) || "Backlog";
    const tipo_proyecto = p.tipo_proyecto || (p.categoria === "Backlog de Propuestas Comerciales" ? "comercial" : "interno");
    return {
      kind: "internal",
      id: p.id,
      name: p.name,
      code: p.code,
      sector: p.sector,
      categoria: p.categoria || p.sector || "Backlog de Propuestas Internas",
      stage,
      tipo_proyecto,
      color: p.color,
      task_count: p.task_count,
      done_count: p.done_count,
      members: p.members,
      po_user_id: p.po_user_id,
    };
  }).filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (item.name || "").toLowerCase();
      const code = (item.code || "").toLowerCase();
      const cat = (item.categoria || "").toLowerCase();
      const stage = (item.stage || "").toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !cat.includes(q) && !stage.includes(q)) return false;
    }
    if (filterStage !== "all" && item.stage !== filterStage) return false;
    if (filterSector !== "all" && item.sector !== filterSector) return false;
    return true;
  });

  // Agrupar por stage profesional (5 etapas)
  const groupedByStage = STAGES.map((st) => ({
    stage: st,
    items: allItems.filter((i) => i.stage === st),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tivit-red-dark">Portafolio</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">Gestión integral del pipeline: desde backlog de propuestas hasta producción.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm((s) => !s)} className="shrink-0 rounded-full bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark">
            {showForm ? "Cancelar" : "+ Nuevo elemento"}
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

      {/* Search and filters — Portafolio */}
      {!id && (
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
      )}

      {showForm && isAdmin && (
        <form onSubmit={createProject} className="mt-5 rounded-2xl border border-black/5 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-tivit-ink">Nuevo elemento de Portafolio — {form.stage}</h2>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STAGE_COLORS[form.stage]}`}>{form.stage}</span>
          </div>
          {form.stage === "Backlog" ? (
            /* ===== FORMULARIO UNIFICADO BACKLOG (sin duplicación) ===== */
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Stage
                  <select value={form.stage} onChange={(e) => {
                    const newStage = e.target.value;
                    const newTipo = form.tipo_proyecto;
                    let autoCat = form.categoria;
                    if (newStage === "Backlog") autoCat = newTipo === "comercial" ? "Backlog de Propuestas Comerciales" : "Backlog de Propuestas Internas";
                    else autoCat = newStage;
                    setForm({ ...form, stage: newStage, categoria: autoCat });
                  }} className={inputClass} required>
                    {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Tipo de Proyecto *
                  <select value={form.tipo_proyecto} onChange={(e) => {
                    const newTipo = e.target.value;
                    const autoCat = form.stage === "Backlog" ? (newTipo === "comercial" ? "Backlog de Propuestas Comerciales" : "Backlog de Propuestas Internas") : form.categoria;
                    setForm({ ...form, tipo_proyecto: newTipo, categoria: autoCat });
                    updatePortfolioField("tipo_proyecto", newTipo);
                  }} className={inputClass} required>
                    <option value="interno">Interno</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Código
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-tivit-ink px-2.5 py-2.5 text-xs font-bold text-white">IA-</span>
                    <input className={inputClass} placeholder="001" value={form.code.startsWith("IA-") ? form.code.slice(3) : form.code} onChange={(e) => {
                      const num = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                      setForm({ ...form, code: num ? `IA-${num}` : "" });
                    }} maxLength={6} />
                  </div>
                  <span className="text-[10px] text-tivit-ink/50">Se guarda como {form.code || "IA-XXX"}</span>
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Nombre de la Idea/Proyecto *
                <input className={inputClass} placeholder="Título corto y descriptivo" value={form.portfolio_data?.nombre_idea || form.name} onChange={(e) => { updatePortfolioField("nombre_idea", e.target.value); setForm(prev => ({ ...prev, name: e.target.value })); }} required maxLength={100} />
              </label>

              {form.tipo_proyecto === "interno" ? (
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Área *
                  <input className={inputClass} placeholder="Ej: Operaciones, TI, Comercial" value={getPortfolioField("area")} onChange={(e)=>updatePortfolioField("area", e.target.value)} />
                </label>
              ) : (
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Cliente *
                  <input className={inputClass} placeholder="Nombre del cliente" value={getPortfolioField("cliente")} onChange={(e)=>updatePortfolioField("cliente", e.target.value)} />
                </label>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Usuario Interesado
                  <input className={inputClass} placeholder="Escribir nombre del usuario interesado" value={getPortfolioField("usuario_interesado")} onChange={(e)=>updatePortfolioField("usuario_interesado", e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Rol del Usuario Interesado
                  <input className={inputClass} placeholder="Escribir rol manualmente" value={getPortfolioField("rol_interesado")} onChange={(e)=>updatePortfolioField("rol_interesado", e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Correo del Usuario Interesado
                  <input className={inputClass} placeholder="correo@empresa.com" value={getPortfolioField("correo_interesado")} onChange={(e)=>updatePortfolioField("correo_interesado", e.target.value)} />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Descripción del Problema/Necesidad *
                <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="¿Qué problema resuelve? Solo negocio, no tecnología aún" value={getPortfolioField("descripcion_problema")} onChange={(e)=>updatePortfolioField("descripcion_problema", e.target.value)} required />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Valor Esperado (ROI / Impacto)
                <textarea className={`${inputClass} min-h-[60px] resize-y`} placeholder="¿Genera ingresos, ahorra horas, reduce costos, mitiga riesgos?" value={getPortfolioField("valor_esperado")} onChange={(e)=>updatePortfolioField("valor_esperado", e.target.value)} />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Prioridad / Urgencia
                  <select className={inputClass} value={getPortfolioField("prioridad")} onChange={(e)=>updatePortfolioField("prioridad", e.target.value)}>
                    <option value="">Seleccionar…</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">País
                  <select className={inputClass} value={getPortfolioField("country") || ""} onChange={(e)=>updatePortfolioField("country", e.target.value)}>
                    <option value="">Seleccionar país…</option>
                    {PAISES.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Documentación Drive
                  <input className={inputClass} placeholder="https://drive.google.com/..." value={getPortfolioField("documentacion_drive")} onChange={(e)=>updatePortfolioField("documentacion_drive", e.target.value)} />
                  <span className="text-[10px] text-tivit-ink/50">Pegar link de Drive</span>
                </label>
              </div>
            </div>
          ) : (
            /* ===== FORMULARIO PARA OTRAS ETAPAS (no Backlog) ===== */
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
                  Stage (Etapa) *
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={inputClass} required>
                    {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
                  Tipo (si Backlog)
                  <select value={form.tipo_proyecto} onChange={(e) => setForm({ ...form, tipo_proyecto: e.target.value })} className={inputClass}>
                    <option value="interno">Interno</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
                  Sponsor
                  <select value={form.sponsor_id} onChange={(e) => setForm({ ...form, sponsor_id: e.target.value })} className={inputClass}>
                    <option value="">Sin sponsor</option>
                    {allUsers.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
                  </select>
                </label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
                  Categoría (legado)
                  <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputClass}>
                    {PORTFOLIO_CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
                  Código
                  <input className={inputClass} placeholder="PF-001" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={30} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
                  Nombre Comercial *
                  <input className={inputClass} placeholder="Portal TIVIT" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
                  PO Encargado
                  <select value={form.po_user_id} onChange={(e) => setForm({ ...form, po_user_id: e.target.value })} className={inputClass}>
                    <option value="">Sin PO asignado</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-tivit-ink">
                Descripción
                <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Descripción del elemento de portafolio" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              {/* Campos dinámicos por stage profesional */}
              <div className="mt-4 rounded-xl border border-tivit-red/10 bg-tivit-red-light/20 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-tivit-ink/60">Campos de etapa: {form.stage}</h3>
                <p className="mt-1 text-xs text-tivit-ink/50">Solo los campos de esta etapa son obligatorios para avanzar. Los criterios de salida se validan al mover de columna.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(FIELD_DEFS[form.stage] || []).map((field) => {
                    if (field.showIf && !field.showIf(form.portfolio_data || {})) return null;
                    const val = form.portfolio_data?.[field.key] ?? "";
                    if (field.type === "text") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label} {field.required && "*"}<input className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} placeholder={field.placeholder} /></label>);
                    if (field.type === "textarea") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink sm:col-span-2">{field.label} {field.required && "*"}<textarea className={`${inputClass} min-h-[60px]`} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} placeholder={field.placeholder} /></label>);
                    if (field.type === "select") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label} {field.required && "*"}<select className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)}><option value="">Seleccionar…</option>{field.options.map(o=><option key={o} value={o}>{field.map?.[o]||o}</option>)}</select></label>);
                    if (field.type === "user") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label} {field.required && "*"}<select className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)}><option value="">Sin asignar</option>{allUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>);
                    if (field.type === "users") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<select multiple className={inputClass} value={Array.isArray(val)?val:[]} onChange={(e)=>updatePortfolioField(field.key, Array.from(e.target.selectedOptions).map(o=>o.value))}>{allUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>);
                    if (field.type === "boolean") return (<label key={field.key} className="flex items-center gap-2 text-xs font-medium text-tivit-ink"><input type="checkbox" checked={!!val} onChange={(e)=>updatePortfolioField(field.key, e.target.checked)} /> {field.label}</label>);
                    if (field.type === "number") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="number" className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value ? Number(e.target.value) : "")} /></label>);
                    if (field.type === "date") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="date" className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} /></label>);
                    if (field.type === "file") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="file" multiple className="w-full rounded-xl border border-dashed border-tivit-red-light bg-white px-3 py-2 text-xs" onChange={(e)=>updatePortfolioField(field.key, Array.from(e.target.files||[]).map(f=>f.name))} />{Array.isArray(val) && val.length>0 && <span className="text-[10px] text-tivit-ink/60">{val.join(", ")}</span>}</label>);
                    return null;
                  })}
                </div>
              </div>
            </>
          )}
          {form.stage !== "Backlog" && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-medium text-tivit-ink/60">Color:</span>
              {PROJECT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`h-7 w-7 rounded-full transition ${form.color === c ? "ring-2 ring-offset-2 ring-tivit-ink" : ""}`} style={{ background: c }} />
              ))}
            </div>
          )}
          {form.stage === "Backlog" && (
            <p className="mt-3 text-xs text-tivit-ink/50">Color en Backlog siempre Rojo (#dc2626) — se asigna automáticamente.</p>
          )}
          {form.stage !== "Backlog" && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">Equipo</span>
                <button type="button" onClick={addToTeam} className="flex items-center gap-1 text-xs font-semibold text-tivit-red hover:underline">
                  <UserPlus className="h-3 w-3" aria-hidden="true" /> Añadir
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <select value={newMember.user_id} onChange={(e) => setNewMember({ ...newMember, user_id: e.target.value })} className={selectClass}>
                  <option value="">Seleccionar usuario…</option>
                  {allUsers.filter((u) => !teamSelection.some((s) => s.user_id === u.id)).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className={selectClass}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {teamSelection.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {teamSelection.map((s) => (
                    <span key={s.user_id} className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs">
                      <span className="font-medium text-tivit-ink">{s.name}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[s.role]}`}>{ROLE_LABELS[s.role]}</span>
                      <button type="button" onClick={() => removeFromTeam(s.user_id)} className="ml-0.5 text-tivit-ink/40 hover:text-alert"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
            <button type="submit" disabled={saving} className="mt-4 rounded-full bg-tivit-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60">
            {saving ? "Creando…" : "Crear en portafolio"}
          </button>
        </form>
      )}

      {loading && <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando portafolio…</p>}

      {!loading && allItems.length === 0 && (
        <div className="mt-6 rounded-2xl border border-tivit-red-light/40 bg-tivit-red-light/20 p-6 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-tivit-ink/30" aria-hidden="true" />
          <p className="mt-2 text-sm text-tivit-ink/50">No hay elementos en el portafolio todavía.</p>
          {isAdmin && (
            <p className="mt-2 text-xs text-tivit-ink/55">
              Creá uno con el botón "+ Nuevo elemento" de arriba.
            </p>
          )}
        </div>
      )}

      {/* Vista agrupada por etapa cuando no hay filtro específico */}
      {!loading && filterStage === "all" && !searchQuery && filterSector === "all" && groupedByStage.length > 0 && (
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
    </div>
  );
}

function TeamSection({ current, isAdmin, showAddMember, setShowAddMember, newMember, setNewMember, availableUsers, addMember, changeMemberRole, removeMember, selectClass, ROLE_LABELS, ROLE_COLORS, UserAvatar, X, UserPlus }) {
  const sortedMembers = [...(current.members || [])].sort(
    (a, b) => (ROLE_HIERARCHY[a.role] ?? 99) - (ROLE_HIERARCHY[b.role] ?? 99)
  );
  return (
    <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">
          Equipo del proyecto ({current.members?.length || 0})
        </h2>
        {isAdmin && (
          <button onClick={() => setShowAddMember((s) => !s)} className="flex items-center gap-1.5 text-xs font-semibold text-tivit-red hover:underline">
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Añadir
          </button>
        )}
      </div>

      {showAddMember && isAdmin && (
        <form onSubmit={addMember} className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-tivit-red/30 bg-tivit-red/5 p-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
            Usuario
            <select value={newMember.user_id} onChange={(e) => setNewMember({ ...newMember, user_id: e.target.value })} className={selectClass} required>
              <option value="">Seleccionar…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
            Rol
            <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className={selectClass}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg bg-tivit-red px-3 py-2 text-xs font-semibold text-white transition hover:bg-tivit-red-dark">Añadir</button>
          <button type="button" onClick={() => setShowAddMember(false)} className="rounded-lg border border-tivit-red-light px-3 py-2 text-xs font-semibold text-tivit-ink transition hover:bg-tivit-red-light">Cancelar</button>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {sortedMembers.length === 0 && (
          <p className="py-4 text-center text-sm text-tivit-ink/50">Sin miembros asignados.</p>
        )}
        {sortedMembers.map((m) => (
          <div key={m.user_id} className={`flex items-center justify-between rounded-xl border border-black/5 border-l-4 ${ROLE_BORDER_COLORS[m.role] || "border-l-gray-400"} p-3`}>
            <div className="flex items-center gap-3">
              <UserAvatar user={{ name: m.name, avatar_color: m.avatar_color }} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-tivit-ink">{m.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[m.role] || ROLE_COLORS.viewer}`}>
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                </div>
                <div className="text-xs text-tivit-ink/50">{m.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <select value={m.role} onChange={(e) => changeMemberRole(m.user_id, e.target.value)} className={selectClass}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              ) : null}
              {isAdmin && (
                <button onClick={() => removeMember(m.user_id)} className="rounded-lg p-1.5 text-tivit-ink/40 transition hover:bg-alert/10 hover:text-alert">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}