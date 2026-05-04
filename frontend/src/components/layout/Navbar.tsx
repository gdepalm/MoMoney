"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import Icon from "@/components/ui/Icon";

export default function Navbar() {
  const { user, logout } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with local logout even if API call fails
    }
    logout();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header
      className="h-15 flex flex-shrink-0 items-center gap-4 border-b border-emerald-100 bg-white/95 px-6 shadow-sm shadow-emerald-950/5 backdrop-blur"
      style={{ height: 60 }}
    >
      {/* Logo */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2.5 transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-emerald-700 text-white">
          <Icon name="scan" size={16} stroke={2} />
        </div>
        <span className="font-display text-xl font-semibold text-emerald-950">
          MoMoney
        </span>
      </button>

      <div className="flex-1" />

      {/* User dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white">
            {initials}
          </div>
          <span className="hidden text-sm font-semibold text-emerald-950 sm:block">
            {user?.name ?? "User"}
          </span>
          <Icon name="chevronDown" size={13} className="text-emerald-700/70" />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-lg shadow-emerald-950/10 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="border-b border-emerald-100 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-950">
                {user?.name}
              </p>
              <p className="truncate text-xs text-emerald-700/60">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              <Icon name="logout" size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
