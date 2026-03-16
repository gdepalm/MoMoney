import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { UploadPhase } from "@/types";

interface Props { phase: UploadPhase; }

const STEPS = ["Upload", "AI Processing", "Preview & Confirm"] as const;

function phaseToStep(phase: UploadPhase): number {
  if (phase === "drop") return 0;
  if (phase === "processing") return 1;
  return 2;
}

export default function UploadSteps({ phase }: Props) {
  const current = phaseToStep(phase);

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const pending = i > current;
        return (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all",
              done    && "bg-emerald-600 text-white",
              active  && "bg-emerald-50 text-emerald-700 border-2 border-emerald-600",
              pending && "bg-slate-100 text-slate-400")}>
              {done ? <Icon name="check" size={11} stroke={3} /> : String(i + 1)}
            </div>
            <span className={cn("text-[12px] font-semibold",
              done    && "text-emerald-600",
              active  && "text-emerald-700",
              pending && "text-slate-400")}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2 rounded-full", done ? "bg-emerald-500" : "bg-slate-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}