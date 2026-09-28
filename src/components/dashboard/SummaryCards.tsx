"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { Skeleton } from "@/components/ui/Skeleton";
import { plan } from "@/lib/data";
import { formatDateShort, money, moneyExact, percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * The four headline figures of the repayment plan.
 *
 * All four are about the plan itself, which is what this page is for. The bond
 * and the renter score used to sit here, from when this was the app's home
 * screen; they belong to their own pages and to the move, and repeating them
 * here made the plan look like a digest of everything rather than the detail
 * of one thing.
 *
 * Deliberately *not* four cards. Card chrome around each one spent most of the
 * width on borders and padding, forced the numbers small, and — because every
 * other block on the page carried the same border and shadow — ranked these no
 * higher than anything else. As one hairline-divided row they get the space to
 * be read as the headline they are.
 */
function Stat({
  label,
  href,
  value,
  unit,
  caption,
  chip,
  first,
}: {
  label: string;
  /** Omitted where the figure is already on the page it would link to. */
  href?: string;
  value: string;
  unit?: string;
  caption: string;
  chip?: React.ReactNode;
  first?: boolean;
}) {
  const className = clsx(
    // The whole figure is the target — no "View" link repeated four times.
    "group flex flex-col rounded-tile px-5 py-4",
    href && "transition-colors duration-200 hover:bg-paper/70",
    !first && "sm:border-l sm:border-sand"
  );

  const body = (
    <>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-clay">
        {label}
      </span>
      <span className="numeric mt-2 text-[38px] font-semibold leading-none tracking-[-0.035em] text-ink">
        {value}
        {unit ? <span className="text-lg font-medium tracking-normal text-mist">{unit}</span> : null}
      </span>
      <span className="mt-2 text-[13px] text-mist">{caption}</span>
      {chip ? <span className="mt-3">{chip}</span> : null}
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Chip({
  children,
  tone = "moss",
}: {
  children: React.ReactNode;
  tone?: "moss" | "cream" | "amber";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "moss"
          ? "bg-moss-soft text-moss"
          : tone === "amber"
            ? "bg-amber-soft text-amber-warm"
            : "bg-cream text-bark"
      )}
    >
      {children}
    </span>
  );
}

export function SummaryCards() {
  const { derived, ready } = useLitchi();

  if (!ready) {
    return (
      <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="px-5 py-4">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-3 h-9 w-32" />
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <Stat
        first
        label="Weekly payment"
        href="/payments"
        value={money(plan.weeklyPayment)}
        unit=" / wk"
        caption="Every Friday, by direct debit"
        chip={<Chip tone="cream">{derived.weeksRemaining} weeks left</Chip>}
      />
      {/* Not "Bond paid off": the figure underneath is measured against the
          total repayable, and calling that the bond is the exact conflation
          the fee split exists to prevent. */}
      <Stat
        label="Paid off"
        value={percent(derived.progress)}
        caption={`${moneyExact(derived.totalRepaid)} of ${money(plan.totalRepayable)}`}
      />
      <Stat
        label="Still to repay"
        value={moneyExact(derived.balance)}
        caption={`${money(plan.principal)} bond plus the ${money(plan.fee)} fee`}
      />
      <Stat
        label="Finishes"
        value={formatDateShort(derived.payoffDate)}
        caption={derived.weeksSaved > 0 ? "Brought forward by extra payments" : "On the original schedule"}
        chip={
          derived.weeksSaved > 0 ? (
            <Chip>
              <TrendingUp className="h-3 w-3" aria-hidden />
              {derived.weeksSaved} {derived.weeksSaved === 1 ? "week" : "weeks"} early
            </Chip>
          ) : undefined
        }
      />
    </div>
  );
}
