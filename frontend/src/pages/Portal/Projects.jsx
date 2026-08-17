import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, FolderKanban, ChevronRight, Edit3, Trash2, Archive, UserPlus, X } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { TypeBadge, StatusBadge, PriorityBadge, UserAvatar, formatDate, formatRelative } from "./components/Badges";

function parseGoals(goal) {
  if (!goal) return [];
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
  const [form, setForm] = useState({ name: "", description: "", color: "#dc2626", sector: "Proyecto", code: "", po_user_id: "" });
  const [teamSelection, setTeamSelection] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ user_id: "", role: "dev" });

  useEffect(() => {
    api.users().then(setAllUsers).catch(() => {});
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
          setForm({ name: proj.name, description: proj.description, color: proj.color, sector: proj.sector || "Proyecto", code: proj.code || "", po_user_id: proj.po_user_id || "" });
          setTasks(t);
          setProjectSprint(sprints.find((s) => s.is_active === 1) || null);
          setProjectAnnouncements(anns.slice(0, 3));
          setPendingSolicitudes(sols.filter((s) => s.status === "pendiente").slice(0, 5));
        })
        .catch((e) => setError(e.message || "Proyecto no encontrado"))
        .finally(() => setLoading(false));
    } else {
      api
        .listProjects()
        .then(setProjects)
        .catch((e) => setError(e.message || "No se pudieron cargar los proyectos"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  async function createProject(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const members = teamSelection.map((s) => ({ user_id: s.user_id, role: s.role }));
      const created = await api.createProject({ ...form, members });
      navigate(`/portal/projects/${created.id}`);
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
      await api.updateProject(current.id, form);
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
    if (!window.confirm("¿Archivar este proyecto?")) return;
    try {
      await api.updateProject(current.id, { status: "archived" });
      navigate("/portal/projects");
    } catch (err) {
      setError(err.message || "No se pudo archivar");
    }
  }

  async function deleteProject() {
    if (!window.confirm("¿Eliminar este proyecto? Las tareas quedarán sin proyecto.")) return;
    try {
      await api.deleteProject(current.id);
      navigate("/portal/projects");
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClass}>
                    <option value="Proyecto">Proyecto</option>
                    <option value="PoC">PoC</option>
                    <option value="Laboratorio">Laboratorio</option>
                  </select>
                  <input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Código" maxLength={30} />
                </div>
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} placeholder="Nombre Comercial" />
                <textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" />
                <select value={form.po_user_id} onChange={(e) => setForm({ ...form, po_user_id: e.target.value })} className={inputClass}>
                  <option value="">Sin PO asignado</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`h-7 w-7 rounded-full transition ${form.color === c ? "ring-2 ring-offset-2 ring-tivit-ink" : ""}`} style={{ background: c }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="rounded-full bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}</button>
                  <button type="button" onClick={() => { setEditing(false); setForm({ name: current.name, description: current.description, color: current.color, sector: current.sector || "Proyecto", code: current.code || "", po_user_id: current.po_user_id || "" }); }} className="rounded-full border border-tivit-red-light px-4 py-2 text-sm font-semibold text-tivit-ink transition hover:bg-tivit-red-light">Cancelar</button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {current.code && <span className="font-mono text-sm text-tivit-ink/50">{current.code}</span>}
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
                  <button onClick={archiveProject} title="Archivar" className="rounded-lg border border-tivit-red-light p-2 text-tivit-ink/60 transition hover:bg-tivit-red-light"><Archive className="h-4 w-4" /></button>
                  <button onClick={deleteProject} title="Eliminar" className="rounded-lg border border-alert/30 p-2 text-alert/60 transition hover:bg-alert/10"><Trash2 className="h-4 w-4" /></button>
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
              <Link to={`/portal/projects/${id}/team`} className="ml-2 text-xs font-semibold text-tivit-red hover:underline">Ver equipo</Link>
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
                <Link to={`/portal/projects/${id}/feed`} className="text-xs font-semibold text-tivit-red hover:underline">Ver todos</Link>
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
                <Link to={`/portal/projects/${id}/solicitudes`} className="text-xs font-semibold text-tivit-red hover:underline">Ver todas</Link>
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
    return (
      <div className="mx-auto max-w-4xl">
        <Link to="/portal/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-tivit-red hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Proyectos
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
                <div className="mt-1 flex items-center gap-2">
                  {current.code && <span className="font-mono text-sm text-tivit-ink/50">{current.code}</span>}
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
                <button onClick={deleteProject} title="Eliminar" className="rounded-lg border border-alert/30 p-2 text-alert/60 transition hover:bg-alert/10"><Trash2 className="h-4 w-4" /></button>
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

  // List view
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tivit-red-dark">Proyectos</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">Organiza las tareas por proyecto y equipo.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm((s) => !s)} className="shrink-0 rounded-full bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark">
            {showForm ? "Cancelar" : "+ Nuevo proyecto"}
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

      {showForm && isAdmin && (
        <form onSubmit={createProject} className="mt-5 rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="text-sm font-semibold text-tivit-ink">Nuevo proyecto</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
              Sector *
              <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClass}>
                <option value="Proyecto">Proyecto</option>
                <option value="PoC">PoC</option>
                <option value="Laboratorio">Laboratorio</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
              Código
              <input className={inputClass} placeholder="PRJ-001" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={30} />
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
            <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Descripción del proyecto" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-tivit-ink/60">Color:</span>
            {PROJECT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`h-7 w-7 rounded-full transition ${form.color === c ? "ring-2 ring-offset-2 ring-tivit-ink" : ""}`} style={{ background: c }} />
            ))}
          </div>

          {/* Team selector */}
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

          <button type="submit" disabled={saving} className="mt-4 rounded-full bg-tivit-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60">
            {saving ? "Creando…" : "Crear proyecto"}
          </button>
        </form>
      )}

      {loading && <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando…</p>}
      {!loading && projects.length === 0 && (
        <p className="py-8 text-center text-sm text-tivit-ink/50">No hay proyectos todavía.</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => {
          const pct = p.task_count ? Math.round((p.done_count / p.task_count) * 100) : 0;
          return (
            <Link
              key={p.id}
              to={`/portal/projects/${p.id}`}
              className="rounded-2xl border border-black/5 bg-white p-5 transition hover:border-tivit-red/20 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: p.color }}>
                  <FolderKanban className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-tivit-ink">{p.name}</h2>
                  <div className="flex items-center gap-2">
                    {p.code && <span className="font-mono text-xs text-tivit-ink/50">{p.code}</span>}
                    <span className="rounded-full bg-tivit-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-tivit-ink/60">{p.sector}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-tivit-ink/50">{p.task_count} tarea{p.task_count !== 1 ? "s" : ""}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-tivit-ink/30" aria-hidden="true" />
              </div>

              {p.members && p.members.length > 0 && (
                <div className="mt-3 flex items-center gap-1">
                  {p.members.slice(0, 4).map((m) => (
                    <UserAvatar key={m.user_id} user={{ name: m.name, avatar_color: m.avatar_color }} size="sm" />
                  ))}
                  {p.members.length > 4 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-tivit-ink/10 text-[10px] font-bold text-tivit-ink/60">
                      +{p.members.length - 4}
                    </span>
                  )}
                  {p.po_user_id && (() => {
                    const po = allUsers.find((u) => u.id === p.po_user_id);
                    return po ? (
                      <span className="ml-2 text-xs text-tivit-ink/50">PO: {po.name}</span>
                    ) : null;
                  })()}
                </div>
              )}

              {p.task_count > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-tivit-ink/60">
                    <span>{p.done_count} completadas</span>
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