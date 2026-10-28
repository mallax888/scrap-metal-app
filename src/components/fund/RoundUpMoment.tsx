"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CreditCard, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PiggyBadge } from "@/components/brand/PiggyMark";
import { movingFund, roundUps, weeklyPurchases } from "@/lib/data";
import { money, moneyExact } from "@/lib/format";
import { roundUpFor } from "@/lib/roundups";
import { useLitchi } from "@/lib/store";

/**
 * The moment the product actually lives in.
 *
 * Everything else on this screen is a balance, which is a thing you go and
 * look at. This is the thing that comes to you: a notification, a second
 * after the card leaves the terminal, that turns 40 cents into a sentence
 * about the move. Nobody opens an app to watch a fund grow — they get told,
 * and the telling is what makes it a habit rather than a setting.
 *
 * It is a simulation and says so. Real push needs a service worker, a
 * permission prompt and a push service, and a notification the viewer has to
 * grant permission for is a worse demo than one they can replay at will.
 *
 * The figures are the same ones the rest of the screen uses — the purchases
 * from the sample week, the live balance, the real distance to the goal — so
 * what the notification says always agrees with what the fund says.
 */

/** Long enough to read, short enough that the next tap is not a wait. */
const DISMISS_AFTER_MS = 6000;

export function RoundUpMoment() {
  const { state, derived } = useLitchi();
  const [index, setIndex] = useState(0);
  /** The purchase the visible notification is about, captured when it fired. */
  const [shown, setShown] = useState<{ merchant: string; amount: number; up: number } | null>(
    null
  );
  const [collected, setCollected] = useState(0);
  const timer = useRef<number | null>(null);

  // Only purchases that would actually round up: a $20.00 top-up makes a
  // confusing demo of a feature whose whole claim is the loose change.
  const rounding = state.roundUpTo ?? 2;
  const purchases = weeklyPurchases.filter(
    (purchase) => roundUpFor(purchase.amount, rounding) > 0
  );
  const purchase = purchases[index % purchases.length];
  const up = purchase ? roundUpFor(purchase.amount, rounding) : 0;

  const remaining = Math.max(0, derived.fundRemaining - collected);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const tap = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setCollected((prev) => Math.round((prev + up) * 100) / 100);
    setShown({ merchant: purchase.merchant, amount: purchase.amount, up });
    setIndex((prev) => prev + 1);
    timer.current = window.setTimeout(() => setShown(null), DISMISS_AFTER_MS);
  }, [purchase, up]);

  const reset = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setShown(null);
    setCollected(0);
    setIndex(0);
  }, []);

  if (!state.roundUpTo || !purchase) return null;

  return (
    <Card tone="ink" className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <CardLabel className="text-onbrand/60">The moment it happens</CardLabel>
          <CardTitle className="mt-2.5 text-onbrand">
            You get told, a second after you tap.
          </CardTitle>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-onbrand/70">
            Nobody opens an app to watch a fund grow. {money(rounding)} rounding, your real
            spending, and the distance to the goal closing in front of you.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-onbrand/15 text-onbrand">
          <Bell className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </div>

      {/* The notification, drawn as it would arrive rather than as a card. */}
      <div className="mt-7 flex justify-center">
        <div
          className={clsx(
            "w-full max-w-sm rounded-[22px] border border-onbrand/10 bg-onbrand/[0.07] p-3.5 backdrop-blur-sm transition-all duration-500",
            shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
          )}
          // The live region announces each arrival, which is the whole point of
          // a notification and the one thing a purely visual mock would lose.
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <PiggyBadge className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-onbrand/60">
                  Litchi
                </span>
                <span className="text-[11px] text-onbrand/50">now</span>
              </div>
              {shown ? (
                <>
                  <p className="numeric mt-1 text-[15px] font-semibold leading-snug text-onbrand">
                    +{moneyExact(shown.up)} to your move
                  </p>
                  <p className="numeric mt-1 text-[13px] leading-relaxed text-onbrand/70">
                    {shown.merchant} {moneyExact(shown.amount)} &rarr;{" "}
                    {moneyExact(shown.amount + shown.up)}. {money(remaining)} to go.
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-onbrand/15 pt-5">
        <div className="min-w-0">
          <p className="numeric text-[13px] text-onbrand/70">
            {collected > 0 ? (
              <>
                <span className="font-semibold text-onbrand">{moneyExact(collected)}</span>{" "}
                added in this run &middot; {money(remaining)} to go of {money(movingFund.goal)}
              </>
            ) : (
              <>
                Tap to see what arrives. Capped at {money(roundUps.weeklyCap)} a week, and skipped
                whenever your balance is under {money(roundUps.balanceFloor)}.
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button variant="onHero" onClick={tap}>
            <CreditCard className="h-4 w-4" aria-hidden />
            Tap your card
          </Button>
          {collected > 0 ? (
            <Button variant="onHeroGhost" onClick={reset}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
