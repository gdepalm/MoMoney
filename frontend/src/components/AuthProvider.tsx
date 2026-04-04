"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import api from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, token, setToken } = useStore();

  // Hydrate auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's a stored token
        const storedToken = localStorage.getItem("auth_token");
        if (storedToken) {
          setToken(storedToken);
        }

        // Try to get user info from backend session
        const response = await api.get("/users/").catch(() => null);
        if (response?.data) {
          const userData = response.data.user || response.data;
          if (userData?.email) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      }
    };

    // Only run once on mount
    if (!token) {
      initializeAuth();
    }
  }, []);

  return <>{children}</>;
}
