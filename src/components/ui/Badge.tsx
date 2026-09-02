import { clsx } from "clsx";

type Tone = "moss" | "cream" | "bark" | "amber" | "outline";

const TONES: Record<Tone, string> = {
  moss: "bg-moss-soft text-moss",
  cream: "bg-cream text-bark",
  bark: "bg-bark text-cream",
  amber: "bg-amber-soft text-amber-warm",
  outline: "border border-sand text-mist",
};

export function Badge({
  children,
  tone = "cream",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
