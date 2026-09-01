import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { TypeBadge, PriorityBadge, UserAvatar, formatDate } from "./components/Badges";
import { Plus, GripVertical, X } from "lucide-react";

const COLUMNS = [
  { key: "backlog", label: "Backlog", color: "bg-gray-100 border-gray-200" },
  { key: "todo", label: "Por hacer", color: "bg-blue-50 border-blue-200" },
  { key: "in_progress", label: "En progreso", color: "bg-amber-50 border-amber-200" },
  { key: "review", label: "En revisión", color: "bg-purple-50 border-purple-200" },
  { key: "done", label: "Completadas", color: "bg-green-50 border-green-200" },
];

const TASK_TYPES = [
  { value: "tarea", label: "Tarea" },
  { value: "bug", label: "Bug" },
  { value: "solicitud", label: "Solicitud" },
];

const PRIORITIES = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export function ProjectBoard() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [form, setForm] = useState({
    title: "",
    type: "tarea",
    priority: "medium",
    sprint_id: "",
    description: "",
    assignee_id: "",
    due_date: "",
    estimate_hours: "",
  });

  useEffect(() => {
    refresh();
  }, [projectId]);

  async function refresh() {
    try {
      setLoading(true);
      const [tasksData, sprintsData] = await Promise.all([
        api.listTasks({ project: projectId }),
        api.listSprints({ project: projectId }),
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setSprints(Array.isArray(sprintsData) ? sprintsData : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function moveToStatus(taskId, newStatus) {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  function handleDragStart(e, task) {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, newStatus) {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      moveToStatus(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  }

  function openCreateModal() {
    setEditingTask(null);
    setForm({
      title: "",
      type: "tarea",
      priority: "medium",
      sprint_id: sprints.find((s) => s.is_active)?.id || "",
      description: "",
      assignee_id: "",
      due_date: "",
      estimate_hours: "",
    });
    setShowModal(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      type: task.type || "tarea",
      priority: task.priority || "medium",
      sprint_id: task.sprint_id || "",
      description: task.description || "",
      assignee_id: task.assignee?.id || "",
      due_date: task.due_date || "",
      estimate_hours: task.estimate_hours || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        project_id: projectId,
        assignee_id: form.assignee_id || null,
        sprint_id: form.sprint_id || null,
        due_date: form.due_date || null,
        estimate_hours: form.estimate_hours ? Number(form.estimate_hours) : null,
      };

      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }
      setShowModal(false);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  const tasksByStatus = {};
  COLUMNS.forEach((col) => {
    tasksByStatus[col.key] = tasks.filter((t) => {
      if (col.key === "backlog") return !t.sprint_id && t.status !== "done";
      if (col.key === "done") return t.status === "done";
      return t.sprint_id && t.status === col.key;
    });
  });

  const activeSprint = sprints.find((s) => s.is_active);

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando board…</div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tivit-ink">Board Kanban</h1>
          {activeSprint && (
            <p className="mt-1 text-sm text-tivit-ink/60">
              Sprint activo: <span className="font-semibold">{activeSprint.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
        >
          <Plus className="h-4 w-4" /> Nueva tarea
        </button>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div
            key={column.key}
            className={`min-w-[280px] max-w-[85vw] w-[85vw] sm:w-72 shrink-0 snap-start rounded-xl border ${column.color} p-3`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.key === "backlog" ? "backlog" : column.key === "done" ? "done" : column.key)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-tivit-ink">{column.label}</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-tivit-ink shadow-sm">
                {tasksByStatus[column.key]?.length || 0}
              </span>
            </div>
            <div className="space-y-2 min-h-32">
              {tasksByStatus[column.key]?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onEdit={() => openEditModal(task)}
                  isDragging={draggedTask?.id === task.id}
                />
              ))}
              {tasksByStatus[column.key]?.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                  Sin tareas
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal
          form={form}
          sprints={sprints}
          users={[]}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          editing={editingTask}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onDragStart, onEdit, isDragging }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={onEdit}
      className={`group cursor-pointer rounded-lg border border-black/10 bg-white p-3 shadow-sm transition hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-300 opacity-0 group-hover:opacity-100" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <TypeBadge type={task.type} />
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="text-sm font-medium text-tivit-ink truncate">{task.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-xs text-gray-400">{task.code}</span>
            <div className="flex items-center gap-2">
              {task.assignee && (
                <UserAvatar user={task.assignee} size="xs" />
              )}
              {task.due_date && (
                <span className={`text-xs ${isPastDue(task.due_date) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isPastDue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function TaskModal({ form, sprints, users, onChange, onSubmit, onClose, editing }) {
  const activeSprint = sprints.find((s) => s.is_active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="mx-4 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white shadow-xl sm:mx-auto">
        <div className="flex items-center justify-between border-b border-black/5 p-4">
          <h2 className="text-lg font-semibold text-tivit-ink">
            {editing ? "Editar tarea" : "Nueva tarea"}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-tivit-ink">Título *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={onChange}
              required
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              placeholder="Nombre de la tarea"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-tivit-ink">Tipo</label>
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-tivit-ink">Prioridad</label>
              <select
                name="priority"
                value={form.priority}
                onChange={onChange}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-tivit-ink">Sprint *</label>
            <select
              name="sprint_id"
              value={form.sprint_id}
              onChange={onChange}
              required
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            >
              <option value="">Sin sprint (Backlog)</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_active ? "(Activo)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-tivit-ink">Fecha vencimiento</label>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={onChange}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-tivit-ink">Horas estimadas</label>
              <input
                type="number"
                name="estimate_hours"
                value={form.estimate_hours}
                onChange={onChange}
                step="0.5"
                min="0"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-tivit-ink">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={3}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-tivit-ink transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
            >
              {editing ? "Guardar" : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
