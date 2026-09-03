import { clsx } from "clsx";

type Tone = "paper" | "cream" | "ink";

const TONES: Record<Tone, string> = {
  paper: "bg-paper",
  cream: "bg-cream",
  ink: "bg-hero text-onbrand",
};

/**
 * Border and shadow both say "separate object". Spending both on every block
 * flattens the page, so they are alternatives rather than a pair: `flat` is the
 * default and `raised` is reserved for the few things that outrank the rest.
 */
const ELEVATION = {
  flat: "border border-sand/70",
  raised: "shadow-card",
} as const;

export function Card({
  children,
  className,
  tone = "paper",
  padded = true,
  interactive = false,
  elevation = "flat",
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
  padded?: boolean;
  interactive?: boolean;
  elevation?: keyof typeof ELEVATION;
}) {
  return (
    <div
      className={clsx(
        "rounded-card",
        TONES[tone],
        ELEVATION[elevation],
        padded && "p-5 sm:p-6",
        interactive &&
          "transition-[border-color,box-shadow] duration-300 hover:border-clay/60 hover:shadow-card",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={clsx(
        "text-[11px] font-semibold uppercase tracking-[0.14em] text-mist",
        className
      )}
    >
      {children}
    </p>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={clsx("text-lg font-semibold tracking-tight text-ink", className)}>
      {children}
    </h2>
  );
}
