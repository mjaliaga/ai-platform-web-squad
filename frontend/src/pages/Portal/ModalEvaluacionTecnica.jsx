import { useEffect, useState } from "react";
import { X, ArrowRight, AlertCircle, Check } from "lucide-react";
import { api } from "../../lib/api";

const TSHIRT_OPTIONS = [
  { value: "S", label: "S", help: "< 2 semanas" },
  { value: "M", label: "M", help: "2-4 semanas" },
  { value: "L", label: "L", help: "1-2 meses" },
  { value: "XL", label: "XL", help: "> 2 meses" },
];

export function ModalEvaluacionTecnica({ isOpen, onClose, project, onSuccess }) {
  const [form, setForm] = useState({
    ingeniero_encargado: "",
    tshirt: "",
    documentacion_drive: "",
    riesgos_dependencias: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && project) {
      let pData = {};
      try {
        pData = project.portfolio_data ? JSON.parse(project.portfolio_data) : {};
      } catch (e) {
        pData = {};
      }
      setForm({
        ingeniero_encargado: pData.ingeniero_encargado || pData.lider_tecnico || "",
        tshirt: pData.tshirt || "",
        documentacion_drive: pData.documentacion_drive || "",
        riesgos_dependencias: pData.riesgos_dependencias || "",
      });
    }
  }, [isOpen, project]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.ingeniero_encargado) {
      setError("El ingeniero encargado es obligatorio");
      return;
    }
    if (!form.tshirt) {
      setError("La estimación T-Shirt es obligatoria");
      return;
    }

    try {
      setSaving(true);
      let pData = {};
      try {
        pData = project.portfolio_data ? JSON.parse(project.portfolio_data) : {};
      } catch (e) {
        pData = {};
      }
      const updatedPortfolioData = {
        ...pData,
        lider_tecnico: form.ingeniero_encargado,
        ingeniero_encargado: form.ingeniero_encargado,
        tshirt: form.tshirt,
        documentacion_drive: form.documentacion_drive,
        riesgos_dependencias: form.riesgos_dependencias,
      };

      await api.updateProject(project.id, {
        stage: "Evaluación técnica",
        categoria: "Evaluación técnica",
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
            <h2 className="text-lg font-semibold text-tivit-ink">Mover a Evaluación Técnica</h2>
            <p className="mt-0.5 text-sm text-tivit-ink/50">Completa la información técnica antes de avanzar</p>
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
              Datos del Backlog se mantienen
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-tivit-ink">
                Ingeniero Encargado <span className="text-tivit-red">*</span>
              </label>
              <input
                type="text"
                value={form.ingeniero_encargado}
                onChange={(e) => updateField("ingeniero_encargado", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                placeholder="Nombre del ingeniero encargado"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-tivit-ink">
                Estimación T-Shirt Size <span className="text-tivit-red">*</span>
              </label>
              <div className="mt-2 flex gap-2">
                {TSHIRT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField("tshirt", opt.value)}
                    className={`flex-1 rounded-xl border py-3 px-2 text-center transition ${
                      form.tshirt === opt.value
                        ? "border-tivit-red bg-tivit-red/5 text-tivit-red font-semibold"
                        : "border-black/10 bg-white text-tivit-ink/60 hover:border-tivit-red/30 hover:bg-tivit-red/5"
                    }`}
                  >
                    <div className="text-lg font-bold">{opt.label}</div>
                    <div className="mt-0.5 text-xs opacity-60">{opt.help}</div>
                  </button>
                ))}
              </div>
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

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Riesgos y Dependencias
              </label>
              <textarea
                value={form.riesgos_dependencias}
                onChange={(e) => updateField("riesgos_dependencias", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20 min-h-[80px] resize-y"
                placeholder="¿Dependemos de terceros? ¿Consideraciones de seguridad? ¿Integraciones críticas?"
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
                  Guardar y Mover a ET
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
