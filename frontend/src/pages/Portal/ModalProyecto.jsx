import { useEffect, useState } from "react";
import { X, ArrowRight, AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";

const MONEDAS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "CLP", label: "CLP" },
  { value: "BRL", label: "BRL" },
  { value: "MXN", label: "MXN" },
  { value: "ARS", label: "ARS" },
  { value: "COP", label: "COP" },
];
const ESTADO_DEV_OPTIONS = ["Planeamiento", "Desarrollo", "Desplegado"];
const ROLES_EQUIPO = ["Dev", "QA", "Designer", "DevOps", "Tech Lead", "Architect"];

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

function stringifyCronograma(cronograma) {
  if (typeof cronograma === 'string') return cronograma;
  if (typeof cronograma === 'object' && cronograma !== null) return JSON.stringify(cronograma);
  return "";
}

export function ModalProyecto({ isOpen, onClose, project, onSuccess }) {
  const [form, setForm] = useState({
    pm_scrum_master: "",
    moneda: "USD",
    presupuesto: "",
    cronograma: {
      num_sprints: "",
      objetivo: "",
      objetivos_secundarios: [""],
      sprints: [{ num: 1, tareas: [""] }],
    },
    estado_dev: "Planeamiento",
    documentacion: "",
    equipo: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      api.users().then((resp) => {
        setUsers(Array.isArray(resp) ? resp : (resp?.items || []));
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && project) {
      const pData = parsePortfolioData(project.portfolio_data);
      let cronogramaObj = { num_sprints: "", objetivo: "", objetivos_secundarios: [""], sprints: [{ num: 1, tareas: [""] }] };
      if (pData.cronograma) {
        if (typeof pData.cronograma === 'string') {
          try {
            cronogramaObj = JSON.parse(pData.cronograma);
          } catch {
            cronogramaObj = { num_sprints: "", objetivo: pData.cronograma, objetivos_secundarios: [""], sprints: [{ num: 1, tareas: [""] }] };
          }
        } else {
          cronogramaObj = pData.cronograma;
        }
      }
      setForm({
        pm_scrum_master: pData.pm_scrum_master || "",
        moneda: pData.moneda || "USD",
        presupuesto: pData.presupuesto || "",
        cronograma: cronogramaObj,
        estado_dev: pData.estado_dev || "Planeamiento",
        documentacion: pData.documentacion || "",
        equipo: pData.equipo || [],
      });
    }
  }, [isOpen, project]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateCronogramaField(key, value) {
    setForm((f) => ({
      ...f,
      cronograma: { ...f.cronograma, [key]: value },
    }));
  }

  function addObjetivo() {
    setForm((f) => ({
      ...f,
      cronograma: {
        ...f.cronograma,
        objetivos_secundarios: [...f.cronograma.objetivos_secundarios, ""],
      },
    }));
  }

  function updateObjetivo(index, value) {
    const newObj = [...form.cronograma.objetivos_secundarios];
    newObj[index] = value;
    setForm((f) => ({
      ...f,
      cronograma: { ...f.cronograma, objetivos_secundarios: newObj },
    }));
  }

  function removeObjetivo(index) {
    const newObj = form.cronograma.objetivos_secundarios.filter((_, i) => i !== index);
    setForm((f) => ({
      ...f,
      cronograma: { ...f.cronograma, objetivos_secundarios: newObj },
    }));
  }

  function addSprint() {
    const nextNum = form.cronograma.sprints.length + 1;
    setForm((f) => ({
      ...f,
      cronograma: {
        ...f.cronograma,
        sprints: [...f.cronograma.sprints, { num: nextNum, tareas: [""] }],
      },
    }));
  }

  function updateSprint(index, field, value) {
    const newSprints = [...form.cronograma.sprints];
    newSprints[index] = { ...newSprints[index], [field]: value };
    setForm((f) => ({
      ...f,
      cronograma: { ...f.cronograma, sprints: newSprints },
    }));
  }

  function addTarea(sprintIndex) {
    const newSprints = [...form.cronograma.sprints];
    newSprints[sprintIndex] = {
      ...newSprints[sprintIndex],
      tareas: [...newSprints[sprintIndex].tareas, ""],
    };
    setForm((f) => ({
      ...f,
      cronograma: { ...f.cronograma, sprints: newSprints },
    }));
  }

  function updateTarea(sprintIndex, tareaIndex, value) {
    const newSprints = [...form.cronograma.sprints];
    const newTareas = [...newSprints[sprintIndex].tareas];
    newTareas[tareaIndex] = value;
    newSprints[sprintIndex] = { ...newSprints[sprintIndex], tareas: newTareas };
    setForm((f) => ({
      ...f,
      cronograma: { ...f.cronograma, sprints: newSprints },
    }));
  }

  function removeTarea(sprintIndex, tareaIndex) {
    const newSprints = [...form.cronograma.sprints];
    const newTareas = newSprints[sprintIndex].tareas.filter((_, i) => i !== tareaIndex);
    newSprints[sprintIndex] = { ...newSprints[sprintIndex], tareas: newTareas };
    setForm((f) => ({
      ...f,
      cronograma: { ...f.cronograma, sprints: newSprints },
    }));
  }

  function removeSprint(index) {
    const newSprints = form.cronograma.sprints.filter((_, i) => i !== index);
    newSprints.forEach((s, i) => { s.num = i + 1; });
    setForm((f) => ({
      ...f,
      cronograma: { ...f.cronograma, sprints: newSprints },
    }));
  }

  function addMiembro() {
    setForm((f) => ({
      ...f,
      equipo: [...f.equipo, { usuario_id: "", rol: "" }],
    }));
  }

  function updateMiembro(index, field, value) {
    const newEquipo = [...form.equipo];
    newEquipo[index] = { ...newEquipo[index], [field]: value };
    setForm((f) => ({ ...f, equipo: newEquipo }));
  }

  function removeMiembro(index) {
    const newEquipo = form.equipo.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, equipo: newEquipo }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      const pData = parsePortfolioData(project.portfolio_data);
      const updatedPortfolioData = {
        ...pData,
        pm_scrum_master: form.pm_scrum_master,
        moneda: form.moneda,
        presupuesto: form.presupuesto,
        cronograma: JSON.stringify(form.cronograma),
        estado_dev: form.estado_dev,
        documentacion: form.documentacion,
        equipo: form.equipo,
      };

      await api.updateProject(project.id, {
        stage: "Proyecto",
        categoria: "Proyecto",
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
            <h2 className="text-lg font-semibold text-tivit-ink">Mover a Proyecto</h2>
            <p className="mt-0.5 text-sm text-tivit-ink/50">Completa la información del Proyecto</p>
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
                Project Manager / Scrum Master
              </label>
              <input
                type="text"
                value={form.pm_scrum_master}
                onChange={(e) => updateField("pm_scrum_master", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                placeholder="Nombre del PM/Scrum Master"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Presupuesto
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  value={form.moneda}
                  onChange={(e) => updateField("moneda", e.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20 w-24"
                >
                  {MONEDAS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={form.presupuesto}
                  onChange={(e) => updateField("presupuesto", e.target.value)}
                  className="flex-1 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                  placeholder="Monto del presupuesto"
                />
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-tivit-ink">Cronograma</h3>

              <div>
                <label className="text-xs font-medium text-tivit-ink/60">
                  Número de Sprints
                </label>
                <input
                  type="number"
                  value={form.cronograma.num_sprints}
                  onChange={(e) => updateCronogramaField("num_sprints", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="Ej: 4"
                  min="1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-tivit-ink/60">
                  Objetivo Principal
                </label>
                <input
                  type="text"
                  value={form.cronograma.objetivo}
                  onChange={(e) => updateCronogramaField("objetivo", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="Objetivo principal del proyecto"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-tivit-ink/60">
                  Objetivos Secundarios
                </label>
                <div className="mt-1 space-y-2">
                  {form.cronograma.objetivos_secundarios.map((obj, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => updateObjetivo(i, e.target.value)}
                        className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                        placeholder={`Objetivo secundario ${i + 1}`}
                      />
                      {form.cronograma.objetivos_secundarios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjetivo(i)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addObjetivo}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-3 w-3" /> Agregar objetivo secundario
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-tivit-ink/60">
                  Sprints y Tareas
                </label>
                <div className="mt-1 space-y-3">
                  {form.cronograma.sprints.map((sprint, sprintIndex) => (
                    <div key={sprintIndex} className="rounded-lg border border-blue-200 bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-tivit-ink">Sprint {sprint.num}</span>
                        {form.cronograma.sprints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSprint(sprintIndex)}
                            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-500 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {sprint.tareas.map((tarea, tareaIndex) => (
                          <div key={tareaIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={tarea}
                              onChange={(e) => updateTarea(sprintIndex, tareaIndex, e.target.value)}
                              className="flex-1 rounded border border-black/10 bg-gray-50 px-2 py-1.5 text-xs"
                              placeholder={`Tarea ${tareaIndex + 1}`}
                            />
                            {sprint.tareas.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTarea(sprintIndex, tareaIndex)}
                                className="rounded border border-red-200 bg-red-50 px-1.5 py-1 text-red-500 hover:bg-red-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addTarea(sprintIndex)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-3 w-3" /> Agregar tarea
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSprint}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-3 w-3" /> Agregar Sprint
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Estado de Desarrollo
              </label>
              <select
                value={form.estado_dev}
                onChange={(e) => updateField("estado_dev", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
              >
                {ESTADO_DEV_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50/30 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-tivit-ink">Equipo del Proyecto</h3>
              <div className="space-y-2">
                {form.equipo.map((miembro, i) => (
                  <div key={i} className="flex gap-2">
                    <select
                      value={miembro.usuario_id}
                      onChange={(e) => updateMiembro(i, "usuario_id", e.target.value)}
                      className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar usuario…</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <select
                      value={miembro.rol}
                      onChange={(e) => updateMiembro(i, "rol", e.target.value)}
                      className="w-32 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Rol…</option>
                      {ROLES_EQUIPO.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMiembro(i)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMiembro}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
                >
                  <Plus className="h-3 w-3" /> Agregar miembro
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-tivit-ink">
                Documentación (URL)
              </label>
              <input
                type="url"
                value={form.documentacion}
                onChange={(e) => updateField("documentacion", e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
                placeholder="https://..."
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
                  Guardar y Mover a Proyecto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
