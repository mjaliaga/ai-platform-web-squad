import { useEffect, useState } from "react";
import { X, ArrowRight, AlertCircle, Check } from "lucide-react";
import { api } from "../../lib/api";

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

export function ModalPoC({ isOpen, onClose, project, onSuccess }) {
  const [form, setForm] = useState({
    hipotesis: "",
    criterios_exito: "",
    fecha_inicio: "",
    fecha_fin: "",
    recursos: "",
    resultados: "",
    documentacion_drive: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && project) {
      const pData = parsePortfolioData(project.portfolio_data);
      setForm({
        hipotesis: pData.hipotesis || "",
        criterios_exito: pData.criterios_exito || "",
        fecha_inicio: pData.fecha_inicio || "",
        fecha_fin: pData.fecha_fin || "",
        recursos: pData.recursos || "",
        resultados: pData.resultados || "",
        documentacion_drive: pData.documentacion_drive || "",
      });
    }
  }, [isOpen, project]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.hipotesis) {
      setError("La hipótesis es obligatoria");
      return;
    }
    if (!form.criterios_exito) {
      setError("Los criterios de éxito son obligatorios");
      return;
    }

    try {
      setSaving(true);
      const pData = parsePortfolioData(project.portfolio_data);
      const updatedPortfolioData = {
        ...pData,
        hipotesis: form.hipotesis,
        criterios_exito: form.criterios_exito,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        recursos: form.recursos,
        resultados: form.resultados,
        documentacion_drive: form.documentacion_drive,
      };

      await api.updateProject(project.id, {
        stage: "PoC",
        categoria: "PoC",
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
            <h2 className="text-lg font-semibold text-tivit-ink">Mover a PoC</h2>
            <p className="mt-0.5 text-sm text-tivit-ink/50">Completa la información del PoC antes de avanzar</p>
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
              Datos del Backlog y Evaluación Técnica se mantienen
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-tivit-ink">
                Hipótesis a Validar <span className="text-tivit-red">*</span>
              </label>
              <textarea
                value={form.hipotesis}
                onChange={(e) => updateField("hipotesis", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20 min-h-[80px] resize-y"
                placeholder="Ej: La API responderá en menos de 2 segundos"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-tivit-ink">
                Criterios de Éxito <span className="text-tivit-red">*</span>
              </label>
              <textarea
                value={form.criterios_exito}
                onChange={(e) => updateField("criterios_exito", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20 min-h-[80px] resize-y"
                placeholder="Definir los criterios que validarán el éxito del PoC"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-tivit-ink">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => updateField("fecha_inicio", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-tivit-ink">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => updateField("fecha_fin", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Recursos Involucrados
              </label>
              <input
                type="text"
                value={form.recursos}
                onChange={(e) => updateField("recursos", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                placeholder="Nombres de los recursos involucrados"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Resultados / Hallazgos
              </label>
              <textarea
                value={form.resultados}
                onChange={(e) => updateField("resultados", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20 min-h-[80px] resize-y"
                placeholder="Documentar los resultados y hallazgos del PoC"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Documentación Drive
              </label>
              <input
                type="url"
                value={form.documentacion_drive}
                onChange={(e) => updateField("documentacion_drive", e.target.value)}
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
                  Guardar y Mover a PoC
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
