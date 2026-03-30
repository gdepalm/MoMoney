import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import api from "@/lib/api";

export const useAuth = () => {
  const router = useRouter();
  const { user, setUser, token, setToken } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        if (storedToken) {
          setToken(storedToken);
        }

        // Try to get user from session/token
        const response = await api.get("/users/").catch(() => null);
        if (response?.data) {
          setUser(response.data.user || response.data);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setToken]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
  };
};

// Protected route hook
export const useProtectedRoute = () => {
  const router = useRouter();
  const { user } = useStore();
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    if (user) {
      setIsProtected(true);
    } else if (typeof window !== "undefined") {
      // Small delay to allow store to hydrate
      setTimeout(() => {
        if (!user) {
          router.replace("/login");
        } else {
          setIsProtected(true);
        }
      }, 100);
    }
  }, [user, router]);

  return isProtected;
};
