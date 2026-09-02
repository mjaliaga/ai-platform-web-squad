import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Send, Clock } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge, PriorityBadge, LevelBadge, UserAvatar, formatDateTime } from "./components/Badges";

export function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [reporter, setReporter] = useState(null);
  const [assignee, setAssignee] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newLevel, setNewLevel] = useState(1);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  async function refresh() {
    try {
      const data = await api.getTicket(id);
      const t = data.ticket || data;
      setTicket(t);
      setReporter(data.reporter || null);
      setAssignee(data.assignee || null);
      setProjectName(data.project_name || t.project_id);
      setProjectCode(data.project_code || "");
      setNewStatus(t.status);
      setNewLevel(t.level);
      const [comms, acts] = await Promise.all([api.listTicketComments(id).catch(() => []), api.listTicketActivity(id).catch(() => [])]);
      setComments(Array.isArray(comms) ? comms : []);
      setActivity(Array.isArray(acts) ? acts : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function handleStatusChange() {
    if (!newStatus || newStatus === ticket.status) return;
    setStatusSaving(true);
    try {
      const updated = await api.updateTicketStatus(id, { status: newStatus });
      const t = updated.ticket || updated;
      setTicket(t);
      setReporter(updated.reporter || reporter);
      setAssignee(updated.assignee || assignee);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleLevelChange() {
    if (Number(newLevel) === ticket.level) return;
    try {
      const updated = await api.updateTicket(id, { level: Number(newLevel) });
      const t = updated.ticket || updated;
      setTicket(t);
      setAssignee(updated.assignee || null);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentSaving(true);
    try {
      await api.createTicketComment(id, newComment.trim());
      setNewComment("");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar ticket? Esta acción no se puede deshacer.")) return;
    try {
      await api.deleteTicket(id);
      navigate("/portal/tickets");
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando ticket…</div>;
  if (error && !ticket) return <div className="py-8 text-center text-sm text-alert">{error}</div>;
  if (!ticket) return <div className="py-8 text-center">Ticket no encontrado</div>;

  const isAdmin = user?.role === "admin";
  const isReporter = user?.id === ticket.reporter_id;
  const isAssignee = user?.id === ticket.assignee_id;
  const canEdit = isAdmin || isReporter || isAssignee;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/portal/tickets" className="inline-flex items-center gap-1.5 text-xs font-semibold text-tivit-red hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Tickets
      </Link>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-tivit-ink/50">{ticket.code}</span>
              <StatusBadge status={ticket.status} />
              <LevelBadge level={ticket.level} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="mt-2 text-xl font-bold text-tivit-ink">{ticket.title}</h1>
            <p className="mt-1 text-sm text-tivit-ink/60">
              Proyecto: <span className="font-medium">{projectCode ? `${projectCode} — ${projectName}` : projectName}</span> · Reportado por {reporter?.name || ticket.reporter_id} · {formatDateTime(ticket.created_at)}
            </p>
          </div>
          {canEdit && (
            <button onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
          )}
        </div>

        {ticket.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-tivit-ink/70">{ticket.description}</p>}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <UserAvatar user={reporter} size="sm" />
            <div>
              <div className="text-xs text-tivit-ink/50">Reportado por</div>
              <div className="text-sm font-medium">{reporter?.name}</div>
              <div className="text-xs text-tivit-ink/40">{reporter?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <UserAvatar user={assignee} size="sm" />
            <div>
              <div className="text-xs text-tivit-ink/50">Asignado (Nivel {ticket.level})</div>
              <div className="text-sm font-medium">{assignee?.name || "Sin asignar"}</div>
              <div className="text-xs text-tivit-ink/40">{assignee?.email || ""}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-tivit-ink/60">Cambiar estado</label>
            <div className="mt-1 flex gap-2">
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
                <option value="abierto">Abierto</option>
                <option value="en_progreso">En progreso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
              <button onClick={handleStatusChange} disabled={statusSaving || newStatus === ticket.status} className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {statusSaving ? "Guardando..." : "Actualizar"}
              </button>
            </div>
            <p className="mt-1 text-xs text-tivit-ink/40">Resuelto/Cerrado son finales. Solo el reportero o admin puede cerrar un resuelto.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-tivit-ink/60">Cambiar nivel (manual)</label>
            <div className="mt-1 flex gap-2">
              <select value={newLevel} onChange={(e) => setNewLevel(Number(e.target.value))} className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
                <option value={1}>Nivel 1 — Manuel Aliaga</option>
                <option value={2}>Nivel 2 — Sergio Aguas</option>
              </select>
              <button onClick={handleLevelChange} disabled={Number(newLevel) === ticket.level} className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">
                Cambiar
              </button>
            </div>
            <p className="mt-1 text-xs text-tivit-ink/40">Reasigna automáticamente según configuración de niveles.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-tivit-ink/50">
          <span>Categoría: {ticket.category || "-"}</span>
          <span>·</span>
          <span>Vence: {ticket.due_date ? formatDateTime(ticket.due_date) : "-"}</span>
          {ticket.resolution && (
            <>
              <span>·</span>
              <span>Resolución: {ticket.resolution}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-tivit-ink">
            <Clock className="h-4 w-4" /> Actividad
          </h3>
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-xs text-tivit-ink/40">Sin actividad aún.</p>
            ) : (
              activity.map((a) => (
                <div key={a.activity.id} className="rounded-lg bg-gray-50 p-2 text-xs">
                  <span className="font-medium">{a.user.name}</span> <span className="text-tivit-ink/60">{a.activity.action}</span>
                  {a.activity.field_changed && (
                    <span>
                      {" "}
                      {a.activity.field_changed}: {a.activity.old_value} → {a.activity.new_value}
                    </span>
                  )}
                  <div className="text-tivit-ink/40">{formatDateTime(a.activity.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4">
          <h3 className="text-sm font-semibold text-tivit-ink">Comentarios</h3>
          <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Añadir comentario..."
              className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              maxLength={5000}
            />
            <button type="submit" disabled={commentSaving || !newComment.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              <Send className="h-4 w-4" /> Enviar
            </button>
          </form>
          <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-xs text-tivit-ink/40">Sin comentarios.</p>
            ) : (
              comments.map((c) => (
                <div key={c.comment.id} className="rounded-lg border border-black/5 bg-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={c.author} size="sm" />
                    <span className="text-xs font-medium">{c.author.name}</span>
                    <span className="ml-auto text-xs text-tivit-ink/40">{formatDateTime(c.comment.created_at)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-tivit-ink/70">{c.comment.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
