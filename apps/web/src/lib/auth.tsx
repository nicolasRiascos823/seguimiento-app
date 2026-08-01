"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, getAccessToken, setAccessToken } from "./api";
import type { LoginResponse, User } from "./types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const me = await apiGet<User>("/auth/me");
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = getAccessToken();
        if (!token) {
          try {
            const refreshed = await apiPost<LoginResponse>("/auth/refresh");
            setAccessToken(refreshed.accessToken);
            if (!cancelled) setUser(refreshed.user);
            return;
          } catch {
            if (!cancelled) setUser(null);
            return;
          }
        }
        const me = await apiGet<User>("/auth/me");
        if (!cancelled) setUser(me);
      } catch {
        setAccessToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiPost<LoginResponse>("/auth/login", { email, password });
      setAccessToken(result.accessToken);
      setUser(result.user);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function useRequireAuth(allowedRoles?: User["role"][]) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && auth.user && !allowedRoles.includes(auth.user.role)) {
      router.replace("/dashboard");
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, allowedRoles, router]);

  return auth;
}
