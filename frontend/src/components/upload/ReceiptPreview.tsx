"use client";

import { useState } from "react";
import { Column, ExtractedItem } from "@/types";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface Props {
  items: ExtractedItem[];
  columns: Column[];
  confidence: number;
  onConfirm: (items: ExtractedItem[]) => void;
  loading: boolean;
}

export default function ReceiptPreview({ items: initial, columns, confidence, onConfirm, loading }: Props) {
  const [items, setItems] = useState<ExtractedItem[]>(initial);
  const [editCell, setEditCell] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const startEdit = (ri: number, colId: string) => {
    setEditCell(`${ri}:${colId}`);
    setEditVal(String(items[ri][colId] ?? ""));
  };
  const saveEdit = (ri: number, colId: string) => {
    setItems(items.map((row, i) => i === ri ? { ...row, [colId]: editVal } : row));
    setEditCell(null);
  };
  const addRow = () => setItems([...items, Object.fromEntries(columns.map((c) => [c.id, ""]))]);

  const pct = Math.round(confidence * 100);
  const isHigh = pct >= 80;

  return (
    <div className="space-y-4">
      {/* Confidence badge */}
      <div className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px]",
        isHigh ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-yellow-50 border-yellow-100 text-yellow-700")}>
        <Icon name="check" size={15} stroke={2.5} />
        <span><strong>{pct}% confidence</strong> · AI extracted {items.length} items · Review and edit before confirming</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map((col) => (
                  <th key={col.id} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  {columns.map((col) => {
                    const key = `${ri}:${col.id}`;
                    const isEditing = editCell === key;
                    return (
                      <td key={col.id} className="px-4 py-2.5 text-[13px] text-slate-700 cursor-pointer"
                        onClick={() => !isEditing && startEdit(ri, col.id)}>
                        {isEditing ? (
                          <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)}
                            onBlur={() => saveEdit(ri, col.id)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") saveEdit(ri, col.id); }}
                            className="w-full px-2 py-1 border-2 border-emerald-500 rounded-lg text-[13px] focus:outline-none" />
                        ) : (
                          <span>{row[col.id] || <span className="text-slate-300">—</span>}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button onClick={addRow} className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            + Add row
          </button>
          <span className="text-[11px] text-slate-400">{items.length} items · Click cell to edit</span>
        </div>
      </div>

      {/* Confirm */}
      <button onClick={() => onConfirm(items)} disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[13px] font-semibold transition-colors disabled:opacity-50 shadow-sm">
        {loading
          ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          : <Icon name="check" size={15} stroke={2.5} />}
        {loading ? "Inserting…" : `Confirm & Insert ${items.length} Rows`}
      </button>
    </div>
  );
}