import { UserPlus, X } from "lucide-react";
import { STAGES, STAGE_COLORS, FIELD_DEFS, PAISES } from "../../../lib/portfolioFields";
import { PROJECT_COLORS, PORTFOLIO_CATEGORIAS } from "../../../lib/portfolioUtils.js";

/**
 * ProjectForm — formulario de creación (y base para edición) del portafolio.
 * Extraído de Projects.jsx god-component para reducir duplicación Backlog.
 * Mantiene misma lógica de updatePortfolioField / cleanForm delegada al padre.
 * No toca estilos responsivos críticos: solo encapsula.
 */

const ROLE_LABELS = {
  lead: "Lead",
  arquitecto: "Arquitecto",
  dev: "Desarrollador",
  design: "Diseño",
  qa: "QA",
  viewer: "Visualizador",
};
const ROLE_COLORS = {
  lead: "bg-tivit-red/10 text-tivit-red",
  arquitecto: "bg-amber-100 text-amber-700",
  dev: "bg-blue-100 text-blue-700",
  design: "bg-pink-100 text-pink-700",
  qa: "bg-emerald-100 text-emerald-700",
  viewer: "bg-gray-100 text-gray-600",
};

// Reusable Backlog fields to avoid duplication (usado en create y edit)
function BacklogFields({
  form,
  setForm,
  getPortfolioField,
  updatePortfolioField,
  inputClass,
  // eslint-disable-next-line no-unused-vars
  allUsers,
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Stage
          <select value={form.stage} onChange={(e) => {
            const newStage = e.target.value;
            const newTipo = form.tipo_proyecto;
            let autoCat = form.categoria;
            if (newStage === "Backlog") autoCat = newTipo === "comercial" ? "Backlog de Propuestas Comerciales" : "Backlog de Propuestas Internas";
            else autoCat = newStage;
            setForm({ ...form, stage: newStage, categoria: autoCat });
          }} className={inputClass} required>
            {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Tipo de Proyecto *
          <select value={form.tipo_proyecto} onChange={(e) => {
            const newTipo = e.target.value;
            const autoCat = form.stage === "Backlog" ? (newTipo === "comercial" ? "Backlog de Propuestas Comerciales" : "Backlog de Propuestas Internas") : form.categoria;
            setForm({ ...form, tipo_proyecto: newTipo, categoria: autoCat });
            updatePortfolioField("tipo_proyecto", newTipo);
          }} className={inputClass} required>
            <option value="interno">Interno</option>
            <option value="comercial">Comercial</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Código
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-tivit-ink px-2.5 py-2.5 text-xs font-bold text-white">IA-</span>
            <input className={inputClass} placeholder="001" value={form.code.startsWith("IA-") ? form.code.slice(3) : form.code} onChange={(e) => {
              const num = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
              setForm({ ...form, code: num ? `IA-${num}` : "" });
            }} maxLength={6} />
          </div>
          <span className="text-[10px] text-tivit-ink/50">Se guarda como {form.code || "IA-XXX"}</span>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Nombre de la Idea/Proyecto *
        <input className={inputClass} placeholder="Título corto y descriptivo" value={form.portfolio_data?.nombre_idea || form.name} onChange={(e) => { updatePortfolioField("nombre_idea", e.target.value); setForm(prev => ({ ...prev, name: e.target.value })); }} required maxLength={100} />
      </label>

      {form.tipo_proyecto === "interno" ? (
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Área *
          <input className={inputClass} placeholder="Ej: Operaciones, TI, Comercial" value={getPortfolioField("area")} onChange={(e)=>updatePortfolioField("area", e.target.value)} />
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Cliente *
          <input className={inputClass} placeholder="Nombre del cliente" value={getPortfolioField("cliente")} onChange={(e)=>updatePortfolioField("cliente", e.target.value)} />
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Usuario Interesado
          <input className={inputClass} placeholder="Escribir nombre del usuario interesado" value={getPortfolioField("usuario_interesado")} onChange={(e)=>updatePortfolioField("usuario_interesado", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Rol del Usuario Interesado
          <input className={inputClass} placeholder="Escribir rol manualmente" value={getPortfolioField("rol_interesado")} onChange={(e)=>updatePortfolioField("rol_interesado", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Correo del Usuario Interesado
          <input className={inputClass} placeholder="correo@empresa.com" value={getPortfolioField("correo_interesado")} onChange={(e)=>updatePortfolioField("correo_interesado", e.target.value)} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Descripción del Problema/Necesidad *
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="¿Qué problema resuelve? Solo negocio, no tecnología aún" value={getPortfolioField("descripcion_problema")} onChange={(e)=>updatePortfolioField("descripcion_problema", e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Valor Esperado (ROI / Impacto)
        <textarea className={`${inputClass} min-h-[60px] resize-y`} placeholder="¿Genera ingresos, ahorra horas, reduce costos, mitiga riesgos?" value={getPortfolioField("valor_esperado")} onChange={(e)=>updatePortfolioField("valor_esperado", e.target.value)} />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Prioridad / Urgencia
          <select className={inputClass} value={getPortfolioField("prioridad")} onChange={(e)=>updatePortfolioField("prioridad", e.target.value)}>
            <option value="">Seleccionar…</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">País
          <select className={inputClass} value={getPortfolioField("country") || ""} onChange={(e)=>updatePortfolioField("country", e.target.value)}>
            <option value="">Seleccionar país…</option>
            {PAISES.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">Documentación Drive
          <input className={inputClass} placeholder="https://drive.google.com/..." value={getPortfolioField("documentacion_drive")} onChange={(e)=>updatePortfolioField("documentacion_drive", e.target.value)} />
          <span className="text-[10px] text-tivit-ink/50">Pegar link de Drive</span>
        </label>
      </div>
    </div>
  );
}

function OtherStagesFields({
  form,
  setForm,
  // eslint-disable-next-line no-unused-vars
  getPortfolioField,
  updatePortfolioField,
  inputClass,
  allUsers,
}) {
  return (
    <>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
          Stage (Etapa) *
          <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={inputClass} required>
            {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
          Tipo (si Backlog)
          <select value={form.tipo_proyecto} onChange={(e) => setForm({ ...form, tipo_proyecto: e.target.value })} className={inputClass}>
            <option value="interno">Interno</option>
            <option value="comercial">Comercial</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
          Sponsor
          <select value={form.sponsor_id} onChange={(e) => setForm({ ...form, sponsor_id: e.target.value })} className={inputClass}>
            <option value="">Sin sponsor</option>
            {allUsers.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
          </select>
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
          Categoría (legado)
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputClass}>
            {PORTFOLIO_CATEGORIAS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
          Código
          <input className={inputClass} placeholder="PF-001" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={30} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
          Nombre Comercial *
          <input className={inputClass} placeholder="Portal TIVIT" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
          PO Encargado
          <select value={form.po_user_id} onChange={(e) => setForm({ ...form, po_user_id: e.target.value })} className={inputClass}>
            <option value="">Sin PO asignado</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-tivit-ink">
        Descripción
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Descripción del elemento de portafolio" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      {/* Campos dinámicos por stage profesional */}
      <div className="mt-4 rounded-xl border border-tivit-red/10 bg-tivit-red-light/20 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-tivit-ink/60">Campos de etapa: {form.stage}</h3>
        <p className="mt-1 text-xs text-tivit-ink/50">Solo los campos de esta etapa son obligatorios para avanzar. Los criterios de salida se validan al mover de columna.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(FIELD_DEFS[form.stage] || []).map((field) => {
            if (field.showIf && !field.showIf(form.portfolio_data || {})) return null;
            const val = form.portfolio_data?.[field.key] ?? "";
            if (field.type === "text") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label} {field.required && "*"}<input className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} placeholder={field.placeholder} /></label>);
            if (field.type === "textarea") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink sm:col-span-2">{field.label} {field.required && "*"}<textarea className={`${inputClass} min-h-[60px]`} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} placeholder={field.placeholder} /></label>);
            if (field.type === "select") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label} {field.required && "*"}<select className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)}><option value="">Seleccionar…</option>{field.options.map(o=><option key={o} value={o}>{field.map?.[o]||o}</option>)}</select></label>);
            if (field.type === "user") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label} {field.required && "*"}<select className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)}><option value="">Sin asignar</option>{allUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>);
            if (field.type === "users") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<select multiple className={inputClass} value={Array.isArray(val)?val:[]} onChange={(e)=>updatePortfolioField(field.key, Array.from(e.target.selectedOptions).map(o=>o.value))}>{allUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>);
            if (field.type === "boolean") return (<label key={field.key} className="flex items-center gap-2 text-xs font-medium text-tivit-ink"><input type="checkbox" checked={!!val} onChange={(e)=>updatePortfolioField(field.key, e.target.checked)} /> {field.label}</label>);
            if (field.type === "number") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="number" className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value ? Number(e.target.value) : "")} /></label>);
            if (field.type === "date") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="date" className={inputClass} value={val} onChange={(e)=>updatePortfolioField(field.key, e.target.value)} /></label>);
            if (field.type === "file") return (<label key={field.key} className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">{field.label}<input type="file" multiple className="w-full rounded-xl border border-dashed border-tivit-red-light bg-white px-3 py-2 text-xs" onChange={(e)=>updatePortfolioField(field.key, Array.from(e.target.files||[]).map(f=>f.name))} />{Array.isArray(val) && val.length>0 && <span className="text-[10px] text-tivit-ink/60">{val.join(", ")}</span>}</label>);
            return null;
          })}
        </div>
      </div>
    </>
  );
}

export function ProjectForm({
  form,
  setForm,
  updatePortfolioField,
  getPortfolioField,
  allUsers = [],
  teamSelection = [],
  setTeamSelection,
  newMember,
  setNewMember,
  saving = false,
  onSubmit,
  inputClass,
  selectClass,
}) {
  function addToTeam() {
    if (!newMember.user_id) return;
    if (teamSelection.some((s) => s.user_id === newMember.user_id)) return;
    const u = allUsers.find((u) => u.id === newMember.user_id);
    setTeamSelection((prev) => [...prev, { ...newMember, name: u?.name, email: u?.email }]);
    setNewMember({ user_id: "", role: "dev" });
  }
  function removeFromTeam(userId) {
    setTeamSelection((prev) => prev.filter((s) => s.user_id !== userId));
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-black/5 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-tivit-ink">Crear Portafolio — {form.stage}</h2>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STAGE_COLORS[form.stage]}`}>{form.stage}</span>
      </div>
      {form.stage === "Backlog" ? (
        <BacklogFields
          form={form}
          setForm={setForm}
          getPortfolioField={getPortfolioField}
          updatePortfolioField={updatePortfolioField}
          inputClass={inputClass}
          allUsers={allUsers}
        />
      ) : (
        <OtherStagesFields
          form={form}
          setForm={setForm}
          getPortfolioField={getPortfolioField}
          updatePortfolioField={updatePortfolioField}
          inputClass={inputClass}
          allUsers={allUsers}
        />
      )}
      {form.stage !== "Backlog" && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-tivit-ink/60">Color:</span>
          {PROJECT_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`h-7 w-7 rounded-full transition ${form.color === c ? "ring-2 ring-offset-2 ring-tivit-ink" : ""}`} style={{ background: c }} />
          ))}
        </div>
      )}
      {form.stage === "Backlog" && (
        <p className="mt-3 text-xs text-tivit-ink/50">Color en Backlog siempre Rojo (#dc2626) — se asigna automáticamente.</p>
      )}
      {form.stage !== "Backlog" && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">Equipo</span>
            <button type="button" onClick={addToTeam} className="flex items-center gap-1 text-xs font-semibold text-tivit-red hover:underline">
              <UserPlus className="h-3 w-3" aria-hidden="true" /> Añadir
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <select value={newMember.user_id} onChange={(e) => setNewMember({ ...newMember, user_id: e.target.value })} className={selectClass}>
              <option value="">Seleccionar usuario…</option>
              {allUsers.filter((u) => !teamSelection.some((s) => s.user_id === u.id)).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className={selectClass}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {teamSelection.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {teamSelection.map((s) => (
                <span key={s.user_id} className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs">
                  <span className="font-medium text-tivit-ink">{s.name}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[s.role]}`}>{ROLE_LABELS[s.role]}</span>
                  <button type="button" onClick={() => removeFromTeam(s.user_id)} className="ml-0.5 text-tivit-ink/40 hover:text-alert"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <button type="submit" disabled={saving} className="mt-4 rounded-full bg-tivit-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60">
        {saving ? "Creando…" : "Crear en portafolio"}
      </button>
    </form>
  );
}

export { BacklogFields, OtherStagesFields };
