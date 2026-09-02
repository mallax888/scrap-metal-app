import { clsx } from "clsx";

type Tone = "paper" | "cream" | "ink";

const TONES: Record<Tone, string> = {
  paper: "bg-paper border-sand/70",
  cream: "bg-cream border-sand",
  ink: "bg-ink border-ink text-cream",
};

export function Card({
  children,
  className,
  tone = "paper",
  padded = true,
  interactive = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
  padded?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-card border shadow-card",
        TONES[tone],
        padded && "p-5 sm:p-6",
        interactive && "transition-shadow duration-300 hover:shadow-lift",
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
