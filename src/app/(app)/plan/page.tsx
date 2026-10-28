"use client";

import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { MissedPaymentCard } from "@/components/dashboard/MissedPaymentCard";
import { RepaymentChart } from "@/components/dashboard/RepaymentChart";
import { NextPaymentCard } from "@/components/dashboard/NextPaymentCard";
import { WeeklyBreakdown } from "@/components/dashboard/WeeklyBreakdown";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { plan } from "@/lib/data";

/**
 * The plan, in detail.
 *
 * This screen used to be the app's front door, and it read like one: the bond,
 * the score, the rewards balance, the Moving Fund and the product roadmap all
 * had a card here, each one a smaller copy of a page that owned the subject
 * properly. That is a reasonable home screen and a poor detail screen, and
 * once /my-tenancy became home it was neither.
 *
 * So everything that is not the repayment has gone back to the page that owns
 * it. What is left answers one question — how is the plan going — from the
 * headline figures down to the payment history.
 */
export default function PlanPage() {
  return (
    <>
      <PageHeader
        title="Your plan"
        subtitle={`Repaying the ${plan.partner} advance that paid your bond.`}
        actions={
          <Badge tone="outline" className="numeric h-9 px-3.5">
            {plan.agreementRef}
          </Badge>
        }
      />

      <div className="stagger space-y-6">
        {/* Above everything, including the headline figures. Someone with a
            failed payment did not open the app to admire their progress. */}
        <MissedPaymentCard />

        <SummaryCards />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RepaymentChart />
          </div>
          <NextPaymentCard />
        </div>

        {/* items-start so the weekly card keeps its own height: it pins its
            total to the bottom, so stretching it to match a much taller
            activity feed opens a hole in the middle of it. */}
        <div className="grid items-start gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ActivityFeed kinds={["repayment", "extra"]} limit={5} />
          </div>
          <WeeklyBreakdown />
        </div>

        <Card tone="cream">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-bark">
                <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div>
                <CardTitle>Questions about your plan?</CardTitle>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-bark">
                  Real people, based in New Zealand. If a payment is going to be tight, tell us
                  early &mdash; we can move it, and doing it in advance means it will not count
                  against you.
                </p>
              </div>
            </div>
            <ButtonLink href="/support" variant="secondary">
              Get support
            </ButtonLink>
          </div>
        </Card>
      </div>
    </>
  );
}
