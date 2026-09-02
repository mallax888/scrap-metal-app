"use client";

import { TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { renterScore, scoreFactors } from "@/lib/data";

export function ScoreCard({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <CardTitle>Your Litchi Score</CardTitle>
          <p className="numeric mt-3 text-[40px] font-semibold leading-none text-ink">
            {renterScore.value}
            <span className="text-lg font-medium text-mist"> / 100</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-moss-soft px-3 py-1.5 text-sm font-medium text-moss">
          <TrendingUp className="h-4 w-4" aria-hidden />
          <span className="numeric">+{renterScore.change}</span>
          <span className="font-normal">{renterScore.band}</span>
        </div>
      </div>

      <dl className={clsx("mt-7 space-y-4", compact && "sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0")}>
        {scoreFactors.map((factor) => (
          <div key={factor.key}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <dt className="text-ink">{factor.label}</dt>
              <dd className="numeric font-semibold text-ink">{factor.value}</dd>
            </div>
            <Progress
              value={factor.value / 100}
              size="sm"
              className="mt-2"
              label={`${factor.label} score`}
            />
          </div>
        ))}
      </dl>

      <p className="mt-7 text-xs leading-relaxed text-mist">
        A strong renter profile can unlock better Litchi offers in the future. The Litchi Score is
        Litchi{"’"}s own measure and is not a legally recognised credit score.
      </p>

      {compact ? null : (
        <ButtonLink href="/score" variant="secondary" className="mt-6 w-full">
          See your full score
        </ButtonLink>
      )}
    </Card>
  );
}
