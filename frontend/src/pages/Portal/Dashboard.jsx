import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Megaphone,
  AlertTriangle,
  Pin,
  Plus,
  ChevronRight,
  Layers,
  Clock,
  CheckCircle2,
  PlayCircle,
  CalendarClock,
  TrendingUp,
  Users,
  ListTodo,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  TypeBadge,
  PriorityBadge,
  UserAvatar,
  formatDate,
  formatRelative,
  toDate,
} from "./components/Badges";

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

export function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState(null);
  const [activeSprint, setActiveSprint] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const statsPromise = isAdmin ? api.dashboard() : api.dashboardMe();
    Promise.all([
      statsPromise,
      api.getActiveSprint().catch(() => null),
      api.listAnnouncements().catch(() => []),
      api.listTasks({ assignee: user?.id }).catch(() => []),
      isAdmin ? api.listProjects().catch(() => []) : Promise.resolve([]),
    ])
      .then(([s, sprint, anns, tasks, projs]) => {
        setStats(s);
        setActiveSprint(sprint);
        setAnnouncements(anns);
        setMyTasks(tasks);
        setProjects(projs);
      })
      .catch((e) => setError(e.message));
  }, [user?.id, isAdmin]);

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (!stats) return <div className="text-tivit-ink/60">Cargando…</div>;

  const statusMap = Object.fromEntries(stats.by_status.map((s) => [s.status, s.count]));
  const pinned = announcements.filter((a) => a.pinned === 1);
  const recentAnnouncements = announcements.slice(0, 3);

  const myByStatus = {};
  for (const t of myTasks) {
    (myByStatus[t.status] ??= []).push(t);
  }
  const myInProgress = myByStatus.in_progress || [];
  const myTodo = myByStatus.todo || [];
  const myReview = myByStatus.review || [];

  const staleTasks = stats.recent_activity.length > 0
    ? myTasks.filter((t) => {
        if (t.status === "done" || t.status === "backlog") return false;
        const updated = toDate(t.updated_at);
        const threeDaysAgo = Date.now() - 3 * 24 * 3600 * 1000;
        return updated ? updated.getTime() < threeDaysAgo : false;
      })
    : [];

  return (
    <div className="space-y-8">
      <Hero
        name={user?.name}
        date={new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        avatarColor={user?.avatar_color}
      />

      {pinned.length > 0 && (
        <div className="space-y-3">
          {pinned.map((a) => (
            <div
              key={a.id}
              className="relative overflow-hidden rounded-2xl border border-tivit-red/20 bg-white p-5 shadow-sm"
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-tivit-red" aria-hidden="true" />
              <div className="flex items-start gap-3 pl-1">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tivit-red/10 text-tivit-red">
                  <Pin className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-tivit-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tivit-red">
                      Anuncio fijado
                    </span>
                    <span className="text-xs text-tivit-ink/45">{formatRelative(a.created_at)}</span>
                  </div>
                  <div className="mt-1 font-semibold text-tivit-ink">{a.title}</div>
                  <p className="mt-0.5 text-sm text-tivit-ink/60 line-clamp-2">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSprint && <ActiveSprintCard sprint={activeSprint} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionHeader title="Mis tareas" count={myTasks.length} />
          {myTasks.length === 0 ? (
            <EmptyCard text="No tenés tareas asignadas todavía." cta="Ver proyectos" to="/portal/projects" />
          ) : (
            <div className="space-y-4">
              {myInProgress.length > 0 && (
                <TaskGroup label="En progreso" icon={<PlayCircle className="h-4 w-4 text-yellow-600" />} dot="bg-yellow-500" tasks={myInProgress} />
              )}
              {myReview.length > 0 && (
                <TaskGroup label="En revisión" icon={<Clock className="h-4 w-4 text-purple-600" />} dot="bg-purple-500" tasks={myReview} />
              )}
              {myTodo.length > 0 && (
                <TaskGroup label="Por hacer" icon={<Layers className="h-4 w-4 text-blue-600" />} dot="bg-blue-500" tasks={myTodo} />
              )}
              {(myByStatus.backlog || []).length > 0 && (
                <TaskGroup label="Backlog" icon={<Layers className="h-4 w-4 text-tivit-ink/40" />} dot="bg-tivit-ink/40" tasks={myByStatus.backlog} />
              )}
              {(myByStatus.done || []).slice(0, 3).length > 0 && (
                <TaskGroup label="Completadas" icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} dot="bg-green-500" tasks={myByStatus.done.slice(0, 3)} />
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <SectionHeader title="Anuncios" count={announcements.length} link={{ to: "/portal/feed", label: "Ver todos" }} />
          {recentAnnouncements.length === 0 ? (
            <EmptyCard text="Todavía no hay anuncios." cta="Publicar" to="/portal/feed" />
          ) : (
            <div className="space-y-2.5">
              {recentAnnouncements.map((a) => (
                <Link
                  key={a.id}
                  to="/portal/feed"
                  className="group block rounded-2xl border border-black/5 bg-white p-4 transition hover:border-tivit-red/20 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tivit-red-light text-tivit-red">
                      <Megaphone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-tivit-ink group-hover:text-tivit-red">
                          {a.title}
                        </span>
                        {a.pinned === 1 && <Pin className="h-3 w-3 shrink-0 text-tivit-red" aria-hidden="true" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-tivit-ink/55">{a.body}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-tivit-ink/45">
                        <UserAvatar user={a.author} size="sm" />
                        <span className="font-medium text-tivit-ink/60">{a.author?.name}</span>
                        <span>·</span>
                        <span>{formatRelative(a.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAdmin && projects.length > 0 && (
        <div>
          <SectionHeader title="Proyectos del equipo" count={projects.length} link={{ to: "/portal/projects", label: "Ver todos" }} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((p) => {
              const pct = p.task_count ? Math.round((p.done_count / p.task_count) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  to={`/portal/projects/${p.id}`}
                  className="group rounded-2xl border border-black/5 bg-white p-4 transition hover:border-tivit-red/20 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: p.color }}>
                      <span className="h-3 w-3 rounded-full bg-white/30" />
                    </span>
                    <span className="truncate text-sm font-semibold text-tivit-ink group-hover:text-tivit-red">{p.name}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-tivit-ink/55">
                    <span>{p.task_count} tareas</span>
                    <span className="font-semibold text-tivit-ink/70">{pct}% completado</span>
                  </div>
                  {p.task_count > 0 && (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-tivit-red-light">
                      <div className="h-full rounded-full bg-tivit-red transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/55">
              {isAdmin ? "Actividad reciente del equipo" : "Mi actividad reciente"}
            </h2>
            <span className="rounded-full bg-tivit-red-light px-2 py-0.5 text-[11px] font-semibold text-tivit-red">
              En vivo
            </span>
          </div>
          {stats.recent_activity.length === 0 ? (
            <p className="py-4 text-center text-sm text-tivit-ink/45">Sin actividad reciente.</p>
          ) : (
            <div className="space-y-4">
              {stats.recent_activity.slice(0, 6).map((a) => (
                <div key={a.id} className="flex gap-3">
                  <UserAvatar user={a.user} size="sm" />
                  <div className="flex-1 text-sm">
                    <span className="font-semibold text-tivit-ink">{a.user.name}</span>{" "}
                    <span className="text-tivit-ink/55">{actionLabel(a)}</span>{" "}
                    <Link
                      to={`/portal/tasks/${a.task_id}`}
                      className="font-mono text-xs font-medium text-tivit-red hover:underline"
                    >
                      ver tarea
                    </Link>
                    <div className="text-xs text-tivit-ink/45">{formatRelative(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/55">Estado del equipo</h2>

            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Total" value={stats.total_tasks} icon={<ListTodo className="h-4 w-4" />} />
              <KpiCard label="En progreso" value={statusMap.in_progress || 0} accent="yellow" icon={<PlayCircle className="h-4 w-4" />} />
              <KpiCard label="Completadas" value={statusMap.done || 0} accent="green" icon={<CheckCircle2 className="h-4 w-4" />} />
              <KpiCard label="Backlog" value={statusMap.backlog || 0} icon={<Layers className="h-4 w-4" />} />
            </div>

            {staleTasks.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Tareas estancadas
                </div>
                <p className="mt-1 text-xs text-amber-700/80">
                  {staleTasks.length} tarea{staleTasks.length > 1 ? "s" : ""} sin actividad hace más de 3 días.
                </p>
                <Link
                  to="/portal"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
                >
                  Revisar tareas <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            )}

            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-tivit-ink/40" aria-hidden="true" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-tivit-ink/55">Carga por miembro</h3>
              </div>
              <div className="space-y-3">
                {stats.by_assignee.length === 0 ? (
                  <p className="text-xs text-tivit-ink/45">Sin datos.</p>
                ) : (
                  stats.by_assignee.map((a) => (
                    <div key={a.assignee_id || "unassigned"} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={{ name: a.assignee_name || "?" }} size="sm" />
                        <span className="text-sm font-medium text-tivit-ink">
                          {a.assignee_name || "Sin asignar"}
                        </span>
                      </div>
                      <span className="rounded-full bg-tivit-red/10 px-2 py-0.5 text-xs font-bold text-tivit-red">
                        {a.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/55">Mi resumen</h2>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Mis tareas" value={stats.total_tasks} icon={<ListTodo className="h-4 w-4" />} />
              <KpiCard label="En progreso" value={statusMap.in_progress || 0} accent="yellow" icon={<PlayCircle className="h-4 w-4" />} />
              <KpiCard label="Completadas" value={statusMap.done || 0} accent="green" icon={<CheckCircle2 className="h-4 w-4" />} />
              <KpiCard label="Por hacer" value={statusMap.todo || 0} icon={<Layers className="h-4 w-4" />} />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-tivit-red" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/55">
              Próximos vencimientos
            </h2>
          </div>
          {stats.upcoming_due.length === 0 ? (
            <p className="py-4 text-center text-sm text-tivit-ink/45">No hay tareas próximas a vencer.</p>
          ) : (
            <div className="space-y-2">
              {stats.upcoming_due.map((t) => (
                <Link
                  key={t.id}
                  to={`/portal/tasks/${t.id}`}
                  className="flex items-center justify-between rounded-xl border border-black/5 p-3 transition hover:border-tivit-red/20 hover:bg-tivit-red-light/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <TypeBadge type={t.type} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-tivit-ink">{t.title}</div>
                      <div className="text-xs text-tivit-ink/45">{t.code}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-tivit-ink">{formatDate(t.due_date)}</div>
                    <PriorityBadge priority={t.priority} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-tivit-red" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/55">
              Tareas por prioridad
            </h2>
          </div>
          <div className="space-y-3">
            {stats.by_priority.map((p) => (
              <BarRow
                key={p.priority}
                label={<PriorityBadge priority={p.priority} />}
                value={p.count}
                total={stats.total_tasks}
                color="bg-orange-500"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ name, date, avatarColor }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-tivit-ink p-6 text-white shadow-sm sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-tivit-red/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/5 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg ring-2 ring-white/20"
            style={{ background: avatarColor || "#dc2626" }}
          >
            {name?.split(" ")[0]?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium capitalize text-white/60">{date}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
              Hola, {name?.split(" ")?.[0] ?? ""}
            </h1>
            <p className="mt-0.5 text-sm text-white/60">Buen día. Resumimos tu trabajo de hoy.</p>
          </div>
        </div>
        <Link
          to="/portal/tasks/new"
          className="flex items-center gap-2 rounded-full bg-tivit-red px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-tivit-red-dark"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Nueva tarea
        </Link>
      </div>
    </div>
  );
}

function ActiveSprintCard({ sprint }) {
  const goals = parseGoals(sprint.goal);
  const pct = sprint.total_tasks ? Math.round((sprint.done_tasks / sprint.total_tasks) * 100) : 0;
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tivit-red/10 text-tivit-red">
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-tivit-red">Sprint activo</span>
            <h2 className="text-lg font-bold text-tivit-ink">{sprint.name}</h2>
          </div>
        </div>
        <Link
          to="/portal/sprints"
          className="flex items-center gap-1.5 rounded-lg border border-tivit-red/20 px-3 py-1.5 text-sm font-semibold text-tivit-red transition hover:bg-tivit-red hover:text-white"
        >
          Ver sprints <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {goals.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm text-tivit-ink/60">
          {goals.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SprintStat label="Progreso" value={`${sprint.done_tasks}/${sprint.total_tasks}`} />
        <SprintStat label="Estimado" value={`${sprint.total_estimate.toFixed(1)} h`} />
        <SprintStat label="Trabajado" value={`${sprint.total_spent.toFixed(1)} h`} />
        <SprintStat label="Avance" value={sprint.total_tasks ? `${pct}%` : "—"} highlight={pct >= 100} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-tivit-red-light">
          <div
            className="h-full rounded-full bg-tivit-red transition-all"
            style={{ width: `${sprint.total_tasks ? (sprint.done_tasks / sprint.total_tasks) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-tivit-ink/60">{pct}%</span>
      </div>
    </div>
  );
}

function SprintStat({ label, value, highlight }) {
  return (
    <div className="rounded-xl bg-tivit-red-light/50 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-tivit-ink/50">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${highlight ? "text-green-700" : "text-tivit-ink"}`}>{value}</div>
    </div>
  );
}

function SectionHeader({ title, count, link }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-tivit-ink/55">
        {title}
        {count > 0 && (
          <span className="rounded-full bg-tivit-red/10 px-2 py-0.5 text-xs font-bold text-tivit-red">
            {count}
          </span>
        )}
      </h2>
      {link && (
        <Link to={link.to} className="flex items-center gap-1 text-xs font-semibold text-tivit-red hover:underline">
          {link.label} <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function TaskGroup({ label, icon, dot, tasks }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider text-tivit-ink/55">{label}</span>
        <span className="rounded-full bg-tivit-ink/5 px-1.5 py-0.5 text-[10px] font-bold text-tivit-ink/55">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-1">
        {tasks.map((t) => (
          <Link
            key={t.id}
            to={`/portal/tasks/${t.id}`}
            className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-tivit-red-light/50"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {icon}
              <span className="truncate text-sm font-medium text-tivit-ink group-hover:text-tivit-red">{t.title}</span>
              <TypeBadge type={t.type} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {t.due_date && (
                <span className="text-xs text-tivit-ink/45">{formatDate(t.due_date)}</span>
              )}
              <PriorityBadge priority={t.priority} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyCard({ text, cta, to }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-8 text-center">
      <p className="text-sm text-tivit-ink/50">{text}</p>
      {cta && to && (
        <Link to={to} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-tivit-red hover:underline">
          {cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function KpiCard({ label, value, accent, icon }) {
  const accentMap = {
    green: { chip: "bg-green-100 text-green-700", value: "text-green-700" },
    yellow: { chip: "bg-yellow-100 text-yellow-700", value: "text-yellow-700" },
  };
  const a = accentMap[accent] || { chip: "bg-tivit-ink/5 text-tivit-ink/60", value: "text-tivit-ink" };
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-tivit-ink/50">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.chip}`}>
          {icon}
        </span>
      </div>
      <div className={`mt-2 text-2xl font-bold ${a.value}`}>{value}</div>
    </div>
  );
}

function BarRow({ label, value, total, color }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <div>{label}</div>
        <span className="font-mono font-semibold text-tivit-ink/60">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-tivit-red-light/60">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
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