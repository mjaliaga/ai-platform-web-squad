import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, History, Filter } from "lucide-react";
import { useContentAudit, useCollections } from "../../../lib/contentQueries";

const ACTION_LABELS = {
  created: { label: "Creado", color: "bg-green-100 text-green-700" },
  updated: { label: "Editado", color: "bg-blue-100 text-blue-700" },
  published: { label: "Publicado", color: "bg-emerald-100 text-emerald-700" },
  unpublished: { label: "Despublicado", color: "bg-yellow-100 text-yellow-700" },
  deleted: { label: "Eliminado", color: "bg-red-100 text-red-700" },
  duplicated: { label: "Duplicado", color: "bg-purple-100 text-purple-700" },
};

export function ContentAuditPage() {
  const { data: collections } = useCollections();
  const [filter, setFilter] = useState("");

  const params = filter ? { collection: filter, limit: 200 } : { limit: 200 };
  const { data, isLoading } = useContentAudit(params);

  const items = Array.isArray(data) ? data : (data?.items || []);

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/portal/cms"
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-tivit-ink/50 hover:text-tivit-red"
        >
          <ChevronLeft className="h-3 w-3" /> Contenido
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-tivit-ink">
          <History className="h-6 w-6 text-tivit-red" />
          Historial de cambios
        </h1>
        <p className="mt-1 text-sm text-tivit-ink/55">
          Auditoría de todas las modificaciones al contenido público.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
        <Filter className="h-4 w-4 text-tivit-ink/45" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-sm focus:border-tivit-red focus:outline-none"
        >
          <option value="">Todas las colecciones</option>
          {collections?.map((c) => (
            <option key={c.ruta} value={c.ruta}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-tivit-ink/45">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-tivit-ink/45">
            Sin actividad registrada.
          </div>
        ) : (
          <ul className="divide-y divide-black/5">
            {items.map((entry) => {
              const meta = ACTION_LABELS[entry.action] || {
                label: entry.action,
                color: "bg-tivit-ink/5 text-tivit-ink/70",
              };
              return (
                <li key={entry.id} className="flex items-start gap-3 p-4">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-tivit-ink">
                      <span className="font-semibold">{entry.actor_name || "—"}</span>{" "}
                      {actionVerb(entry.action)}{" "}
                      <Link
                        to={`/portal/cms/${entry.collection}/${entry.slug}`}
                        className="font-mono text-tivit-red hover:underline"
                      >
                        {entry.collection}/{entry.slug}
                      </Link>
                    </p>
                    {entry.details && (
                      <p className="mt-0.5 text-xs text-tivit-ink/55">
                        {entry.details}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-tivit-ink/45">
                    {new Date(entry.created_at).toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function actionVerb(action) {
  switch (action) {
    case "created":
      return "creó";
    case "updated":
      return "editó";
    case "published":
      return "publicó";
    case "unpublished":
      return "despublicó";
    case "deleted":
      return "eliminó";
    case "duplicated":
      return "duplicó";
    default:
      return action;
  }
}
