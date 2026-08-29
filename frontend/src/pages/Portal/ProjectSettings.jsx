import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Save, AlertCircle, Plus, Trash2 } from "lucide-react";

const SECTORES = ["Tecnología", "Marketing", "Ventas", "Operaciones", "Recursos Humanos", "Finanzas", "Legal", "Otro"];
const CATEGORIAS_PORTAFOLIO = [
  "Backlog de Propuestas Internas",
  "Backlog de Propuestas Comerciales",
  "Evaluación técnica",
  "PoC",
  "Proyecto",
  "Producción",
];
const TIPO_PROYECTO_OPTIONS = [
  { value: "interno", label: "Interno" },
  { value: "comercial", label: "Comercial" },
];
const PRIORIDAD_OPTIONS = ["Alta", "Media", "Baja"];
const PAISES = [
  "Argentina", "Brasil", "Chile", "Colombia", "México", "Perú", "Uruguay",
  "Ecuador", "Venezuela", "Bolivia", "Paraguay", "Costa Rica", "Panamá",
  "Guatemala", "El Salvador", "Honduras", "Nicaragua", "República Dominicana",
  "España", "Estados Unidos", "Portugal",
];
const COLORES = [
  "#dc2626", "#ea580c", "#d97706", "#65a30d", "#16a34a",
  "#0d9488", "#0891b2", "#2563eb", "#7c3aed", "#c026d3",
  "#db2777", "#475569"
];
const TSHIRT_OPTIONS = [
  { value: "S", label: "S", desc: "< 2 semanas" },
  { value: "M", label: "M", desc: "2-4 semanas" },
  { value: "L", label: "L", desc: "1-2 meses" },
  { value: "XL", label: "XL", desc: "> 2 meses" },
];
const MONEDAS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "CLP", label: "CLP" },
  { value: "BRL", label: "BRL" },
  { value: "MXN", label: "MXN" },
  { value: "ARS", label: "ARS" },
  { value: "COP", label: "COP" },
];
const ESTADO_DEV_PROYECTO = ["Planeamiento", "Desarrollo", "Desplegado"];
const ESTADO_ACEPTACION_OPTIONS = ["Pendiente", "Aprobado", "Rechazado"];
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
    color: "#dc2626",
    tipo_proyecto: "interno",
    portfolio_data: {},
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (project) {
      const portfolioData = parsePortfolioData(project.portfolio_data);
      setForm({
        name: project.name || "",
        code: project.code || "",
        description: project.description || "",
        sector: project.sector || "",
        categoria: project.categoria || "Proyecto",
        color: project.color || "#dc2626",
        tipo_proyecto: project.tipo_proyecto || "interno",
        portfolio_data: portfolioData,
      });
    }
  }, [project]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updatePortfolioData(field, value) {
    setForm((f) => ({
      ...f,
      portfolio_data: { ...f.portfolio_data, [field]: value },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        name: form.name,
        code: form.code,
        description: form.description,
        sector: form.sector,
        categoria: form.categoria,
        color: form.color,
        tipo_proyecto: form.tipo_proyecto,
        portfolio_data: JSON.stringify(form.portfolio_data),
      };

      const updated = await api.updateProject(project.id, payload);
      setProject(updated);
      setSuccess("Cambios guardados correctamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const currentStage = form.stage || form.categoria;
  const isEvaluacionTecnica = currentStage === "Evaluación técnica";
  const isPoC = currentStage === "PoC";
  const isProyecto = currentStage === "Proyecto";
  const isProduccion = currentStage === "Producción";

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
          Edita todos los detalles del proyecto.
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
            <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Información General</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Nombre del proyecto
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
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
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm font-mono"
                  placeholder="Ej: IA-001"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Tipo de Proyecto
                  </label>
                  <select
                    value={form.tipo_proyecto}
                    onChange={(e) => updateField("tipo_proyecto", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  >
                    {TIPO_PROYECTO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Categoría Portafolio
                  </label>
                  <select
                    value={form.categoria}
                    onChange={(e) => updateField("categoria", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  >
                    {CATEGORIAS_PORTAFOLIO.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Sector
                  </label>
                  <select
                    value={form.sector}
                    onChange={(e) => updateField("sector", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar sector…</option>
                    {SECTORES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Prioridad / Urgencia
                  </label>
                  <select
                    value={form.portfolio_data.prioridad || ""}
                    onChange={(e) => updatePortfolioData("prioridad", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar…</option>
                    {PRIORIDAD_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/5 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Detalles del Proyecto</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Nombre de la Idea/Proyecto
                </label>
                <input
                  type="text"
                  value={form.portfolio_data.nombre_idea || ""}
                  onChange={(e) => updatePortfolioData("nombre_idea", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="Título corto y descriptivo"
                />
              </div>

              {form.tipo_proyecto === "interno" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Área
                  </label>
                  <input
                    type="text"
                    value={form.portfolio_data.area || ""}
                    onChange={(e) => updatePortfolioData("area", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Ej: Operaciones, TI, Comercial"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={form.portfolio_data.cliente || ""}
                    onChange={(e) => updatePortfolioData("cliente", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Nombre del cliente"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Usuario Interesado
                </label>
                <input
                  type="text"
                  value={form.portfolio_data.usuario_interesado || ""}
                  onChange={(e) => updatePortfolioData("usuario_interesado", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="Escribir nombre del usuario interesado"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Rol del Usuario Interesado
                  </label>
                  <input
                    type="text"
                    value={form.portfolio_data.rol_interesado || ""}
                    onChange={(e) => updatePortfolioData("rol_interesado", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Escribir rol manualmente"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Correo del Usuario Interesado
                  </label>
                  <input
                    type="email"
                    value={form.portfolio_data.correo_interesado || ""}
                    onChange={(e) => updatePortfolioData("correo_interesado", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="correo@empresa.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Descripción del Problema/Necesidad
                </label>
                <textarea
                  value={form.portfolio_data.descripcion_problema || ""}
                  onChange={(e) => updatePortfolioData("descripcion_problema", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="¿Qué problema resuelve? Solo negocio, no tecnología aún"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Valor Esperado (ROI / Impacto)
                </label>
                <textarea
                  value={form.portfolio_data.valor_esperado || ""}
                  onChange={(e) => updatePortfolioData("valor_esperado", e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="¿Genera ingresos, ahorra horas, reduce costos, mitiga riesgos?"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    País
                  </label>
                  <select
                    value={form.portfolio_data.country || ""}
                    onChange={(e) => updatePortfolioData("country", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar país…</option>
                    {PAISES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Documentación Drive
                  </label>
                  <input
                    type="url"
                    value={form.portfolio_data.documentacion_drive || ""}
                    onChange={(e) => updatePortfolioData("documentacion_drive", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>
            </div>
          </div>

          {isEvaluacionTecnica && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-6">
              <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Información de Evaluación Técnica</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Ingeniero Encargado
                  </label>
                  <input
                    type="text"
                    value={form.portfolio_data.ingeniero_encargado || ""}
                    onChange={(e) => updatePortfolioData("ingeniero_encargado", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Nombre del ingeniero encargado"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Estimación T-Shirt Size
                  </label>
                  <div className="mt-2 flex gap-2">
                    {TSHIRT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updatePortfolioData("tshirt", opt.value)}
                        className={`flex-1 rounded-lg border py-2 px-3 text-center text-sm font-medium transition ${
                          form.portfolio_data.tshirt === opt.value
                            ? "border-tivit-red bg-tivit-red/10 text-tivit-red"
                            : "border-black/10 bg-white text-tivit-ink/60 hover:border-tivit-red/30"
                        }`}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-xs opacity-60">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  {form.portfolio_data.tshirt && (
                    <p className="mt-1 text-xs text-tivit-ink/50">
                      Tamaño seleccionado: {form.portfolio_data.tshirt}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Riesgos y Dependencias
                  </label>
                  <textarea
                    value={form.portfolio_data.riesgos_dependencias || ""}
                    onChange={(e) => updatePortfolioData("riesgos_dependencias", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="¿Dependemos de terceros? ¿Consideraciones de seguridad? ¿Integraciones críticas?"
                  />
                </div>
              </div>
            </div>
          )}

          {isPoC && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-6">
              <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Información de PoC</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Hipótesis a Validar
                  </label>
                  <textarea
                    value={form.portfolio_data.hipotesis || ""}
                    onChange={(e) => updatePortfolioData("hipotesis", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Ej: La API responderá en menos de 2 segundos"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Criterios de Éxito
                  </label>
                  <textarea
                    value={form.portfolio_data.criterios_exito || ""}
                    onChange={(e) => updatePortfolioData("criterios_exito", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Definir los criterios que validarán el éxito del PoC"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-tivit-ink">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={form.portfolio_data.fecha_inicio || ""}
                      onChange={(e) => updatePortfolioData("fecha_inicio", e.target.value)}
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-tivit-ink">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      value={form.portfolio_data.fecha_fin || ""}
                      onChange={(e) => updatePortfolioData("fecha_fin", e.target.value)}
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Recursos Involucrados
                  </label>
                  <input
                    type="text"
                    value={form.portfolio_data.recursos || ""}
                    onChange={(e) => updatePortfolioData("recursos", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Nombres de los recursos involucrados"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Resultados / Hallazgos
                  </label>
                  <textarea
                    value={form.portfolio_data.resultados || ""}
                    onChange={(e) => updatePortfolioData("resultados", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Documentar los resultados y hallazgos del PoC"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Sponsor Aprueba
                  </label>
                  <input
                    type="text"
                    value={form.portfolio_data.sponsor_aprueba || ""}
                    onChange={(e) => updatePortfolioData("sponsor_aprueba", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Nombre de quien aprueba el PoC"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-tivit-ink">
                    Documentación Drive
                  </label>
                  <input
                    type="url"
                    value={form.portfolio_data.documentacion_drive || ""}
                    onChange={(e) => updatePortfolioData("documentacion_drive", e.target.value)}
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          {isProyecto && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-6 space-y-5">
              <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Información del Proyecto</h2>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Project Manager / Scrum Master
                </label>
                <input
                  type="text"
                  value={form.portfolio_data.pm_scrum_master || ""}
                  onChange={(e) => updatePortfolioData("pm_scrum_master", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="Nombre del PM/Scrum Master"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Presupuesto
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.portfolio_data.moneda || "USD"}
                    onChange={(e) => updatePortfolioData("moneda", e.target.value)}
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm w-24"
                  >
                    {MONEDAS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={form.portfolio_data.presupuesto || ""}
                    onChange={(e) => updatePortfolioData("presupuesto", e.target.value)}
                    className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Monto del presupuesto"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-tivit-ink">Cronograma</h3>

                <div>
                  <label className="mb-1 block text-xs font-medium text-tivit-ink/60">
                    Número de Sprints
                  </label>
                  <input
                    type="number"
                    value={(() => {
                      try {
                        const c = typeof form.portfolio_data.cronograma === 'string'
                          ? JSON.parse(form.portfolio_data.cronograma)
                          : form.portfolio_data.cronograma;
                        return c?.num_sprints || "";
                      } catch { return ""; }
                    })()}
                    onChange={(e) => {
                      const current = (() => {
                        try {
                          const c = typeof form.portfolio_data.cronograma === 'string'
                            ? JSON.parse(form.portfolio_data.cronograma)
                            : form.portfolio_data.cronograma;
                          return c || {};
                        } catch { return {}; }
                      })();
                      updatePortfolioData("cronograma", JSON.stringify({ ...current, num_sprints: e.target.value }));
                    }}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                    placeholder="Ej: 4"
                    min="1"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-tivit-ink/60">
                    Objetivo Principal
                  </label>
                  <input
                    type="text"
                    value={(() => {
                      try {
                        const c = typeof form.portfolio_data.cronograma === 'string'
                          ? JSON.parse(form.portfolio_data.cronograma)
                          : form.portfolio_data.cronograma;
                        return c?.objetivo || "";
                      } catch { return ""; }
                    })()}
                    onChange={(e) => {
                      const current = (() => {
                        try {
                          const c = typeof form.portfolio_data.cronograma === 'string'
                            ? JSON.parse(form.portfolio_data.cronograma)
                            : form.portfolio_data.cronograma;
                          return c || {};
                        } catch { return {}; }
                      })();
                      updatePortfolioData("cronograma", JSON.stringify({ ...current, objetivo: e.target.value }));
                    }}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                    placeholder="Objetivo principal del proyecto"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-tivit-ink/60">
                    Documentación (URL)
                  </label>
                  <input
                    type="url"
                    value={form.portfolio_data.documentacion || ""}
                    onChange={(e) => updatePortfolioData("documentacion", e.target.value)}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Estado de Desarrollo
                </label>
                <select
                  value={form.portfolio_data.estado_dev || "Planeamiento"}
                  onChange={(e) => updatePortfolioData("estado_dev", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                >
                  {ESTADO_DEV_PROYECTO.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-green-100 bg-green-50/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-tivit-ink">Equipo del Proyecto</h3>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const eq = typeof form.portfolio_data.equipo === 'string'
                        ? JSON.parse(form.portfolio_data.equipo)
                        : form.portfolio_data.equipo;
                      return Array.isArray(eq) ? eq : [];
                    } catch { return []; }
                  })().map((miembro, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={miembro.usuario_id || ""}
                        onChange={(e) => {
                          const current = (() => {
                            try {
                              const eq = typeof form.portfolio_data.equipo === 'string'
                                ? JSON.parse(form.portfolio_data.equipo)
                                : form.portfolio_data.equipo;
                              return Array.isArray(eq) ? eq : [];
                            } catch { return []; }
                          })();
                          current[i] = { ...current[i], usuario_id: e.target.value };
                          updatePortfolioData("equipo", JSON.stringify(current));
                        }}
                        className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                        placeholder="Usuario"
                      />
                      <select
                        value={miembro.rol || ""}
                        onChange={(e) => {
                          const current = (() => {
                            try {
                              const eq = typeof form.portfolio_data.equipo === 'string'
                                ? JSON.parse(form.portfolio_data.equipo)
                                : form.portfolio_data.equipo;
                              return Array.isArray(eq) ? eq : [];
                            } catch { return []; }
                          })();
                          current[i] = { ...current[i], rol: e.target.value };
                          updatePortfolioData("equipo", JSON.stringify(current));
                        }}
                        className="w-32 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Rol…</option>
                        {ROLES_EQUIPO.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const current = (() => {
                        try {
                          const eq = typeof form.portfolio_data.equipo === 'string'
                            ? JSON.parse(form.portfolio_data.equipo)
                            : form.portfolio_data.equipo;
                          return Array.isArray(eq) ? eq : [];
                        } catch { return []; }
                      })();
                      updatePortfolioData("equipo", JSON.stringify([...current, { usuario_id: "", rol: "" }]));
                    }}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
                  >
                    <Plus className="h-3 w-3" /> Agregar miembro
                  </button>
                </div>
              </div>
            </div>
          )}

          {isProduccion && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-6 space-y-4">
              <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Información de Producción</h2>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Fecha Deploy Producción
                </label>
                <input
                  type="date"
                  value={form.portfolio_data.fecha_deploy || ""}
                  onChange={(e) => updatePortfolioData("fecha_deploy", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  URL Producción
                </label>
                <input
                  type="url"
                  value={form.portfolio_data.url_produccion || ""}
                  onChange={(e) => updatePortfolioData("url_produccion", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Estado de Aceptación
                </label>
                <select
                  value={form.portfolio_data.estado_aceptacion || "Pendiente"}
                  onChange={(e) => updatePortfolioData("estado_aceptacion", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                >
                  {ESTADO_ACEPTACION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Notas Release
                </label>
                <textarea
                  value={form.portfolio_data.notas_release || ""}
                  onChange={(e) => updatePortfolioData("notas_release", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="Changelog, lecciones aprendidas, observaciones..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-tivit-ink">
                  Documentación Final
                </label>
                <input
                  type="url"
                  value={form.portfolio_data.documentacion_final || ""}
                  onChange={(e) => updatePortfolioData("documentacion_final", e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-black/5 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-tivit-ink">Color del Proyecto</h2>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateField("color", color)}
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
