import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Save, Trash2, AlertCircle } from "lucide-react";

const SECTORES = ["Tecnología", "Marketing", "Ventas", "Operaciones", "Recursos Humanos", "Finanzas", "Legal", "Otro"];
const CATEGORIAS_PORTAFOLIO = [
  "Backlog de Propuestas Internas",
  "Backlog de Propuestas Comerciales",
  "Evaluación técnica",
  "PoC",
  "Proyecto",
  "Producción",
];
const COLORES = [
  "#dc2626", "#ea580c", "#d97706", "#65a30d", "#16a34a",
  "#0d9488", "#0891b2", "#2563eb", "#7c3aed", "#c026d3",
  "#db2777", "#475569"
];

export function ProjectSettings() {
  const { user } = useAuth();
  const { project, setProject } = useOutletContext();
  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    sector: "",
    categoria: "Proyecto",
    color: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || "",
        code: project.code || "",
        description: project.description || "",
        sector: project.sector || "",
        categoria: project.categoria || "Proyecto",
        color: project.color || "#dc2626",
      });
    }
  }, [project]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await api.updateProject(project.id, form);
      setProject(updated);
      setSuccess("Cambios guardados correctamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleColorSelect(color) {
    setForm((f) => ({ ...f, color }));
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-tivit-ink/30" />
        <p className="mt-2 text-sm text-tivit-ink/60">
          No tienes permisos para editar la configuración del proyecto.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tivit-ink">Configuración</h1>
        <p className="mt-1 text-sm text-tivit-ink/60">
          Edita los detalles del proyecto.
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
              {success}
            </div>
          )}

          <div className="rounded-xl border border-black/5 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Información general</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Nombre del proyecto
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Código
                </label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm font-mono"
                  placeholder="Ej: PROJ-001"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Categoría Portafolio *
                </label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  required
                >
                  {CATEGORIAS_PORTAFOLIO.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-tivit-ink/50">Define la fase en el pipeline: Backlog → Evaluación → PoC → Producción.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Sector
                </label>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar sector…</option>
                  {SECTORES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/5 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Color del proyecto</h2>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`h-10 w-10 rounded-lg transition-all ${
                    form.color === color
                      ? "ring-2 ring-offset-2 ring-tivit-ink scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ background: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ background: form.color }}
              >
                <span className="text-xs font-bold">Aa</span>
              </span>
              <span className="text-sm text-tivit-ink/60">
                Vista previa del color
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-tivit-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
