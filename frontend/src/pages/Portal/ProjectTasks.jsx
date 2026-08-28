import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { TypeBadge, PriorityBadge, UserAvatar, formatDate } from "./components/Badges";
import { Plus, List, CheckCircle, Clock, AlertCircle } from "lucide-react";

const STATUS_TABS = [
  { key: "backlog", label: "Backlog", icon: List },
  { key: "todo", label: "Por hacer", icon: Clock },
  { key: "in_progress", label: "En progreso", icon: Clock },
  { key: "review", label: "En revisión", icon: AlertCircle },
  { key: "done", label: "Completadas", icon: CheckCircle },
];

export function ProjectTasks() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("backlog");

  useEffect(() => {
    refresh();
  }, [projectId, activeTab]);

  async function refresh() {
    try {
      setLoading(true);
      const data = await api.listTasks({ project: projectId });
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function moveToStatus(taskId, status) {
    try {
      await api.updateTaskStatus(taskId, status);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "backlog") return !task.sprint_id;
    return task.status === activeTab;
  });

  const taskCounts = {
    backlog: tasks.filter((t) => !t.sprint_id).length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando tareas…</div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tivit-ink">Tareas del proyecto</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            Gestiona las tareas y el backlog del proyecto.
          </p>
        </div>
        <Link
          to={`/portal/portfolio/${projectId}/tasks/new`}
          className="flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
        >
          <Plus className="h-4 w-4" /> Nueva tarea
        </Link>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-black/5 pb-px text-sm font-medium">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = taskCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 transition ${
                activeTab === tab.key
                  ? "border-tivit-red text-tivit-red"
                  : "border-transparent text-tivit-ink/60 hover:border-tivit-ink/20 hover:text-tivit-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === tab.key ? "bg-tivit-red/10" : "bg-black/5"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <section>
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-black/5 bg-white p-8 text-center">
            <p className="text-sm text-tivit-ink/50">
              {activeTab === "backlog"
                ? "No hay tareas en el backlog."
                : `No hay tareas en "${STATUS_TABS.find((t) => t.key === activeTab)?.label}".`}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTasks.map((task) => (
              <TaskRow key={task.id} task={task} onMove={moveToStatus} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TaskRow({ task, onMove }) {
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
            {task.assignee && (
              <span className="flex items-center gap-1">
                <UserAvatar user={task.assignee} size="xs" />
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {task.status !== "done" && (
          <select
            value={task.status || "todo"}
            onChange={(e) => onMove(task.id, e.target.value)}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-xs"
          >
            <option value="todo">Por hacer</option>
            <option value="in_progress">En progreso</option>
            <option value="review">En revisión</option>
            <option value="done">Completada</option>
          </select>
        )}
      </div>
    </div>
  );
}
