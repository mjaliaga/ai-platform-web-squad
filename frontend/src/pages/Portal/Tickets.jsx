import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, Plus, Settings, Search } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge, PriorityBadge, LevelBadge, UserAvatar, formatDate } from "./components/Badges";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "abierto", label: "Abiertos" },
  { value: "en_progreso", label: "En progreso" },
  { value: "resuelto", label: "Resueltos" },
  { value: "cerrado", label: "Cerrados" },
];

const LEVEL_FILTERS = [
  { value: "", label: "Todos los niveles" },
  { value: "1", label: "Nivel 1" },
  { value: "2", label: "Nivel 2" },
];

export function Tickets() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [search, setSearch] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ level1: "", level2: "" });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    refresh();
    loadProjects();
    loadConfig();
    loadUsers();
  }, []);

  async function loadProjects() {
    try {
      const data = await api.listProjects({ limit: 100 });
      setProjects(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function loadUsers() {
    try {
      const data = await api.users();
      setUsers(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function loadConfig() {
    try {
      const data = await api.getTicketConfig();
      setConfig(Array.isArray(data) ? data : []);
      const l1 = data.find((c) => c.level === 1);
      const l2 = data.find((c) => c.level === 2);
      setConfigForm({ level1: l1?.user_id || "", level2: l2?.user_id || "" });
    } catch {}
  }

  async function refresh() {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterLevel) params.level = filterLevel;
      if (filterProject) params.project_id = filterProject;
      if (search.trim()) params.q = search.trim();
      const data = await api.listTickets(params);
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [filterStatus, filterLevel, filterProject]);

  async function handleSaveConfig(e) {
    e.preventDefault();
    try {
      if (configForm.level1) await api.updateTicketConfig({ level: 1, user_id: configForm.level1 });
      if (configForm.level2) await api.updateTicketConfig({ level: 2, user_id: configForm.level2 });
      await loadConfig();
      setShowConfig(false);
    } catch (err) {
      setError(err.message);
    }
  }

  const level1User = config.find((c) => c.level === 1);
  const level2User = config.find((c) => c.level === 2);

  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando tickets…</div>;
  if (error) return <div className="py-8 text-center text-sm text-alert">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-tivit-ink">
            <Ticket className="h-6 w-6 text-tivit-red" /> Tickets
          </h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            Asociados a portfolio — Nivel 1: {level1User ? `${level1User.user_name} (${level1User.user_email})` : "Manuel Aliaga"} · Nivel 2: {level2User ? `${level2User.user_name} (${level2User.user_email})` : "Sergio Aguas"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-tivit-ink hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" /> Configurar niveles
            </button>
          )}
          <Link
            to="/portal/tickets/new"
            className="inline-flex items-center gap-2 rounded-xl bg-tivit-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-tivit-red-dark"
          >
            <Plus className="h-4 w-4" /> Nuevo ticket
          </Link>
        </div>
      </div>

      {showConfig && isAdmin && (
        <form onSubmit={handleSaveConfig} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-tivit-ink">Configurar responsables por nivel</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-tivit-ink/60">Nivel 1 — Contacto inicial</label>
              <select
                value={configForm.level1}
                onChange={(e) => setConfigForm((f) => ({ ...f, level1: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              >
                <option value="">Seleccionar usuario...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-tivit-ink/60">Nivel 2 — Escalado</label>
              <select
                value={configForm.level2}
                onChange={(e) => setConfigForm((f) => ({ ...f, level2: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              >
                <option value="">Seleccionar usuario...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowConfig(false)} className="rounded-lg border border-black/10 px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white">
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-black/5 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tivit-ink/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && refresh()}
              placeholder="Buscar por título, código..."
              className="w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
            />
          </div>
          <button onClick={refresh} className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Buscar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filterStatus === f.value ? "bg-tivit-red text-white" : "bg-tivit-ink/5 text-tivit-ink/70 hover:bg-tivit-ink/10"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {LEVEL_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterLevel(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filterLevel === f.value ? "bg-tivit-red text-white" : "bg-tivit-ink/5 text-tivit-ink/70 hover:bg-tivit-ink/10"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-tivit-ink/50">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} {filterStatus || filterLevel || filterProject || search ? "(filtrados)" : ""}
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white p-8 text-center">
          <Ticket className="mx-auto h-8 w-8 text-tivit-ink/20" />
          <p className="mt-2 text-sm text-tivit-ink/50">No hay tickets.</p>
          <p className="text-xs text-tivit-ink/40">Crea uno nuevo asociado a un proyecto de tu portfolio.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => {
            const ticket = t.ticket || t;
            const reporter = t.reporter;
            const assignee = t.assignee;
            const projectName = t.project_name;
            return (
              <Link key={ticket.id} to={`/portal/tickets/${ticket.id}`} className="rounded-xl border border-black/5 bg-white p-4 hover:shadow-sm transition">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-tivit-ink/50">{ticket.code}</span>
                      <StatusBadge status={ticket.status} />
                      <LevelBadge level={ticket.level} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <h3 className="mt-2 truncate text-sm font-semibold text-tivit-ink">{ticket.title}</h3>
                    {ticket.description && <p className="mt-1 line-clamp-2 text-xs text-tivit-ink/60">{ticket.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-tivit-ink/50">
                      <span>Proyecto: {projectName || ticket.project_id}</span>
                      <span>·</span>
                      <span>Reportado por: {reporter?.name || ticket.reporter_id}</span>
                      {assignee && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <UserAvatar user={assignee} size="sm" /> {assignee.name}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-tivit-ink/40">{ticket.category || ""}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
