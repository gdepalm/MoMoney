"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type StepStatus = "pending" | "active" | "done";

const STEPS = [
  { label: "Reading receipt image",  sub: "Analyzing visual content…"       },
  { label: "Extracting line items",  sub: "Parsing merchant & amounts…"     },
  { label: "Structuring data",       sub: "Mapping to your columns…"        },
];

interface Props { forceDone?: boolean; }

export default function AIProcessing({ forceDone }: Props) {
  const [statuses, setStatuses] = useState<StepStatus[]>(["active", "pending", "pending"]);

  useEffect(() => {
    if (forceDone) { setStatuses(["done", "done", "done"]); return; }
    const t1 = setTimeout(() => setStatuses(["done", "active", "pending"]), 1200);
    const t2 = setTimeout(() => setStatuses(["done", "done", "active"]),   2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [forceDone]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Icon name="scan" size={26} stroke={1.75} className="text-emerald-600 animate-spin" />
      </div>
      <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">AI Processing Receipt</h3>
      <p className="text-[13px] text-slate-400 mt-1.5">Extracting data from your image…</p>

      <div className="mt-6 space-y-1 text-left">
        {STEPS.map((step, i) => {
          const s = statuses[i];
          return (
            <div key={i} className="flex items-start gap-3 py-2.5">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 text-[11px] font-bold",
                s === "done"   && "bg-emerald-100 text-emerald-600",
                s === "active" && "bg-emerald-600 text-white",
                s === "pending"&& "bg-slate-100 text-slate-300")}>
                {s === "done" ? <Icon name="check" size={12} stroke={3} /> : s === "active" ? "·" : ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[13px] font-medium transition-colors",
                  s === "done"    && "text-emerald-600",
                  s === "active"  && "text-slate-800",
                  s === "pending" && "text-slate-300")}>
                  {step.label}
                </p>
                {s === "active" && (
                  <>
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.sub}</p>
                    <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full animate-[fillBar_1.8s_ease_forwards]" />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}