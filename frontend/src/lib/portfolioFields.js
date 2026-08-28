// Portafolio 5 etapas — fuente única profesional para formularios y validación
// Cada etapa tiene campos clave, tipos, opciones y criterios de salida
export const STAGES = ["Backlog", "Evaluación técnica", "PoC", "Proyecto", "Producción"];
export const STAGE_CLOSED = "Cerrado";

export const STAGE_COLORS = {
  "Backlog": "bg-slate-100 text-slate-700 border-slate-200",
  "Evaluación técnica": "bg-amber-50 text-amber-700 border-amber-200",
  "PoC": "bg-purple-50 text-purple-700 border-purple-200",
  "Proyecto": "bg-blue-50 text-blue-700 border-blue-200",
  "Producción": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Cerrado": "bg-gray-100 text-gray-600 border-gray-200",
};
export const STAGE_DOT = {
  "Backlog": "bg-slate-400",
  "Evaluación técnica": "bg-amber-500",
  "PoC": "bg-purple-500",
  "Proyecto": "bg-blue-500",
  "Producción": "bg-emerald-500",
  "Cerrado": "bg-gray-400",
};

export const FIELD_DEFS = {
  Backlog: [
    { key: "nombre_idea", label: "Nombre de la Idea/Proyecto", type: "text", required: true, placeholder: "Título corto y descriptivo" },
    { key: "tipo_proyecto", label: "Tipo de Proyecto", type: "select", required: true, options: ["interno","comercial"], map: { interno: "Interno", comercial: "Comercial" } },
    { key: "area", label: "Área (si es Interno)", type: "text", placeholder: "Ej: Operaciones, TI, Comercial", showIf: (d) => d.tipo_proyecto === "interno" || !d.tipo_proyecto },
    { key: "cliente", label: "Cliente (si es Externo/Comercial)", type: "text", placeholder: "Nombre del cliente", showIf: (d) => d.tipo_proyecto === "comercial" },
    { key: "codigo_numero", label: "Código IA (solo número, se genera IA-XXX)", type: "text", placeholder: "Ej: 001", help: "Se guarda como IA-001" },
    { key: "usuario_interesado", label: "Usuario Interesado", type: "text", placeholder: "Escribir nombre del usuario interesado" },
    { key: "rol_interesado", label: "Rol del Usuario Interesado", type: "text", placeholder: "Escribir rol manualmente (ej: Jefe de Operaciones)" },
    { key: "correo_interesado", label: "Correo del Usuario Interesado", type: "text", placeholder: "correo@empresa.com" },
    { key: "descripcion_problema", label: "Descripción del Problema/Necesidad", type: "textarea", required: true, placeholder: "¿Qué problema resuelve? Solo negocio, no tecnología aún" },
    { key: "valor_esperado", label: "Valor Esperado (ROI / Impacto)", type: "textarea", placeholder: "¿Genera ingresos, ahorra horas, reduce costos, mitiga riesgos?" },
    { key: "prioridad", label: "Prioridad / Urgencia", type: "select", options: ["Alta","Media","Baja"] },
    { key: "documentacion_drive", label: "Documentación Drive", type: "text", placeholder: "Pegar link de Drive (https://drive.google.com/...)", help: "Drive de la documentación" },
  ],
  "Evaluación técnica": [
    { key: "lider_tecnico", label: "Líder Técnico Asignado", type: "user", required: true },
    { key: "arquitectura_propuesta", label: "Arquitectura / Tecnología Propuesta", type: "textarea", placeholder: "App móvil, API, RPA..." },
    { key: "tshirt", label: "Estimación T-Shirt Size", type: "select", required: true, options: ["S","M","L","XL"], help: "S <2sem, M 2-4sem, L 1-2mes, XL >2mes" },
    { key: "riesgos_dependencias", label: "Riesgos y Dependencias", type: "textarea", placeholder: "¿Dependemos de terceros? ¿Seguridad?" },
    { key: "complejidad", label: "Complejidad Técnica", type: "select", options: ["Alta","Media","Baja"] },
    { key: "decision_tecnica", label: "Decisión Técnica", type: "select", options: ["Aprobado para PoC","Rechazado","Requiere cambios"] },
    { key: "skip_poc_justificacion", label: "Justificación skip PoC (si Baja)", type: "textarea", showIf: (d) => d.complejidad === "Baja" },
  ],
  "PoC": [
    { key: "hipotesis", label: "Hipótesis a Validar", type: "textarea", required: true, placeholder: "Ej: API responde <2s" },
    { key: "criterios_exito", label: "Criterios de Éxito", type: "textarea", required: true },
    { key: "fecha_inicio", label: "Fecha de Inicio", type: "date" },
    { key: "fecha_fin", label: "Fecha de Fin", type: "date", help: "Timebox máx 2-3 semanas" },
    { key: "recursos", label: "Recursos Involucrados", type: "users" },
    { key: "resultados", label: "Resultados / Hallazgos", type: "textarea" },
    { key: "decision_go_nogo", label: "Decisión Ejecutiva (Go/No-Go)", type: "select", options: ["Go","No-Go"] },
    { key: "sponsor_aprobado", label: "Sponsor aprueba Go", type: "boolean" },
    { key: "comite_aprobado", label: "Comité aprueba Go", type: "boolean" },
  ],
  "Proyecto": [
    { key: "pm_scrum_master", label: "Project Manager / Scrum Master", type: "user" },
    { key: "presupuesto", label: "Presupuesto", type: "number" },
    { key: "cronograma_hitos", label: "Cronograma Hitos (JSON)", type: "textarea", placeholder: '[{"hito":"M1","fecha":"2026-09-01"}]' },
    { key: "estado_dev", label: "Estado de Desarrollo", type: "select", options: ["To Do","In Progress","Code Review","Testing"] },
    { key: "metricas_qa", label: "Métricas de Calidad (QA)", type: "textarea" },
    { key: "uat_aprobado", label: "UAT Aprobado", type: "boolean" },
    { key: "uat_tester", label: "Tester UAT", type: "user" },
    { key: "qa_aprobado", label: "QA Aprobado", type: "boolean" },
    { key: "documentacion", label: "Documentación (URL)", type: "text" },
  ],
  "Producción": [
    { key: "fecha_go_live", label: "Fecha de Despliegue (Go-Live)", type: "date", required: true },
    { key: "responsable_produccion", label: "Responsable de Producción", type: "user" },
    { key: "hypercare_inicio", label: "Hypercare Inicio", type: "date" },
    { key: "hypercare_fin", label: "Hypercare Fin", type: "date" },
    { key: "incidencias", label: "Incidencias en Producción (conteo)", type: "number" },
    { key: "metricas_adopcion", label: "Métricas de Adopción", type: "textarea", placeholder: "Usuarios activos, etc." },
    { key: "acta_cierre", label: "Acta de Cierre firmada", type: "boolean" },
    { key: "soporte_capacitado", label: "Soporte capacitado", type: "boolean" },
  ],
};

export function getNextStages(current) {
  const map = {
    "Backlog": ["Evaluación técnica"],
    "Evaluación técnica": ["PoC", "Proyecto"],
    "PoC": ["Proyecto"],
    "Proyecto": ["Producción"],
    "Producción": ["Cerrado"],
    "Cerrado": [],
  };
  return map[current] || [];
}

export function canSkipPoc(data) {
  return data.complejidad === "Baja";
}

// Validación salida por etapa (misma lógica que backend can_transition)
export function validateExitCriteria(stage, data, sponsorId) {
  const errors = [];
  if (stage === "Backlog") {
    if (!data.descripcion_problema && !data.valor_esperado) errors.push("Falta descripcion_problema o valor_esperado");
    if (!sponsorId && !data.sponsor_aprobado) errors.push("Sponsor no aprobado");
  }
  if (stage === "Evaluación técnica") {
    if (!data.lider_tecnico) errors.push("Falta líder técnico");
    if (!["S","M","L","XL"].includes(data.tshirt)) errors.push("Falta tshirt S/M/L/XL");
  }
  if (stage === "PoC") {
    if (data.decision_go_nogo !== "Go") errors.push("PoC requiere Go");
    if (!data.sponsor_aprobado) errors.push("Falta sponsor_aprobado");
    if (!data.comite_aprobado) errors.push("Falta comite_aprobado");
  }
  if (stage === "Proyecto") {
    if (!data.qa_aprobado) errors.push("Falta qa_aprobado");
    if (!data.uat_aprobado) errors.push("Falta uat_aprobado");
  }
  return errors;
}
