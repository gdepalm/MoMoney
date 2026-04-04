"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { invoicesApi } from "@/lib/api";
import { Invoice, Column, InvoiceRow } from "@/types";
import AppShell from "@/components/layout/Appshell";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import ColumnConfigModal from "@/components/modals/ColumnConfigModal";
import Icon from "@/components/ui/Icon";

export const dynamic = 'force-dynamic';

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, setSelectedInvoice } = useStore();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showColConfig, setShowColConfig] = useState(false);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    load();
  }, [id, user]);

  const load = () => {
    setLoading(true); setError(null);
    invoicesApi.get(id)
      .then((s) => {
        // Transform backend response to frontend Invoice format
        const invoice: Invoice = {
          data: s.data,
          id: String(s.id),
          name: s.data?.name || `Invoice #${s.id}`,
          description: s.data?.description,
          columns: [],
          rows: [],
          rowCount: 0,
          columnCount: 0,
          createdAt: s.createdAt,
          updatedAt: s.createdAt,
        };
        setInvoice(invoice);
        setSelectedInvoice(invoice);
      })
      .catch(() => setError("Failed to load invoice."))
      .finally(() => setLoading(false));
  };

  const handleRowsChange = (rows: InvoiceRow[]) => {
    if (invoice) setInvoice({ ...invoice, rows });
  };

  const handleColumnsSaved = (columns: Column[]) => {
    if (invoice) setInvoice({ ...invoice, columns });
  };

  return (
    <AppShell>
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <p className="text-[13px] text-red-600 mb-3">{error}</p>
            <button onClick={load} className="text-[13px] text-red-700 underline">Retry</button>
          </div>
        ) : invoice ? (
          <>
            {/* Back */}
            <button onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors mb-4">
              <Icon name="arrowLeft" size={14} />
              Back to Dashboard
            </button>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{invoice.name}</h1>
                {invoice.description && <p className="text-[13px] text-slate-400 mt-1">{invoice.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={load}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Icon name="rows" size={14} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button onClick={() => setShowColConfig(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Icon name="settings" size={14} />
                  <span className="hidden sm:inline">Configure Columns</span>
                </button>
                <button onClick={() => router.push(`/upload/${id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-colors shadow-sm">
                  <Icon name="upload" size={14} />
                  Upload Receipt
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Rows",   value: invoice.rows.length },
                { label: "Columns",      value: invoice.columns.length },
                { label: "Last Updated", value: new Date(invoice.updatedAt).toLocaleDateString() },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{s.label}</p>
                  <p className="text-[22px] font-bold text-slate-900 font-mono tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <InvoiceTable
              invoiceId={invoice.id}
              columns={invoice.columns}
              rows={invoice.rows}
              onRowsChange={handleRowsChange}
            />

            <ColumnConfigModal
              open={showColConfig}
              onClose={() => setShowColConfig(false)}
              invoiceId={invoice.id}
              columns={invoice.columns}
              onSaved={handleColumnsSaved}
            />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
