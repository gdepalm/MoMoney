"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { groupsApi } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ open, onClose }: Props) {
  const { addGroup } = useStore();
  const [name, setName] = useState("");
  const [columns, setColumns] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setName("");
    setColumns([""]);
    setError(null);
    onClose();
  };

  const addColumn = () => setColumns((prev) => [...prev, ""]);
  const removeColumn = (i: number) =>
    setColumns((prev) => prev.filter((_, idx) => idx !== i));
  const updateColumn = (i: number, val: string) =>
    setColumns((prev) => prev.map((c, idx) => (idx === i ? val : c)));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const filtered = columns.map((c) => c.trim()).filter(Boolean);
    // "Price" is always appended as the last column
    const finalColumns = [...filtered, "Price"];
    setLoading(true);
    setError(null);
    try {
      const group = await groupsApi.create({
        name: name.trim(),
        columns: finalColumns,
      });
      addGroup(group);
      handleClose();
    } catch {
      setError("Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            New Group
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
              Group Name *
            </label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., January Expenses"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-2">
              Columns
            </label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {columns.map((col, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 w-5 flex-shrink-0 text-right">
                    {i + 1}.
                  </span>
                  <input
                    value={col}
                    onChange={(e) => updateColumn(i, e.target.value)}
                    placeholder={`Column ${i + 1} name`}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  {columns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColumn(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* Fixed "Price" column — always last, not removable */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400 w-5 flex-shrink-0 text-right">
                {columns.length + 1}.
              </span>
              <div className="flex-1 px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-[13px] text-slate-400 select-none">
                Prices
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg flex-shrink-0">
                Automatically
              </span>
            </div>

            <button
              type="button"
              onClick={addColumn}
              className="mt-2 flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors w-full"
            >
              <Icon name="plus" size={13} />
              Add column
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors",
                loading || !name.trim()
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700",
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon name="plus" size={14} />
              )}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
