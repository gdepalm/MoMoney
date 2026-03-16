"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { spreadsheetsApi } from "@/lib/api";
import { Spreadsheet, Column, SpreadsheetRow } from "@/types";
import AppShell from "@/components/layout/Appshell";
import SpreadsheetTable from "@/components/spreadsheet/SpreadsheetTable";
import ColumnConfigModal from "@/components/modals/ColumnConfigModal";
import Icon from "@/components/ui/Icon";

export default function SpreadsheetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, setSelectedSpreadsheet } = useStore();

  const [sheet, setSheet] = useState<Spreadsheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showColConfig, setShowColConfig] = useState(false);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    load();
  }, [id, user]);

  const load = () => {
    setLoading(true); setError(null);
    spreadsheetsApi.get(id)
      .then((s) => { setSheet(s); setSelectedSpreadsheet(s); })
      .catch(() => setError("Failed to load spreadsheet."))
      .finally(() => setLoading(false));
  };

  const handleRowsChange = (rows: SpreadsheetRow[]) => {
    if (sheet) setSheet({ ...sheet, rows });
  };

  const handleColumnsSaved = (columns: Column[]) => {
    if (sheet) setSheet({ ...sheet, columns });
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
        ) : sheet ? (
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
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{sheet.name}</h1>
                {sheet.description && <p className="text-[13px] text-slate-400 mt-1">{sheet.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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
                { label: "Total Rows",   value: sheet.rows.length },
                { label: "Columns",      value: sheet.columns.length },
                { label: "Last Updated", value: new Date(sheet.updatedAt).toLocaleDateString() },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{s.label}</p>
                  <p className="text-[22px] font-bold text-slate-900 font-mono tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <SpreadsheetTable
              spreadsheetId={sheet.id}
              columns={sheet.columns}
              rows={sheet.rows}
              onRowsChange={handleRowsChange}
            />

            <ColumnConfigModal
              open={showColConfig}
              onClose={() => setShowColConfig(false)}
              spreadsheetId={sheet.id}
              columns={sheet.columns}
              onSaved={handleColumnsSaved}
            />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}