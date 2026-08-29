import { createContext, useCallback, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { queryKeys, setUnauthorizedHandler } from "../lib/queryClient";
import { useToast } from "./ToastContext.jsx";

const AuthContext = createContext(null);

const AUTH_QUERY_KEYS = [
  queryKeys.me,
  queryKeys.unreadCount,
  queryKeys.dashboardMe,
  queryKeys.dashboard,
];

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Wire the global 401 handler — clear auth-related data and bounce to /login.
  const handleUnauthorized = useCallback(() => {
    qc.setQueryData(queryKeys.me, null);
    qc.removeQueries({ queryKey: AUTH_QUERY_KEYS, exact: false });
    // Only navigate if we are not already on a public route.
    const publicPaths = ["/", "/login", "/proyectos", "/laboratorio", "/casos-de-exito", "/poc"];
    const isPublic = publicPaths.some(
      (p) => window.location.pathname === p || window.location.pathname.startsWith(`${p}/`)
    );
    if (!isPublic) {
      toast.warning("Tu sesión expiró. Vuelve a iniciar sesión.");
      navigate("/login", { replace: true });
    }
  }, [qc, navigate, toast]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => api.login(email, password),
    onSuccess: (res) => {
      const user = res.user || res;
      qc.setQueryData(queryKeys.me, user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Selective cleanup — preserve static CMS data and any unrelated query cache.
      qc.setQueryData(queryKeys.me, null);
      qc.removeQueries({ queryKey: AUTH_QUERY_KEYS, exact: false });
    },
  });

  async function login(email, password) {
    const res = await loginMutation.mutateAsync({ email, password });
    return res.user || res;
  }

  async function logout() {
    await logoutMutation.mutateAsync();
  }

  async function refreshUser() {
    const me = await api.me();
    qc.setQueryData(queryKeys.me, me);
    return me;
  }

  const value = {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    isFetching: meQuery.isFetching,
    login,
    logout,
    refreshUser,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
