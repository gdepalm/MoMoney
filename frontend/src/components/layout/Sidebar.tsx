"use client";

import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-[220px] bg-white border-r border-slate-200 flex-shrink-0 overflow-y-auto flex flex-col">
      <nav className="p-3">
        <button
          onClick={() => router.push("/dashboard")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-emerald-50 text-emerald-700"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
        >
          <Icon name="grid" size={14} />
          Dashboard
        </button>
      </nav>
    </aside>
  );
}
