"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { groupsApi, invoicesApi } from "@/lib/api";
import { Group, InvoiceRead } from "@/types";
import AppShell from "@/components/layout/Appshell";
import Icon from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

type GroupWithInvoices = Group & { invoices?: InvoiceRead[] };

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useStore();

  const [group, setGroup] = useState<GroupWithInvoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const groupId = Number(id);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (Number.isNaN(groupId)) {
      setError("Invalid group id.");
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user]);

  const load = () => {
    setLoading(true);
    setError(null);
    groupsApi
      .get(groupId)
      .then((g) => setGroup(g as GroupWithInvoices))
      .catch((e) => setError(e?.message || "Failed to load group."))
      .finally(() => setLoading(false));
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      await groupsApi.remove(groupId);
      router.replace("/dashboard");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete group.";
      setActionError(msg);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleNewInvoice = async () => {
    setCreatingInvoice(true);
    setActionError(null);
    try {
      const invoice = await invoicesApi.create({ groupId, data: {} });
      router.push(`/upload/${invoice.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create invoice.";
      setActionError(msg);
      setCreatingInvoice(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!group) return;
    const prev = group.invoices ?? [];
    setGroup({ ...group, invoices: prev.filter((i) => i.id !== invoiceId) });
    try {
      await invoicesApi.delete(invoiceId);
    } catch (e) {
      // Roll back on failure
      setGroup({ ...group, invoices: prev });
      const msg = e instanceof Error ? e.message : "Failed to delete invoice.";
      setActionError(msg);
    }
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
            <div className="flex gap-2 justify-center">
              <button
                onClick={load}
                className="text-[13px] text-red-700 underline"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-[13px] text-slate-600 underline"
              >
                Back
              </button>
            </div>
          </div>
        ) : group ? (
          <>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors mb-4"
            >
              <Icon name="arrowLeft" size={14} />
              Back to Dashboard
            </button>

            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="min-w-0">
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight truncate">
                  {group.name}
                </h1>
                <p className="text-[13px] text-slate-400 mt-1">
                  {group.invoices?.length ?? 0} invoice
                  {(group.invoices?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
                  {group.columns.length} column
                  {group.columns.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={load}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Icon name="rows" size={14} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-red-200 bg-white text-red-600 rounded-xl text-[13px] font-medium hover:bg-red-50 transition-colors"
                >
                  <Icon name="trash" size={14} />
                  <span className="hidden sm:inline">Delete Group</span>
                </button>
                <button
                  onClick={handleNewInvoice}
                  disabled={creatingInvoice}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-[13px] font-semibold transition-colors shadow-sm"
                >
                  {creatingInvoice ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icon name="upload" size={14} />
                  )}
                  Upload Receipt
                </button>
              </div>
            </div>

            {actionError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-[13px] text-red-600">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span className="flex-1">{actionError}</span>
                <button
                  onClick={() => setActionError(null)}
                  className="text-red-400 hover:text-red-600 shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            <InvoicesTable
              columns={group.columns}
              invoices={group.invoices ?? []}
              onDelete={handleDeleteInvoice}
            />
          </>
        ) : null}
      </div>

      {confirmDelete && group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmDelete(false)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 p-6">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Icon name="trash" size={20} className="text-red-500" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-900 mb-1">
              Delete group?
            </h2>
            <p className="text-[13px] text-slate-500 mb-6">
              <span className="font-semibold text-slate-700">{group.name}</span>{" "}
              and all {group.invoices?.length ?? 0} of its invoices will be
              permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icon name="trash" size={13} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  // Strip currency symbols, thousands separators, and surrounding whitespace.
  // Accepts "Rp 12.500", "$1,234.56", "12.500,50" (treated as European), etc.
  const cleaned = v.replace(/[^\d,.\-]/g, "").trim();
  if (!cleaned) return null;
  let normalized = cleaned;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma > lastDot) {
    // European-style: "12.500,50" -> "12500.50"
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // US-style: "1,234.56" -> "1234.56"
    normalized = cleaned.replace(/,/g, "");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatTotal(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function InvoicesTable({
  columns,
  invoices,
  onDelete,
}: {
  columns: string[];
  invoices: InvoiceRead[];
  onDelete: (id: number) => void;
}) {
  if (columns.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <p className="text-[13px] text-slate-400">
          This group has no columns configured.
        </p>
      </div>
    );
  }

  // Only sum the "Price" column (case-insensitive). Non-numeric values are
  // skipped, not treated as zero.
  const priceColumn = columns.find((c) => c.trim().toLowerCase() === "price");
  let priceSum = 0;
  let priceCount = 0;
  if (priceColumn) {
    for (const inv of invoices) {
      const data = (inv.data ?? {}) as Record<string, unknown>;
      const n = parseNumber(data[priceColumn]);
      if (n !== null) {
        priceSum += n;
        priceCount += 1;
      }
    }
  }
  const showTotal = priceColumn && priceCount > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Created
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-12 text-center text-[13px] text-slate-400"
                >
                  No invoices yet. Click{" "}
                  <span className="font-semibold text-slate-600">
                    Upload Receipt
                  </span>{" "}
                  to add one.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const data = (inv.data ?? {}) as Record<string, unknown>;
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group"
                  >
                    {columns.map((col) => {
                      const val = data[col];
                      return (
                        <td
                          key={col}
                          className="px-4 py-2.5 text-[13px] text-slate-700 max-w-[220px]"
                        >
                          <span className="truncate block">
                            {val !== undefined && val !== null && val !== "" ? (
                              String(val)
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-[12px] text-slate-400 whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete invoice #${inv.id}? This cannot be undone.`,
                            )
                          ) {
                            onDelete(inv.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                        title="Delete invoice"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {showTotal && invoices.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-3 text-[13px] font-semibold text-slate-700 whitespace-nowrap"
                  >
                    {col === priceColumn && (
                      <span>
                        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mr-2">
                          Total
                        </span>
                        {formatTotal(priceSum)}
                      </span>
                    )}
                  </td>
                ))}
                <td />
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
        {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
