"use client";

import { useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  preview: string | null;
  fileName: string;
  onClear: () => void;
  disabled?: boolean;
}

export default function UploadDropzone({ onFile, preview, fileName, onClear, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type.startsWith("image/") || f.type === "application/pdf") onFile(f);
  };

  if (preview) return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <Icon name="fileText" size={48} stroke={1} className="text-slate-300 mb-3" />
        <p className="text-[13px] font-medium text-slate-600">{fileName}</p>
        <p className="text-[11px] text-slate-400 mt-1">Ready for AI processing</p>
      </div>
      <button onClick={onClear} disabled={disabled}
        className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-40">
        <Icon name="x" size={12} />
      </button>
    </div>
  );

  return (
    <label
      className={cn(
        "flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all",
        dragging ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) { const f = e.dataTransfer.files[0]; if (f) handleFile(f); } }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
    >
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
        dragging ? "bg-emerald-100 text-emerald-600" : "bg-white border border-slate-200 text-slate-400")}>
        <Icon name={dragging ? "upload" : "image"} size={24} stroke={1.5} />
      </div>
      <div className="text-center">
        <p className="text-[14px] font-semibold text-slate-700">{dragging ? "Drop your receipt here" : "Drag & drop receipt image"}</p>
        <p className="text-[12px] text-slate-400 mt-1">or click to browse · JPG, PNG, PDF supported</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} disabled={disabled} />
    </label>
  );
}