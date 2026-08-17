import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, downloadAttachment } from "../../lib/api";
import {
  StatusBadge,
  TypeBadge,
  PriorityBadge,
  AreaBadge,
  UserAvatar,
  formatDate,
  formatRelative,
} from "./components/Badges";

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

export function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [blocking, setBlocking] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [watchers, setWatchers] = useState([]);
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [showLogTime, setShowLogTime] = useState(false);
  const [timeForm, setTimeForm] = useState({ hours: "", description: "" });
  const [showAddDep, setShowAddDep] = useState(false);
  const [depSearch, setDepSearch] = useState("");
  const [depResults, setDepResults] = useState([]);

  useEffect(() => {
    refresh();
    api.users().then(setUsers).catch(console.error);
    api.listSprints().then(setSprints).catch(console.error);
  }, [id]);

  async function refresh() {
    try {
      const [t, c, a, at, st, deps, bl, te, w] = await Promise.all([
        api.getTask(id),
        api.listComments(id),
        api.listActivity(id),
        api.listAttachments(id),
        api.listSubtasks(id).catch(() => []),
        api.listDependencies(id).catch(() => []),
        api.listBlocking(id).catch(() => []),
        api.listTimeEntries(id).catch(() => []),
        api.listWatchers(id).catch(() => []),
      ]);
      setTask(t);
      setComments(c);
      setActivity(a);
      setAttachments(at);
      setSubtasks(st);
      setDependencies(deps);
      setBlocking(bl);
      setTimeEntries(te);
      setWatchers(w);
      const me = await api.me().catch(() => null);
      if (me) {
        setIsWatching(w.some((u) => u.id === me.id));
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.createComment(id, newComment);
      setNewComment("");
      const [c, a] = await Promise.all([api.listComments(id), api.listActivity(id)]);
      setComments(c);
      setActivity(a);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleFieldChange(field, value) {
    try {
      await api.updateTask(id, { [field]: value });
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await api.updateTaskStatus(id, newStatus);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleSprintChange(sprintId) {
    try {
      await api.updateTask(id, { sprint_id: sprintId || null });
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await api.uploadAttachment(id, file);
      const at = await api.listAttachments(id);
      setAttachments(at);
      const a = await api.listActivity(id);
      setActivity(a);
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
  }

  async function toggleSubtask(subId, completed) {
    try {
      await api.toggleSubtask(subId, completed);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function createSubtask() {
    const title = prompt("Título de la subtarea:");
    if (!title) return;
    try {
      await api.createTask({ title, parent_id: id, status: "todo", priority: "medium", type: "tarea" });
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleLogTime(e) {
    e.preventDefault();
    if (!timeForm.hours) return;
    try {
      await api.logTime(id, Number(timeForm.hours), timeForm.description || null);
      setTimeForm({ hours: "", description: "" });
      setShowLogTime(false);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDeleteTime(entryId) {
    if (!confirm("¿Eliminar esta entrada de tiempo?")) return;
    try {
      await api.deleteTimeEntry(id, entryId);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function toggleWatch() {
    try {
      if (isWatching) {
        await api.unwatchTask(id);
        setIsWatching(false);
      } else {
        await api.watchTask(id);
        setIsWatching(true);
      }
      const w = await api.listWatchers(id);
      setWatchers(w);
    } catch (e) {
      alert(e.message);
    }
  }

  async function searchDeps(query) {
    setDepSearch(query);
    if (query.length < 2) {
      setDepResults([]);
      return;
    }
    try {
      const res = await api.searchTasksForDep(query, id);
      setDepResults(res);
    } catch (e) {
      console.error(e);
    }
  }

  async function addDep(depId) {
    try {
      await api.addDependency(id, depId);
      setShowAddDep(false);
      setDepSearch("");
      setDepResults([]);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function removeDep(depId) {
    try {
      await api.removeDependency(id, depId);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function deleteTask() {
    if (!confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.")) return;
    try {
      await api.deleteTask(id);
      navigate("/portal");
    } catch (e) {
      alert(e.message);
    }
  }

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (!task) return <div className="text-tivit-ink/60">Cargando tarea…</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-tivit-ink/60 hover:text-tivit-red"
        >
          ← Volver
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <TypeBadge type={task.type} />
              <span className="font-mono text-sm text-tivit-ink/60">{task.code}</span>
            </div>
            <h1 className="text-2xl font-bold text-tivit-ink">{task.title}</h1>
            {task.description && (
              <div className="mt-4 whitespace-pre-wrap text-tivit-ink/80">{task.description}</div>
            )}
          </div>

          {task.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((l) => (
                <AreaBadge key={l} area={l} />
              ))}
            </div>
          )}

          <DependenciesSection
            taskId={id}
            dependencies={dependencies}
            blocking={blocking}
            showAdd={showAddDep}
            setShowAdd={setShowAddDep}
            depSearch={depSearch}
            searchDeps={searchDeps}
            depResults={depResults}
            addDep={addDep}
            removeDep={removeDep}
          />

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-tivit-ink/80">
                  Subtareas ({task.completed_subtask_count}/{task.subtask_count})
                </h2>
                <button
                  onClick={createSubtask}
                  className="rounded-lg border border-tivit-red/30 px-3 py-1 text-xs font-semibold text-tivit-red hover:bg-tivit-red hover:text-white"
                >
                  + Agregar
                </button>
              </div>
              {subtasks.length === 0 ? (
                <p className="text-sm text-tivit-ink/50">Sin subtareas.</p>
              ) : (
                <div className="space-y-2">
                  {subtasks.map((st) => (
                    <label key={st.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-tivit-red-light/40">
                      <input
                        type="checkbox"
                        checked={st.status === "done"}
                        onChange={(e) => toggleSubtask(st.id, e.target.checked)}
                        className="h-4 w-4 accent-tivit-red"
                      />
                      <span className={`flex-1 text-sm ${st.status === "done" ? "text-tivit-ink/40 line-through" : "text-tivit-ink"}`}>
                        {st.title}
                      </span>
                      <PriorityBadge priority={st.priority} />
                    </label>
                  ))}
                </div>
              )}
            </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-tivit-ink/80">
              Comentarios ({comments.length})
            </h2>

            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <UserAvatar user={c.author} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-tivit-ink">{c.author.name}</span>
                      <span className="text-xs text-tivit-ink/50">{formatRelative(c.created_at)}</span>
                    </div>
                    <CommentBody body={c.body} users={users} />
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-tivit-ink/50">Sé el primero en comentar.</p>
              )}
            </div>

            <form onSubmit={submitComment} className="mt-6">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribí un comentario. Usá @nombre para mencionar."
                className="w-full rounded-lg border border-black/10 p-3 text-sm focus:border-tivit-red focus:outline-none focus:ring-2 focus:ring-tivit-red/20"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-40"
                >
                  Comentar
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-tivit-ink/80">
              Actividad
            </h2>
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <UserAvatar user={a.user} size="sm" />
                  <div className="flex-1">
                    <span className="font-semibold text-tivit-ink">{a.user.name}</span>{" "}
                    <span className="text-tivit-ink/70">{describeActivity(a)}</span>
                    <div className="text-xs text-tivit-ink/50">{formatRelative(a.created_at)}</div>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-sm text-tivit-ink/50">Sin actividad registrada.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-tivit-ink/60">Detalles</h3>

            <DetailRow label="Estado">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded border border-black/10 px-2 py-1 text-xs"
              >
                {(task.type === "solicitud" ? SOLICITUD_STATUSES : STATUSES).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Prioridad">
              <select
                value={task.priority}
                onChange={(e) => handleFieldChange("priority", e.target.value)}
                className="rounded border border-black/10 px-2 py-1 text-xs"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Crítica</option>
              </select>
            </DetailRow>

            <DetailRow label="Asignado">
              <select
                value={task.assignee_id || ""}
                onChange={(e) => handleFieldChange("assignee_id", e.target.value || null)}
                className="rounded border border-black/10 px-2 py-1 text-xs"
              >
                <option value="">Sin asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Sprint">
              <select
                value={task.sprint_id || ""}
                onChange={(e) => handleSprintChange(e.target.value)}
                className="rounded border border-black/10 px-2 py-1 text-xs"
              >
                <option value="">Sin sprint</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_active === 1 ? "✓" : ""}
                  </option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Reportado por">
              <div className="flex items-center gap-2 text-sm">
                <UserAvatar user={task.reporter} size="sm" />
                <span>{task.reporter.name}</span>
              </div>
            </DetailRow>

            {task.due_date && (
              <DetailRow label="Vence">
                <span className="text-sm font-semibold text-tivit-ink">{formatDate(task.due_date)}</span>
              </DetailRow>
            )}

            <DetailRow label="Estimado">
              <span className="text-sm">
                {task.estimate_hours ? `${task.estimate_hours} h` : "—"}
              </span>
            </DetailRow>

            <DetailRow label="Tiempo registrado">
              <span className="text-sm font-semibold text-tivit-ink">
                {task.time_spent_hours?.toFixed(1) || "0.0"} h
                {task.estimate_hours && task.time_spent_hours > task.estimate_hours && (
                  <span className="ml-2 text-xs text-alert">⚠ excedido</span>
                )}
              </span>
            </DetailRow>

            <DetailRow label="Creado">
              <span className="text-xs text-tivit-ink/60">{formatRelative(task.created_at)}</span>
            </DetailRow>

            <button
              onClick={toggleWatch}
              className={`mt-3 w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isWatching
                  ? "border border-tivit-red bg-tivit-red/10 text-tivit-red"
                  : "border border-black/10 text-tivit-ink hover:bg-tivit-red-light"
              }`}
            >
              {isWatching ? "👁 Viendo" : "👁 Vigilar tarea"}
            </button>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-tivit-ink/60">
              Tiempo ({timeEntries.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeEntries.map((te) => (
                <div key={te.id} className="flex items-start gap-2 rounded-lg border border-black/5 p-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-tivit-ink">
                        {te.hours.toFixed(1)} h
                      </span>
                      <button
                        onClick={() => handleDeleteTime(te.id)}
                        className="text-xs text-alert hover:underline"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs text-tivit-ink/60">{te.user.name}</div>
                    {te.description && (
                      <div className="mt-1 text-xs text-tivit-ink/70">{te.description}</div>
                    )}
                    <div className="mt-1 text-xs text-tivit-ink/40">{formatRelative(te.logged_at)}</div>
                  </div>
                </div>
              ))}
              {timeEntries.length === 0 && (
                <p className="text-sm text-tivit-ink/50">Sin registros.</p>
              )}
            </div>
            {showLogTime ? (
              <form onSubmit={handleLogTime} className="mt-3 space-y-2">
                <input
                  type="number"
                  step="0.25"
                  placeholder="Horas"
                  value={timeForm.hours}
                  onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-tivit-red focus:outline-none"
                  required
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={timeForm.description}
                  onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-tivit-red focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-tivit-red px-3 py-2 text-xs font-semibold text-white hover:bg-tivit-red-dark"
                  >
                    Registrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogTime(false)}
                    className="rounded-lg border border-black/10 px-3 py-2 text-xs text-tivit-ink hover:bg-tivit-red-light"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowLogTime(true)}
                className="mt-3 w-full rounded-lg border border-tivit-red/30 px-3 py-2 text-xs font-semibold text-tivit-red hover:bg-tivit-red hover:text-white"
              >
                + Registrar tiempo
              </button>
            )}
          </div>

          {watchers.length > 0 && (
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-tivit-ink/60">
                Vigilantes ({watchers.length})
              </h3>
              <div className="space-y-2">
                {watchers.map((w) => (
                  <div key={w.id} className="flex items-center gap-2">
                    <UserAvatar user={w} size="sm" />
                    <span className="text-sm text-tivit-ink">{w.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-tivit-ink/60">
              Adjuntos ({attachments.length})
            </h3>
            <div className="space-y-2">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border border-black/5 p-2 hover:bg-tivit-red-light/40">
                  <span className="text-lg">📎</span>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => downloadAttachment(id, a.id, a.filename)}
                      className="block w-full truncate text-left text-sm font-medium text-tivit-ink hover:text-tivit-red"
                    >
                      {a.filename}
                    </button>
                    <div className="text-xs text-tivit-ink/50">
                      {formatBytes(a.size_bytes)} · subido por {a.uploader.name}
                    </div>
                  </div>
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="text-sm text-tivit-ink/50">Sin adjuntos.</p>
              )}
            </div>
            <label className="mt-3 block cursor-pointer rounded-lg border-2 border-dashed border-tivit-red/30 p-3 text-center text-xs font-semibold text-tivit-red transition hover:bg-tivit-red/5">
              + Subir archivo
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <button
            onClick={deleteTask}
            className="w-full rounded-lg border border-alert/30 px-4 py-2 text-sm font-semibold text-alert hover:bg-alert hover:text-white"
          >
            Eliminar tarea
          </button>
        </aside>
      </div>
    </div>
  );
}

function DependenciesSection({
  taskId,
  dependencies,
  blocking,
  showAdd,
  setShowAdd,
  depSearch,
  searchDeps,
  depResults,
  addDep,
  removeDep,
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-tivit-ink/80">
          Dependencias
        </h2>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="rounded-lg border border-tivit-red/30 px-3 py-1 text-xs font-semibold text-tivit-red hover:bg-tivit-red hover:text-white"
        >
          {showAdd ? "Cancelar" : "+ Agregar"}
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-lg border border-tivit-red/20 bg-tivit-red/5 p-3">
          <input
            type="text"
            placeholder="Buscar tarea por título o código..."
            value={depSearch}
            onChange={(e) => searchDeps(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-tivit-red focus:outline-none"
            autoFocus
          />
          {depResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-black/10 bg-white">
              {depResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addDep(r.id)}
                  className="flex w-full items-center gap-2 border-b border-black/5 p-2 text-left text-sm last:border-0 hover:bg-tivit-red-light/50"
                >
                  <span className="font-mono text-xs text-tivit-ink/60">{r.code}</span>
                  <span className="flex-1 truncate text-tivit-ink">{r.title}</span>
                  <StatusBadge status={r.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {dependencies.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold text-tivit-ink/60">
              Esta tarea depende de:
            </div>
            <div className="space-y-1">
              {dependencies.map((d) => (
                <DepRow key={d.id} dep={d} onRemove={() => removeDep(d.id)} />
              ))}
            </div>
          </div>
        )}

        {blocking.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold text-tivit-ink/60">
              Bloquea a:
            </div>
            <div className="space-y-1">
              {blocking.map((d) => (
                <DepRow key={d.id} dep={d} />
              ))}
            </div>
          </div>
        )}

        {dependencies.length === 0 && blocking.length === 0 && (
          <p className="text-sm text-tivit-ink/50">Sin dependencias.</p>
        )}
      </div>
    </div>
  );
}

function DepRow({ dep, onRemove }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-black/5 p-2 hover:bg-tivit-red-light/30">
      <span className="font-mono text-xs text-tivit-ink/60">{dep.code}</span>
      <a
        href={`/portal/tasks/${dep.id}`}
        className="flex-1 truncate text-sm font-medium text-tivit-ink hover:text-tivit-red"
      >
        {dep.title}
      </a>
      <StatusBadge status={dep.status} />
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-xs text-alert hover:underline"
          title="Quitar"
        >
          ×
        </button>
      )}
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 text-xs font-semibold text-tivit-ink/50">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function CommentBody({ body, users }) {
  const parts = [];
  let buffer = "";
  let i = 0;
  while (i < body.length) {
    if (body[i] === "@") {
      let j = i + 1;
      while (j < body.length && /[a-zA-Z0-9._-]/.test(body[j])) j++;
      const mention = body.slice(i + 1, j);
      if (mention.length > 0) {
        if (buffer) parts.push(buffer);
        const user = users.find((u) => u.name === mention || u.email.startsWith(mention));
        parts.push(
          <span
            key={i}
            className={user ? "rounded bg-tivit-red/15 px-1 font-semibold text-tivit-red" : "rounded bg-tivit-ink/10 px-1 font-semibold text-tivit-ink"}
          >
            @{mention}
          </span>
        );
        buffer = "";
        i = j;
        continue;
      }
    }
    buffer += body[i];
    i++;
  }
  if (buffer) parts.push(buffer);
  return <div className="mt-1 whitespace-pre-wrap text-sm text-tivit-ink/80">{parts}</div>;
}

function describeActivity(a) {
  switch (a.action) {
    case "created":
      return "creó esta tarea";
    case "updated":
      return `actualizó ${a.field_changed || "un campo"}`;
    case "moved":
      return `movió la tarea de "${a.old_value}" a "${a.new_value}"`;
    case "assigned":
      return `cambió la asignación`;
    case "commented":
      return "comentó";
    case "attached":
      return `adjuntó "${a.new_value}"`;
    case "toggled":
      return `marcó una subtarea como ${a.new_value}`;
    case "linked":
      return `agregó dependencia con ${a.new_value}`;
    case "time_logged":
      return `registró ${a.new_value}`;
    default:
      return a.action;
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}