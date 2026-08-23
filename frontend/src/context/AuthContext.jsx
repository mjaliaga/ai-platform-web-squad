import { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

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
      qc.setQueryData(queryKeys.me, null);
      qc.clear();
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
