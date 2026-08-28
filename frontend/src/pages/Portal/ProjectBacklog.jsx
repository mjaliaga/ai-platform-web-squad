import { useEffect, useState } from "react";
import { Link, useParams, Outlet } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { TypeBadge, PriorityBadge, StatusBadge, UserAvatar, AreaBadge, formatDate } from "./components/Badges";
import { Plus, Filter, Users, Globe } from "lucide-react";

export function ProjectBacklog() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [showTaskByMember, setShowTaskByMember] = useState(false);

  useEffect(() => {
    refresh();
  }, [projectId]);

  async function refresh() {
    try {
      setLoading(true);
      const params = { project: projectId };
      const [tasksData, usersData] = await Promise.all([
        api.listTasks(params),
        api.users()
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setUsers(Array.isArray(usersData) ? usersData : (usersData?.items || []));
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
    if (selectedAssignee && task.assignee_id !== selectedAssignee) return false;
    return true;
  });

  const tasksByAssignee = users.map((u) => ({
    user: u,
    tasks: filteredTasks.filter((t) => t.assignee_id === u.id)
  })).filter((g) => g.tasks.length > 0);

  const unassignedTasks = filteredTasks.filter((t) => !t.assignee_id);

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando backlog…</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTaskByMember(!showTaskByMember)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              showTaskByMember
                ? "bg-tivit-red text-white"
                : "border border-black/10 bg-white text-tivit-ink hover:bg-tivit-red-light"
            }`}
          >
            <Users className="h-4 w-4" />
            Tareas por integrante
          </button>
          <Link
            to={`/portal/portfolio/${projectId}/tasks/new`}
            className="flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </Link>
        </div>
      </div>

      {!showTaskByMember ? (
        <section>
          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-black/5 bg-white p-8 text-center">
              <p className="text-sm text-tivit-ink/50">No hay tareas en el backlog.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-gray-50/50 text-left text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
                    <th className="px-3 py-3">Código</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Título</th>
                    <th className="px-3 py-3">Prioridad</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Asignado</th>
                    <th className="px-3 py-3">Sprint</th>
                    <th className="px-3 py-3">Estimación</th>
                    <th className="px-3 py-3">Vencimiento</th>
                    <th className="px-3 py-3">Entregable</th>
                    <th className="px-3 py-3">Áreas</th>
                    <th className="px-3 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-3 font-mono text-xs text-tivit-ink/60">{task.code}</td>
                      <td className="px-3 py-3"><TypeBadge type={task.type} /></td>
                      <td className="px-3 py-3">
                        <Link to={`/portal/tasks/${task.id}`} className="font-medium text-tivit-ink hover:text-tivit-red">
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-3 py-3"><StatusBadge status={task.status} /></td>
                      <td className="px-3 py-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={task.assignee} size="sm" />
                            <span className="text-xs">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-tivit-ink/40">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-tivit-ink/60">
                        {task.sprint?.name || "-"}
                      </td>
                      <td className="px-3 py-3 text-xs text-tivit-ink/60">
                        {task.estimate_hours ? `${task.estimate_hours}h` : "-"}
                      </td>
                      <td className="px-3 py-3 text-xs text-tivit-ink/60">
                        {task.due_date ? formatDate(task.due_date) : "-"}
                      </td>
                      <td className="px-3 py-3 text-xs text-tivit-ink/60 max-w-[200px] truncate">
                        {task.deliverable || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(task.labels || []).map((label) => (
                            <AreaBadge key={label} area={label} />
                          ))}
                          {(!task.labels || task.labels.length === 0) && <span className="text-xs text-tivit-ink/40">-</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {task.status !== "done" && (
                          <select
                            value={task.status || "todo"}
                            onChange={(e) => moveToStatus(task.id, e.target.value)}
                            className="rounded-lg border border-black/10 px-2 py-1 text-xs"
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">Por hacer</option>
                            <option value="in_progress">En progreso</option>
                            <option value="review">En revisión</option>
                            <option value="done">Completada</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-6">
          {tasksByAssignee.map(({ user: u, tasks: utasks }) => (
            <div key={u.id} className="rounded-xl border border-black/5 bg-white p-4">
              <div className="mb-3 flex items-center gap-3 border-b border-black/5 pb-3">
                <UserAvatar user={u} size="md" />
                <div>
                  <div className="font-semibold text-tivit-ink">{u.name}</div>
                  <div className="text-xs text-tivit-ink/50">{u.email}</div>
                </div>
                <div className="ml-auto rounded-full bg-tivit-red/10 px-3 py-1 text-xs font-semibold text-tivit-red">
                  {utasks.length} tarea{utasks.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="space-y-2">
                {utasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-black/5 bg-gray-50/50 p-3">
                    <div className="flex items-center gap-3">
                      <TypeBadge type={task.type} />
                      <Link to={`/portal/tasks/${task.id}`} className="font-medium text-tivit-ink hover:text-tivit-red">
                        {task.title}
                      </Link>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex items-center gap-2">
                      {task.due_date && (
                        <span className="text-xs text-tivit-ink/50">Vence: {formatDate(task.due_date)}</span>
                      )}
                      <select
                        value={task.status || "todo"}
                        onChange={(e) => moveToStatus(task.id, e.target.value)}
                        className="rounded-lg border border-black/10 px-2 py-1 text-xs"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="todo">Por hacer</option>
                        <option value="in_progress">En progreso</option>
                        <option value="review">En revisión</option>
                        <option value="done">Completada</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {unassignedTasks.length > 0 && (
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <div className="mb-3 flex items-center gap-3 border-b border-black/5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-tivit-ink">Sin asignar</div>
                </div>
                <div className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {unassignedTasks.length} tarea{unassignedTasks.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="space-y-2">
                {unassignedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-black/5 bg-gray-50/50 p-3">
                    <div className="flex items-center gap-3">
                      <TypeBadge type={task.type} />
                      <Link to={`/portal/tasks/${task.id}`} className="font-medium text-tivit-ink hover:text-tivit-red">
                        {task.title}
                      </Link>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex items-center gap-2">
                      {task.due_date && (
                        <span className="text-xs text-tivit-ink/50">Vence: {formatDate(task.due_date)}</span>
                      )}
                      <select
                        value={task.status || "todo"}
                        onChange={(e) => moveToStatus(task.id, e.target.value)}
                        className="rounded-lg border border-black/10 px-2 py-1 text-xs"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="todo">Por hacer</option>
                        <option value="in_progress">En progreso</option>
                        <option value="review">En revisión</option>
                        <option value="done">Completada</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="rounded-xl border border-black/5 bg-white p-8 text-center">
              <p className="text-sm text-tivit-ink/50">No hay tareas para mostrar.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
