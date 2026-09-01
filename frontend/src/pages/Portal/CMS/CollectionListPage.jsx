import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit3,
  ChevronLeft,
} from "lucide-react";
import {
  useCollections,
  useContentItems,
  useDeleteContentItem,
  useDuplicateContentItem,
  usePublishContentItem,
} from "../../../lib/contentQueries";
import { useAuth } from "../../../context/AuthContext";
import { formatDateTime } from "../components/Badges";

const EDITABLE_COLLECTIONS = ["laboratorio", "poc", "casos-de-exito", "almaviva", "xms"];

export function CollectionListPage() {
  const { collection } = useParams();
  const { data: collections } = useCollections();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filters = {
    q: search,
    published:
      statusFilter === "published"
        ? true
        : statusFilter === "drafts"
          ? false
          : undefined,
  };

  const { data, isLoading, error } = useContentItems(collection, filters);
  const deleteMut = useDeleteContentItem(collection);
  const duplicateMut = useDuplicateContentItem(collection);
  const publishMut = usePublishContentItem(collection);

  const isEditor = !!user && ["member", "editor", "admin"].includes(user.role);
  const isReadOnly = false;
  const isEditable = EDITABLE_COLLECTIONS.includes(collection) && isEditor;
  const meta = collections?.find((c) => c.ruta === collection);

  // Proyectos migrado a tabla `projects` — mostrar aviso y redirigir a /portal/portfolio
  if (collection === "proyectos") {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-tivit-ink">Portafolio gestionado en otra sección</h2>
        <p className="mt-2 text-sm text-tivit-ink/60">
          Desde la migración 020 los elementos del portafolio se administran en la tabla <code className="rounded bg-tivit-ink/5 px-1">projects</code> y no en el CMS genérico.
          Usá la sección <strong>Portafolio</strong> del portal para crear y editar (6 categorías: Backlog Internas/Comerciales, Evaluación técnica, PoC, Proyecto, Producción).
        </p>
        <Link
          to="/portal/portfolio"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white hover:bg-tivit-red-dark"
        >
          Ir a Portafolio
        </Link>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        <p className="text-tivit-ink/60">Colección no encontrada.</p>
        <Link
          to="/portal/cms"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-tivit-red hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> Volver
        </Link>
      </div>
    );
  }

  const items = Array.isArray(data) ? data : (data?.items || []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            to="/portal/cms"
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-tivit-ink/50 hover:text-tivit-red"
          >
            <ChevronLeft className="h-3 w-3" /> Contenido
          </Link>
          <h1 className="text-2xl font-bold text-tivit-ink">{meta.nombre}</h1>
          <p className="mt-1 text-sm text-tivit-ink/55">{meta.titulo}</p>
        </div>
        {isEditable ? (
          <Link
            to={`/portal/cms/${collection}/new`}
            className="flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-tivit-red-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo item
          </Link>
        ) : (
          <span className="rounded-lg bg-tivit-ink/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-tivit-ink/50">
            Solo lectura
          </span>
        )}
      </div>

      {!isEditable && !isReadOnly && (
        <div className="rounded-xl border border-alert/20 bg-alert/5 p-3 text-sm text-alert">
          Necesitas estar autenticado para editar. Tu rol: <strong>{user?.role || "—"}</strong>. Contacta a un admin si necesitas acceso.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tivit-ink/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por slug o contenido…"
            className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-sm focus:border-tivit-red focus:outline-none focus:ring-2 focus:ring-tivit-red/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-tivit-red focus:outline-none"
        >
          <option value="all">Todos ({meta.total_items})</option>
          <option value="published">Publicados ({meta.total_publicados})</option>
          <option value="drafts">Borradores ({meta.total_borradores})</option>
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-alert/30 bg-alert/10 p-4 text-sm text-alert">
          Error al cargar items: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-tivit-ink/45">Cargando items…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-8 text-center">
          <p className="text-sm text-tivit-ink/50">No hay items en esta colección todavía.</p>
          <Link
            to={`/portal/cms/${collection}/new`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-tivit-red hover:underline"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:hidden">
            {items.map((item) => {
              const title = item.data.nombreComercial || item.data.nombre || item.slug;
              return (
                <div key={item.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/portal/cms/${collection}/${item.slug}`}
                      className="min-w-0 flex-1 truncate font-semibold text-tivit-ink hover:text-tivit-red"
                    >
                      {title}
                    </Link>
                    {item.published ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                        <Eye className="h-3 w-3" /> Publicado
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
                        <EyeOff className="h-3 w-3" /> Borrador
                      </span>
                    )}
                  </div>
                  <code className="mt-2 inline-block rounded bg-tivit-ink/5 px-1.5 py-0.5 text-xs text-tivit-ink/60">
                    {item.slug}
                  </code>
                  {item.data.codigo && (
                    <span className="ml-2 rounded bg-tivit-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-tivit-ink/60">
                      {item.data.codigo}
                    </span>
                  )}
                  <div className="mt-2 text-xs text-tivit-ink/55" title={formatDateTime(item.updated_at)}>
                    {formatDateTime(item.updated_at)}
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-black/5 pt-3">
                    {isEditable ? (
                      <>
                        <Link
                          to={`/portal/cms/${collection}/${item.slug}`}
                          className="rounded p-1.5 text-tivit-ink/55 hover:bg-tivit-red-light hover:text-tivit-red"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() =>
                            publishMut.mutate({
                              slug: item.slug,
                              published: !item.published,
                            })
                          }
                          className="rounded p-1.5 text-tivit-ink/55 hover:bg-tivit-red-light hover:text-tivit-red"
                          title={item.published ? "Despublicar" : "Publicar"}
                        >
                          {item.published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Duplicar "${title}"?`)) {
                              duplicateMut.mutate(item.slug);
                            }
                          }}
                          className="rounded p-1.5 text-tivit-ink/55 hover:bg-tivit-red-light hover:text-tivit-red"
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `¿Eliminar "${title}"? Esta acción no se puede deshacer.`
                              )
                            ) {
                              deleteMut.mutate(item.slug);
                            }
                          }}
                          className="rounded p-1.5 text-tivit-ink/55 hover:bg-alert/10 hover:text-alert"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/portal/cms/${collection}/${item.slug}`}
                        className="rounded p-1.5 text-tivit-ink/30 hover:bg-black/5 hover:text-tivit-ink/50"
                        title="Ver (solo lectura)"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm sm:block">
            <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-tivit-red-light/40 text-xs uppercase tracking-wider text-tivit-ink/55">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Item</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-left font-semibold">Actualizado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {items.map((item) => {
                const title =
                  item.data.nombreComercial ||
                  item.data.nombre ||
                  item.slug;
                return (
                  <tr key={item.id} className="hover:bg-tivit-red-light/20">
                    <td className="px-4 py-3">
                      <Link
                        to={`/portal/cms/${collection}/${item.slug}`}
                        className="font-semibold text-tivit-ink hover:text-tivit-red"
                      >
                        {title}
                      </Link>
                      {item.data.codigo && (
                        <span className="ml-2 rounded bg-tivit-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-tivit-ink/60">
                          {item.data.codigo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-tivit-ink/5 px-1.5 py-0.5 text-xs text-tivit-ink/60">
                        {item.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {item.published ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                          <Eye className="h-3 w-3" /> Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
                          <EyeOff className="h-3 w-3" /> Borrador
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-tivit-ink/55" title={formatDateTime(item.updated_at)}>
                      {formatDateTime(item.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditable ? (
                          <>
                            <Link
                              to={`/portal/cms/${collection}/${item.slug}`}
                              className="rounded p-1.5 text-tivit-ink/55 hover:bg-tivit-red-light hover:text-tivit-red"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() =>
                                publishMut.mutate({
                                  slug: item.slug,
                                  published: !item.published,
                                })
                              }
                              className="rounded p-1.5 text-tivit-ink/55 hover:bg-tivit-red-light hover:text-tivit-red"
                              title={item.published ? "Despublicar" : "Publicar"}
                            >
                              {item.published ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Duplicar "${title}"?`)) {
                                  duplicateMut.mutate(item.slug);
                                }
                          }}
                          className="rounded p-1.5 text-tivit-ink/55 hover:bg-tivit-red-light hover:text-tivit-red"
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `¿Eliminar "${title}"? Esta acción no se puede deshacer.`
                              )
                            ) {
                              deleteMut.mutate(item.slug);
                            }
                          }}
                          className="rounded p-1.5 text-tivit-ink/55 hover:bg-alert/10 hover:text-alert"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                          </>
                        ) : (
                          <Link
                            to={`/portal/cms/${collection}/${item.slug}`}
                            className="rounded p-1.5 text-tivit-ink/30 hover:bg-black/5 hover:text-tivit-ink/50"
                            title="Ver (solo lectura)"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}

      <p className="text-xs text-tivit-ink/45">
        Mostrando {items.length} de {data?.total ?? items.length} items
      </p>
    </div>
  );
}
