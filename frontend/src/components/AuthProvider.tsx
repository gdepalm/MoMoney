"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import api from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, logout } = useStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        if (storedToken) setToken(storedToken);

        const response = await api
          .get<{ user?: { email?: string } } & { email?: string }>("/users/")
          .catch(() => null);

        const body = response?.data as
          | ({ user?: { email?: string } } & { email?: string })
          | undefined;
        const userData = body?.user ?? body;

        if (userData?.email) {
          setUser(userData as never);
        } else {
          // Backend says no active session — clear any stale persisted user
          // so the login page doesn't bounce us back to /dashboard.
          logout();
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
