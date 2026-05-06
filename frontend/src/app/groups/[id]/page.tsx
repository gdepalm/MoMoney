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
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceRead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState(false);
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

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    if (!group) return;
    const invoiceId = invoiceToDelete.id;
    const prev = group.invoices ?? [];
    setDeletingInvoice(true);
    setGroup({ ...group, invoices: prev.filter((i) => i.id !== invoiceId) });
    try {
      await invoicesApi.delete(invoiceId);
      setInvoiceToDelete(null);
    } catch (e) {
      // Roll back on failure
      setGroup({ ...group, invoices: prev });
      const msg = e instanceof Error ? e.message : "Failed to delete invoice.";
      setActionError(msg);
    } finally {
      setDeletingInvoice(false);
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
            <p className="mb-3 text-sm text-red-600">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={load}
                className="text-sm text-red-700 underline"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-emerald-800 underline"
              >
                Back
              </button>
            </div>
          </div>
        ) : group ? (
          <>
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-emerald-800/65 transition-colors hover:text-emerald-950"
            >
              <Icon name="arrowLeft" size={14} />
              Back to Dashboard
            </button>

            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="min-w-0">
                <h1 className="truncate font-display text-3xl font-semibold text-emerald-950">
                  {group.name}
                </h1>
                <p className="mt-1 text-sm text-emerald-950/60">
                  {group.invoices?.length ?? 0} invoice
                  {(group.invoices?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
                  {group.columns.length} column
                  {group.columns.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={load}
                  type="button"
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white/90 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm shadow-emerald-950/5 transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <Icon name="refreshCw" size={14} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Icon name="trash" size={14} />
                  <span className="hidden sm:inline">Delete Group</span>
                </button>
                <button
                  onClick={handleNewInvoice}
                  disabled={creatingInvoice}
                  type="button"
                  className="flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-800 disabled:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
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
              onDelete={setInvoiceToDelete}
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
            <h2 className="mb-1 text-lg font-bold text-emerald-950">
              Delete group?
            </h2>
            <p className="mb-6 text-sm text-emerald-950/65">
              <span className="font-semibold text-slate-700">{group.name}</span>{" "}
              and all {group.invoices?.length ?? 0} of its invoices will be
              permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
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

      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !deletingInvoice && setInvoiceToDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/10">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <Icon name="trash" size={20} className="text-red-500" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-emerald-950">
              Delete invoice?
            </h2>
            <p className="mb-6 text-sm text-emerald-950/65">
              Invoice #{invoiceToDelete.id} will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setInvoiceToDelete(null)}
                disabled={deletingInvoice}
                className="flex-1 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInvoice}
                disabled={deletingInvoice}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deletingInvoice ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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
  const hasComma = lastComma !== -1;
  const hasDot = lastDot !== -1;
  if (hasComma && hasDot && lastComma > lastDot) {
    // European-style: "12.500,50" -> "12500.50"
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma && hasDot) {
    // US-style: "1,234.56" -> "1234.56"
    normalized = cleaned.replace(/,/g, "");
  } else if (hasDot) {
    const parts = cleaned.split(".");
    const isThousands = parts.length > 1 && parts.slice(1).every((p) => p.length === 3);
    normalized = isThousands ? cleaned.replace(/\./g, "") : cleaned;
  } else if (hasComma) {
    const parts = cleaned.split(",");
    const isThousands = parts.length > 1 && parts.slice(1).every((p) => p.length === 3);
    normalized = isThousands ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
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

function isMoneyColumn(column: string): boolean {
  const normalized = column
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (/\b(price|amount|cost|harga|jumlah)\b/.test(normalized)) return true;
  return [
    "total",
    "subtotal",
    "grand total",
    "total pembayaran",
    "total belanja",
  ].includes(normalized);
}

function normalizeColumnKey(column: string): string {
  return column.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function getColumnValue(
  data: Record<string, unknown>,
  column: string,
): unknown {
  if (Object.prototype.hasOwnProperty.call(data, column)) {
    return data[column];
  }

  const target = normalizeColumnKey(column);
  const matchingKey = Object.keys(data).find(
    (key) => normalizeColumnKey(key) === target,
  );

  return matchingKey ? data[matchingKey] : undefined;
}

function InvoicesTable({
  columns,
  invoices,
  onDelete,
}: {
  columns: string[];
  invoices: InvoiceRead[];
  onDelete: (invoice: InvoiceRead) => void;
}) {
  if (columns.length === 0) {
    return (
      <div className="bg-white border border-emerald-100 rounded-2xl p-12 text-center">
        <p className="text-sm text-emerald-950/60">
          This group has no columns configured.
        </p>
      </div>
    );
  }

  // Sum the best matching money column. Non-numeric values are skipped, not
  // treated as zero.
  const priceColumn = columns.find(isMoneyColumn);
  let priceSum = 0;
  if (priceColumn) {
    for (const inv of invoices) {
      const data = (inv.data ?? {}) as Record<string, unknown>;
      const n = parseNumber(getColumnValue(data, priceColumn));
      if (n !== null) {
        priceSum += n;
      }
    }
  }
  const leadingColumns = priceColumn
    ? columns.filter((col) => col !== priceColumn)
    : columns;
  const showTotal = priceColumn && invoices.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="border-b border-emerald-100 bg-white">
              {leadingColumns.map((col) => (
                <th
                  key={col}
                  className="border-r border-emerald-100 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-emerald-700/80 last:border-r-0 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              <th className="border-r border-emerald-100 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-emerald-700/80 whitespace-nowrap">
                Created
              </th>
              {priceColumn && (
                <th className="border-r border-emerald-100 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-emerald-700/80 whitespace-nowrap">
                  {priceColumn}
                </th>
              )}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-12 text-center text-sm text-emerald-950/60"
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
                    className="border-b border-emerald-100 transition-colors last:border-0 hover:bg-emerald-50/30 group"
                  >
                    {leadingColumns.map((col) => {
                      const val = getColumnValue(data, col);
                      return (
                        <td
                          key={col}
                          className="max-w-[220px] border-r border-emerald-100 px-4 py-3 text-sm text-emerald-950/75 last:border-r-0"
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
                    <td className="border-r border-emerald-100 px-4 py-3 text-sm text-emerald-950/55 whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    {priceColumn &&
                      (() => {
                        const priceValue = getColumnValue(data, priceColumn);
                        return (
                          <td className="max-w-[220px] border-r border-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-950">
                            <span className="block truncate">
                              {priceValue !== undefined &&
                              priceValue !== null &&
                              priceValue !== "" ? (
                                String(priceValue)
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </span>
                          </td>
                        );
                      })()}
                    <td className="px-2 py-2.5 text-right">
                      <button
                        onClick={() => onDelete(inv)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        title="Delete invoice"
                        aria-label={`Delete invoice #${inv.id}`}
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
              <tr className="border-t-2 border-emerald-200 bg-white">
                {leadingColumns.map((col) => (
                  <td
                    key={col}
                    className="border-r border-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-950/75 whitespace-nowrap"
                  />
                ))}
                <td className="border-r border-emerald-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-emerald-700/80">
                  Total
                </td>
                <td className="border-r border-emerald-100 px-4 py-3 text-sm font-bold text-emerald-900 whitespace-nowrap">
                  {formatTotal(priceSum)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="border-t border-emerald-100 bg-white px-4 py-2.5 text-xs text-emerald-700/70">
        {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
