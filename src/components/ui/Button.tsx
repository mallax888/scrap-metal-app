import Link from "next/link";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-onbrand hover:bg-brand-strong active:bg-brand-strong shadow-card",
  secondary: "bg-paper text-ink border border-sand hover:border-clay hover:bg-cream/50",
  soft: "bg-cream text-bark hover:bg-sand",
  ghost: "text-bark hover:bg-cream",
  danger: "bg-paper text-bark border border-sand hover:bg-cream",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const BASE =
  "inline-flex items-center justify-center rounded-full font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 whitespace-nowrap";

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading = false,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      className={clsx(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={clsx(BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  );
}
