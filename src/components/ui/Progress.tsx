import { clsx } from "clsx";

/**
 * Tones carry meaning, so pick by what the bar measures — not by what looks
 * good next to it:
 *
 *   litchi — money owed to Litchi. The bond payoff, and nothing else.
 *   moss   — how the renter is doing. Score factors, savings, anything where
 *            a full bar is good news.
 *   cream  — sits on a dark slab, where neither of the above survives.
 *
 * Red on a "you're doing well" measure reads as a warning, which is why the
 * score is not litchi even though litchi is the brand colour.
 */
type Tone = "litchi" | "cream" | "moss";

const TRACK: Record<Tone, string> = {
  litchi: "bg-blush",
  cream: "bg-onbrand/25",
  moss: "bg-moss-soft",
};

const FILL: Record<Tone, string> = {
  litchi: "bg-litchi",
  cream: "bg-onbrand",
  moss: "bg-moss",
};

/**
 * The repayment bar. Width animates on change so an extra payment visibly
 * moves the needle rather than snapping.
 */
export function Progress({
  value,
  className,
  tone = "litchi",
  size = "md",
  label,
  decorative = false,
}: {
  /** 0–1 */
  value: number;
  className?: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  label?: string;
  /**
   * Set where the same figure is already on the page as text. The bar is then
   * a picture of a number a screen reader has just read out, so announcing it
   * again as a progressbar only makes the page longer to listen to.
   */
  decorative?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };

  const semantics = decorative
    ? ({ "aria-hidden": true } as const)
    : ({
        role: "progressbar",
        "aria-valuenow": Math.round(pct),
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-label": label,
      } as const);

  return (
    <div
      className={clsx("w-full overflow-hidden rounded-full", heights[size], TRACK[tone], className)}
      {...semantics}
    >
      <div
        className={clsx("h-full rounded-full transition-[width] duration-700 ease-out", FILL[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const RING_TRACK: Record<Tone, string> = {
  litchi: "stroke-blush",
  cream: "stroke-onbrand/25",
  moss: "stroke-moss-soft",
};

const RING_FILL: Record<Tone, string> = {
  litchi: "stroke-litchi",
  cream: "stroke-onbrand",
  moss: "stroke-moss",
};

/** Circular percentage used for bond payoff and the Litchi Score. */
export function ProgressRing({
  value,
  size = 76,
  stroke = 7,
  tone = "litchi",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
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
          className={RING_TRACK[tone]}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={clsx(
            "transition-[stroke-dashoffset] duration-700 ease-out",
            RING_FILL[tone]
          )}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
