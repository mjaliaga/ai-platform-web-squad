const API_URL = import.meta.env.VITE_API_URL || "/api";

function getCsrfToken() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name === "csrf_token") {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

/**
 * Custom error class that carries the HTTP status code so callers
 * (react-query retries, global handlers, etc.) can act on it.
 */
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isMutating = ["POST", "PATCH", "PUT", "DELETE"].includes(method);

  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (isMutating) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  // Timeout + AbortSignal: 15s por defecto, respeta signal externo (React Query)
  const timeoutMs = options.timeout ?? 15000;
  const hasExternalSignal = !!options.signal;
  const controller = hasExternalSignal ? null : new AbortController();
  const signal = options.signal ?? controller?.signal ?? null;
  let timeoutId = null;
  if (!hasExternalSignal && timeoutMs > 0 && signal) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  let res;
  try {
    // Extrae timeout/headers/signal para no duplicar; headers calculado prevalece
    const { timeout: _t, headers: _oh, signal: _os, ...fetchOptions } = options;
    res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...fetchOptions,
      headers,
      signal,
    });
  } catch (networkError) {
    if (networkError?.name === "AbortError") {
      throw new ApiError("Tiempo de espera agotado. Intenta nuevamente.", 408, null);
    }
    throw new ApiError("Error de red. Verifica tu conexión.", 0, null);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = { error: res.statusText || `Error ${res.status}` };
    }
    const message = body?.error || `Error ${res.status}`;
    throw new ApiError(message, res.status, body);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function uploadFile(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  return request(path, { method: "POST", body: formData });
}

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array<any>} items - Lista de ítems paginados
 * @property {number} [total]
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * Normaliza respuestas paginadas del backend a un array plano.
 * El backend puede devolver directamente un array o un objeto paginado `{ items: [...] }`.
 * Coordinado con agente D: todas las listas que pueden paginar (listSprints, listAnnouncements,
 * listUsers/users, listProjects, etc.) DEBEN usar este helper para consistencia.
 *
 * @param {Array<any> | PaginatedResponse | null | undefined} resp - Respuesta cruda del fetch
 * @returns {Array<any>} Array normalizado (vacío si resp es null/undefined/inválido)
 * @example
 * const items = unwrapPaginated(await request("/sprints"));
 * // items === [] | [...]
 */
export function unwrapPaginated(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.items)) return resp.items;
  return [];
}

/** @typedef {PaginatedResponse} PaginatedResp @deprecated alias */
/** @typedef {Array<any>} UnwrappedArray */

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  users: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/users${qs ? `?${qs}` : ""}`));
  },
  // alias para compatibilidad con código que usa listUsers
  listUsers: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/users${qs ? `?${qs}` : ""}`));
  },
  getUserStats: (id) => request(`/users/${id}/stats`),
  getWorkload: () => request("/users/workload"),
  getWorkloadBulk: () => request("/users/workload"),
  createUser: (payload) =>
    request("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) =>
    request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
  updateProfile: (payload) =>
    request("/auth/profile", { method: "PATCH", body: JSON.stringify(payload) }),
  changePassword: (payload) =>
    request("/auth/password", { method: "PATCH", body: JSON.stringify(payload) }),

  listAnnouncements: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/announcements${qs ? `?${qs}` : ""}`));
  },
  createAnnouncement: (payload) =>
    request("/announcements", { method: "POST", body: JSON.stringify(payload) }),
  updateAnnouncement: (id, payload) =>
    request(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAnnouncement: (id) =>
    request(`/announcements/${id}`, { method: "DELETE" }),

  listWiki: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/wiki${qs ? `?${qs}` : ""}`));
  },
  getWiki: (slug) => request(`/wiki/${slug}`),
  createWiki: (payload) =>
    request("/wiki", { method: "POST", body: JSON.stringify(payload) }),
  updateWiki: (slug, payload) =>
    request(`/wiki/${slug}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteWiki: (slug) => request(`/wiki/${slug}`, { method: "DELETE" }),

  // Portafolio — canónico profesional (mantiene compatibilidad con /projects legacy)
  listProjects: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/portfolio${qs ? `?${qs}` : ""}`));
  },
  listProjectsSimple: () => request("/portfolio/list"),
  getProject: (id) => request(`/portfolio/${id}`),
  createProject: (payload) =>
    request("/portfolio", { method: "POST", body: JSON.stringify(payload) }),
  updateProject: (id, payload) =>
    request(`/portfolio/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteProject: (id) => request(`/portfolio/${id}`, { method: "DELETE" }),
  addProjectMember: (projectId, payload) =>
    request(`/portfolio/${projectId}/members`, { method: "POST", body: JSON.stringify(payload) }),
  updateProjectMemberRole: (projectId, userId, role) =>
    request(`/portfolio/${projectId}/members/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  removeProjectMember: (projectId, userId) =>
    request(`/portfolio/${projectId}/members/${userId}`, { method: "DELETE" }),
  getProjectSolicitudes: (projectId) => request(`/portfolio/${projectId}/solicitudes`),
  getProjectProgress: (projectId) => request(`/portfolio/${projectId}/progress`),
  getProjectBySlug: (slug) => request(`/portfolio/by-slug/${slug}`),
  setProjectPublished: (id, published) =>
    request(`/portfolio/${id}/publish`, { method: "POST", body: JSON.stringify({ published }) }),
  setProjectReservado: (id, reservado) =>
    request(`/portfolio/${id}/reservado`, { method: "POST", body: JSON.stringify({ reservado }) }),
  listPublicProjects: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/projects/list/public${qs ? `?${qs}` : ""}`));
  },
  getPublicProjectBySlug: (slug) => request(`/projects/public/${slug}`),

  dashboardMe: () => request("/dashboard/me"),

  dashboard: () => request("/dashboard"),
  backlog: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/backlog${qs ? `?${qs}` : ""}`));
  },

  listTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, v);
    });
    const qs = params.toString();
    return unwrapPaginated(await request(`/tasks${qs ? `?${qs}` : ""}`));
  },
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (payload) =>
    request("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id, payload) =>
    request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateTaskStatus: (id, status, position, justification) =>
    request(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, position, justification }),
    }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),

  listComments: (taskId) => request(`/tasks/${taskId}/comments`),
  createComment: (taskId, body) =>
    request(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  editComment: (taskId, commentId, body) =>
    request(`/tasks/${taskId}/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    }),
  deleteComment: (taskId, commentId) =>
    request(`/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" }),

  listActivity: (taskId) => request(`/tasks/${taskId}/activity`),

  listAttachments: (taskId) => request(`/tasks/${taskId}/attachments`),
  uploadAttachment: (taskId, file) => uploadFile(`/tasks/${taskId}/attachments`, file),

  listSubtasks: (taskId) => request(`/tasks/${taskId}/subtasks`),
  toggleSubtask: (id, completed) =>
    request(`/subtasks/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    }),

  listSprints: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/sprints${qs ? `?${qs}` : ""}`));
  },
  getActiveSprint: () => request("/sprints/active"),
  getSprint: (id) => request(`/sprints/${id}`),
  createSprint: (payload) =>
    request("/sprints", { method: "POST", body: JSON.stringify(payload) }),
  updateSprint: (id, payload) =>
    request(`/sprints/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  activateSprint: (id) =>
    request(`/sprints/${id}/activate`, { method: "POST" }),
  deleteSprint: (id) => request(`/sprints/${id}`, { method: "DELETE" }),
  assignTasksToSprint: (sprintId, taskIds) =>
    request(`/sprints/${sprintId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ task_ids: taskIds }),
    }),

  listDependencies: (taskId) => request(`/tasks/${taskId}/dependencies`),
  listBlocking: (taskId) => request(`/tasks/${taskId}/blocking`),
  addDependency: (taskId, dependsOnId) =>
    request(`/tasks/${taskId}/dependencies`, {
      method: "POST",
      body: JSON.stringify({ depends_on_id: dependsOnId }),
    }),
  removeDependency: (taskId, dependsOnId) =>
    request(`/tasks/${taskId}/dependencies/${dependsOnId}`, { method: "DELETE" }),
  searchTasksForDep: (q, excludeId) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (excludeId) params.set("exclude", excludeId);
    return request(`/tasks/search?${params}`);
  },

  listTimeEntries: (taskId) => request(`/tasks/${taskId}/time`),
  logTime: (taskId, hours, description) =>
    request(`/tasks/${taskId}/time`, {
      method: "POST",
      body: JSON.stringify({ hours, description }),
    }),
  deleteTimeEntry: (taskId, entryId) =>
    request(`/tasks/${taskId}/time/${entryId}`, { method: "DELETE" }),
  editTimeEntry: (taskId, entryId, hours, description) =>
    request(`/tasks/${taskId}/time/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify({ hours, description }),
    }),

  listWatchers: (taskId) => request(`/tasks/${taskId}/watchers`),
  watchTask: (taskId) => request(`/tasks/${taskId}/watch`, { method: "POST" }),
  unwatchTask: (taskId) => request(`/tasks/${taskId}/watch`, { method: "DELETE" }),

  listNotifications: async () => unwrapPaginated(await request("/notifications")),
  unreadCount: () => request("/notifications/unread"),
  markNotificationsRead: () => request("/notifications/read", { method: "POST" }),

  // --- CMS de contenido público ---
  listCollections: () => request("/content/collections"),
  getSchema: (collection) => request(`/content/schemas/${collection}`),
  listContent: async (collection, params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });
    const q = qs.toString();
    return unwrapPaginated(await request(`/content/${collection}${q ? `?${q}` : ""}`));
  },
  getContentItem: (collection, slug) =>
    request(`/content/${collection}/${slug}`),
  createContentItem: (collection, payload) =>
    request(`/content/${collection}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateContentItem: (collection, slug, payload) =>
    request(`/content/${collection}/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteContentItem: (collection, slug) =>
    request(`/content/${collection}/${slug}`, { method: "DELETE" }),
  publishContentItem: (collection, slug, published) =>
    request(`/content/${collection}/${slug}/publish`, {
      method: "POST",
      body: JSON.stringify({ published }),
    }),
  duplicateContentItem: (collection, slug) =>
    request(`/content/${collection}/${slug}/duplicate`, { method: "POST" }),
  listContentAudit: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/content/audit${qs ? `?${qs}` : ""}`));
  },
  listSecurityAudit: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/admin/audit/security${qs ? `?${qs}` : ""}`));
  },

  // --- Media ---
  listMedia: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/media${qs ? `?${qs}` : ""}`));
  },
  uploadMedia: (file, alt) => {
    const fd = new FormData();
    fd.append("file", file);
    if (alt) fd.append("alt", alt);
    return request("/media", { method: "POST", body: fd });
  },
  updateMedia: (id, payload) =>
    request(`/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteMedia: (id) => request(`/media/${id}`, { method: "DELETE" }),

  listEpics: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/epics${qs ? `?${qs}` : ""}`));
  },
  getEpic: (id) => request(`/epics/${id}`),
  createEpic: (payload) =>
    request(`/epics`, { method: "POST", body: JSON.stringify(payload) }),
  updateEpic: (id, payload) =>
    request(`/epics/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteEpic: (id) => request(`/epics/${id}`, { method: "DELETE" }),

  listVersions: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return unwrapPaginated(await request(`/versions${qs ? `?${qs}` : ""}`));
  },
  getVersion: (id) => request(`/versions/${id}`),
  createVersion: (payload) =>
    request(`/versions`, { method: "POST", body: JSON.stringify(payload) }),
  updateVersion: (id, payload) =>
    request(`/versions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteVersion: (id) => request(`/versions/${id}`, { method: "DELETE" }),
  assignVersion: (versionId, taskId, relationship = "fix") =>
    request(`/versions/${versionId}/assign`, {
      method: "POST",
      body: JSON.stringify({ task_id: taskId, relationship }),
    }),
  unassignVersion: (versionId, taskId) =>
    request(`/versions/${versionId}/tasks/${taskId}`, { method: "DELETE" }),

  listWorkflows: () => request("/workflows"),
  getWorkflow: (id) => request(`/workflows/${id}`),
  createWorkflow: (payload) =>
    request(`/workflows`, { method: "POST", body: JSON.stringify(payload) }),
  deleteWorkflow: (id) => request(`/workflows/${id}`, { method: "DELETE" }),
  addWorkflowStatus: (workflowId, payload) =>
    request(`/workflows/${workflowId}/statuses`, { method: "POST", body: JSON.stringify(payload) }),
  addWorkflowTransition: (workflowId, payload) =>
    request(`/workflows/${workflowId}/transitions`, { method: "POST", body: JSON.stringify(payload) }),

  listSavedFilters: () => request("/saved-filters"),
  createSavedFilter: (payload) =>
    request(`/saved-filters`, { method: "POST", body: JSON.stringify(payload) }),
  updateSavedFilter: (id, payload) =>
    request(`/saved-filters/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteSavedFilter: (id) => request(`/saved-filters/${id}`, { method: "DELETE" }),
  executeSavedFilter: (id) => request(`/saved-filters/${id}/execute`),
  searchTasks: (query, limit = 50, offset = 0) =>
    request(`/tasks/search`, {
      method: "POST",
      body: JSON.stringify({ query, limit, offset }),
    }),

  getProjectReports: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/project${qs ? `?${qs}` : ""}`);
  },

  listTodos: () => request("/todos"),
  getTodosStats: () => request("/todos/stats"),
  createTodo: (payload) =>
    request("/todos", { method: "POST", body: JSON.stringify(payload) }),
  updateTodo: (id, payload) =>
    request(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTodo: (id) =>
    request(`/todos/${id}`, { method: "DELETE" }),
  clearCompletedTodos: () =>
    request("/todos/clear-completed", { method: "DELETE" }),
  reorderTodos: (todoIds) =>
    request("/todos/reorder", { method: "POST", body: JSON.stringify(todoIds) }),

  listCertifications: () => request("/certifications"),
  createCertification: (payload) =>
    request("/certifications", { method: "POST", body: JSON.stringify(payload) }),
  deleteCertification: (id) =>
    request(`/certifications/${id}`, { method: "DELETE" }),

  // --- Tickets (asociados a portfolio) ---
  listTickets: async (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });
    const q = qs.toString();
    return unwrapPaginated(await request(`/tickets${q ? `?${q}` : ""}`));
  },
  getTicket: (id) => request(`/tickets/${id}`),
  createTicket: (payload) =>
    request("/tickets", { method: "POST", body: JSON.stringify(payload) }),
  updateTicket: (id, payload) =>
    request(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTicket: (id) => request(`/tickets/${id}`, { method: "DELETE" }),
  updateTicketStatus: (id, payload) =>
    request(`/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  listTicketActivity: (id) => request(`/tickets/${id}/activity`),
  listTicketComments: (id) => request(`/tickets/${id}/comments`),
  createTicketComment: (id, body) =>
    request(`/tickets/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
  getTicketConfig: () => request("/tickets/config"),
  updateTicketConfig: (payload) =>
    request("/tickets/config", { method: "POST", body: JSON.stringify(payload) }),
};

export async function downloadAttachment(taskId, attachmentId, filename) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/attachments`, {
    credentials: "include",
  });
  const list = await res.json();
  const att = list.find((a) => a.id === attachmentId);
  if (!att) throw new Error("Adjunto no encontrado");
  const fileRes = await fetch(`${API_URL}/attachments/${attachmentId}`, {
    credentials: "include",
  });
  if (!fileRes.ok) throw new Error("No se pudo descargar");
  const blob = await fileRes.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || att.filename;
  a.click();
  URL.revokeObjectURL(url);
}
