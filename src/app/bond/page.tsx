"use client";

import { useState } from "react";
import { Banknote, FileText, Landmark, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { BondLodgementCard } from "@/components/dashboard/BondLodgementCard";
import { RepaymentChart } from "@/components/dashboard/RepaymentChart";
import { ExtraPaymentModal } from "@/components/modals/ExtraPaymentModal";
import { RepaymentPlanModal } from "@/components/modals/RepaymentPlanModal";
import { bond, plan, tenancy } from "@/lib/data";
import { formatDate, money, moneyExact, percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

const STEPS = [
  {
    icon: Banknote,
    title: "Litchi's partner paid your bond",
    body: `${plan.partner} paid ${money(bond.amount)} on your behalf on ${formatDate(
      bond.lodgedDate
    )}, so you didn't need it in cash to move in.`,
  },
  {
    icon: Landmark,
    title: "Your landlord lodged it",
    body: `The bond was lodged with ${bond.lodgedWith} in the normal way, under bond ID ${bond.bondId}. It stays there for the whole tenancy.`,
  },
  {
    icon: ShieldCheck,
    title: "You repay Litchi weekly",
    body: `${money(plan.weeklyPayment)} every Friday until the bond is repaid. No interest, no early repayment fee.`,
  },
];

export default function BondPage() {
  const { derived } = useLitchi();
  const [planOpen, setPlanOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Bond Assist"
        title="My Bond"
        subtitle="What you owe, who holds your bond, and how the finance works."
        actions={
          <>
            <Button variant="secondary" onClick={() => setPlanOpen(true)}>
              View repayment plan
            </Button>
            <Button onClick={() => setExtraOpen(true)}>Make extra payment</Button>
          </>
        }
      />

      <div className="space-y-6">
        <Card className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <CardLabel>Bond financed</CardLabel>
            <p className="numeric mt-2.5 text-[28px] font-semibold leading-none text-ink">
              {money(plan.principal)}
            </p>
            <p className="mt-2 text-sm text-mist">{bond.weeksOfRent} weeks&rsquo; rent</p>
          </div>
          <div>
            <CardLabel>Repaid</CardLabel>
            <p className="numeric mt-2.5 text-[28px] font-semibold leading-none text-ink">
              {moneyExact(derived.totalRepaid)}
            </p>
            <p className="numeric mt-2 text-sm text-moss">
              {percent(derived.progress)} of your bond
            </p>
          </div>
          <div>
            <CardLabel>Balance</CardLabel>
            <p className="numeric mt-2.5 text-[28px] font-semibold leading-none text-ink">
              {moneyExact(derived.balance)}
            </p>
            <p className="numeric mt-2 text-sm text-mist">
              {derived.weeksRemaining} weekly payments left
            </p>
          </div>
          <div>
            <CardLabel>Payoff date</CardLabel>
            <p className="mt-2.5 text-[22px] font-semibold leading-tight text-ink">
              {derived.balance <= 0 ? "Paid in full" : formatDate(derived.payoffDate)}
            </p>
            <p className="mt-2 text-sm text-mist">
              Agreed term ends {formatDate(plan.agreedEndDate)}
            </p>
          </div>

          <div className="sm:col-span-2 xl:col-span-4">
            <Progress value={derived.progress} size="lg" label="Bond repayment progress" />
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RepaymentChart />
          </div>
          <BondLodgementCard />
        </div>

        <Card>
          <CardTitle>How Bond Assist works</CardTitle>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-bark">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <p className="numeric mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1.5 text-[15px] font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{step.body}</p>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-sand/70 pt-6">
            <Badge tone="cream">Lender: {plan.partner}</Badge>
            <Badge tone="outline">Agreement {plan.agreementRef}</Badge>
            <Badge tone="moss">0% interest</Badge>
            <ButtonLink href="/documents" variant="ghost" size="sm" className="ml-auto">
              <FileText className="h-4 w-4" aria-hidden />
              Bond documents
            </ButtonLink>
          </div>
        </Card>

        <Card tone="cream">
          <CardTitle>At the end of your tenancy</CardTitle>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
            Your bond is refunded by {bond.lodgedWith} through the usual process once you and your
            landlord agree the tenancy has ended. Your tenancy at {tenancy.property} started{" "}
            {formatDate(tenancy.startDate)}. If any Litchi balance is still outstanding at that
            point, it&rsquo;s settled then — we&rsquo;ll walk you through it well before your
            tenancy ends.
          </p>
        </Card>
      </div>

      <RepaymentPlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
      <ExtraPaymentModal open={extraOpen} onClose={() => setExtraOpen(false)} />
    </>
  );
}
