"use client";

import { ArrowRight, Building2, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { WeeklyBreakdown } from "@/components/dashboard/WeeklyBreakdown";
import { ecosystem, plan, rent, tenancy } from "@/lib/data";
import { formatDayDate, money } from "@/lib/format";
import { useLitchi } from "@/lib/store";

const RENT_PRODUCT = ecosystem.find((product) => product.id === "eco_rent")!;

export default function RentPage() {
  const { derived, state, toggleWaitlist } = useLitchi();
  const toast = useToast();
  const joined = state.waitlist.includes(RENT_PRODUCT.id);

  const annual = [
    { label: "Rent", value: tenancy.rentWeekly * 52, tone: "text-ink" },
    { label: "Litchi bond repayment", value: plan.weeklyPayment * 52, tone: "text-ink" },
    { label: "Total housing", value: derived.totalWeeklyHousing * 52, tone: "text-ink" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Housing"
        title="Rent"
        subtitle="Rent goes to your landlord. Your Litchi payment repays your bond. Two payments, always shown separately."
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardLabel>Rent</CardLabel>
                <p className="numeric mt-3 text-[38px] font-semibold leading-none text-ink">
                  {money(rent.weekly)}
                  <span className="text-base font-medium text-mist"> / week</span>
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
                <Building2 className="h-[18px] w-[18px]" aria-hidden />
              </span>
            </div>

            <dl className="mt-7 divide-y divide-sand/70 text-sm">
              {[
                { label: "Paid to", value: rent.paidTo },
                { label: "Property", value: tenancy.property },
                { label: "Method", value: rent.method },
                { label: "Next due", value: formatDayDate(rent.nextDue) },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-mist">{row.label}</dt>
                  <dd className="text-right font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-auto flex items-start gap-3 rounded-tile border border-sand bg-canvas px-4 py-3.5 pt-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden />
              <p className="text-xs leading-relaxed text-mist">
                Rent isn&rsquo;t collected by Litchi. You pay it directly to {rent.paidTo}, and it
                never forms part of your bond repayment.
              </p>
            </div>
          </Card>

          <WeeklyBreakdown showRentLink={false} />
        </div>

        <Card>
          <CardTitle>Over a full year</CardTitle>
          <p className="mt-1 text-sm text-mist">
            Based on your current rent and Litchi repayment, held flat for 52 weeks.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            {annual.map((row, index) => (
              <div
                key={row.label}
                className={
                  index === annual.length - 1
                    ? "rounded-tile bg-cream/70 px-4 py-4"
                    : "rounded-tile border border-sand px-4 py-4"
                }
              >
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                  {row.label}
                </dt>
                <dd className={`numeric mt-2 text-[22px] font-semibold ${row.tone}`}>
                  {money(row.value)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-mist">
            Your Litchi repayment stops once your bond is repaid — from{" "}
            {money(derived.totalWeeklyHousing)} a week back down to {money(rent.weekly)}.
          </p>
        </Card>

        <Card tone="cream" className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Badge tone="outline">Coming soon</Badge>
            <h2 className="mt-3 text-[22px] font-semibold tracking-tight text-ink">
              Pay rent through Litchi
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-mist">
              One payment a week covering rent and your Litchi repayment, with every receipt in one
              place and your on-time record building your Litchi Score automatically.
            </p>
          </div>
          <Button
            variant={joined ? "soft" : "primary"}
            onClick={() => {
              toggleWaitlist(RENT_PRODUCT.id);
              toast(
                joined ? "Left the Rent payments waitlist" : "You're on the Rent payments waitlist",
                joined ? "info" : "success"
              );
            }}
            className="shrink-0"
          >
            {joined ? "On the waitlist ✓" : "Join the waitlist"}
            {joined ? null : <ArrowRight className="h-4 w-4" aria-hidden />}
          </Button>
        </Card>
      </div>
    </>
  );
}
