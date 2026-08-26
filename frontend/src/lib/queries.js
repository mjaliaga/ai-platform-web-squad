import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { queryKeys } from "./queryClient";

export function useMe(options = {}) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
    ...options,
  });
}

export function useUsers(params = {}) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => api.users(params),
  });
}

export function useUserStats(id) {
  return useQuery({
    queryKey: queryKeys.userStats(id),
    queryFn: () => api.getUserStats(id),
    enabled: !!id,
  });
}

export function useProjects(params = {}) {
  return useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () => api.listProjects(params),
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });
}

export function useTasks(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.tasks(filters),
    queryFn: () => api.listTasks(filters),
    enabled: options.enabled ?? true,
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => api.getTask(id),
    enabled: !!id,
  });
}

export function useBoard(scope, project) {
  return useQuery({
    queryKey: queryKeys.board(scope, project),
    queryFn: () => api.getBoard({ scope, project }),
  });
}

export function useBacklog(scope, project) {
  return useQuery({
    queryKey: queryKeys.backlog(scope, project),
    queryFn: () => api.backlog({ scope, project }),
  });
}

export function useSprints(params = {}) {
  return useQuery({
    queryKey: queryKeys.sprints(params),
    queryFn: () => api.listSprints(params),
  });
}

export function useActiveSprint() {
  return useQuery({
    queryKey: queryKeys.activeSprint,
    queryFn: () => api.getActiveSprint(),
    retry: false,
  });
}

export function useComments(taskId) {
  return useQuery({
    queryKey: queryKeys.comments(taskId),
    queryFn: () => api.listComments(taskId),
    enabled: !!taskId,
  });
}

export function useActivity(taskId) {
  return useQuery({
    queryKey: queryKeys.activity(taskId),
    queryFn: () => api.listActivity(taskId),
    enabled: !!taskId,
  });
}

export function useAttachments(taskId) {
  return useQuery({
    queryKey: queryKeys.attachments(taskId),
    queryFn: () => api.listAttachments(taskId),
    enabled: !!taskId,
  });
}

export function useSubtasks(taskId) {
  return useQuery({
    queryKey: queryKeys.subtasks(taskId),
    queryFn: () => api.listSubtasks(taskId),
    enabled: !!taskId,
  });
}

export function useDependencies(taskId) {
  return useQuery({
    queryKey: queryKeys.dependencies(taskId),
    queryFn: () => api.listDependencies(taskId),
    enabled: !!taskId,
  });
}

export function useBlocking(taskId) {
  return useQuery({
    queryKey: queryKeys.blocking(taskId),
    queryFn: () => api.listBlocking(taskId),
    enabled: !!taskId,
  });
}

export function useTimeEntries(taskId) {
  return useQuery({
    queryKey: queryKeys.timeEntries(taskId),
    queryFn: () => api.listTimeEntries(taskId),
    enabled: !!taskId,
  });
}

export function useWatchers(taskId) {
  return useQuery({
    queryKey: queryKeys.watchers(taskId),
    queryFn: () => api.listWatchers(taskId),
    enabled: !!taskId,
  });
}

export function useNotifications(params = {}) {
  return useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: () => api.listNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => api.unreadCount(),
    refetchInterval: 60 * 1000,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.dashboard(),
  });
}

export function useDashboardMe() {
  return useQuery({
    queryKey: queryKeys.dashboardMe,
    queryFn: () => api.dashboardMe(),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createTask(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["backlog"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateTask(id, payload),
    onSuccess: (data, { id }) => {
      qc.setQueryData(queryKeys.task(id), data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["backlog"] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, position, justification }) =>
      api.updateTaskStatus(id, status, position, justification),
    onSuccess: (data, { id }) => {
      qc.setQueryData(queryKeys.task(id), data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["backlog"] });
    },
  });
}

export function useCreateComment(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.createComment(taskId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.activity(taskId) });
    },
  });
}

export function useUploadAttachment(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => api.uploadAttachment(taskId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attachments(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.activity(taskId) });
    },
  });
}

export function useLogTime(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hours, description }) =>
      api.logTime(taskId, hours, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.timeEntries(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.activity(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.task(taskId) });
    },
  });
}

export function useDeleteTimeEntry(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId) => api.deleteTimeEntry(taskId, entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.timeEntries(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.task(taskId) });
    },
  });
}

export function useToggleWatch(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isWatching) =>
      isWatching ? api.unwatchTask(taskId) : api.watchTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.watchers(taskId) });
    },
  });
}

export function useToggleSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }) => api.toggleSubtask(id, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subtasks"] });
    },
  });
}

export function useAddDependency(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnId) => api.addDependency(taskId, dependsOnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dependencies(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.activity(taskId) });
    },
  });
}

export function useRemoveDependency(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dependsOnId) => api.removeDependency(taskId, dependsOnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dependencies(taskId) });
    },
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

export function useAnnouncements(params = {}) {
  return useQuery({
    queryKey: queryKeys.announcements(params),
    queryFn: () => api.listAnnouncements(params),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createAnnouncement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateAnnouncement(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}
