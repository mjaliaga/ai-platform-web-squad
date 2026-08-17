import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { AREA_COLORS, AREA_LABELS } from "./components/Badges";

const AREAS = Object.keys(AREA_LABELS);

export function TaskForm() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const initialType = searchParams.get("type") || "tarea";
  const isSolicitud = initialType === "solicitud";
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [task, setTask] = useState({
    title: "",
    description: "",
    type: initialType,
    priority: "medium",
    status: initialType === "solicitud" ? "pendiente" : "backlog",
    assignee_id: isSolicitud ? (user?.id || "") : "",
    estimate_hours: "",
    due_date: "",
    deliverable: "",
    sprint_id: "",
    project_id: projectId || "",
  });

  useEffect(() => {
    const sprintParams = projectId ? { project: projectId } : {};
    Promise.all([api.users(), api.listSprints(sprintParams), api.listProjectsSimple()])
      .then(([u, s, p]) => {
        setUsers(u);
        setSprints(s);
        setProjects(p);
      })
      .catch(console.error);
  }, []);

  function update(field, value) {
    setTask((t) => ({ ...t, [field]: value }));
  }

  function toggleArea(area) {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...task,
      assignee_id: task.assignee_id || null,
      sprint_id: task.sprint_id || null,
      project_id: task.project_id || null,
      estimate_hours: task.estimate_hours ? Number(task.estimate_hours) : null,
      due_date: task.due_date || null,
      deliverable: task.deliverable || null,
      labels: selectedAreas,
    };
    try {
      const created = await api.createTask(payload);
      navigate(`/portal/tasks/${created.id}`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold text-tivit-ink">{isSolicitud ? "Nueva solicitud" : "Nueva tarea"}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <Field label="Título" required>
          <input
            type="text"
            required
            value={task.title}
            onChange={(e) => update("title", e.target.value)}
            className="input"
            placeholder="Implementar login con OAuth"
          />
        </Field>

        <Field label="Descripción">
          <textarea
            rows={5}
            value={task.description}
            onChange={(e) => update("description", e.target.value)}
            className="input"
            placeholder="Detalles, criterios de aceptación, links…"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          {!isSolicitud && (
            <Field label="Tipo">
              <select
                value={task.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const newStatus = newType === "solicitud" ? "pendiente" : "backlog";
                  setTask((t) => ({ ...t, type: newType, status: newStatus }));
                }}
                className="input"
              >
                <option value="tarea">Tarea</option>
                <option value="bug">Bug</option>
                <option value="solicitud">Solicitud</option>
              </select>
            </Field>
          )}

          <Field label="Prioridad">
            <select value={task.priority} onChange={(e) => update("priority", e.target.value)} className="input">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Crítica</option>
            </select>
          </Field>

          {!isSolicitud && (
            <Field label="Estado inicial">
              <select value={task.status} onChange={(e) => update("status", e.target.value)} className="input">
                <option value="backlog">Backlog</option>
                <option value="todo">Por hacer</option>
              </select>
            </Field>
          )}

          {isSolicitud && (
            <Field label="Solicitado por">
              <input type="text" className="input bg-gray-50" value={user?.name || ""} readOnly disabled />
            </Field>
          )}

          <Field label="Sprint">
            <select value={task.sprint_id} onChange={(e) => update("sprint_id", e.target.value)} className="input">
              <option value="">Sin sprint</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_active === 1 ? "(activo)" : ""}
                </option>
              ))}
            </select>
          </Field>

          {!projectId && !isSolicitud && (
            <Field label="Proyecto">
              <select value={task.project_id} onChange={(e) => update("project_id", e.target.value)} className="input">
                <option value="">Sin proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {!isSolicitud && (
            <>
              <Field label="Estimación (horas)">
                <input
                  type="number"
                  step="0.5"
                  value={task.estimate_hours}
                  onChange={(e) => update("estimate_hours", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Fecha de vencimiento">
                <input
                  type="date"
                  value={task.due_date}
                  onChange={(e) => update("due_date", e.target.value)}
                  className="input"
                />
              </Field>
            </>
          )}
        </div>

        {!isSolicitud && (
          <Field label="¿Qué se entregará?">
            <textarea
              rows={2}
              value={task.deliverable}
              onChange={(e) => update("deliverable", e.target.value)}
              className="input"
              placeholder="Describe el entregable de esta tarea…"
            />
          </Field>
        )}

        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
            Área de trabajo
          </span>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  selectedAreas.includes(area)
                    ? `${AREA_COLORS[area]} ring-2 ring-offset-1 ring-current`
                    : "bg-tivit-ink/5 text-tivit-ink/50 hover:bg-tivit-ink/10"
                }`}
              >
                {AREA_LABELS[area]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-tivit-ink/20 px-4 py-2 text-sm font-semibold text-tivit-ink hover:bg-tivit-red-light"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white hover:bg-tivit-red-dark"
          >
            {isSolicitud ? "Crear solicitud" : "Crear tarea"}
          </button>
        </div>
      </form>

      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid rgba(0,0,0,0.1); padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: var(--color-tivit-red); box-shadow: 0 0 0 3px rgba(242,0,38,0.1); }`}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
        {label} {required && <span className="text-tivit-red">*</span>}
      </span>
      {children}
    </label>
  );
}
