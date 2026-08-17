import { useEffect, useState } from "react";
import { Pin, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar, formatRelative } from "./components/Badges";

export function Feed({ projectId } = {}) {
  const { user } = useAuth();
  const { id: routeId } = useParams();
  const pid = projectId || routeId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, [pid]);

  async function refresh() {
    setLoading(true);
    try {
      const params = pid ? { project: pid } : {};
      const list = await api.listAnnouncements(params);
      setItems(list);
    } catch (e) {
      setError(e.message || "No se pudieron cargar los anuncios");
    } finally {
      setLoading(false);
    }
  }

  async function create(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.createAnnouncement({ title, body, project_id: pid || null });
      setTitle("");
      setBody("");
      await refresh();
    } catch (err) {
      setError(err.message || "No se pudo publicar");
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(item) {
    setError("");
    try {
      await api.updateAnnouncement(item.id, { pinned: item.pinned === 1 ? 0 : 1 });
      await refresh();
    } catch (err) {
      setError(err.message || "No se pudo actualizar");
    }
  }

  async function remove(item) {
    if (!window.confirm("¿Eliminar este anuncio?")) return;
    setError("");
    try {
      await api.deleteAnnouncement(item.id);
      await refresh();
    } catch (err) {
      setError(err.message || "No se pudo eliminar");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-tivit-red-light bg-white px-3.5 py-2.5 outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-tivit-red-dark">Anuncios del equipo</h1>
      <p className="mt-1 text-sm text-tivit-ink/60">
        Comunicaciones, avisos y novedades del equipo.
      </p>

      {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

      <form onSubmit={create} className="mt-6 rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="text-sm font-semibold text-tivit-ink">Publicar anuncio</h2>
        <div className="mt-3 flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
          <textarea
            className={`${inputClass} min-h-[90px] resize-y`}
            placeholder="Escribe el contenido…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={10000}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-tivit-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60"
        >
          {saving ? "Publicando…" : "Publicar"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {loading && <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando…</p>}
        {!loading && items.length === 0 && (
          <p className="py-8 text-center text-sm text-tivit-ink/50">Sin anuncios todavía. ¡Publica el primero!</p>
        )}
        {items.map((a) => {
          const canModify = a.author?.id === user?.id || user?.role === "admin";
          return (
            <div
              key={a.id}
              className={`rounded-2xl border bg-white p-5 ${a.pinned === 1 ? "border-tivit-red/30 shadow-sm" : "border-black/5"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={a.author} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-tivit-ink">{a.title}</h2>
                      {a.pinned === 1 && (
                        <span className="flex items-center gap-1 rounded-full bg-tivit-red-light px-2 py-0.5 text-xs font-semibold text-tivit-red-dark">
                          <Pin className="h-3 w-3" aria-hidden="true" /> Fijado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-tivit-ink/50">
                      {a.author?.name} · {formatRelative(a.created_at)}
                    </div>
                  </div>
                </div>
                {canModify && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => togglePin(a)}
                      title={a.pinned === 1 ? "Desfijar" : "Fijar"}
                      className={`rounded-lg p-2 transition ${
                        a.pinned === 1
                          ? "bg-tivit-red-light text-tivit-red"
                          : "text-tivit-ink/50 hover:bg-tivit-red-light hover:text-tivit-ink"
                      }`}
                    >
                      <Pin className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => remove(a)}
                      title="Eliminar"
                      className="rounded-lg p-2 text-tivit-ink/50 transition hover:bg-alert/10 hover:text-alert"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-tivit-ink/80">{a.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}