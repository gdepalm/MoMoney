"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { invoicesApi, receiptApi, groupsApi } from "@/lib/api";
import { Column, ExtractedItem } from "@/types";
import AppShell from "@/components/layout/Appshell";
import UploadDropzone from "@/components/upload/UploadDropzone";
import UploadSteps from "@/components/upload/UploadSteps";
import AIProcessing from "@/components/upload/AIProcessing";
import ReceiptPreview from "@/components/upload/ReceiptPreview";
import Icon from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    user,
    uploadPhase,
    uploadedFile,
    uploadedImageUrl,
    jobId,
    aiPreviewData,
    uploadError,
    setUploadPhase,
    setUploadedFile,
    setUploadedImageUrl,
    setJobId,
    setAiPreviewData,
    setUploadError,
    resetUpload,
  } = useStore();

  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [groupColumns, setGroupColumns] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [uploadingAnother, setUploadingAnother] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    resetUpload();
    setLoadingMeta(true);
    setMetaError(null);
    invoicesApi
      .get(id)
      .then(async (inv) => {
        setGroupId(inv.group_id);
        const group = await groupsApi.get(inv.group_id);
        setGroupName(group.name);
        setGroupColumns(group.columns ?? []);
      })
      .catch((e) => {
        setMetaError(e?.message || "Failed to load invoice.");
      })
      .finally(() => setLoadingMeta(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(msg);
      setUploadPhase("drop");
    }
  };

  const handleConfirm = async (items: ExtractedItem[]) => {
    if (!jobId) return;
    setConfirmLoading(true);
    setUploadError(null);
    try {
      await receiptApi.insertToSheet(id, jobId, items);
      // Each preview row becomes its own invoice (= one row in the group page).
      // The original invoice (created when the user opened the upload page)
      // gets the first item; remaining items become new invoices in the same
      // group so manually-added rows actually show up.
      const [first, ...rest] = items;
      if (first) {
        await invoicesApi.update(id, {
          data: first as Record<string, unknown>,
        });
      }
      if (rest.length > 0 && groupId !== null) {
        await Promise.all(
          rest.map((item) =>
            invoicesApi.create({
              groupId,
              data: item as Record<string, unknown>,
            }),
          ),
        );
      }
      setUploadPhase("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to insert data.";
      setUploadError(msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  const goBackToGroup = () => {
    if (groupId !== null) router.push(`/groups/${groupId}`);
    else router.push("/dashboard");
  };

  const handleUploadAnother = async () => {
    if (groupId === null) return;
    setUploadingAnother(true);
    setUploadError(null);
    try {
      const invoice = await invoicesApi.create({ groupId, data: {} });
      resetUpload();
      router.push(`/upload/${invoice.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start a new upload.";
      setUploadError(msg);
      setUploadingAnother(false);
    }
  };

  // ── Done screen ───────────────────────────────────────────────────────────
  if (uploadPhase === "done")
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Icon
                name="checkCircle"
                size={40}
                stroke={1.5}
                className="text-emerald-600"
              />
            </div>
            <h2 className="text-[26px] font-bold text-slate-900 tracking-tight mb-2">
              Inserted Successfully!
            </h2>
            <p className="text-[14px] text-slate-400 mb-8 leading-relaxed">
              Your receipt data has been added to{" "}
              <strong className="text-slate-700">
                {groupName || "the group"}
              </strong>
              .
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={goBackToGroup}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-colors"
              >
                Back to Group <Icon name="arrowRight" size={15} />
              </button>
              <button
                onClick={handleUploadAnother}
                disabled={uploadingAnother || groupId === null}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {uploadingAnother && (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                )}
                Upload Another Receipt
              </button>
              {uploadError && (
                <p className="text-[12px] text-red-600 mt-1">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );

  // Build Column[] from group's string columns for the preview component.
  const previewColumns: Column[] = groupColumns.map((name, idx) => ({
    id: name,
    name,
    type: "text",
    order: idx,
  }));
  const previewItems = aiPreviewData?.items ?? [];
  const previewConfidence = aiPreviewData?.confidence ?? 0.94;

  return (
    <AppShell>
      <div className="p-8 max-w-2xl mx-auto">
        <button
          onClick={goBackToGroup}
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <Icon name="arrowLeft" size={14} />
          Back to {loadingMeta ? "Group" : groupName || "Group"}
        </button>

        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Upload Receipt
          </h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Extract data with AI and add it to{" "}
            <strong className="text-slate-700">{groupName || "the group"}</strong>
          </p>
        </div>

        <div className="mb-8">
          <UploadSteps phase={uploadPhase} />
        </div>

        {(uploadError || metaError) && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-[13px] text-red-600">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span className="flex-1">{uploadError || metaError}</span>
            <button
              onClick={() => {
                setUploadError(null);
                setMetaError(null);
              }}
              className="text-red-400 hover:text-red-600 shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {uploadPhase === "drop" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <UploadDropzone
                onFile={handleFile}
                preview={uploadedImageUrl}
                fileName={uploadedFile?.name ?? ""}
                onClear={() => {
                  setUploadedFile(null);
                  setUploadedImageUrl(null);
                }}
              />
            </div>

            {uploadedFile && (
              <button
                onClick={handleUpload}
                disabled={loadingMeta}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl text-[13px] font-semibold transition-colors shadow-sm"
              >
                Extract Data with AI
                <Icon name="zap" size={15} />
              </button>
            )}
          </div>
        )}

        {uploadPhase === "processing" && <AIProcessing />}

        {uploadPhase === "preview" && (
          <ReceiptPreview
            items={previewItems}
            columns={previewColumns}
            confidence={previewConfidence}
            onConfirm={handleConfirm}
            loading={confirmLoading}
          />
        )}
      </div>
    </AppShell>
  );
}
