"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { MovingFundModal } from "@/components/modals/MovingFundModal";
import { movingFund } from "@/lib/data";
import { money, percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

export function MovingFundCard() {
  const { derived, ready } = useLitchi();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card tone="cream" className="flex h-full flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
          Moving Fund
        </p>
        <h2 className="mt-3 max-w-xs text-[22px] font-semibold leading-snug tracking-tight text-ink">
          Your next move starts here.
        </h2>

        <div className="mt-6 flex items-baseline gap-2">
          {ready ? (
            <>
              <span className="numeric text-[34px] font-semibold leading-none text-ink">
                {money(derived.fundSaved)}
              </span>
              <span className="text-sm text-mist">saved</span>
            </>
          ) : (
            <Skeleton className="h-9 w-32 bg-sand" />
          )}
        </div>
        <p className="numeric mt-1.5 text-sm text-mist">Goal: {money(movingFund.goal)}</p>

        <Progress
          value={derived.fundProgress}
          className="mt-5"
          label="Moving Fund progress"
        />

        <p className="mt-3 text-sm text-bark">
          You{"’"}re{" "}
          <span className="numeric font-semibold">{percent(derived.fundProgress)}</span> of the way
          toward your next move.
        </p>

        <div className="mt-auto pt-7">
          <Button className="w-full" onClick={() => setOpen(true)}>
            Add to Moving Fund
          </Button>
        </div>
      </Card>

      <MovingFundModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
