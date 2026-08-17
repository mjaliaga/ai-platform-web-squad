import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FolderKanban, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { StatusBadge, TypeBadge, PriorityBadge, UserAvatar, formatDate, formatRelative } from "./components/Badges";

const ROLE_LABELS = {
  lead: "Líder",
  dev: "Desarrollador",
  design: "Diseño",
  qa: "QA",
  viewer: "Observador",
  arquitecto: "Arquitecto",
};

export function MemberProfile() {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getUserStats(id),
      api.listTasks({ assignee: id, limit: 500 }).catch(() => []),
    ])
      .then(([s, t]) => {
        setStats(s);
        setTasks(t);
      })
      .catch((e) => setError(e.message || "Error cargando perfil"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando…</p>;
  if (error) return <p className="py-8 text-center text-sm text-alert">{error}</p>;
  if (!stats) return null;

  const { user: member, task_counts, total_tasks, total_estimate, total_spent, overdue_count, projects, recent_activity } = stats;
  const statusMap = Object.fromEntries(task_counts.map((s) => [s.status, s.count]));
  const byStatus = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  const pctDone = total_tasks ? Math.round(((statusMap.done || 0) / total_tasks) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/portal/members" className="inline-flex items-center gap-1.5 text-sm font-semibold text-tivit-red hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Miembros
      </Link>

      {/* Header */}
      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
        <div className="flex items-start gap-4">
          <UserAvatar user={member} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-tivit-ink">{member.name}</h1>
            <p className="text-sm text-tivit-ink/60">{member.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-tivit-red-light px-2 py-0.5 text-xs font-semibold text-tivit-red-dark">
                {member.role === "admin" ? "Administrador" : "Miembro"}
              </span>
              {member.active !== 1 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Desactivado</span>
              )}
              {member.created_at && (
                <span className="text-xs text-tivit-ink/50">Desde {formatDate(member.created_at)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Tareas totales" value={total_tasks} />
        <StatCard label="En progreso" value={statusMap.in_progress || 0} accent="yellow" />
        <StatCard label="Completadas" value={statusMap.done || 0} accent="green" />
        <StatCard label="Vencidas" value={overdue_count} accent={overdue_count > 0 ? "red" : ""} />
      </div>

      {/* Progress bar */}
      {total_tasks > 0 && (
        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-tivit-ink">Progreso</span>
            <span className="font-semibold text-tivit-ink">{pctDone}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/5">
            <div className="h-full rounded-full bg-tivit-red" style={{ width: `${pctDone}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-tivit-ink/60">
            {Object.entries(byStatus).map(([status, count]) => (
              <span key={status} className="flex items-center gap-1">
                <StatusBadge status={status} /> {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hours */}
      {(total_estimate > 0 || total_spent > 0) && (
        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">Tiempo</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-tivit-ink/60">Estimado</div>
              <div className="text-lg font-bold text-tivit-ink">{total_estimate.toFixed(1)} h</div>
            </div>
            <div>
              <div className="text-xs text-tivit-ink/60">Trabajado</div>
              <div className="text-lg font-bold text-tivit-ink">{total_spent.toFixed(1)} h</div>
            </div>
            <div>
              <div className="text-xs text-tivit-ink/60">Eficiencia</div>
              <div className="text-lg font-bold text-tivit-ink">
                {total_estimate > 0 ? `${Math.round((total_spent / total_estimate) * 100)}%` : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">
            Proyectos ({projects.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {projects.map((p) => (
              <Link
                key={p.project_id}
                to={`/portal/projects/${p.project_id}`}
                className="flex items-center gap-3 rounded-xl border border-black/5 p-3 transition hover:border-tivit-red/20"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: p.project_color }}>
                  <FolderKanban className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-tivit-ink">{p.project_name}</div>
                  <div className="text-xs text-tivit-ink/50">{ROLE_LABELS[p.role] || p.role}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Overdue tasks */}
      {overdue_count > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" /> {overdue_count} tarea{overdue_count > 1 ? "s" : ""} vencida{overdue_count > 1 ? "s" : ""}
          </div>
          <div className="mt-2 space-y-1">
            {tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").slice(0, 5).map((t) => (
              <Link key={t.id} to={`/portal/tasks/${t.id}`} className="flex items-center gap-2 text-sm text-amber-800 hover:underline">
                <TypeBadge type={t.type} /> {t.title} <span className="text-xs">({formatDate(t.due_date)})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recent_activity.length > 0 && (
        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">Actividad reciente</h2>
          <div className="space-y-3">
            {recent_activity.map((a) => (
              <div key={a.id} className="flex gap-3">
                <UserAvatar user={a.user} size="sm" />
                <div className="flex-1 text-sm">
                  <span className="font-semibold text-tivit-ink">{a.user.name}</span>{" "}
                  <span className="text-tivit-ink/60">{actionLabel(a)}</span>{" "}
                  <Link to={`/portal/tasks/${a.task_id}`} className="font-mono text-xs text-tivit-red hover:underline">ver tarea</Link>
                  <div className="text-xs text-tivit-ink/50">{formatRelative(a.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">
          Tareas asignadas ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-tivit-ink/50">Sin tareas asignadas.</p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 20).map((t) => (
              <Link
                key={t.id}
                to={`/portal/tasks/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-black/5 p-3 transition hover:bg-tivit-red-light/40"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <TypeBadge type={t.type} />
                  <span className="truncate text-sm font-medium text-tivit-ink">{t.title}</span>
                  <span className="font-mono text-xs text-tivit-ink/50">{t.code}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  {t.due_date && <span className="text-xs text-tivit-ink/50">{formatDate(t.due_date)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const colors = {
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    "": "bg-tivit-ink/5 text-tivit-ink",
  };
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">{label}</div>
      <div className={`mt-1 w-fit rounded-md px-2 py-0.5 text-xl font-bold ${colors[accent || ""]}`}>{value}</div>
    </div>
  );
}

function actionLabel(a) {
  switch (a.action) {
    case "created": return "creó una tarea";
    case "updated": return `actualizó ${a.field_changed || "la tarea"}`;
    case "moved": return `movió la tarea de ${a.old_value} a ${a.new_value}`;
    case "assigned": return "reasignó la tarea";
    case "commented": return "comentó en la tarea";
    case "attached": return `adjuntó ${a.new_value}`;
    case "toggled": return `marcó subtarea como ${a.new_value}`;
    default: return a.action;
  }
}
