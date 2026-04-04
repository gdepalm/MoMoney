"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { invoicesApi, receiptApi } from "@/lib/api";
import { Invoice, ExtractedItem } from "@/types";
import { SAMPLE_COLUMNS, EXTRACTED_PREVIEW } from "@/lib/data";
import AppShell from "@/components/layout/Appshell";
import UploadDropzone from "@/components/upload/UploadDropzone";
import UploadSteps from "@/components/upload/UploadSteps";
import AIProcessing from "@/components/upload/AIProcessing";
import ReceiptPreview from "@/components/upload/ReceiptPreview";
import Icon from "@/components/ui/Icon";

export const dynamic = 'force-dynamic';

export default function UploadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, uploadPhase, uploadedFile, uploadedImageUrl, jobId, aiPreviewData,
    uploadError, setUploadPhase, setUploadedFile, setUploadedImageUrl,
    setJobId, setAiPreviewData, setUploadError, resetUpload } = useStore();

  const [sheet, setSheet] = useState<Invoice | null>(null);
  const [sheetLoading, setSheetLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    resetUpload();
    invoicesApi.get(id).then((s) => {
      // Transform backend response to frontend Invoice format
      const invoice: Invoice = {
        id: String(s.id),
        name: s.data?.name || `Invoice #${s.id}`,
        description: s.data?.description,
        columns: [],
        rows: [],
        rowCount: 0,
        columnCount: 0,
        createdAt: s.created_at,
        updatedAt: s.created_at,
      };
      setSheet(invoice);
    }).finally(() => setSheetLoading(false));
  }, [id, user]);

  const handleFile = (file: File) => {
    setUploadedFile(file);
    setUploadedImageUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    setUploadError(null);
    setUploadPhase("processing");
    try {
      const { jobId: jId, preview } = await receiptApi.upload(id, uploadedFile);
      setJobId(jId);
      setAiPreviewData(preview);
      setUploadPhase("preview");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUploadError(msg ?? "Upload failed. Please try again.");
      setUploadPhase("drop");
    }
  };

  const handleConfirm = async (items: ExtractedItem[]) => {
    if (!jobId) return;
    setConfirmLoading(true);
    try {
      await receiptApi.insertToSheet(id, jobId, items);
      setUploadPhase("done");
    } catch {
      setUploadError("Failed to insert data. Please try again.");
    } finally {
      setConfirmLoading(false);
    }
  };

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (uploadPhase === "done") return (
    <AppShell>
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Icon name="checkCircle" size={40} stroke={1.5} className="text-emerald-600" />
          </div>
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight mb-2">Inserted Successfully!</h2>
          <p className="text-[14px] text-slate-400 mb-8 leading-relaxed">
            Your receipt data has been added to{" "}
            <strong className="text-slate-700">{sheet?.name}</strong>.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push(`/invoice/${id}`)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-colors">
              View Invoice <Icon name="arrowRight" size={15} />
            </button>
            <button onClick={resetUpload}
              className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-colors">
              Upload Another Receipt
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );

  // ── Columns for the invoice (fall back to sample) ───────────────────────
  const columns = sheet?.columns ?? SAMPLE_COLUMNS;

  // ── Preview data: real AI data or sample fallback ────────────────────────────
  const previewItems = aiPreviewData?.items ?? EXTRACTED_PREVIEW;
  const previewConfidence = aiPreviewData?.confidence ?? 0.94;

  return (
    <AppShell>
      <div className="p-8 max-w-2xl mx-auto">
        {/* Back */}
        <button onClick={() => router.push(`/invoice/${id}`)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors mb-4">
          <Icon name="arrowLeft" size={14} />
          Back to {sheetLoading ? "Invoice" : (sheet?.name ?? "Invoice")}
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Upload Receipt</h1>
          <p className="text-[13px] text-slate-400 mt-1">Extract data with AI and insert into invoice</p>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <UploadSteps phase={uploadPhase} />
        </div>

        {/* Error banner */}
        {uploadError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-[13px] text-red-600">
            <span className="mt-0.5 flex-shrink-0">⚠</span>
            <span className="flex-1">{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
          </div>
        )}

        {/* ── Step 1: Drop ───────────────────────────────────────────────────── */}
        {uploadPhase === "drop" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <UploadDropzone
                onFile={handleFile}
                preview={uploadedImageUrl}
                fileName={uploadedFile?.name ?? ""}
                onClear={() => { setUploadedFile(null); setUploadedImageUrl(null); }}
              />
            </div>

            {/* Sample file shortcuts */}
            {!uploadedFile && (
              <div className="flex gap-2">
                {["receipt-sample.jpg", "coffee-receipt.png", "invoice.pdf"].map((name) => (
                  <button key={name}
                    onClick={() => { setUploadedImageUrl("demo"); setUploadedFile(new File([], name)); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-medium text-slate-500 transition-colors truncate px-2">
                    <Icon name="fileText" size={12} />
                    <span className="truncate">{name}</span>
                  </button>
                ))}
              </div>
            )}

            {uploadedFile && (
              <button onClick={handleUpload}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[13px] font-semibold transition-colors shadow-sm">
                Extract Data with AI
                <Icon name="zap" size={15} />
              </button>
            )}
          </div>
        )}

        {/* ── Step 2: Processing ─────────────────────────────────────────────── */}
        {uploadPhase === "processing" && <AIProcessing />}

        {/* ── Step 3: Preview ────────────────────────────────────────────────── */}
        {uploadPhase === "preview" && (
          <ReceiptPreview
            items={previewItems}
            columns={columns}
            confidence={previewConfidence}
            onConfirm={handleConfirm}
            loading={confirmLoading}
          />
        )}
      </div>
    </AppShell>
  );
}