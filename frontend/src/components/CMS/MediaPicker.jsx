import { useState, useRef } from "react";
import { X, Upload, Search, ImageIcon, Loader2 } from "lucide-react";
import { useMediaList, useUploadMedia } from "../../lib/contentQueries";

export function MediaPicker({ onSelect, onClose, kind = "image" }) {
  const fileRef = useRef(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const { data, isLoading, refetch } = useMediaList({
    kind,
    limit: 60,
    q: search || undefined,
  });

  const uploadMut = useUploadMedia();

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadMut.mutateAsync({ file, alt: "" });
      onSelect({ url: result.url, alt: result.alt_text || "" });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const items = Array.isArray(data) ? data : (data?.items || []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tivit-ink/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-bold text-tivit-ink">
            Biblioteca de medios
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-tivit-ink/55 hover:bg-tivit-red-light hover:text-tivit-red"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-3 border-b border-black/5 bg-tivit-red-light/30 px-5 py-3">
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
          <input
            ref={fileRef}
            type="file"
            accept={kind === "image" ? "image/*" : kind === "video" ? "video/*" : "*/*"}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white hover:bg-tivit-red-dark disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Subir nuevo
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 rounded-lg border border-alert/30 bg-alert/10 p-3 text-sm text-alert">
            {error}
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {isLoading && (
            <p className="text-center text-sm text-tivit-ink/45">Cargando…</p>
          )}
          {!isLoading && items.length === 0 && (
            <div className="py-10 text-center">
              <ImageIcon className="mx-auto mb-2 h-10 w-10 text-tivit-ink/30" />
              <p className="text-sm text-tivit-ink/45">
                No hay archivos todavía. Subí uno nuevo.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelect({ url: m.url, alt: m.alt_text || "" });
                  onClose();
                }}
                className="group relative aspect-square overflow-hidden rounded-lg border border-black/10 bg-tivit-ink/5 hover:border-tivit-red hover:ring-2 hover:ring-tivit-red/30"
              >
                {m.mime_type?.startsWith("image/") ? (
                  <img
                    src={m.url}
                    alt={m.alt_text || m.filename}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-tivit-ink/50">
                    {m.mime_type}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-tivit-ink/80 p-1.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                  <p className="truncate">{m.filename}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
