const STATUS_DOT = {
  backlog: "bg-tivit-ink/40",
  todo: "bg-blue-500",
  in_progress: "bg-yellow-500",
  review: "bg-purple-500",
  done: "bg-green-500",
  pendiente: "bg-amber-500",
  en_revision: "bg-blue-500",
  aprobada: "bg-green-500",
  rechazada: "bg-red-500",
  resuelta: "bg-emerald-500",
};

const STATUS_COLORS = {
  backlog: "bg-tivit-ink/10 text-tivit-ink/70",
  todo: "bg-blue-50 text-blue-700",
  in_progress: "bg-yellow-50 text-yellow-700",
  review: "bg-purple-50 text-purple-700",
  done: "bg-green-50 text-green-700",
  pendiente: "bg-amber-50 text-amber-700",
  en_revision: "bg-blue-50 text-blue-700",
  aprobada: "bg-green-50 text-green-700",
  rechazada: "bg-red-50 text-red-700",
  resuelta: "bg-emerald-50 text-emerald-700",
};

const STATUS_LABELS = {
  backlog: "Backlog",
  todo: "Por hacer",
  in_progress: "En progreso",
  review: "En revisión",
  done: "Completado",
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  resuelta: "Resuelta",
};

const TYPE_COLORS = {
  tarea: "bg-blue-50 text-blue-700",
  bug: "bg-alert/10 text-alert",
  solicitud: "bg-teal-50 text-teal-700",
};

const TYPE_LABELS = {
  tarea: "Tarea",
  bug: "Bug",
  solicitud: "Solicitud",
};

export const AREA_COLORS = {
  frontend: "bg-sky-50 text-sky-700",
  backend: "bg-emerald-50 text-emerald-700",
  qa: "bg-amber-50 text-amber-700",
  deploy: "bg-purple-50 text-purple-700",
  "diseño": "bg-pink-50 text-pink-700",
  "consulta-po": "bg-gray-100 text-gray-600",
};

export const AREA_LABELS = {
  frontend: "Frontend",
  backend: "Backend",
  qa: "QA",
  deploy: "Deploy",
  "diseño": "Diseño",
  "consulta-po": "Consulta PO",
};

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

const PRIORITY_LABELS = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Crítica",
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.todo}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || "bg-current"}`} aria-hidden="true" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function TypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TYPE_COLORS[type] || TYPE_COLORS.task}`}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export function AreaBadge({ area }) {
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${AREA_COLORS[area] || "bg-gray-100 text-gray-600"}`}>
      {AREA_LABELS[area] || area}
    </span>
  );
}

export function UserAvatar({ user, size = "md" }) {
  if (!user) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-500 ${size === "sm" ? "h-6 w-6 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-8 w-8 text-sm"}`}>
        ?
      </div>
    );
  }
  const sizeClass = size === "sm" ? "h-6 w-6 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-8 w-8 text-sm";
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white ${sizeClass}`}
      style={{ background: user.avatar_color || "#dc2626" }}
      title={user.name}
    >
      {user.name?.[0]?.toUpperCase()}
    </div>
  );
}

export function toDate(value) {
  if (!value) return null;
  let s = String(value).trim();
  // Fecha sola "YYYY-MM-DD" (due_date, issue_date) -> tratar como fecha local a medianoche, sin conversión UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // SQLite "YYYY-MM-DD HH:MM:SS[.ms]" en UTC sin zona -> normalizar a ISO Z
  const sqlite = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?$/);
  if (sqlite) return new Date(`${sqlite[1]}T${sqlite[2]}Z`);
  // ISO sin zona "YYYY-MM-DDTHH:MM:SS[.ms]" -> tratar como UTC (evita que se interprete como local)
  const isoNoTz = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?$/);
  if (isoNoTz) return new Date(`${s}Z`);
  // Ya tiene Z u offset (+HH:MM / -HH:MM) -> parse directo como UTC
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso) {
  const d = toDate(iso);
  if (!d) return iso;
  // toLocaleDateString usa la zona horaria local del navegador (persona)
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso) {
  const d = toDate(iso);
  if (!d) return iso ?? "";
  // Hora estandarizada a la zona local de la persona (navegador)
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export function formatDateTimeLong(iso) {
  const d = toDate(iso);
  if (!d) return iso ?? "";
  return d.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" });
}

export function formatRelative(iso) {
  const d = toDate(iso);
  if (!d) return iso ?? "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return formatDate(iso);
}