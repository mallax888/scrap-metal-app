"use client";

import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { HeroBondCard } from "@/components/dashboard/HeroBondCard";
import { RepaymentChart } from "@/components/dashboard/RepaymentChart";
import { NextPaymentCard } from "@/components/dashboard/NextPaymentCard";
import { BondLodgementCard } from "@/components/dashboard/BondLodgementCard";
import { RewardsCard } from "@/components/dashboard/RewardsCard";
import { WeeklyBreakdown } from "@/components/dashboard/WeeklyBreakdown";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { MovingFundCard } from "@/components/dashboard/MovingFundCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EcosystemGrid } from "@/components/dashboard/EcosystemGrid";
import { bond, renter } from "@/lib/data";
import { useGreeting } from "@/lib/use-greeting";

export default function OverviewPage() {
  const greeting = useGreeting();

  return (
    <>
      <PageHeader
        title={
          <>
            {greeting}, {renter.firstName} <span aria-hidden>👋</span>
          </>
        }
        subtitle="Here's your Litchi overview."
        actions={
          <Badge tone="outline" className="numeric h-9 px-3.5">
            Bond ID {bond.bondId}
          </Badge>
        }
      />

      <div className="space-y-6">
        <SummaryCards />

        <HeroBondCard />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RepaymentChart />
          </div>
          <NextPaymentCard />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <BondLodgementCard />
          <WeeklyBreakdown />
          <RewardsCard />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ScoreCard compact />
          </div>
          <MovingFundCard />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ActivityFeed kinds={["repayment", "extra"]} limit={4} />
          </div>

          <Card tone="cream" className="flex h-full flex-col">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-bark">
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <CardTitle className="mt-5">Questions about your bond?</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Real people, based in New Zealand. If a payment is going to be tight, tell us early —
              we can move it.
            </p>
            <div className="mt-auto pt-7">
              <ButtonLink href="/support" variant="secondary" className="w-full">
                Get support
              </ButtonLink>
            </div>
          </Card>
        </div>

        <EcosystemGrid />
      </div>
    </>
  );
}
