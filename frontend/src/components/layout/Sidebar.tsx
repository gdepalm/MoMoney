"use client";

import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onCreateNew: () => void;
}

export default function Sidebar({ onCreateNew }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { invoices } = useStore();

  return (
    <aside className="w-[220px] bg-white border-r border-slate-200 flex-shrink-0 overflow-y-auto flex flex-col">
      {/* Main nav */}
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

      <div className="h-px bg-slate-100 mx-3" />

      {/* Invoices */}
      <div className="p-3 pt-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Invoices
          </span>
          <button
            onClick={onCreateNew}
            className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            title="New invoice"
          >
            <Icon name="plus" size={12} />
          </button>
        </div>

        <div className="space-y-0.5">
          {invoices.length === 0 ? (
            <p className="text-[12px] text-slate-400 px-3 py-2">No invoices yet</p>
          ) : (
            invoices.slice(0, 30).map((sheet) => {
              const active = pathname === `/invoice/${sheet.id}`;
              return (
                <button
                  key={sheet.id}
                  onClick={() => router.push(`/invoice/${sheet.id}`)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors text-left",
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}
                >
                  <Icon name="fileText" size={13} className="flex-shrink-0" />
                  <span className="truncate">{sheet.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}