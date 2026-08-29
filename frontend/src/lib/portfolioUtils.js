/**
 * Shared helpers for project/portfolio data normalization.
 * Previously duplicated across Dashboard, Projects, Sprints, etc.
 */

export function parseGoals(goal) {
  if (!goal) return [];
  if (Array.isArray(goal)) return goal.filter(Boolean);
  try {
    const parsed = JSON.parse(goal);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [String(parsed)];
  } catch {
    return [goal];
  }
}

export function parseJsonSafe(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeItem(item) {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object" && "value" in item) return String(item.value ?? "");
  return String(item);
}

export const PROJECT_COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#65a30d",
];

export const PORTFOLIO_CATEGORIAS = [
  "Backlog de Propuestas Internas",
  "Backlog de Propuestas Comerciales",
  "Evaluación técnica",
  "PoC",
  "Proyecto",
  "Producción",
];

export const CATEGORIA_COLORS = {
  "Backlog de Propuestas Internas": "bg-slate-100 text-slate-700 border-slate-200",
  "Backlog de Propuestas Comerciales": "bg-blue-50 text-blue-700 border-blue-200",
  "Evaluación técnica": "bg-amber-50 text-amber-700 border-amber-200",
  "PoC": "bg-purple-50 text-purple-700 border-purple-200",
  "Proyecto": "bg-tivit-red/10 text-tivit-red border-tivit-red/20",
  "Producción": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const CATEGORIA_DOT = {
  "Backlog de Propuestas Internas": "bg-slate-400",
  "Backlog de Propuestas Comerciales": "bg-blue-500",
  "Evaluación técnica": "bg-amber-500",
  "PoC": "bg-purple-500",
  "Proyecto": "bg-tivit-red",
  "Producción": "bg-emerald-500",
};

export const STAGE_DOT = {
  Backlog: "bg-slate-400",
  Evaluación: "bg-amber-500",
  PoC: "bg-purple-500",
  Proyecto: "bg-tivit-red",
  Producción: "bg-emerald-500",
};

export const STAGE_COLORS = {
  Backlog: "bg-slate-50 border-slate-200",
  Evaluación: "bg-amber-50 border-amber-200",
  PoC: "bg-purple-50 border-purple-200",
  Proyecto: "bg-red-50 border-red-200",
  Producción: "bg-emerald-50 border-emerald-200",
};

export function getNextStages(currentStage) {
  const stageOrder = ["Backlog", "Evaluación", "PoC", "Proyecto", "Producción"];
  const idx = stageOrder.indexOf(currentStage);
  if (idx === -1 || idx === stageOrder.length - 1) return [];
  // Permit forward moves up to one stage ahead (excluding direct Producción skip).
  return [stageOrder[idx + 1]];
}

export function getProgress(progress) {
  if (!progress || typeof progress !== "object") return { percent: 0, label: "—" };
  const total = progress.total_tasks ?? 0;
  const done = progress.done_tasks ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return {
    percent,
    label: `${done} / ${total}`,
  };
}
