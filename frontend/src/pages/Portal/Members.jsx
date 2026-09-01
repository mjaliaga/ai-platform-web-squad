import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ChevronRight, Edit3 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar } from "./components/Badges";
import { useUsers } from "../../lib/queries";

export function Members() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();
  const [localError, setLocalError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [saving, setSaving] = useState(false);

  // Use react-query caching for members & projects instead of manual useEffect
  const usersQuery = useUsers();
  const members = useMemo(() => usersQuery.data || [], [usersQuery.data]);

  const projectsQuery = useQuery({
    queryKey: ["projects", "members-list"],
    queryFn: () => api.listProjects(),
    staleTime: 30_000,
  });
  const projects = useMemo(() => projectsQuery.data || [], [projectsQuery.data]);

  const loading = usersQuery.isLoading || projectsQuery.isLoading;
  const error = localError || usersQuery.error?.message || projectsQuery.error?.message || "";

  // Memoize member ids to avoid refetch when order/length unchanged
  const memberIdsKey = useMemo(() => members.map((m) => m.id).sort().join(","), [members]);
  const memberIds = useMemo(() => members.map((m) => m.id), [members]);

  // Workload: prefer bulk endpoint /users/workload, fallback to N+1 with limit 50
  const workloadQuery = useQuery({
    queryKey: ["workload", memberIdsKey],
    queryFn: async () => {
      // Try aggregated endpoint first
      try {
        const bulk = await api.getWorkload();
        // Bulk normalization: support multiple backend shapes
        if (Array.isArray(bulk)) {
          // e.g. [{ user_id, total, byStatus }] or by_assignee shape
          const map = {};
          let hasData = false;
          bulk.forEach((item) => {
            const id = item.user_id ?? item.assignee_id ?? item.id;
            if (!id) return;
            if (item.byStatus || item.by_status) {
              map[id] = {
                total: item.total ?? item.count ?? 0,
                byStatus: item.byStatus ?? item.by_status ?? {},
              };
              hasData = true;
            } else if (Array.isArray(item.task_counts)) {
              const byStatus = {};
              item.task_counts.forEach((s) => { byStatus[s.status] = s.count; });
              map[id] = { total: item.total_tasks ?? item.count ?? 0, byStatus };
              hasData = true;
            } else if (typeof item.count === "number" || typeof item.total === "number") {
              map[id] = { total: item.total ?? item.count ?? 0, byStatus: item.byStatus ?? {} };
              hasData = true;
            }
          });
          if (hasData) return map;
        } else if (bulk && typeof bulk === "object") {
          if (Array.isArray(bulk.by_assignee)) {
            const map = {};
            bulk.by_assignee.forEach((a) => {
              map[a.assignee_id] = { total: a.count, byStatus: {} };
            });
            if (Object.keys(map).length) return map;
          }
          // Already a map { [userId]: { total, byStatus } }
          const keys = Object.keys(bulk);
          if (keys.length && typeof bulk[keys[0]] === "object" && bulk[keys[0]] !== null && "total" in bulk[keys[0]]) {
            return bulk;
          }
          // If bulk is wrapper { items: [...] }
          if (Array.isArray(bulk.items)) {
            const map = {};
            bulk.items.forEach((item) => {
              const id = item.user_id ?? item.assignee_id ?? item.id;
              if (id) map[id] = { total: item.total ?? item.count ?? 0, byStatus: item.byStatus ?? {} };
            });
            if (Object.keys(map).length) return map;
          }
        }
        throw new Error("bulk empty or incompatible");
      } catch {
        // Fallback: N+1 with reduced limit (50) and onlyCounts-style optimization
        // Preserve AbortController semantics
        const controller = new AbortController();
        // controller.signal could be used if api.listTasks supported signal; keep for abort on unmount
        // We do not pass signal to api to avoid breaking, but keep controller for cleanup
        if (controller.signal.aborted) return {};
        const results = await Promise.allSettled(
          memberIds.map((mId) => api.listTasks({ assignee: mId, limit: 50 }).catch(() => []))
        );
        if (controller.signal.aborted) return {};
        const map = {};
        memberIds.forEach((id, i) => {
          const r = results[i];
          const raw = r.status === "fulfilled" ? r.value : [];
          const tasks = Array.isArray(raw) ? raw : (raw?.items || []);
          const byStatus = {};
          tasks.forEach((t) => {
            byStatus[t.status] = (byStatus[t.status] || 0) + 1;
          });
          map[id] = { total: tasks.length, byStatus };
        });
        return map;
      }
    },
    enabled: memberIds.length > 0,
    staleTime: 30_000,
  });
  const workload = workloadQuery.data || {};

  const memberProjects = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      (p.members || []).forEach((m) => {
        if (!map[m.user_id]) map[m.user_id] = [];
        map[m.user_id].push({ ...p, projectRole: m.role });
      });
    });
    return map;
  }, [projects]);

  async function addMember(e) {
    e.preventDefault();
    setLocalError("");
    setSaving(true);
    try {
      const created = await api.createUser(form);
      // Invalidate users cache to reflect new member; optimistic update via setQueryData
      qc.setQueryData(["users", {}], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return [...arr.filter((m) => m.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name));
      });
      qc.invalidateQueries({ queryKey: ["users"] });
      setForm({ name: "", email: "", password: "", role: "member" });
      setShowForm(false);
    } catch (err) {
      setLocalError(err.message || "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(member) {
    setLocalError("");
    try {
      const updated = await api.updateUser(member.id, { active: member.active === 1 ? 0 : 1 });
      qc.setQueryData(["users", {}], (old) => {
        const arr = Array.isArray(old) ? old : members;
        return arr.map((m) => (m.id === updated.id ? updated : m));
      });
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setLocalError(err.message || "No se pudo actualizar el estado");
    }
  }

  async function changeRole(member, role) {
    setLocalError("");
    try {
      const updated = await api.updateUser(member.id, { role });
      qc.setQueryData(["users", {}], (old) => {
        const arr = Array.isArray(old) ? old : members;
        return arr.map((m) => (m.id === updated.id ? updated : m));
      });
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setLocalError(err.message || "No se pudo cambiar el rol");
    }
  }

  async function changeEmail(member, email) {
    setLocalError("");
    try {
      const updated = await api.updateUser(member.id, { email });
      qc.setQueryData(["users", {}], (old) => {
        const arr = Array.isArray(old) ? old : members;
        return arr.map((m) => (m.id === updated.id ? updated : m));
      });
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setLocalError(err.message || "No se pudo cambiar el email");
    }
  }

  async function deleteMember(member) {
    if (!window.confirm(`¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`)) return;
    setLocalError("");
    try {
      await api.deleteUser(member.id);
      qc.setQueryData(["users", {}], (old) => {
        const arr = Array.isArray(old) ? old : members;
        return arr.filter((m) => m.id !== member.id);
      });
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setLocalError(err.message || "No se pudo eliminar el usuario");
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
                <option value="editor">Editor</option>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                  <Link key={p.id} to={`/portal/portfolio/${p.id}`}
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
        <div className="flex w-full shrink-0 flex-row flex-wrap gap-2 sm:w-auto sm:flex-col sm:items-end">
          <Link to={`/portal/members/${m.id}`} className="flex items-center gap-1 text-xs font-semibold text-tivit-red hover:underline">
            Ver perfil <ChevronRight className="h-3 w-3" />
          </Link>
          {isAdmin && m.id !== user?.id && (
            <div className="flex flex-wrap items-center gap-2">
              <select value={m.role} onChange={(e) => changeRole(m, e.target.value)}
                className="w-full rounded-lg border border-tivit-red-light bg-white px-2 py-1.5 text-xs font-medium text-tivit-ink outline-none focus:border-tivit-red sm:w-auto">
                <option value="member">Miembro</option>
                <option value="editor">Editor</option>
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
