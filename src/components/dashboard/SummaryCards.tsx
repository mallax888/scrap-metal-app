"use client";

import Link from "next/link";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { Skeleton } from "@/components/ui/Skeleton";
import { bond, plan, renterScore } from "@/lib/data";
import { money, moneyExact, percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * The four headline figures.
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
  href: string;
  value: string;
  unit?: string;
  caption: string;
  chip?: React.ReactNode;
  first?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        // The whole figure is the target — no "View" link repeated four times.
        "group flex flex-col rounded-tile px-5 py-4 transition-colors duration-200 hover:bg-paper/70",
        !first && "sm:border-l sm:border-sand"
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-clay">
        {label}
      </span>
      <span className="numeric mt-2 text-[38px] font-semibold leading-none tracking-[-0.035em] text-ink">
        {value}
        {unit ? <span className="text-lg font-medium text-mist">{unit}</span> : null}
      </span>
      <span className="mt-2 text-[13px] text-mist">{caption}</span>
      {chip ? <span className="mt-3">{chip}</span> : null}
    </Link>
  );
}

function Chip({
  children,
  tone = "moss",
}: {
  children: React.ReactNode;
  tone?: "moss" | "cream";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "moss" ? "bg-moss-soft text-moss" : "bg-cream text-bark"
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
        label="Bond"
        href="/bond"
        value={money(bond.amount)}
        caption="Held by Tenancy Services"
        chip={
          <Chip>
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Paid &amp; lodged
          </Chip>
        }
      />
      <Stat
        label="Weekly payment"
        href="/payments"
        value={money(plan.weeklyPayment)}
        unit=" / wk"
        caption="Bond repayment"
        chip={<Chip tone="cream">{derived.weeksRemaining} weeks left</Chip>}
      />
      <Stat
        label="Bond paid off"
        href="/bond"
        value={percent(derived.progress)}
        caption={`${moneyExact(derived.totalRepaid)} of ${money(plan.principal)}`}
      />
      <Stat
        label="Renter score"
        href="/score"
        value={String(renterScore.value)}
        unit=" / 100"
        caption={renterScore.band}
        chip={
          <Chip>
            <TrendingUp className="h-3 w-3" aria-hidden />+{renterScore.change} this month
          </Chip>
        }
      />
    </div>
  );
}
