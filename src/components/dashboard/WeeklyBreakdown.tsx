"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { plan, tenancy } from "@/lib/data";
import { money } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * Rent and the Litchi repayment are two different payments to two different
 * parties. They are always shown as separate lines, never merged.
 */
export function WeeklyBreakdown({ showRentLink = true }: { showRentLink?: boolean } = {}) {
  const { derived } = useLitchi();

  const lines = [
    {
      label: "Rent",
      to: tenancy.landlordAgency,
      amount: tenancy.rentWeekly,
      dot: "bg-clay",
    },
    {
      label: "Litchi bond repayment",
      to: "Litchi Bond Assist",
      amount: plan.weeklyPayment,
      dot: "bg-litchi",
    },
  ];

  const rentShare = tenancy.rentWeekly / derived.totalWeeklyHousing;

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Your weekly housing</CardTitle>
          <p className="mt-1 text-sm text-mist">Two separate payments, shown separately.</p>
        </div>
        {showRentLink ? (
          <Link
            href="/rent"
            className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-bark transition-colors hover:text-ink"
          >
            Rent
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      {/* Proportional bar: rent vs Litchi repayment. */}
      <div className="mt-6 flex h-2.5 w-full overflow-hidden rounded-full bg-sand" aria-hidden>
        <div className="h-full bg-clay" style={{ width: `${rentShare * 100}%` }} />
        <div className="h-full flex-1 bg-litchi" />
      </div>

      <dl className="mt-6 divide-y divide-sand/70">
        {lines.map((line) => (
          <div key={line.label} className="flex items-center justify-between gap-4 py-3.5">
            <dt className="flex min-w-0 items-center gap-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${line.dot}`} aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{line.label}</span>
                <span className="block truncate text-xs text-mist">to {line.to}</span>
              </span>
            </dt>
            <dd className="numeric shrink-0 text-sm font-semibold text-ink">
              {money(line.amount)}
              <span className="font-normal text-mist"> / wk</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex items-baseline justify-between gap-4 rounded-tile bg-cream/70 px-4 py-3.5">
        <span className="text-sm font-medium text-ink">Total weekly housing payment</span>
        <span className="numeric text-lg font-semibold text-ink">
          {money(derived.totalWeeklyHousing)}
        </span>
      </div>
    </Card>
  );
}
