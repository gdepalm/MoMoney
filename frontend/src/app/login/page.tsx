"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import Icon from "@/components/ui/Icon";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, setUser, token } = useStore();
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
      } catch {
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_28%),linear-gradient(180deg,#ecfdf5_0%,#f0fdfa_48%,#ffffff_100%)] p-6">
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white/85 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm shadow-emerald-950/5 transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <Icon name="arrowLeft" size={15} />
        Back
      </Link>

      {/* Logo */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-900/15">
          <Icon name="scan" size={24} stroke={2} className="text-white" />
        </div>
        <h1 className="font-display text-4xl font-semibold text-emerald-950">
          Welcome to MoMoney
        </h1>
        <p className="mt-2 text-base text-emerald-950/65">
          Sign in to manage your receipt invoices
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white/90 p-8 shadow-xl shadow-emerald-950/10 backdrop-blur">
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <span className="mt-0.5 flex-shrink-0">⚠</span>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-base font-semibold text-emerald-950 transition-colors hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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

        <p className="mt-5 text-center text-sm leading-6 text-emerald-950/55">
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
        <div className="flex min-h-screen items-center justify-center bg-emerald-50">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
