import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { invoicesApi } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateInvoiceModal({ open, onClose }: Props) {
  const router = useRouter();
  const { addInvoice } = useStore();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => { setName(""); setDesc(""); setError(null); onClose(); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const invoice = await invoicesApi.create({ name: name.trim(), description: desc.trim() || undefined });
      // Map backend invoice response to InvoiceSummary format
      const summary = {
        id: String(invoice.id),
        name: invoice.data?.name || name.trim(),
        description: invoice.data?.description || desc.trim() || undefined,
        rowCount: 0,
        columnCount: 0,
        createdAt: invoice.created_at,
        updatedAt: invoice.created_at,
      };
      addInvoice(summary);
      handleClose();
      router.push(`/invoice/${invoice.id}`);
    } catch {
      setError("Failed to create invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">New Invoice</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {error && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Name *</label>
            <input
              autoFocus required
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., January Expenses"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea
              rows={3} value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional description..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()}
              className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors",
                loading || !name.trim() ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700")}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Icon name="plus" size={14} />}
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Backwards compatibility alias
export { CreateInvoiceModal as CreateSpreadsheetModal };