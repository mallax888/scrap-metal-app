"use client";

import { Check, Coins, Lock, TriangleAlert } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { roundUps, weeklyPurchases } from "@/lib/data";
import { formatDate, money, moneyExact } from "@/lib/format";
import { roundUpFor, weeklyRoundUp } from "@/lib/roundups";
import { useLitchi } from "@/lib/store";

/**
 * The habit, and the three rules that keep it from doing harm.
 *
 * Showing the actual purchases matters more than it looks. "About $10 a week"
 * is a claim; a list with a $5.50 coffee becoming $6.00 is the arithmetic
 * someone can check, and checking it is what makes the number believable
 * enough to leave switched on.
 *
 * The rules are on the card rather than in terms because each of them is a
 * promise about restraint, and a promise nobody reads is not one.
 */
/** The middle option, used only to show what switching on would collect. */
const SUGGESTED_ROUNDING = 2;

export function RoundUps() {
  const { state, derived, setRoundUpTo } = useLitchi();
  const on = state.roundUpTo !== null;
  const paused = on && derived.roundUpsPaused;

  return (
    <Card className={clsx(paused && "border-amber-warm/30 bg-amber-soft")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              paused ? "bg-amber-warm/15 text-amber-warm" : "bg-cream text-bark"
            )}
          >
            {paused ? (
              <TriangleAlert className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Coins className="h-[18px] w-[18px]" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <CardTitle>Round up your spending</CardTitle>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-mist">
              {paused ? (
                <>
                  Paused. A payment didn&rsquo;t go through, so nothing has been rounded up this
                  week.
                </>
              ) : (
                <>
                  Every card purchase rounds up, and the difference goes straight into this fund.
                </>
              )}
            </p>
          </div>
        </div>
        <Badge tone={paused ? "amber" : on ? "moss" : "outline"}>
          {paused ? "Paused" : on ? "On" : "Off"}
        </Badge>
      </div>

      {paused ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-5">
          <p className="max-w-xl text-sm leading-relaxed text-bark">
            Round-ups stand down whenever a Litchi payment fails. Sort the payment and they start
            again on the next purchase &mdash; there is nothing to switch back on.
          </p>
          <ButtonLink href="/plan">Sort the payment</ButtonLink>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-ink">Round up to the nearest</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Round up to the nearest">
              <ChoiceChip pressed={!on} onClick={() => setRoundUpTo(null)}>
                Off
              </ChoiceChip>
              {roundUps.options.map((option) => (
                <ChoiceChip
                  key={option}
                  pressed={state.roundUpTo === option}
                  onClick={() => setRoundUpTo(option)}
                >
                  {money(option)}
                </ChoiceChip>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[12.5px] text-mist">
            {roundUps.account.bank} &bull;&bull;&bull;&bull; {roundUps.account.last4}, connected
            through {roundUps.account.via} on {formatDate(roundUps.account.connectedDate)}.
          </p>

          {on ? (
            <div className="mt-5 rounded-tile bg-cream px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <CardLabel className="text-clay">This week</CardLabel>
                <p className="numeric text-[20px] font-semibold tracking-[-0.02em] text-ink">
                  {moneyExact(derived.roundUpWeekly)}{" "}
                  <span className="text-[12.5px] font-medium tracking-normal text-mist">
                    from {weeklyPurchases.length} purchases
                  </span>
                </p>
              </div>

              <ul className="numeric mt-3 divide-y divide-sand/60">
                {weeklyPurchases.map((purchase, index) => {
                  const up = roundUpFor(purchase.amount, state.roundUpTo ?? 1);
                  return (
                    <li
                      key={`${purchase.merchant}-${index}`}
                      className="flex items-baseline gap-x-4 gap-y-1 py-2 text-[13px]"
                    >
                      <span className="min-w-0 flex-1 truncate text-ink">
                        {purchase.merchant}
                        <span className="ml-2 text-[11.5px] text-clay">{purchase.day}</span>
                      </span>
                      <span className="hidden shrink-0 whitespace-nowrap text-mist sm:block">
                        {moneyExact(purchase.amount)}{" "}
                        <span className="text-ink">
                          &rarr; {moneyExact(purchase.amount + up)}
                        </span>
                      </span>
                      <span
                        className={clsx(
                          "w-14 shrink-0 text-right font-semibold",
                          up > 0 ? "text-moss" : "font-normal text-clay"
                        )}
                      >
                        {up > 0 ? `+${moneyExact(up)}` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-bark">
                <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
                {roundUps.skippedThisWeek} round-ups skipped on {roundUps.skippedDay}{" "}
                &mdash; your balance was under {money(roundUps.balanceFloor)}. We never overdraw
                you.
              </p>
            </div>
          ) : (
            <p className="mt-5 rounded-tile bg-cream px-5 py-4 text-sm leading-relaxed text-bark">
              Switched off, so nothing is read from your account and nothing is taken. On last
              week&rsquo;s spending, rounding to {money(SUGGESTED_ROUNDING)} would have put{" "}
              <span className="numeric font-semibold text-ink">
                {moneyExact(weeklyRoundUp(weeklyPurchases, SUGGESTED_ROUNDING))}
              </span>{" "}
              into the fund.
            </p>
          )}

          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {[
              `Never more than ${money(roundUps.weeklyCap)} in a week`,
              `Skipped whenever your balance is under ${money(roundUps.balanceFloor)}`,
              "Paused if a Litchi payment fails",
            ].map((rule) => (
              <li
                key={rule}
                className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-mist"
              >
                <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
                {rule}
              </li>
            ))}
            <li className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-mist">
              <Lock className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
              Your money, withdrawable any time
            </li>
          </ul>
        </>
      )}
    </Card>
  );
}
