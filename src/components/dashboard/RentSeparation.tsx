"use client";

import { Building2, Info, PiggyBank } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { plan, rent, tenancy } from "@/lib/data";
import { formatDayDate, money } from "@/lib/format";

/**
 * What rent is, and what it isn't.
 *
 * This used to be a whole screen called "Rent", which was a page named after
 * the one thing Litchi does not do — so the nav implied it, and the page then
 * spent its content correcting the impression the nav had created. Worse, it
 * ended on an invitation to join a waitlist for paying rent through Litchi,
 * directly contradicting the promise three paragraphs above it.
 *
 * The claim is worth keeping and belongs here, on the page about what you are
 * actually paying. Two payments, two parties, never summed except once and
 * labelled as a total.
 */
export function RentSeparation() {
  const annualRent = tenancy.rentWeekly * 52;

  const sides = [
    {
      icon: Building2,
      label: "Your rent",
      amount: rent.weekly,
      to: rent.paidTo,
      rows: [
        { label: "Paid to", value: rent.paidTo },
        { label: "Method", value: rent.method },
        { label: "Next due", value: formatDayDate(rent.nextDue) },
        { label: "Over a year", value: money(annualRent) },
      ],
    },
    {
      icon: PiggyBank,
      label: "Your Litchi payment",
      amount: plan.weeklyPayment,
      to: "Litchi Bond Assist",
      rows: [
        { label: "Paid to", value: plan.partner },
        { label: "What it repays", value: `The ${money(plan.principal)} bond` },
        { label: "Ends", value: `After ${plan.termWeeks} weeks` },
        { label: "Over a year", value: money(plan.totalRepayable) },
      ],
    },
  ];

  return (
    <Card>
      <CardTitle>Your rent, and this</CardTitle>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist">
        Two payments, to two different people, for two different things. Litchi never collects one
        of them.
      </p>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        {sides.map((side) => {
          const Icon = side.icon;
          return (
            <div key={side.label} className="rounded-tile border border-sand/70 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                    {side.label}
                  </p>
                  <p className="numeric mt-2.5 text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink">
                    {money(side.amount)}
                    <span className="text-sm font-medium tracking-normal text-mist"> / week</span>
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              </div>

              <dl className="mt-5 divide-y divide-sand/70 text-[13px]">
                {side.rows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-mist">{row.label}</dt>
                    <dd className="text-right font-medium text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-tile bg-cream px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-bark" aria-hidden />
        <p className="text-[13px] leading-relaxed text-bark">
          Rent is never collected by Litchi and never forms part of your bond repayment. When the
          bond is repaid, the Litchi payment stops and your housing goes back to a flat{" "}
          {money(rent.weekly)} a week. The two were only ever side by side, never joined.
        </p>
      </div>
    </Card>
  );
}
