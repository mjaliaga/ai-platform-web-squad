import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ChevronRight, Edit3 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar } from "./components/Badges";

export function Members() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workload, setWorkload] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.users(),
      api.listProjects().catch(() => ({ items: [] })),
    ])
      .then(([usersResp, projsResp]) => {
        setMembers(Array.isArray(usersResp) ? usersResp : (usersResp?.items || []));
        setProjects(Array.isArray(projsResp) ? projsResp : (projsResp?.items || []));
      })
      .catch((e) => setError(e.message || "No se pudieron cargar los miembros"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (members.length === 0) return;
    Promise.all(
      members.map((m) =>
        api.listTasks({ assignee: m.id, limit: 500 }).catch(() => [])
      )
    ).then((taskArrays) => {
      const map = {};
      members.forEach((m, i) => {
        const tasks = taskArrays[i];
        const byStatus = {};
        tasks.forEach((t) => {
          byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        });
        map[m.id] = { total: tasks.length, byStatus };
      });
      setWorkload(map);
    });
  }, [members]);

  const memberProjects = {};
  projects.forEach((p) => {
    (p.members || []).forEach((m) => {
      if (!memberProjects[m.user_id]) memberProjects[m.user_id] = [];
      memberProjects[m.user_id].push({ ...p, projectRole: m.role });
    });
  });

  async function addMember(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const created = await api.createUser(form);
      setMembers((prev) => [...prev.filter((m) => m.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", email: "", password: "", role: "member" });
      setShowForm(false);
    } catch (err) {
      setError(err.message || "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(member) {
    setError("");
    try {
      const updated = await api.updateUser(member.id, { active: member.active === 1 ? 0 : 1 });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado");
    }
  }

  async function changeRole(member, role) {
    setError("");
    try {
      const updated = await api.updateUser(member.id, { role });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      setError(err.message || "No se pudo cambiar el rol");
    }
  }

  async function changeEmail(member, email) {
    setError("");
    try {
      const updated = await api.updateUser(member.id, { email });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      setError(err.message || "No se pudo cambiar el email");
    }
  }

  async function deleteMember(member) {
    if (!window.confirm(`¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`)) return;
    setError("");
    try {
      await api.deleteUser(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      setError(err.message || "No se pudo eliminar el usuario");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-tivit-red-light bg-white px-3.5 py-2.5 outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tivit-red-dark">Miembros del equipo</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            {members.length} personas con acceso al portal.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="shrink-0 rounded-full bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
          >
            {showForm ? "Cancelar" : "+ Añadir miembro"}
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

      {showForm && isAdmin && (
        <form onSubmit={addMember} className="mt-5 rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="text-sm font-semibold text-tivit-ink">Nuevo miembro</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
              Nombre
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
              Email
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
              Contraseña
              <input type="password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
              Rol
              <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="member">Miembro</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-full bg-tivit-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60"
          >
            {saving ? "Creando…" : "Crear usuario"}
          </button>
        </form>
      )}

      <div className="mt-6">
        {loading && <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando…</p>}
        {!loading && (() => {
          const admins = members.filter((m) => m.role === "admin");
          const regular = members.filter((m) => m.role !== "admin");
          return (
            <>
              {admins.length > 0 && (
                <div className="mb-6">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-tivit-red">
                    <span className="h-2 w-2 rounded-full bg-tivit-red" />
                    Administradores ({admins.length})
                  </h2>
                  <div className="space-y-3">
                    {admins.map((m) => (
                      <MemberCard key={m.id} m={m} wl={workload[m.id]} mProjects={memberProjects[m.id]} user={user} isAdmin={isAdmin} inputClass={inputClass} changeRole={changeRole} changeEmail={changeEmail} toggleActive={toggleActive} deleteMember={deleteMember} />
                    ))}
                  </div>
                </div>
              )}
              {regular.length > 0 && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">
                    <span className="h-2 w-2 rounded-full bg-tivit-ink/40" />
                    Miembros ({regular.length})
                  </h2>
                  <div className="space-y-3">
                    {regular.map((m) => (
                      <MemberCard key={m.id} m={m} wl={workload[m.id]} mProjects={memberProjects[m.id]} user={user} isAdmin={isAdmin} inputClass={inputClass} changeRole={changeRole} changeEmail={changeEmail} toggleActive={toggleActive} deleteMember={deleteMember} />
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

function MemberCard({ m, wl, mProjects, user, isAdmin, inputClass, changeRole, changeEmail, toggleActive, deleteMember }) {
  const workload = wl || { total: 0, byStatus: {} };
  const projects = mProjects || [];
  const pctDone = workload.total ? Math.round(((workload.byStatus.done || 0) / workload.total) * 100) : 0;
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(m.email);
  const [emailError, setEmailError] = useState("");

  async function saveEmail() {
    const value = emailValue.trim();
    if (!value || !value.includes("@")) {
      setEmailError("Email inválido");
      return;
    }
    setEmailError("");
    await changeEmail(m, value);
    setEditingEmail(false);
  }
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <UserAvatar user={m} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/portal/members/${m.id}`} className="truncate text-base font-semibold text-tivit-ink hover:text-tivit-red">
                {m.name}
              </Link>
              <span className="rounded-full bg-tivit-red-light px-2 py-0.5 text-xs font-semibold text-tivit-red-dark">
                {m.role === "admin" ? "Admin" : "Miembro"}
              </span>
              {m.active !== 1 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Desactivado</span>
              )}
            </div>
            <div className="text-sm text-tivit-ink/60">
              {editingEmail ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    className="rounded-lg border border-tivit-red-light bg-white px-2 py-1 text-xs outline-none focus:border-tivit-red"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                  />
                  <button onClick={saveEmail} className="rounded-lg bg-tivit-red px-2 py-1 text-xs font-semibold text-white transition hover:bg-tivit-red-dark">Guardar</button>
                  <button onClick={() => { setEditingEmail(false); setEmailValue(m.email); setEmailError(""); }} className="rounded-lg border border-black/10 px-2 py-1 text-xs font-semibold text-tivit-ink transition hover:bg-tivit-red-light">Cancelar</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="truncate">{m.email}</span>
                  {isAdmin && m.id !== user?.id && (
                    <button onClick={() => { setEditingEmail(true); setEmailValue(m.email); }} title="Editar email" className="rounded p-1 text-tivit-ink/40 transition hover:text-tivit-red">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
              {emailError && <span className="mt-1 block text-xs text-alert">{emailError}</span>}
            </div>
            {projects.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {projects.map((p) => (
                  <Link key={p.id} to={`/portal/projects/${p.id}`}
                    className="flex items-center gap-1 rounded-full border border-black/10 px-2 py-0.5 text-xs transition hover:border-tivit-red/30">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    <span className="font-medium text-tivit-ink">{p.name}</span>
                    <span className="text-tivit-ink/50">({p.projectRole})</span>
                  </Link>
                ))}
              </div>
            )}
            {workload.total > 0 && (
              <div className="mt-2.5">
                <div className="mb-1 flex items-center justify-between text-xs text-tivit-ink/60">
                  <span>{workload.total} tarea{workload.total !== 1 ? "s" : ""}</span>
                  <span>{pctDone}% completado</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-black/5">
                  {["in_progress","todo","review","backlog","done"].map((st) => {
                    const cfg = {in_progress:"bg-yellow-400",todo:"bg-blue-400",review:"bg-purple-400",backlog:"bg-gray-300",done:"bg-green-400"};
                    const count = workload.byStatus[st] || 0;
                    if (!count) return null;
                    return <div key={st} className={cfg[st]} style={{ width: `${(count / workload.total) * 100}%` }} />;
                  })}
                </div>
              </div>
            )}
            {workload.total === 0 && <p className="mt-1.5 text-xs text-tivit-ink/40">Sin tareas asignadas</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link to={`/portal/members/${m.id}`} className="flex items-center gap-1 text-xs font-semibold text-tivit-red hover:underline">
            Ver perfil <ChevronRight className="h-3 w-3" />
          </Link>
          {isAdmin && m.id !== user?.id && (
            <div className="flex items-center gap-2">
              <select value={m.role} onChange={(e) => changeRole(m, e.target.value)}
                className="rounded-lg border border-tivit-red-light bg-white px-2 py-1.5 text-xs font-medium text-tivit-ink outline-none focus:border-tivit-red">
                <option value="member">Miembro</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={() => toggleActive(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${m.active === 1 ? "border border-alert/30 text-alert hover:bg-alert/10" : "border border-green-700/30 text-green-700 hover:bg-green-50"}`}>
                {m.active === 1 ? "Desactivar" : "Activar"}
              </button>
              <button onClick={() => deleteMember(m)} title="Eliminar usuario"
                className="rounded-lg border border-alert/30 px-2 py-1.5 text-xs font-semibold text-alert/60 transition hover:bg-alert/10 hover:text-alert">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
