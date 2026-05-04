"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { groupsApi } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, groups, setGroups } = useStore();

  useEffect(() => {
    if (!user) return;
    groupsApi
      .list()
      .then(setGroups)
      .catch(() => {
        // Fail silently — the dashboard surfaces load errors more visibly.
      });
  }, [user, setGroups]);

  const activeGroupId = (() => {
    const m = pathname?.match(/^\/groups\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();

  return (
    <aside className="w-[240px] flex-shrink-0 overflow-y-auto border-r border-emerald-100 bg-white">
      <nav className="p-3 flex-1 flex flex-col gap-4">
        <button
          onClick={() => router.push("/dashboard")}
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
                  onClick={() => router.push(`/groups/${g.id}`)}
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
    </aside>
  );
}
