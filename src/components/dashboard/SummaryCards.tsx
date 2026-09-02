"use client";

import Link from "next/link";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/Progress";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { bond, plan, renterScore } from "@/lib/data";
import { money, moneyExact, percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

function SummaryCard({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card interactive className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <CardLabel>{label}</CardLabel>
        <Link
          href={href}
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay transition-colors hover:text-bark"
        >
          View
        </Link>
      </div>
      {children}
    </Card>
  );
}

export function SummaryCards() {
  const { derived, ready } = useLitchi();

  if (!ready) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <SkeletonCard key={key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Bond" href="/bond">
        <p className="numeric mt-4 text-[34px] font-semibold leading-none text-ink">
          {money(bond.amount)}
        </p>
        <p className="mt-2 text-sm text-mist">Bond amount</p>
        <div className="mt-4">
          <Badge tone="moss">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Paid &amp; lodged
          </Badge>
        </div>
        <p className="mt-3 text-xs text-mist">Held securely by Tenancy Services</p>
      </SummaryCard>

      <SummaryCard label="Weekly Litchi payment" href="/payments">
        <p className="numeric mt-4 text-[34px] font-semibold leading-none text-ink">
          {money(plan.weeklyPayment)}
          <span className="text-base font-medium text-mist"> / week</span>
        </p>
        <p className="mt-2 text-sm text-mist">Bond repayment</p>
        <p className="numeric mt-auto pt-4 text-sm font-medium text-bark">
          {derived.weeksRemaining} weeks remaining
        </p>
      </SummaryCard>

      <SummaryCard label="Bond paid off" href="/bond">
        <div className="mt-4 flex items-center gap-4">
          <ProgressRing value={derived.progress} size={74} stroke={7}>
            <span className="numeric text-lg font-semibold text-ink">
              {percent(derived.progress)}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="numeric text-sm font-semibold text-ink">
              {moneyExact(derived.totalRepaid)}
            </p>
            <p className="numeric text-sm text-mist">of {money(plan.principal)} repaid</p>
          </div>
        </div>
      </SummaryCard>

      <SummaryCard label="Renter score" href="/score">
        <p className="numeric mt-4 text-[34px] font-semibold leading-none text-ink">
          {renterScore.value}
          <span className="text-base font-medium text-mist"> / 100</span>
        </p>
        <p className="mt-2 text-sm text-mist">{renterScore.band}</p>
        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-moss">
          <TrendingUp className="h-4 w-4" aria-hidden />
          <span className="numeric">+{renterScore.change}</span>
          <span className="font-normal text-mist">{renterScore.changeWindow}</span>
        </div>
      </SummaryCard>
    </div>
  );
}
