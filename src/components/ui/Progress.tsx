import { clsx } from "clsx";

/**
 * The repayment bar. Width animates on change so an extra payment visibly
 * moves the needle rather than snapping.
 */
export function Progress({
  value,
  className,
  tone = "bark",
  size = "md",
  label,
}: {
  /** 0–1 */
  value: number;
  className?: string;
  tone?: "bark" | "cream" | "moss";
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };
  const track = {
    bark: "bg-blush",
    cream: "bg-onbrand/25",
    moss: "bg-moss-soft",
  };
  const fill = {
    bark: "bg-litchi",
    cream: "bg-onbrand",
    moss: "bg-moss",
  };

  return (
    <div
      className={clsx("w-full overflow-hidden rounded-full", heights[size], track[tone], className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={clsx("h-full rounded-full transition-[width] duration-700 ease-out", fill[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Circular percentage used for the "bond paid off" summary card. */
export function ProgressRing({
  value,
  size = 76,
  stroke = 7,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-blush"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-litchi transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
