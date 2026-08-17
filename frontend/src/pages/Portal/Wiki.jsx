import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Edit3, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar, formatRelative } from "./components/Badges";

export function Wiki({ projectId } = {}) {
  const { slug, id: routeProjectId } = useParams();
  const pid = projectId || routeProjectId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    if (slug === "nueva") {
      setCurrent(null);
      setForm({ title: "", body: "" });
      setEditing(true);
      setLoading(false);
      return;
    }
    if (slug) {
      api
        .getWiki(slug)
        .then((p) => {
          setCurrent(p);
          setForm({ title: p.title, body: p.body });
          setEditing(false);
        })
        .catch((e) => setError(e.message || "Página no encontrada"))
        .finally(() => setLoading(false));
    } else {
      const params = pid ? { project: pid } : {};
      api
        .listWiki(params)
        .then(setPages)
        .catch((e) => setError(e.message || "No se pudieron cargar las páginas"))
        .finally(() => setLoading(false));
    }
  }, [slug, pid]);

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (current) {
        const updated = await api.updateWiki(current.slug, form);
        navigate(`/portal/wiki/${updated.slug}`, { replace: true });
      } else {
        const created = await api.createWiki({ ...form, project_id: pid || null });
        navigate(`/portal/wiki/${created.slug}`);
      }
    } catch (err) {
      setError(err.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function removePage() {
    if (!window.confirm("¿Eliminar esta página?")) return;
    setError("");
    try {
      await api.deleteWiki(current.slug);
      navigate("/portal/wiki");
    } catch (err) {
      setError(err.message || "No se pudo eliminar");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-tivit-red-light bg-white px-3.5 py-2.5 outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20";

  const canEdit = !current || current.author?.id === user?.id || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  if (slug) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link to="/portal/wiki" className="inline-flex items-center gap-1.5 text-sm font-semibold text-tivit-red hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Wiki
        </Link>

        {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

        {loading && <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando…</p>}

        {current && !editing && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-tivit-red-dark">{current.title}</h1>
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-tivit-red-light px-3 py-1.5 text-xs font-semibold text-tivit-ink transition hover:bg-tivit-red-light"
                  >
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" /> Editar
                  </button>
                  {isAdmin && (
                    <button
                      onClick={removePage}
                      className="flex items-center gap-1.5 rounded-lg border border-alert/30 px-3 py-1.5 text-xs font-semibold text-alert transition hover:bg-alert/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-tivit-ink/50">
              <UserAvatar user={current.author} size="sm" />
              {current.author?.name} · actualizada {formatRelative(current.updated_at)}
            </div>
            <div className="prose mt-5 whitespace-pre-wrap text-sm leading-relaxed text-tivit-ink/80">
              {current.body}
            </div>
          </div>
        )}

        {!current && editing && (
          <form onSubmit={save} className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
            <h2 className="text-lg font-semibold text-tivit-ink">Nueva página</h2>
            <div className="mt-3 flex flex-col gap-3">
              <input className={inputClass} placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} />
              <textarea
                className={`${inputClass} min-h-[260px] resize-y font-mono text-xs`}
                placeholder="Contenido…"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving} className="rounded-full bg-tivit-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60">
                {saving ? "Guardando…" : "Crear página"}
              </button>
              <button type="button" onClick={() => navigate("/portal/wiki")} className="rounded-full border border-tivit-red-light px-5 py-2 text-sm font-semibold text-tivit-ink transition hover:bg-tivit-red-light">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {current && editing && (
          <form onSubmit={save} className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
            <h2 className="text-sm font-semibold text-tivit-ink">Editar página</h2>
            <div className="mt-3 flex flex-col gap-3">
              <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} />
              <textarea
                className={`${inputClass} min-h-[260px] resize-y font-mono text-xs`}
                placeholder="Contenido…"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving} className="rounded-full bg-tivit-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60">
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button type="button" onClick={() => { setEditing(false); setForm({ title: current.title, body: current.body }); }} className="rounded-full border border-tivit-red-light px-5 py-2 text-sm font-semibold text-tivit-ink transition hover:bg-tivit-red-light">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tivit-red-dark">Wiki del equipo</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">Base de conocimiento y documentación.</p>
        </div>
        <button onClick={() => navigate("/portal/wiki/nueva")} className="shrink-0 rounded-full bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark">
          + Nueva página
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

      {loading && <p className="py-8 text-center text-sm text-tivit-ink/50">Cargando…</p>}
      {!loading && pages.length === 0 && <p className="py-8 text-center text-sm text-tivit-ink/50">Todavía no hay páginas.</p>}

      <div className="mt-6 space-y-2">
        {pages.map((p) => (
          <Link
            key={p.id}
            to={`/portal/wiki/${p.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 transition hover:border-tivit-red/30 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tivit-red-light text-tivit-red">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-tivit-ink">{p.title}</div>
              <div className="text-xs text-tivit-ink/50">
                {p.author?.name} · actualizada {formatRelative(p.updated_at)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}