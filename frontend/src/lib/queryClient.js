import { QueryClient } from "@tanstack/react-query";

/**
 * Determine whether a given error should NOT be retried.
 * Auth errors (401, 403) and bad requests (400, 404, 422) are never retried.
 */
function shouldNotRetry(error) {
  const status = error?.status ?? error?.response?.status;
  if (status && status >= 400 && status < 500) return true;
  // Legacy fallback: backend sometimes surfaces errors with a status code
  // embedded in the message; cover the common cases.
  const msg = String(error?.message ?? "");
  if (msg.startsWith("Error 4")) return true;
  return false;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      // Spec: retry only on 5xx, not on 4xx; keep helper for legacy message check
      retry: (failureCount, error) => {
        if (shouldNotRetry(error)) return false;
        const status = error?.status ?? error?.response?.status ?? 0;
        return status >= 500 && failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Centralized 401 handler — clears auth state when the session expires.
// Set from AuthProvider after mount.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  if (typeof onUnauthorized === "function") onUnauthorized();
}

// Wrap fetch to detect 401 and trigger the global handler ONLY for protected API routes.
// Evita disparar logout fantasma en rutas públicas (/api/public, /content, etc.).
const originalFetch = globalThis.fetch?.bind(globalThis);
if (originalFetch) {
  globalThis.fetch = async (...args) => {
    const res = await originalFetch(...args);
    if (res.status === 401) {
      let url = "";
      try {
        const first = args[0];
        if (typeof first === "string") url = first;
        else if (typeof Request !== "undefined" && first instanceof Request) url = first.url;
        else if (first && typeof first.url === "string") url = first.url;
      } catch {}
      const isPublicApi =
        url.includes("/public/") ||
        url.includes("/public") ||
        url.includes("/health") ||
        url.includes("/api/auth/login");
      const isApi = url.includes("/api/");
      // Solo notificar si es API protegida; ignora fetches públicos, assets, y third-party
      if (isApi && !isPublicApi) {
        notifyUnauthorized();
      }
    }
    return res;
  };
}

export const queryKeys = {
  me: ["auth", "me"],
  users: (params) => ["users", params],
  userStats: (id) => ["users", id, "stats"],
  workload: ["users", "workload"],
  projects: (params) => ["projects", params],
  project: (id) => ["projects", id],
  tasks: (filters) => ["tasks", filters],
  task: (id) => ["tasks", id],
  board: (scope, project) => ["board", scope, project],
  backlog: (scope, project) => ["backlog", scope, project],
  sprints: (params) => ["sprints", params],
  activeSprint: ["sprints", "active"],
  epics: (params) => ["epics", params],
  versions: (params) => ["versions", params],
  comments: (taskId) => ["tasks", taskId, "comments"],
  activity: (taskId) => ["tasks", taskId, "activity"],
  attachments: (taskId) => ["tasks", taskId, "attachments"],
  subtasks: (taskId) => ["tasks", taskId, "subtasks"],
  dependencies: (taskId) => ["tasks", taskId, "dependencies"],
  blocking: (taskId) => ["tasks", taskId, "blocking"],
  timeEntries: (taskId) => ["tasks", taskId, "time"],
  watchers: (taskId) => ["tasks", taskId, "watchers"],
  notifications: (params) => ["notifications", params],
  unreadCount: ["notifications", "unread"],
  dashboard: ["dashboard"],
  dashboardMe: ["dashboard", "me"],
  announcements: (params) => ["announcements", params],
  todos: ["todos"],
  todosStats: ["todos", "stats"],
  tickets: (params) => ["tickets", params],
  ticket: (id) => ["tickets", id],
  ticketActivity: (id) => ["tickets", id, "activity"],
  ticketComments: (id) => ["tickets", id, "comments"],
  ticketConfig: ["tickets", "config"],
};
