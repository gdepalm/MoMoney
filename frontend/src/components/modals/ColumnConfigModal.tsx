"use client";

import { useState } from "react";
import { Column, ColumnType } from "@/types";
import { invoicesApi } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: { value: ColumnType; label: string; badge: string }[] = [
  { value: "text",       label: "Text",       badge: "bg-slate-100 text-slate-500" },
  { value: "number",     label: "Number",     badge: "bg-blue-100 text-blue-700"   },
  { value: "date",       label: "Date",       badge: "bg-yellow-100 text-yellow-700" },
  { value: "ai_extract", label: "AI Extract", badge: "bg-purple-100 text-purple-700" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  columns: Column[];
  onSaved: (cols: Column[]) => void;
}

export default function ColumnConfigModal({ open, onClose, invoiceId, columns, onSaved }: Props) {
  const [local, setLocal] = useState<Omit<Column, "id">[]>(
    columns.map(({ name, type, order }) => ({ name, type, order }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const add = () => setLocal([...local, { name: "", type: "text", order: local.length }]);
  const remove = (i: number) => setLocal(local.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Omit<Column, "id">, val: string | number) =>
    setLocal(local.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));

  const handleSave = async () => {
    if (local.some((c) => !c.name.trim())) { setError("All columns need a name."); return; }
    setLoading(true); setError(null);
    try {
      const updatedColumns = local.map((col, idx) => ({ ...col, id: columns[idx].id }));
      const saved = await invoicesApi.update(invoiceId, { columns: updatedColumns });
      onSaved(saved.columns);
      onClose();
    } catch { setError("Failed to save columns."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 flex flex-col max-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Configure Columns</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {error && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">{error}</p>}

          {local.length === 0 && (
            <p className="text-[13px] text-slate-400 text-center py-6">No columns yet. Add one below.</p>
          )}

          {local.map((col, i) => {
            const typeInfo = TYPE_OPTIONS.find((t) => t.value === col.type)!;
            return (
              <div key={i} className="flex items-center gap-2">
                <Icon name="grip" size={14} className="text-slate-300 flex-shrink-0 cursor-grab" />
                <input
                  value={col.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  placeholder="Column name"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <select
                  value={col.type}
                  onChange={(e) => update(i, "type", e.target.value)}
                  className="px-2 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", typeInfo.badge)}>
                  {col.type === "ai_extract" ? "AI" : col.type[0].toUpperCase()}
                </span>
                <button onClick={() => remove(i)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            );
          })}

          <button onClick={add} className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors w-full">
            <Icon name="plus" size={13} />
            Add Column
          </button>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Icon name="check" size={13} />}
            Save Columns
          </button>
        </div>
      </div>
    </div>
  );
}