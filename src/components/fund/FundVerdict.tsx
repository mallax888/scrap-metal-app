"use client";

import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { movingFund, tenancy } from "@/lib/data";
import { formatDate, money, moneyExact } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * The one line this screen exists to say.
 *
 * A savings screen that shows a balance and a goal lets someone drift for ten
 * months and find out in the week they are moving. This says now, in a
 * sentence, whether the money will be there on the day — and when it will not,
 * names the single change that fixes it rather than leaving the reader to work
 * out which of three settings to touch.
 *
 * It was a card with a heading, a sub-heading, a timeline and a nudge box.
 * Everything in it was true and almost none of it was the answer, so the
 * answer is what is left.
 */
export function FundVerdict() {
  const { derived, setRoundUpTo } = useLitchi();
  const projection = derived.fundProjection;
  const fix = derived.fundFix;

  const tone = derived.roundUpsPaused
    ? "amber"
    : projection.inTime
      ? "moss"
      : "litchi";

  return (
    <div
      className={clsx(
        "mt-5 flex flex-wrap items-center justify-between gap-4 rounded-card px-5 py-4",
        // Paper rather than cream: the shortfall is coral, and coral on cream
        // measures 4.34:1 — under the floor for text this size. On paper it
        // clears, and the box still reads as its own object against the page.
        tone === "amber" ? "bg-amber-soft" : "border border-sand/70 bg-paper"
      )}
    >
      <p className="max-w-[46ch] text-[14px] leading-relaxed text-bark">
        {derived.roundUpsPaused ? (
          <>
            Round-ups are paused while a payment is unsettled, so{" "}
            <strong className="numeric font-semibold text-ink">
              {moneyExact(projection.weekly)}
            </strong>{" "}
            a week is going in. They start again on their own once it is sorted.
          </>
        ) : projection.inTime ? (
          <>
            <strong className="numeric font-semibold text-moss">
              {money(projection.atMoveDate)} by moving day
            </strong>{" "}
            &mdash; enough, with room to spare, at {moneyExact(projection.weekly)} a week.
          </>
        ) : (
          <>
            <strong className="numeric font-semibold text-litchi">
              {money(projection.shortfall)} short
            </strong>{" "}
            on {formatDate(tenancy.endDate)}, at {moneyExact(projection.weekly)} a week.
            {fix ? (
              <>
                {" "}
                Rounding to{" "}
                <strong className="font-semibold text-ink">{money(fix.rounding)}</strong> instead
                closes it.
              </>
            ) : (
              <>
                {" "}
                You would need {money(movingFund.goal)} by then.
              </>
            )}
          </>
        )}
      </p>
      {fix && !derived.roundUpsPaused ? (
        <Button onClick={() => setRoundUpTo(fix.rounding)}>
          Round to {money(fix.rounding)}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
