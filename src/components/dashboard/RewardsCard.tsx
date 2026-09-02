"use client";

import { Check, Sparkles } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { rewardCategories, rewards } from "@/lib/data";
import { points } from "@/lib/format";
import { useLitchi } from "@/lib/store";

export function RewardsCard() {
  const { derived, ready } = useLitchi();

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <CardTitle>Litchi Rewards</CardTitle>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
          <Sparkles className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </div>

      {ready ? (
        <p className="numeric mt-4 text-[34px] font-semibold leading-none text-ink">
          {points(derived.pointsBalance)}
          <span className="text-base font-medium text-mist"> points</span>
        </p>
      ) : (
        <Skeleton className="mt-4 h-9 w-36" />
      )}

      <p className="mt-2.5 text-sm text-mist">
        You{"’"}ve earned{" "}
        <span className="numeric font-semibold text-moss">
          +{points(rewards.earnedThisMonth)} points
        </span>{" "}
        this month
      </p>

      <ul className="mt-6 space-y-2.5">
        {rewardCategories.map((category) => (
          <li key={category.key} className="flex items-center gap-3 text-sm text-ink">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moss-soft text-moss">
              <Check className="h-3 w-3" aria-hidden />
            </span>
            {category.label}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <ButtonLink href="/rewards" variant="secondary" className="w-full">
          View rewards
        </ButtonLink>
      </div>
    </Card>
  );
}
