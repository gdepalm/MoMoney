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
      className="h-15 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm"
      style={{ height: 60 }}
    >
      {/* Logo */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-emerald-600 rounded-[9px] flex items-center justify-center text-white flex-shrink-0">
          <Icon name="scan" size={16} stroke={2} />
        </div>
        <span className="font-bold text-[15px] text-slate-900 tracking-tight">
          MoMoney
        </span>
      </button>

      <div className="flex-1" />

      {/* User dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-[11px] font-semibold">
            {initials}
          </div>
          <span className="text-[13px] font-medium text-slate-700 hidden sm:block">
            {user?.name ?? "User"}
          </span>
          <Icon name="chevronDown" size={13} className="text-slate-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-slate-800">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
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
