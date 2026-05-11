"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { groupsApi } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useSidebar } from "./Appshell";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, groups, setGroups } = useStore();
  const { open, setOpen } = useSidebar();

  useEffect(() => {
    if (!user) return;
    groupsApi
      .list()
      .then(setGroups)
      .catch(() => {
        // Fail silently — the dashboard surfaces load errors more visibly.
      });
  }, [user, setGroups]);

  // Close the mobile drawer on route change so navigating from inside it
  // doesn't leave the overlay sitting on top of the destination page.
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  const activeGroupId = (() => {
    const m = pathname?.match(/^\/groups\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const nav = (
    <nav className="p-3 flex-1 flex flex-col gap-4">
      <button
        onClick={() => go("/dashboard")}
        className={cn(
          "w-full flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
          pathname === "/dashboard"
            ? "bg-emerald-50 text-emerald-900"
            : "text-emerald-800/75 hover:bg-emerald-50 hover:text-emerald-950"
        )}
      >
        <Icon name="grid" size={14} />
        Dashboard
      </button>

      {groups.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="px-3 text-xs font-bold uppercase tracking-wider text-emerald-700/60">
            Groups
          </div>
          {groups.map((g) => {
            const isActive = activeGroupId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => go(`/groups/${g.id}`)}
                className={cn(
                  "w-full flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-emerald-800/75 hover:bg-emerald-50 hover:text-emerald-950"
                )}
                title={g.name}
              >
                <Icon name="folder" size={14} />
                <span className="truncate">{g.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar (md+): inline column */}
      <aside className="hidden md:flex w-[240px] flex-shrink-0 overflow-y-auto border-r border-emerald-100 bg-white flex-col">
        {nav}
      </aside>

      {/* Mobile drawer (< md): overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute top-0 left-0 h-full w-[260px] max-w-[80vw] bg-white border-r border-emerald-100 shadow-xl flex flex-col overflow-y-auto transition-transform",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
