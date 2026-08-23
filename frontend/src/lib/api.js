const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function uploadFile(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  return request(path, { method: "POST", body: formData });
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  users: () => request("/users"),
  getUserStats: (id) => request(`/users/${id}/stats`),
  createUser: (payload) =>
    request("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) =>
    request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
  updateProfile: (payload) =>
    request("/auth/profile", { method: "PATCH", body: JSON.stringify(payload) }),
  changePassword: (payload) =>
    request("/auth/password", { method: "PATCH", body: JSON.stringify(payload) }),

  listAnnouncements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/announcements${qs ? `?${qs}` : ""}`);
  },
  createAnnouncement: (payload) =>
    request("/announcements", { method: "POST", body: JSON.stringify(payload) }),
  updateAnnouncement: (id, payload) =>
    request(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAnnouncement: (id) =>
    request(`/announcements/${id}`, { method: "DELETE" }),

  listWiki: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/wiki${qs ? `?${qs}` : ""}`);
  },
  getWiki: (slug) => request(`/wiki/${slug}`),
  createWiki: (payload) =>
    request("/wiki", { method: "POST", body: JSON.stringify(payload) }),
  updateWiki: (slug, payload) =>
    request(`/wiki/${slug}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteWiki: (slug) => request(`/wiki/${slug}`, { method: "DELETE" }),

  listProjects: () => request("/projects"),
  listProjectsSimple: () => request("/projects/list"),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (payload) =>
    request("/projects", { method: "POST", body: JSON.stringify(payload) }),
  updateProject: (id, payload) =>
    request(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  addProjectMember: (projectId, payload) =>
    request(`/projects/${projectId}/members`, { method: "POST", body: JSON.stringify(payload) }),
  updateProjectMemberRole: (projectId, userId, role) =>
    request(`/projects/${projectId}/members/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  removeProjectMember: (projectId, userId) =>
    request(`/projects/${projectId}/members/${userId}`, { method: "DELETE" }),
  getProjectSolicitudes: (projectId) => request(`/projects/${projectId}/solicitudes`),

  dashboardMe: () => request("/dashboard/me"),

  dashboard: () => request("/dashboard"),
  backlog: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/backlog${qs ? `?${qs}` : ""}`);
  },

  listTasks: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, v);
    });
    const qs = params.toString();
    return request(`/tasks${qs ? `?${qs}` : ""}`);
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

  listActivity: (taskId) => request(`/tasks/${taskId}/activity`),

  listAttachments: (taskId) => request(`/tasks/${taskId}/attachments`),
  uploadAttachment: (taskId, file) => uploadFile(`/tasks/${taskId}/attachments`, file),

  listSubtasks: (taskId) => request(`/tasks/${taskId}/subtasks`),
  toggleSubtask: (id, completed) =>
    request(`/subtasks/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    }),

  listSprints: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/sprints${qs ? `?${qs}` : ""}`);
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

  listWatchers: (taskId) => request(`/tasks/${taskId}/watchers`),
  watchTask: (taskId) => request(`/tasks/${taskId}/watch`, { method: "POST" }),
  unwatchTask: (taskId) => request(`/tasks/${taskId}/watch`, { method: "DELETE" }),

  listNotifications: () => request("/notifications"),
  unreadCount: () => request("/notifications/unread"),
  markNotificationsRead: () => request("/notifications/read", { method: "POST" }),

  // --- CMS de contenido público ---
  listCollections: () => request("/content/collections"),
  getSchema: (collection) => request(`/content/schemas/${collection}`),
  listContent: (collection, params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });
    const q = qs.toString();
    return request(`/content/${collection}${q ? `?${q}` : ""}`);
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
  listContentAudit: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/content/audit${qs ? `?${qs}` : ""}`);
  },

  // --- Media ---
  listMedia: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/media${qs ? `?${qs}` : ""}`);
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