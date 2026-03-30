"use client";

import { useState } from "react";
import { Column, InvoiceRow } from "@/types";
import { invoicesApi } from "@/lib/api";
import { COLUMN_TYPE_BADGE } from "@/lib/data";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface Props {
  invoiceId: string;
  columns: Column[];
  rows: InvoiceRow[];
  onRowsChange: (rows: InvoiceRow[]) => void;
}

export default function InvoiceTable({ invoiceId, columns, rows, onRowsChange }: Props) {
  const [editCell, setEditCell] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const startEdit = (rowId: string, colId: string, val: unknown) => {
    setEditCell(`${rowId}:${colId}`);
    setEditVal(String(val ?? ""));
  };

  const saveEdit = async (rowId: string, colId: string) => {
    const updated = rows.map((r) => r.id === rowId ? { ...r, [colId]: editVal } : r);
    onRowsChange(updated);
    setEditCell(null);
    try { await invoicesApi.update(invoiceId, { [rowId]: { [colId]: editVal } }); }
    catch { onRowsChange(rows); }
  };

  if (columns.length === 0) return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
      <p className="text-[13px] text-slate-400">No columns configured. Click "Configure Columns" to get started.</p>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => {
                const badge = COLUMN_TYPE_BADGE[col.type];
                return (
                  <th key={col.id} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {col.name}
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", badge.cls)}>{badge.label}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[13px] text-slate-400">
                  No data yet. Upload a receipt to get started.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group">
                  {columns.map((col) => {
                    const key = `${row.id}:${col.id}`;
                    const isEditing = editCell === key;
                    const val = row[col.id];
                    return (
                      <td key={col.id} className="px-4 py-2.5 text-[13px] text-slate-700 max-w-[200px]"
                        onDoubleClick={() => startEdit(row.id, col.id, val)}>
                        {isEditing ? (
                          <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)}
                            onBlur={() => saveEdit(row.id, col.id)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(row.id, col.id); if (e.key === "Escape") setEditCell(null); }}
                            className="w-full px-2 py-1 border-2 border-emerald-500 rounded-lg text-[13px] focus:outline-none" />
                        ) : (
                          <div className="flex items-center gap-1.5 cursor-default">
                            <span className={cn("truncate", col.id === "c4" && "font-mono font-semibold")}>
                              {val != null && val !== "" ? String(val) : <span className="text-slate-300">—</span>}
                            </span>
                            <Icon name="pencil" size={11} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
        {rows.length} row{rows.length !== 1 ? "s" : ""} · Double-click any cell to edit
      </div>
    </div>
  );
}
