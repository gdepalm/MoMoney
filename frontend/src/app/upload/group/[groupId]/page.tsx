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

export default function GroupUploadPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const {
    user,
    uploadPhase,
    uploadedFile,
    uploadedImageUrl,
    aiPreviewData,
    uploadError,
    setUploadPhase,
    setUploadedFile,
    setUploadedImageUrl,
    setAiPreviewData,
    setUploadError,
    resetUpload,
  } = useStore();

  const [groupName, setGroupName] = useState<string>("");
  const [groupColumns, setGroupColumns] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    resetUpload();
    setLoadingMeta(true);
    setMetaError(null);
    groupsApi
      .get(Number(groupId))
      .then((group) => {
        setGroupName(group.name);
        setGroupColumns(group.columns ?? []);
      })
      .catch((e) => {
        setMetaError(e?.message || "Failed to load group.");
      })
      .finally(() => setLoadingMeta(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user]);

  const handleFile = (file: File) => {
    setUploadedFile(file);
    setUploadedImageUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    setUploadError(null);
    setUploadPhase("processing");
    try {
      const { preview } = await receiptApi.uploadForGroup(Number(groupId), uploadedFile);
      setAiPreviewData(preview);
      setUploadPhase("preview");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(msg);
      setUploadPhase("drop");
    }
  };

  const handleConfirm = async (items: ExtractedItem[]) => {
    setConfirmLoading(true);
    setUploadError(null);
    try {
      await Promise.all(
        items.map((item) =>
          invoicesApi.create({
            groupId: Number(groupId),
            data: item as Record<string, unknown>,
          }),
        ),
      );
      setUploadPhase("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to insert data.";
      setUploadError(msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  const goBackToGroup = () => {
    router.push(`/groups/${groupId}`);
  };

  const handleUploadAnother = () => {
    resetUpload();
    router.push(`/upload/group/${groupId}`);
  };

  // ── Done screen ───────────────────────────────────────────────────────────
  if (uploadPhase === "done")
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full p-4 sm:p-8">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Icon
                name="checkCircle"
                size={40}
                stroke={1.5}
                className="text-emerald-600"
              />
            </div>
            <h2 className="mb-2 font-display text-[26px] font-semibold text-emerald-950">
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
                className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-colors"
              >
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

  const previewColumns: Column[] = groupColumns.map((name, idx) => ({
    id: name,
    name,
    type: "text",
    order: idx,
  }));
  const previewItems = aiPreviewData?.items ?? [];

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-2xl mx-auto">
        <button
          onClick={goBackToGroup}
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <Icon name="arrowLeft" size={14} />
          Back to {loadingMeta ? "Group" : groupName || "Group"}
        </button>

        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-emerald-950">
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
            onConfirm={handleConfirm}
            loading={confirmLoading}
          />
        )}
      </div>
    </AppShell>
  );
}
