import { useEffect, useState } from "react";
import { X, ArrowRight, AlertCircle, Check } from "lucide-react";
import { api } from "../../lib/api";

const ESTADO_ACEPTACION_OPTIONS = ["Pendiente", "Aprobado", "Rechazado"];

function parsePortfolioData(data) {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try {
    let parsed = JSON.parse(data);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch {
    return {};
  }
}

export function ModalProduccion({ isOpen, onClose, project, onSuccess }) {
  const [form, setForm] = useState({
    fecha_deploy: "",
    url_produccion: "",
    estado_aceptacion: "Pendiente",
    notas_release: "",
    documentacion_final: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && project) {
      const pData = parsePortfolioData(project.portfolio_data);
      setForm({
        fecha_deploy: pData.fecha_deploy || "",
        url_produccion: pData.url_produccion || "",
        estado_aceptacion: pData.estado_aceptacion || "Pendiente",
        notas_release: pData.notas_release || "",
        documentacion_final: pData.documentacion_final || "",
      });
    }
  }, [isOpen, project]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      const pData = parsePortfolioData(project.portfolio_data);
      const updatedPortfolioData = {
        ...pData,
        fecha_deploy: form.fecha_deploy,
        url_produccion: form.url_produccion,
        estado_aceptacion: form.estado_aceptacion,
        notas_release: form.notas_release,
        documentacion_final: form.documentacion_final,
      };

      await api.updateProject(project.id, {
        stage: "Producción",
        categoria: "Producción",
        portfolio_data: updatedPortfolioData,
      });

      onSuccess();
      onClose();
    } catch (e) {
      setError(e.message || "No se pudo mover el proyecto");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white rounded-t-2xl p-4 px-6">
          <div>
            <h2 className="text-lg font-semibold text-tivit-ink">Mover a Producción</h2>
            <p className="mt-0.5 text-sm text-tivit-ink/50">Completa la información de despliegue</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-black/5 bg-gray-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tivit-ink/40">
              <Check className="h-4 w-4 text-emerald-500" />
              Datos de etapas anteriores se mantienen
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Fecha Deploy Producción
              </label>
              <input
                type="date"
                value={form.fecha_deploy}
                onChange={(e) => updateField("fecha_deploy", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                URL Producción
              </label>
              <input
                type="url"
                value={form.url_produccion}
                onChange={(e) => updateField("url_produccion", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Estado de Aceptación
              </label>
              <select
                value={form.estado_aceptacion}
                onChange={(e) => updateField("estado_aceptacion", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
              >
                {ESTADO_ACEPTACION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Notas Release
              </label>
              <textarea
                value={form.notas_release}
                onChange={(e) => updateField("notas_release", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20 min-h-[100px] resize-y"
                placeholder="Changelog, lecciones aprendidas, observaciones..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Documentación Final
              </label>
              <input
                type="url"
                value={form.documentacion_final}
                onChange={(e) => updateField("documentacion_final", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-tivit-ink transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-tivit-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60"
            >
              {saving ? (
                "Guardando…"
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Guardar y Mover a Producción
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
