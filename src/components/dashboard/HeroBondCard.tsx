"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PiggyMark } from "@/components/brand/PiggyMark";
import { ExtraPaymentModal } from "@/components/modals/ExtraPaymentModal";
import { RepaymentPlanModal } from "@/components/modals/RepaymentPlanModal";
import { plan } from "@/lib/data";
import { money, moneyExact, percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

export function HeroBondCard() {
  const { derived, ready } = useLitchi();
  const [planOpen, setPlanOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);

  const stats = [
    { label: "Bond", value: money(plan.principal) },
    { label: "Repayment", value: `${money(plan.weeklyPayment)} / week` },
    { label: "Remaining", value: `${derived.weeksRemaining} weeks` },
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-card bg-hero p-6 text-onbrand shadow-lift sm:p-9">
        {/* One soft brown wash, and a large ghosted mark — no gradient stacks. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 88% 0%, rgba(169,130,106,0.30), transparent 62%)",
          }}
          aria-hidden
        />
        <PiggyMark
          className="pointer-events-none absolute -right-8 -bottom-12 h-56 w-56 text-onbrand/[0.05]"
          accent="var(--hero)"
        />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay">
            Bond Assist
          </p>
          <h2 className="mt-3 max-w-md text-[30px] font-semibold leading-[1.15] tracking-tight sm:text-[38px]">
            Your bond is sorted.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-onbrand/70">
            You moved in without paying the full bond upfront.
          </p>

          <dl className="mt-8 grid max-w-lg grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-onbrand/45">
                  {stat.label}
                </dt>
                <dd className="numeric mt-1.5 text-xl font-semibold sm:text-[22px]">
                  {ready ? stat.value : <Skeleton className="h-6 w-24 bg-onbrand/15" />}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 max-w-2xl">
            <div className="flex items-baseline justify-between text-sm">
              <span className="numeric font-medium text-onbrand">
                {moneyExact(derived.totalRepaid)}{" "}
                <span className="font-normal text-onbrand/55">repaid</span>
              </span>
              <span className="numeric text-onbrand/55">{moneyExact(derived.balance)} to go</span>
            </div>
            <Progress
              value={derived.progress}
              tone="cream"
              size="lg"
              className="mt-3"
              label="Bond repayment progress"
            />
            <p className="numeric mt-3 text-sm text-onbrand/55">
              {percent(derived.progress)} of your bond repaid
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="onHero"
              onClick={() => setPlanOpen(true)}
            >
              View repayment plan
            </Button>
            <Button
              size="lg"
              variant="onHeroGhost"
              onClick={() => setExtraOpen(true)}
            >
              Make extra payment
            </Button>
          </div>
        </div>
      </section>

      <RepaymentPlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
      <ExtraPaymentModal open={extraOpen} onClose={() => setExtraOpen(false)} />
    </>
  );
}
