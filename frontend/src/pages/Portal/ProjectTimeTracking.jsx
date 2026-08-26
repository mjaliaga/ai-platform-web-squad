import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Clock, Plus, Trash2, Calendar, User } from "lucide-react";

export function ProjectTimeTracking() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projectTimeEntries, setProjectTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    task_id: "",
    hours: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    refresh();
  }, [projectId]);

  async function refresh() {
    try {
      setLoading(true);
      const [tasksData] = await Promise.all([
        api.listTasks({ project: projectId }),
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      const entries = [];
      for (const task of (tasksData || []).slice(0, 50)) {
        try {
          const taskEntries = await api.listTimeEntries(task.id);
          if (Array.isArray(taskEntries)) {
            taskEntries.forEach((e) => entries.push({ ...e, taskTitle: task.title, taskCode: task.code }));
          }
        } catch (e) {}
      }
      entries.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
      setProjectTimeEntries(entries.slice(0, 100));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.logTime(form.task_id, Number(form.hours), form.description);
      setForm({ ...form, hours: "", description: "" });
      setShowForm(false);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(taskId, entryId) {
    if (!window.confirm("¿Eliminar este registro?")) return;
    try {
      await api.deleteTimeEntry(taskId, entryId);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  const totalHours = projectTimeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando tiempo…</div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tivit-ink">Registro de Tiempo</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            Tiempo registrado en tareas del proyecto.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
        >
          <Plus className="h-4 w-4" /> Registrar tiempo
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-black/5 bg-white p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-tivit-ink/40" />
            <span className="text-sm text-tivit-ink/60">Total registrado:</span>
            <span className="text-xl font-bold text-tivit-ink">{totalHours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-tivit-ink/40" />
            <span className="text-sm text-tivit-ink/60">Registros:</span>
            <span className="font-semibold text-tivit-ink">{projectTimeEntries.length}</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-black/5 bg-white p-4">
          <h3 className="mb-4 font-semibold text-tivit-ink">Nuevo registro de tiempo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">Tarea *</label>
                <select
                  name="task_id"
                  value={form.task_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar tarea…</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code} - {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">Horas *</label>
                <input
                  type="number"
                  name="hours"
                  value={form.hours}
                  onChange={handleChange}
                  required
                  min="0.25"
                  step="0.25"
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-tivit-ink">Fecha *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-tivit-ink">Descripción</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                placeholder="Descripción del trabajo realizado"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-tivit-ink transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-black/5 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-tivit-ink/60">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-tivit-ink/60">Tarea</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-tivit-ink/60">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-tivit-ink/60">Horas</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-tivit-ink/60">Descripción</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {projectTimeEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No hay registros de tiempo.
                </td>
              </tr>
            ) : (
              projectTimeEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-tivit-ink">
                    {new Date(entry.logged_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-tivit-ink/60">{entry.taskCode}</span>
                    <span className="ml-2 text-sm text-tivit-ink">{entry.taskTitle}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-tivit-ink">{entry.user?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm font-semibold text-tivit-ink">
                      <Clock className="h-3 w-3" />
                      {entry.hours}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-tivit-ink/60">
                    {entry.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {entry.user?.id === user?.id && (
                      <button
                        onClick={() => handleDelete(entry.task_id, entry.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
