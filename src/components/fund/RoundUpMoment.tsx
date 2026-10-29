"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CreditCard, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardLabel } from "@/components/ui/Card";
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
  const { state, derived, setRoundUpTo } = useLitchi();
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
  /** What the notification shows: the last one that fired, or the next one up. */
  const display = shown ?? { merchant: purchase?.merchant ?? "", amount: purchase?.amount ?? 0, up };

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

  /*
   * The card stays when round-ups are off.
   *
   * Hiding it took the rounding chips with it — and they were the only way
   * back on, which left "off" as a one-way door. It also loses the better
   * argument: someone who has not switched this on is exactly who should see
   * what arrives when they do.
   */
  const off = !state.roundUpTo;
  if (!purchase) return null;

  return (
    <Card tone="ink" className="overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <CardLabel className="text-onbrand/60">The moment it happens</CardLabel>
        <Bell className="h-[18px] w-[18px] shrink-0 text-onbrand/60" aria-hidden />
      </div>

      {/* The notification, drawn as it would arrive rather than as a card. */}
      <div className="mt-5 flex justify-center">
        <div
          className={clsx(
            "w-full max-w-sm rounded-[22px] border border-onbrand/10 bg-onbrand/[0.07] p-3.5 backdrop-blur-sm transition-all duration-500",
            // At rest it shows the next purchase as an example rather than an
            // empty hole: a card whose whole argument is "look what arrives"
            // should not open with nothing to look at.
            //
            // Marked by the word "example" rather than by dimming it. Fading
            // the container multiplied down the label and the timestamp with
            // it and put both under 4.5:1 — the same way the cover's dimmed
            // sample panel failed.
            shown && "translate-y-0"
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
                <span className="text-[11px] text-onbrand/50">{shown ? "now" : "example"}</span>
              </div>
              <p className="numeric mt-1 text-[15px] font-semibold leading-snug text-onbrand">
                +{moneyExact(display.up)} to your move
              </p>
              <p className="numeric mt-1 text-[13px] leading-relaxed text-onbrand/70">
                {display.merchant} {moneyExact(display.amount)} &rarr;{" "}
                {moneyExact(display.amount + display.up)}. {money(remaining)} to go.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-onbrand/15 pt-5">
        <div className="min-w-0">
          <p className="numeric text-[13px] text-onbrand/70">
            {off ? (
              <>Round-ups are off. Pick a rounding to see what arrives.</>
            ) : collected > 0 ? (
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
          <Button variant="onHero" onClick={tap} disabled={off}>
            <CreditCard className="h-4 w-4" aria-hidden />
            Tap your card
          </Button>
          {/* The setting sits with the thing it changes rather than in a card
              below it: the amounts in the notification are what it controls. */}
          <span className="flex gap-1.5" role="group" aria-label="Round up to the nearest">
            {roundUps.options.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={state.roundUpTo === option}
                onClick={() => setRoundUpTo(option)}
                className={clsx(
                  "tap rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                  state.roundUpTo === option
                    ? "bg-onbrand text-hero"
                    : "border border-onbrand/25 text-onbrand/70 hover:text-onbrand"
                )}
              >
                {money(option)}
              </button>
            ))}
          </span>
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
