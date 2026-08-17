import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { TypeBadge, PriorityBadge, UserAvatar, formatDate } from "./components/Badges";

export function Backlog({ projectId } = {}) {
  const { user } = useAuth();
  const { id: routeId } = useParams();
  const pid = projectId || routeId;
  const isAdmin = user?.role === "admin";
  const [backlog, setBacklog] = useState(null);
  const [scope, setScope] = useState(isAdmin && !pid ? "all" : "mine");
  const [error, setError] = useState(null);

  useEffect(() => {
    refresh();
  }, [scope, pid]);

  async function refresh() {
    try {
      const params = {};
      if (scope === "mine") params.scope = "mine";
      if (pid) params.project = pid;
      const data = await api.backlog(params);
      setBacklog(data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function moveToBoard(taskId, status) {
    try {
      await api.updateTaskStatus(taskId, status);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (!backlog) return <div className="text-tivit-ink/60">Cargando backlog…</div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-tivit-ink">Backlog</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            Ideas y tareas pendientes. Promové una tarea al tablero cuando esté lista para ejecutar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-black/10 bg-white text-xs font-medium">
            <button
              onClick={() => setScope("all")}
              className={`rounded-l-lg px-3 py-1.5 transition ${scope === "all" ? "bg-tivit-red text-white" : "text-tivit-ink/60 hover:bg-tivit-red-light"}`}
            >
              Todo el equipo
            </button>
            <button
              onClick={() => setScope("mine")}
              className={`rounded-r-lg px-3 py-1.5 transition ${scope === "mine" ? "bg-tivit-red text-white" : "text-tivit-ink/60 hover:bg-tivit-red-light"}`}
            >
              Mis tareas
            </button>
          </div>
          <Link
            to={pid ? `/portal/projects/${pid}/tasks/new` : "/portal/tasks/new"}
            className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
          >
            + Nueva tarea
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold text-tivit-ink">Tareas pendientes</h2>
        {backlog.tasks.length === 0 ? (
          <p className="text-sm text-tivit-ink/50">No hay tareas en el backlog.</p>
        ) : (
          <div className="grid gap-3">
            {backlog.tasks.map((task) => (
              <BacklogRow key={task.id} task={task} onMove={moveToBoard} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BacklogRow({ task, onMove }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        <TypeBadge type={task.type} />
        <div className="flex-1">
          <Link
            to={`/portal/tasks/${task.id}`}
            className="font-semibold text-tivit-ink hover:text-tivit-red"
          >
            {task.title}
          </Link>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-tivit-ink/60">
            <span className="font-mono">{task.code}</span>
            <PriorityBadge priority={task.priority} />
            {task.due_date && <span>Vence: {formatDate(task.due_date)}</span>}
            {task.deliverable && <span className="text-tivit-ink/80">· {task.deliverable}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <UserAvatar user={task.assignee} size="sm" />
        <button
          onClick={() => onMove(task.id, "todo")}
          className="rounded-lg bg-tivit-red px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-tivit-red-dark"
        >
          Promover
        </button>
      </div>
    </div>
  );
}