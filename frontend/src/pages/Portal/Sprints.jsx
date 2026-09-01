import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { X, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate, formatRelative } from "./components/Badges";

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

export function Sprints({ projectId } = {}) {
  const { id: routeId } = useParams();
  const pid = projectId || routeId;
  const toast = useToast();
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: "", goals: [""], start_date: "", end_date: "", risks: "", team_dependencies: "", third_party_dependencies: "" });

  useEffect(() => {
    refresh();
  }, [pid]);

  async function refresh() {
    try {
      const params = pid ? { project: pid } : {};
      const list = await api.listSprints(params);
      setSprints(list);
      setActiveSprint(list.find((s) => s.is_active === 1) || null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.createSprint({
        name: newSprint.name,
        goals: newSprint.goals.filter((g) => g.trim()),
        start_date: newSprint.start_date || null,
        end_date: newSprint.end_date || null,
        project_id: pid || null,
        risks: newSprint.risks || null,
        team_dependencies: newSprint.team_dependencies || null,
        third_party_dependencies: newSprint.third_party_dependencies || null,
      });
      setNewSprint({ name: "", goals: [""], start_date: "", end_date: "", risks: "", team_dependencies: "", third_party_dependencies: "" });
      setShowCreate(false);
      toast.success("Sprint creado");
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleActivate(id) {
    try {
      await api.activateSprint(id);
      toast.success("Sprint activado");
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este sprint? Las tareas quedarán sin sprint asignado.")) return;
    try {
      await api.deleteSprint(id);
      toast.success("Sprint eliminado");
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (error) return <div className="text-alert">No se pudieron cargar los sprints.</div>;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tivit-ink">Sprints</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            Planificá y ejecutá el trabajo en iteraciones de tiempo definido.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
        >
          {showCreate ? "Cancelar" : "+ Nuevo sprint"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-tivit-ink/60">
            Crear sprint
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" required>
              <input
                type="text"
                required
                value={newSprint.name}
                onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                className="input"
                placeholder="Sprint 12"
              />
            </Field>
            <div className="md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
                Objetivos
              </span>
              <div className="flex flex-col gap-2">
                {newSprint.goals.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-tivit-ink/40">○</span>
                    <input
                      type="text"
                      value={g}
                      onChange={(e) => {
                        const goals = [...newSprint.goals];
                        goals[i] = e.target.value;
                        setNewSprint({ ...newSprint, goals });
                      }}
                      className="input flex-1"
                      placeholder={`Objetivo ${i + 1}`}
                    />
                    {newSprint.goals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewSprint({ ...newSprint, goals: newSprint.goals.filter((_, idx) => idx !== i) })}
                        className="rounded p-1 text-tivit-ink/40 hover:bg-alert/10 hover:text-alert"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setNewSprint({ ...newSprint, goals: [...newSprint.goals, ""] })}
                  className="flex items-center gap-1 self-start text-xs font-semibold text-tivit-red hover:underline"
                >
                  <Plus className="h-3 w-3" /> Añadir objetivo
                </button>
              </div>
            </div>
            <Field label="Fecha de inicio">
              <input
                type="date"
                value={newSprint.start_date}
                onChange={(e) => setNewSprint({ ...newSprint, start_date: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Fecha de fin">
              <input
                type="date"
                value={newSprint.end_date}
                onChange={(e) => setNewSprint({ ...newSprint, end_date: e.target.value })}
                className="input"
              />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Riesgos">
              <textarea
                rows={2}
                value={newSprint.risks}
                onChange={(e) => setNewSprint({ ...newSprint, risks: e.target.value })}
                className="input"
                placeholder="Riesgos identificados…"
              />
            </Field>
            <Field label="Dependencias del equipo">
              <textarea
                rows={2}
                value={newSprint.team_dependencies}
                onChange={(e) => setNewSprint({ ...newSprint, team_dependencies: e.target.value })}
                className="input"
                placeholder="Dependencias internas…"
              />
            </Field>
            <Field label="Dependencias de terceros">
              <textarea
                rows={2}
                value={newSprint.third_party_dependencies}
                onChange={(e) => setNewSprint({ ...newSprint, third_party_dependencies: e.target.value })}
                className="input"
                placeholder="Dependencias externas…"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white hover:bg-tivit-red-dark"
            >
              Crear sprint
            </button>
          </div>
        </form>
      )}

      {activeSprint && (
        <section className="mb-6 rounded-2xl border-2 border-tivit-red/30 bg-gradient-to-br from-tivit-red/5 to-white p-6 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-tivit-red px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                  Activo
                </span>
                <h2 className="text-xl font-bold text-tivit-ink">{activeSprint.name}</h2>
              </div>
              {parseGoals(activeSprint.goal).length > 0 && (
                <ul className="mt-1 list-disc pl-4 text-sm text-tivit-ink/70">
                  {parseGoals(activeSprint.goal).map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              )}
              <div className="mt-2 text-xs text-tivit-ink/60">
                {formatDate(activeSprint.start_date)} → {formatDate(activeSprint.end_date)}
              </div>
            </div>
          </div>

          <SprintStats sprint={activeSprint} />
        </section>
      )}

      <h2 className="mb-4 text-lg font-bold text-tivit-ink">Todos los sprints</h2>
      {sprints.length === 0 ? (
        <p className="text-sm text-tivit-ink/50">Sin sprints todavía.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sprints.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                s.is_active ? "border-tivit-red/30" : "border-black/5"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-tivit-ink">{s.name}</h3>
                  {parseGoals(s.goal).length > 0 && (
                    <ul className="mt-1 list-disc pl-4 text-sm text-tivit-ink/70">
                      {parseGoals(s.goal).map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  )}
                  <div className="mt-2 text-xs text-tivit-ink/60">
                    {formatDate(s.start_date)} → {formatDate(s.end_date)}
                  </div>
                  {s.risks && <p className="mt-1.5 text-xs text-amber-700"><strong>Riesgos:</strong> {s.risks}</p>}
                  {s.team_dependencies && <p className="mt-0.5 text-xs text-blue-700"><strong>Dep. equipo:</strong> {s.team_dependencies}</p>}
                  {s.third_party_dependencies && <p className="mt-0.5 text-xs text-purple-700"><strong>Dep. terceros:</strong> {s.third_party_dependencies}</p>}
                </div>
                {s.is_active === 1 && (
                  <span className="rounded-full bg-tivit-red px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                    Activo
                  </span>
                )}
              </div>
              <SprintStats sprint={s} compact />
              <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                <div className="text-xs text-tivit-ink/50">
                  Creado {formatRelative(s.created_at)}
                </div>
                <div className="flex gap-2">
                  {s.is_active !== 1 && (
                    <button
                      onClick={() => handleActivate(s.id)}
                      className="rounded-lg border border-tivit-red/30 px-3 py-1.5 text-xs font-semibold text-tivit-red transition hover:bg-tivit-red hover:text-white"
                    >
                      Activar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-alert hover:bg-alert/10"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid rgba(0,0,0,0.1); padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: var(--color-tivit-red); box-shadow: 0 0 0 3px rgba(242,0,38,0.1); }`}</style>
    </div>
  );
}

function SprintStats({ sprint, compact }) {
  const progress = sprint.total_tasks ? Math.round((sprint.done_tasks / sprint.total_tasks) * 100) : 0;
  const estimateVsSpent = sprint.total_estimate
    ? Math.min(100, Math.round((sprint.total_spent / sprint.total_estimate) * 100))
    : 0;
  return (
    <div className={compact ? "space-y-2" : "mt-4 space-y-3"}>
      <StatRow label="Tareas" value={`${sprint.done_tasks}/${sprint.total_tasks}`} percent={progress} color="bg-tivit-red" />
      <StatRow
        label="Horas"
        value={`${sprint.total_spent.toFixed(1)} / ${sprint.total_estimate.toFixed(1)} h`}
        percent={estimateVsSpent}
        color="bg-blue-500"
      />
    </div>
  );
}

function StatRow({ label, value, percent, color }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-tivit-ink/70">{label}</span>
        <span className="font-mono text-tivit-ink/60">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/5">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
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