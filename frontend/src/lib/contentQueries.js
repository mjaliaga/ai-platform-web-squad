import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { queryKeys } from "./queryClient";

export function useCollections() {
  return useQuery({
    queryKey: ["content", "collections"],
    queryFn: () => api.listCollections(),
    staleTime: 60 * 1000,
  });
}

export function useContentSchema(collection) {
  return useQuery({
    queryKey: ["content", "schema", collection],
    queryFn: () => api.getSchema(collection),
    enabled: !!collection,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContentItems(collection, params = {}) {
  return useQuery({
    queryKey: ["content", "items", collection, params],
    queryFn: () => api.listContent(collection, params),
    enabled: !!collection,
  });
}

export function useContentItem(collection, slug) {
  return useQuery({
    queryKey: ["content", "item", collection, slug],
    queryFn: () => api.getContentItem(collection, slug),
    enabled: !!collection && !!slug,
  });
}

export function useCreateContentItem(collection) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createContentItem(collection, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content", "items", collection] });
      qc.invalidateQueries({ queryKey: ["content", "collections"] });
    },
  });
}

export function useUpdateContentItem(collection) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, payload }) =>
      api.updateContentItem(collection, slug, payload),
    onSuccess: (data, { slug }) => {
      qc.setQueryData(["content", "item", collection, slug], data);
      qc.invalidateQueries({ queryKey: ["content", "items", collection] });
      qc.invalidateQueries({ queryKey: ["content", "collections"] });
    },
  });
}

export function useDeleteContentItem(collection) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug) => api.deleteContentItem(collection, slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content", "items", collection] });
      qc.invalidateQueries({ queryKey: ["content", "collections"] });
    },
  });
}

export function usePublishContentItem(collection) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, published }) =>
      api.publishContentItem(collection, slug, published),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content", "items", collection] });
      qc.invalidateQueries({ queryKey: ["content", "collections"] });
    },
  });
}

export function useDuplicateContentItem(collection) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug) => api.duplicateContentItem(collection, slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content", "items", collection] });
      qc.invalidateQueries({ queryKey: ["content", "collections"] });
    },
  });
}

export function useMediaList(params = {}) {
  return useQuery({
    queryKey: ["media", params],
    queryFn: () => api.listMedia(params),
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, alt }) => api.uploadMedia(file, alt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteMedia(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useContentAudit(params = {}) {
  return useQuery({
    queryKey: ["content", "audit", params],
    queryFn: () => api.listContentAudit(params),
  });
}
