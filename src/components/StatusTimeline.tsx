import { clsx } from "clsx";
import { RequestStatus } from "@/lib/types";

const STEPS: RequestStatus[] = ["quoted", "scheduled", "collected", "paid"];
const LABELS: Record<RequestStatus, string> = {
  quoted: "Quoted",
  scheduled: "Scheduled",
  collected: "Collected",
  paid: "Paid",
};

export function StatusTimeline({ status }: { status: RequestStatus }) {
  const activeIndex = STEPS.indexOf(status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <span
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold",
                i <= activeIndex
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
              )}
            >
              {i + 1}
            </span>
            <span
              className={clsx(
                "text-[11px] font-medium",
                i <= activeIndex ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"
              )}
            >
              {LABELS[step]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span
              className={clsx(
                "mx-1 h-0.5 flex-1",
                i < activeIndex ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
