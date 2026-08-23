import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.message?.includes("401")) return false;
        if (error?.message?.includes("403")) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryKeys = {
  me: ["auth", "me"],
  users: (params) => ["users", params],
  userStats: (id) => ["users", id, "stats"],
  projects: (params) => ["projects", params],
  project: (id) => ["projects", id],
  tasks: (filters) => ["tasks", filters],
  task: (id) => ["tasks", id],
  board: (scope, project) => ["board", scope, project],
  backlog: (scope, project) => ["backlog", scope, project],
  sprints: (params) => ["sprints", params],
  activeSprint: ["sprints", "active"],
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
};
