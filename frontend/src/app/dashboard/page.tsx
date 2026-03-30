"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { invoicesApi } from "@/lib/api";
import { InvoiceSummary } from "@/types";
import AppShell from "@/components/layout/Appshell";
import Icon from "@/components/ui/Icon";

export default function DashboardPage() {
  const router = useRouter();
  const { user, invoices, setInvoices, removeInvoice, setUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Wait a bit for AuthProvider to restore session, then verify auth
    const timer = setTimeout(async () => {
      if (!user) {
        // Try to restore auth from session
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            const userData = data.user || data;
            if (userData?.email) {
              setUser(userData);
              setIsAuthChecking(false);
              return;
            }
          }
        } catch (err) {
          console.error("Failed to restore auth:", err);
        }
        // No auth, redirect to login
        router.replace("/login");
      } else {
        setIsAuthChecking(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, router, setUser]);

  useEffect(() => {
    if (isAuthChecking) {
      return; // Wait for auth check
    }

    // Load invoices once we know user is authenticated
    if (user) {
      invoicesApi.list()
        .then((invoices) => {
          // Transform backend InvoiceRead to InvoiceSummary
          const summaries = invoices.map((inv) => ({
            id: String(inv.id),
            name: inv.data?.name || `Invoice #${inv.id}`,
            description: inv.data?.description,
            rowCount: 0,
            columnCount: 0,
            createdAt: inv.created_at,
            updatedAt: inv.created_at,
          }));
          setInvoices(summaries);
        })
        .catch((err) => {
          console.error("Failed to load invoices:", err);
          setError("Failed to load invoices.");
        })
        .finally(() => setLoading(false));
    }
  }, [user, isAuthChecking, setInvoices]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      await invoicesApi.delete(id);
      removeInvoice(id);
    } catch { alert("Failed to delete."); }
    setMenuOpen(null);
  };

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-[13px] text-slate-400 mt-1">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <p className="text-[13px] text-red-600 mb-3">{error}</p>
            <button onClick={() => window.location.reload()} className="text-[13px] text-red-700 underline">Retry</button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="fileText" size={24} stroke={1.5} className="text-slate-400" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-700 mb-2">No invoices yet</h3>
            <p className="text-[13px] text-slate-400 mb-6">Create your first invoice to start organizing receipt data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {invoices.map((sheet: InvoiceSummary, idx: number) => (
              <InvoiceCard
                key={sheet.id}
                invoice={sheet}
                menuOpen={menuOpen === sheet.id}
                onOpen={() => router.push(`/invoice/${sheet.id}`)}
                onMenuToggle={() => setMenuOpen(menuOpen === sheet.id ? null : sheet.id)}
                onDelete={() => handleDelete(sheet.id)}
                style={{ animationDelay: `${idx * 0.04}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InvoiceCard({ invoice, menuOpen, onOpen, onMenuToggle, onDelete, style }: {
  invoice: InvoiceSummary;
  menuOpen: boolean;
  onOpen: () => void;
  onMenuToggle: () => void;
  onDelete: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative"
      style={style}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
          <Icon name="table" size={20} stroke={1.75} />
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMenuToggle}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <span className="text-lg leading-none tracking-widest">···</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              <button onClick={onOpen} className="w-full text-left px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">Open</button>
              <button onClick={onDelete} className="w-full text-left px-3 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors">Delete</button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-bold text-[14px] text-slate-900 tracking-tight mb-1 truncate">{invoice.name}</h3>
      <p className="text-[12px] text-slate-400 line-clamp-2 min-h-[16px]">{invoice.description ?? ""}</p>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Icon name="rows" size={11} />{invoice.rowCount} rows
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Icon name="calendar" size={11} />{invoice.updatedAt}
        </span>
      </div>
    </div>
  );
}