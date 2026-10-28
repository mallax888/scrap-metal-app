"use client";

import { ArrowRight, Target } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TODAY, movingFund, tenancy } from "@/lib/data";
import { daysBetween, formatDateShort, money, moneyExact } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * Whether the money will be there on the day it is needed.
 *
 * A savings screen that only shows a balance and a goal lets someone drift for
 * ten months and discover the shortfall in the week they are moving. This one
 * measures against the day the fixed term ends, is allowed to answer no, and
 * when the answer is no it names the one change that fixes it.
 *
 * The timeline draws the tenancy, not the saving. The end of the fixed term is
 * the fixed point and the goal date moves around it — which is the correct way
 * round, and the reason the shortfall is legible at a glance rather than being
 * a subtraction the reader has to perform.
 */
export function FundProjection() {
  const { state, derived, setRoundUpTo } = useLitchi();
  const projection = derived.fundProjection;
  const fix = derived.fundFix;

  const daysToMove = daysBetween(TODAY, tenancy.endDate);
  const daysToGoal = projection.goalDate ? daysBetween(TODAY, projection.goalDate) : null;
  // The track runs to whichever is further away, so a goal that lands after
  // the move is visibly past the marker rather than pinned to the end.
  const span = Math.max(daysToMove, daysToGoal ?? 0) || 1;

  return (
    <Card>
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
          <Target className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div className="min-w-0">
          <CardTitle>Will it be there in time?</CardTitle>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-mist">
            Measured against the day your fixed term ends, not a date of its own.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[19px] leading-relaxed tracking-[-0.012em] text-ink">
          {derived.roundUpsPaused ? (
            <>
              While round-ups are paused you&rsquo;re putting away{" "}
              <strong className="numeric font-semibold">
                {moneyExact(projection.weekly)}
              </strong>{" "}
              a week.
            </>
          ) : projection.inTime ? (
            <>
              You&rsquo;ll have{" "}
              <strong className="numeric font-semibold">
                {money(projection.atMoveDate)}
              </strong>{" "}
              by moving day &mdash;{" "}
              <strong className="font-semibold text-moss">enough, with room to spare</strong>.
            </>
          ) : (
            <>
              You&rsquo;ll have{" "}
              <strong className="numeric font-semibold">
                {money(projection.atMoveDate)}
              </strong>{" "}
              by moving day &mdash;{" "}
              <strong className="numeric font-semibold text-litchi">
                {money(projection.shortfall)} short
              </strong>
              .
            </>
          )}
        </p>
        <p className="mt-2 text-[13px] text-mist">
          {moneyExact(projection.weekly)} a week
          {state.autoTopUp ? `: your ${money(movingFund.autoTopUp)} top-up` : ""}
          {state.autoTopUp && derived.roundUpWeekly > 0
            ? ` plus about ${moneyExact(derived.roundUpWeekly)} of round-ups`
            : ""}
          .
        </p>
      </div>

      {/* The tenancy as a track: today, the day the term ends, and where the
          goal lands against it. */}
      <div className="mt-7">
        <div className="relative h-2 rounded-full bg-sand">
          <span
            className="block h-full rounded-full bg-moss"
            style={{ width: `${Math.min(100, ((daysToGoal ?? span) / span) * 100)}%` }}
          />
          <span
            className="absolute top-[-5px] w-0.5 rounded-sm bg-litchi"
            style={{ height: 18, left: `${(daysToMove / span) * 100}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-2.5 flex justify-between gap-4 text-[11.5px] leading-relaxed text-mist">
          <span>
            <strong className="font-semibold text-ink">Today</strong>
            <br />
            {formatDateShort(TODAY)}
          </span>
          <span className={clsx(daysToMove / span > 0.8 ? "text-right" : "text-center")}>
            <strong className="font-semibold text-ink">Your term ends</strong>
            <br />
            {formatDateShort(tenancy.endDate)}
          </span>
          {projection.goalDate && daysToGoal !== null && daysToGoal > daysToMove ? (
            <span className="text-right">
              <strong className="font-semibold text-ink">Goal reached</strong>
              <br />
              {formatDateShort(projection.goalDate)}
            </span>
          ) : null}
        </div>
      </div>

      {fix ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-tile bg-cream px-5 py-4">
          <div className="min-w-0">
            <CardLabel className="text-clay">One change closes it</CardLabel>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-bark">
              Round to <strong className="font-semibold text-ink">{money(fix.rounding)}</strong>{" "}
              instead and that&rsquo;s about{" "}
              <strong className="numeric font-semibold text-ink">
                {moneyExact(fix.projection.weekly)}
              </strong>{" "}
              a week &mdash;{" "}
              <strong className="numeric font-semibold text-ink">
                {money(fix.projection.atMoveDate)} by moving day
              </strong>
              , which clears it.
            </p>
          </div>
          <Button onClick={() => setRoundUpTo(fix.rounding)}>
            Round to {money(fix.rounding)}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
