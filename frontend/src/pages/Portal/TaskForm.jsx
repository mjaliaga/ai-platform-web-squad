import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext.jsx";

export function TaskForm() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const isSolicitud = searchParams.get("type") === "solicitud";
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [task, setTask] = useState({
    title: "",
    description: "",
    type: "tarea",
    priority: "medium",
    status: isSolicitud ? "pendiente" : "backlog",
    assignee_name: "",
    estimate_hours: "",
    due_date: "",
    deliverable: "",
    project_id: projectId || "",
  });

  useEffect(() => {
    Promise.all([api.users(), api.listProjectsSimple()])
      .then(([uResp, pResp]) => {
        setUsers(Array.isArray(uResp) ? uResp : (uResp?.items || []));
        setProjects(Array.isArray(pResp) ? pResp : (pResp?.items || []));
      })
      .catch((err) => toast.error("Error cargando datos: " + err.message));
  }, []);

  function update(field, value) {
    setTask((t) => ({ ...t, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const matchedUser = task.assignee_name
      ? users.find(
          (u) =>
            u.name.toLowerCase() === task.assignee_name.trim().toLowerCase() ||
            u.email?.toLowerCase() === task.assignee_name.trim().toLowerCase() ||
            u.name.toLowerCase().includes(task.assignee_name.trim().toLowerCase())
        )
      : null;
    const payload = {
      ...task,
      assignee_id: matchedUser?.id || task.assignee_id || null,
      project_id: task.project_id || null,
      estimate_hours: task.estimate_hours ? Number(task.estimate_hours) : null,
      due_date: task.due_date || null,
      deliverable: task.deliverable || null,
    };
    delete payload.assignee_name;
    try {
      const created = await api.createTask(payload);
      toast.success(isSolicitud ? "Solicitud creada" : "Tarea creada");
      navigate(`/portal/tasks/${created.id}`);
    } catch (err) {
      toast.error("Error: " + err.message);
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
          <Field label="Prioridad">
            <select value={task.priority} onChange={(e) => update("priority", e.target.value)} className="input">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Crítica</option>
            </select>
          </Field>

          <Field label="Asignado a">
            <input
              type="text"
              value={task.assignee_name || ""}
              onChange={(e) => update("assignee_name", e.target.value)}
              className="input"
              placeholder="Nombre del asignado"
            />
          </Field>

          {isSolicitud && (
            <Field label="Solicitado por">
              <input type="text" className="input bg-gray-50" value={user?.name || ""} readOnly disabled />
            </Field>
          )}

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
