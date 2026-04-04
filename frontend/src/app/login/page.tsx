"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import Icon from "@/components/ui/Icon";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, setUser, setToken, token } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
      return;
    }

    // Try to restore session from cookies if already authenticated
    const restoreSession = async () => {
      try {
        const response = await authApi.getUser();
        if (response?.email) {
          setUser(response);
          router.replace("/dashboard");
        }
      } catch (err) {
        // Session may have expired or user not authenticated
        const urlError = params.get("error");
        if (urlError) {
          setError("Google sign-in was cancelled or failed. Please try again.");
        }
      }
    };

    if (!token) {
      restoreSession();
    }
  }, [params, user, router, setUser, token]);

  const handleGoogle = () => {
    setLoading(true);
    // This redirects to the backend OAuth endpoint
    authApi.googleLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Icon name="scan" size={24} stroke={2} className="text-white" />
        </div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
          Welcome to MoMoney
        </h1>
        <p className="text-[13px] text-slate-400 mt-1.5">
          Sign in to manage your receipt invoices
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6 text-[13px] text-red-600">
            <span className="mt-0.5 flex-shrink-0">⚠</span>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-[1.5px] border-slate-200 rounded-xl text-[14px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-5 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
