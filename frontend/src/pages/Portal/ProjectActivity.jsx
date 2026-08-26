import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { ActivityIcon, Plus, Edit, ArrowRight, MessageSquare, Paperclip, CheckCircle } from "lucide-react";

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function getActivityIcon(type) {
  switch (type) {
    case "created":
      return { icon: Plus, color: "text-green-600 bg-green-100" };
    case "updated":
      return { icon: Edit, color: "text-blue-600 bg-blue-100" };
    case "status_changed":
      return { icon: ArrowRight, color: "text-purple-600 bg-purple-100" };
    case "commented":
      return { icon: MessageSquare, color: "text-amber-600 bg-amber-100" };
    case "attached":
      return { icon: Paperclip, color: "text-cyan-600 bg-cyan-100" };
    default:
      return { icon: ActivityIcon, color: "text-gray-600 bg-gray-100" };
  }
}

export function ProjectActivity() {
  const { id: projectId } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    refresh();
  }, [projectId]);

  async function refresh() {
    try {
      setLoading(true);
      const tasks = await api.listTasks({ project: projectId, limit: 50 });
      const tasksList = Array.isArray(tasks) ? tasks : [];

      const activityItems = [];

      tasksList.forEach((task) => {
        if (task.created_at) {
          activityItems.push({
            id: `${task.id}-created`,
            type: "created",
            taskId: task.id,
            taskCode: task.code,
            taskTitle: task.title,
            timestamp: task.created_at,
            description: `creó la tarea`,
            user: task.reporter?.name || "Usuario",
          });
        }
        if (task.updated_at && task.updated_at !== task.created_at) {
          activityItems.push({
            id: `${task.id}-updated`,
            type: "updated",
            taskId: task.id,
            taskCode: task.code,
            taskTitle: task.title,
            timestamp: task.updated_at,
            description: `actualizó la tarea`,
            user: task.assignee?.name || task.reporter?.name || "Usuario",
          });
        }
      });

      activityItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(activityItems.slice(0, 30));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando actividad…</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tivit-ink">Actividad</h1>
        <p className="mt-1 text-sm text-tivit-ink/60">
          Actividad reciente del proyecto.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border border-black/5 bg-white p-8 text-center">
          <p className="text-sm text-tivit-ink/50">No hay actividad reciente en el proyecto.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => {
            const { icon: Icon, color } = getActivityIcon(activity.type);
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-4 transition hover:bg-gray-50"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-tivit-ink">{activity.user}</span>
                    <span className="text-sm text-tivit-ink/60">{activity.description}</span>
                    <Link
                      to={`/portal/tasks/${activity.taskId}`}
                      className="text-sm font-medium text-tivit-red hover:underline"
                    >
                      {activity.taskCode}
                    </Link>
                  </div>
                  <p className="truncate text-sm text-tivit-ink/50">{activity.taskTitle}</p>
                </div>
                <span className="shrink-0 text-xs text-tivit-ink/40">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
