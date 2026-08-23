import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Upload, Trash2, Image as ImageIcon, Film, FileText } from "lucide-react";
import { useMediaList, useUploadMedia, useDeleteMedia } from "../../../lib/contentQueries";

const KIND_FILTERS = [
  { value: "all", label: "Todos", icon: ImageIcon },
  { value: "image", label: "Imágenes", icon: ImageIcon },
  { value: "video", label: "Videos", icon: Film },
  { value: "document", label: "Documentos", icon: FileText },
];

export function MediaManagerPage() {
  const [kind, setKind] = useState("image");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const params = kind !== "all" ? { kind } : {};
  if (search) params.q = search;

  const { data, isLoading, refetch } = useMediaList(params);
  const uploadMut = useUploadMedia();
  const deleteMut = useDeleteMedia();

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadMut.mutateAsync({ file, alt: "" });
      refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const items = data?.items || [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            to="/portal/cms"
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-tivit-ink/50 hover:text-tivit-red"
          >
            <ChevronLeft className="h-3 w-3" /> Contenido
          </Link>
          <h1 className="text-2xl font-bold text-tivit-ink">Biblioteca de medios</h1>
          <p className="mt-1 text-sm text-tivit-ink/55">
            Imágenes, videos y documentos subidos al CMS.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-tivit-red-dark">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {uploading ? "Subiendo…" : "Subir archivo"}
          <input
            type="file"
            accept="image/*,video/*,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="flex gap-1">
          {KIND_FILTERS.map((kf) => {
            const Icon = kf.icon;
            return (
              <button
                key={kf.value}
                onClick={() => setKind(kf.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  kind === kf.value
                    ? "bg-tivit-red text-white"
                    : "text-tivit-ink/65 hover:bg-tivit-red-light"
                }`}
              >
                <Icon className="h-4 w-4" /> {kf.label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tivit-ink/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-sm focus:border-tivit-red focus:outline-none focus:ring-2 focus:ring-tivit-red/20"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-alert/30 bg-alert/10 p-3 text-sm text-alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-tivit-ink/45">Cargando…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-8 text-center">
          <ImageIcon className="mx-auto mb-2 h-10 w-10 text-tivit-ink/30" />
          <p className="text-sm text-tivit-ink/50">No hay archivos en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <div
              key={m.id}
              className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
            >
              <div className="aspect-square bg-tivit-ink/5">
                {m.mime_type?.startsWith("image/") ? (
                  <img
                    src={m.url}
                    alt={m.alt_text || m.filename}
                    className="h-full w-full object-cover"
                  />
                ) : m.mime_type?.startsWith("video/") ? (
                  <video src={m.url} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center">
                    <FileText className="h-10 w-10 text-tivit-ink/30" />
                    <span className="text-[10px] text-tivit-ink/45">{m.mime_type}</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-semibold text-tivit-ink/75" title={m.filename}>
                  {m.filename}
                </p>
                <p className="text-[10px] text-tivit-ink/45">
                  {formatBytes(m.size_bytes)}
                  {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar "${m.filename}"?`)) deleteMut.mutate(m.id);
                }}
                className="absolute right-2 top-2 hidden rounded-lg bg-white/90 p-1.5 text-tivit-ink/55 shadow-sm hover:text-alert group-hover:block"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-tivit-ink/45">
        Total: {data?.total ?? 0} archivos
      </p>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
