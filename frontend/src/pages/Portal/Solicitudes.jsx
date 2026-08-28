import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Filter } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge, TypeBadge, PriorityBadge, formatRelative } from "./components/Badges";

const SOLICITUD_FILTERS = [
  { value: "", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "resuelta", label: "Resueltas" },
];

const ACTION_LABELS = {
  en_revision: "Revisar",
  aprobada: "Aprobar",
  rechazada: "Rechazar",
  resuelta: "Marcar resuelta",
};

export function Solicitudes() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionTarget, setActionTarget] = useState(null);
  const [justification, setJustification] = useState("");

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api
      .getProjectSolicitudes(projectId)
      .then(setItems)
      .catch((e) => setError(e.message || "Error cargando solicitudes"))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function confirmAction() {
    if (!actionTarget) return;
    const { item, newStatus } = actionTarget;
    setError("");
    try {
      await api.updateTaskStatus(item.id, newStatus, undefined, justification || undefined);
      setItems((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: newStatus } : s))
      );
      setActionTarget(null);
      setJustification("");
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado");
    }
  }

  const filtered = filter ? items.filter((s) => s.status === filter) : items;
  const pendingCount = items.filter((s) => s.status === "pendiente").length;

  async function deleteSolicitud(s) {
    if (!window.confirm("¿Eliminar esta solicitud?")) return;
    setError("");
    try {
      await api.deleteTask(s.id);
      setItems((prev) => prev.filter((item) => item.id !== s.id));
    } catch (err) {
      setError(err.message || "No se pudo eliminar la solicitud");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tivit-red-dark">Solicitudes</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            Solicitudes y peticiones del equipo al líder o arquitecto.
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Link
          to={`/portal/portfolio/${projectId}/tasks/new?type=solicitud`}
          className="shrink-0 rounded-full bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
        >
          + Nueva solicitud
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-tivit-ink/40" />
        {SOLICITUD_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              filter === f.value
                ? "bg-tivit-red text-white"
                : "bg-tivit-ink/5 text-tivit-ink/60 hover:bg-tivit-ink/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

      {loading && <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando…</p>}

      {!loading && filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-tivit-ink/50">
          {filter ? "No hay solicitudes con este filtro." : "No hay solicitudes todavía."}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-2xl border border-black/5 bg-white p-5 transition hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <TypeBadge type={s.type} />
                  <StatusBadge status={s.status} />
                  <PriorityBadge priority={s.priority} />
                  <span className="font-mono text-xs text-tivit-ink/50">{s.code}</span>
                </div>
                <h3 className="mt-1.5 text-base font-semibold text-tivit-ink">{s.title}</h3>
                {s.description && (
                  <p className="mt-1 text-sm text-tivit-ink/60 line-clamp-2">{s.description}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-tivit-ink/50">
                  {s.reporter && (
                    <span>Solicitado por {s.reporter.name}</span>
                  )}
                  <span>· {formatRelative(s.created_at)}</span>
                </div>
              </div>

              {/* Status change actions */}
              {isAdmin && (
                <div className="flex shrink-0 flex-col gap-1">
                  {actionTarget?.item.id === s.id ? (
                    <div className="flex flex-col gap-2 rounded-xl border border-tivit-red/20 bg-tivit-red/5 p-3">
                      <div className="text-xs font-semibold text-tivit-ink">
                        {ACTION_LABELS[actionTarget.newStatus]}
                      </div>
                      <textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder={actionTarget.newStatus === "rechazada" ? "Justificación (requerida)…" : "Justificación (opcional)…"}
                        className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-xs outline-none focus:border-tivit-red"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={confirmAction}
                          disabled={actionTarget.newStatus === "rechazada" && !justification.trim()}
                          className="rounded-lg bg-tivit-red px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => { setActionTarget(null); setJustification(""); }}
                          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-tivit-ink transition hover:bg-tivit-red-light"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {s.status === "pendiente" && (
                        <>
                          <button onClick={() => setActionTarget({ item: s, newStatus: "en_revision" })} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">Revisar</button>
                          <button onClick={() => setActionTarget({ item: s, newStatus: "aprobada" })} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50">Aprobar</button>
                          <button onClick={() => setActionTarget({ item: s, newStatus: "rechazada" })} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">Rechazar</button>
                        </>
                      )}
                      {s.status === "en_revision" && (
                        <>
                          <button onClick={() => setActionTarget({ item: s, newStatus: "aprobada" })} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50">Aprobar</button>
                          <button onClick={() => setActionTarget({ item: s, newStatus: "rechazada" })} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">Rechazar</button>
                        </>
                      )}
                      {s.status === "aprobada" && (
                        <button onClick={() => setActionTarget({ item: s, newStatus: "resuelta" })} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">Marcar resuelta</button>
                      )}
                    </>
                  )}
                  <Link to={`/portal/tasks/${s.id}`} className="mt-1 text-center text-xs font-semibold text-tivit-red hover:underline">Ver detalle</Link>
                  {isAdmin && (
                    <button
                      onClick={() => deleteSolicitud(s)}
                      className="mt-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
