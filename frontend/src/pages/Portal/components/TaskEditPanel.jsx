import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, ExternalLink, Trash2 } from "lucide-react";
import { api } from "../../../lib/api";
import { TypeBadge, PriorityBadge, StatusBadge, AreaBadge, UserAvatar, formatDate, AREA_COLORS, AREA_LABELS } from "./Badges";

const STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Por hacer" },
  { value: "in_progress", label: "En progreso" },
  { value: "review", label: "En revisión" },
  { value: "done", label: "Completado" },
];

const SOLICITUD_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "resuelta", label: "Resuelta" },
];

const PRIORITIES = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Crítica" },
];

export function TaskEditPanel({ task, onClose, onUpdate, onDelete }) {
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    deliverable: task.deliverable || "",
    status: task.status,
    priority: task.priority,
    assignee_id: task.assignee_id || "",
    sprint_id: task.sprint_id || "",
    due_date: task.due_date || "",
    estimate_hours: task.estimate_hours ?? "",
    labels: task.labels || [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.users(), api.listSprints().catch(() => [])])
      .then(([u, s]) => {
        setUsers(u);
        setSprints(s);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description || "",
      deliverable: task.deliverable || "",
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee_id || "",
      sprint_id: task.sprint_id || "",
      due_date: task.due_date || "",
      estimate_hours: task.estimate_hours ?? "",
      labels: task.labels || [],
    });
  }, [task.id]);

  async function updateField(field, value) {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    setSaving(true);
    try {
      const payload = {};
      if (field === "status") {
        await api.updateTaskStatus(task.id, value);
      } else if (field === "assignee_id") {
        payload[field] = value || null;
        await api.updateTask(task.id, payload);
      } else if (field === "sprint_id") {
        payload[field] = value || null;
        await api.updateTask(task.id, payload);
      } else if (field === "estimate_hours") {
        payload[field] = value ? Number(value) : null;
        await api.updateTask(task.id, payload);
      } else if (field === "due_date") {
        payload[field] = value || null;
        await api.updateTask(task.id, payload);
      } else {
        payload[field] = value;
        await api.updateTask(task.id, payload);
      }
      if (onUpdate) onUpdate(task.id, field, value);
    } catch (err) {
      console.error("Error updating task:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta tarea?")) return;
    try {
      await api.deleteTask(task.id);
      if (onDelete) onDelete(task.id);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  }

  const selectClass =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-tivit-ink outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20";
  const inputClass =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-tivit-ink outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-black/10 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <TypeBadge type={task.type} />
            <span className="font-mono text-xs text-tivit-ink/50">{task.code}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to={`/portal/tasks/${task.id}`}
              className="rounded-lg p-2 text-tivit-ink/50 transition hover:bg-tivit-red-light hover:text-tivit-ink"
              title="Ver tarea completa"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={handleDelete}
              className="rounded-lg p-2 text-tivit-ink/50 transition hover:bg-alert/10 hover:text-alert"
              title="Eliminar tarea"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-tivit-ink/50 transition hover:bg-tivit-red-light hover:text-tivit-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {saving && (
            <div className="mb-3 rounded-lg bg-tivit-red/5 px-3 py-1.5 text-xs font-medium text-tivit-red">
              Guardando…
            </div>
          )}

          {/* Title */}
          <input
            className="mb-4 w-full border-none bg-transparent text-lg font-bold text-tivit-ink outline-none placeholder:text-tivit-ink/30"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Título de la tarea"
          />

          {/* Fields grid */}
          <div className="space-y-3">
            <FieldRow label="Estado">
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className={selectClass}
              >
                {(task.type === "solicitud" ? SOLICITUD_STATUSES : STATUSES).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Prioridad">
              <select
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
                className={selectClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Asignado a">
              <select
                value={form.assignee_id}
                onChange={(e) => updateField("assignee_id", e.target.value)}
                className={selectClass}
              >
                <option value="">Sin asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Sprint">
              <select
                value={form.sprint_id}
                onChange={(e) => updateField("sprint_id", e.target.value)}
                className={selectClass}
              >
                <option value="">Sin sprint</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_active === 1 ? "(activo)" : ""}
                  </option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Vencimiento">
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => updateField("due_date", e.target.value)}
                className={inputClass}
              />
            </FieldRow>

            <FieldRow label="Estimación (h)">
              <input
                type="number"
                step="0.5"
                min="0"
                value={form.estimate_hours}
                onChange={(e) => updateField("estimate_hours", e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </FieldRow>
          </div>

          {/* Area labels */}
          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
              Área de trabajo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(AREA_LABELS).map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={async () => {
                    const newLabels = form.labels.includes(area)
                      ? form.labels.filter((l) => l !== area)
                      : [...form.labels, area];
                    setForm((f) => ({ ...f, labels: newLabels }));
                    setSaving(true);
                    try {
                      await api.updateTask(task.id, { labels: newLabels });
                      if (onUpdate) onUpdate(task.id, "labels", newLabels);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                    form.labels.includes(area)
                      ? `${AREA_COLORS[area]} ring-1 ring-offset-1 ring-current`
                      : "bg-tivit-ink/5 text-tivit-ink/40 hover:bg-tivit-ink/10"
                  }`}
                >
                  {AREA_LABELS[area]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
              Descripción
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className={`${inputClass} resize-y`}
              placeholder="Detalles, criterios de aceptación…"
            />
          </div>

          {/* Deliverable */}
          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
              ¿Qué se entregará?
            </label>
            <textarea
              rows={2}
              value={form.deliverable}
              onChange={(e) => updateField("deliverable", e.target.value)}
              className={`${inputClass} resize-y`}
              placeholder="Describe el entregable…"
            />
          </div>

          {/* Info */}
          <div className="mt-5 space-y-2 rounded-xl border border-black/5 bg-tivit-red-light/30 p-4 text-xs text-tivit-ink/60">
            <div className="flex items-center gap-2">
              <span className="font-medium">Reportado por:</span>
              <UserAvatar user={task.reporter} size="sm" />
              <span>{task.reporter?.name}</span>
            </div>
            {task.assignee && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Asignado a:</span>
                <UserAvatar user={task.assignee} size="sm" />
                <span>{task.assignee.name}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Creado:</span> {formatDate(task.created_at)}
            </div>
            {task.time_spent_hours > 0 && (
              <div>
                <span className="font-medium">Tiempo registrado:</span> {task.time_spent_hours.toFixed(1)} h
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
