"use client";

import { Check, Lock } from "lucide-react";
import { clsx } from "clsx";
import { useToast } from "@/components/ui/Toast";
import { movingFund, roundUps, weeklyPurchases } from "@/lib/data";
import { formatDate, money, moneyExact } from "@/lib/format";
import { roundUpFor } from "@/lib/roundups";
import { useLitchi } from "@/lib/store";

/**
 * Where the money comes from: the purchases, the account, the top-up, the
 * promises.
 *
 * None of this is the answer to "will it be there in time", which is why it
 * sits behind a heading now rather than taking three cards in front of it.
 * But it is the evidence for the answer, so it is one press away rather than
 * gone: "about $10 a week" is a claim, and a $5.50 coffee becoming $6.00 is
 * the arithmetic someone can check.
 */
export function RoundUpDetail() {
  const { state, derived, setRoundUpTo, toggleAutoTopUp } = useLitchi();
  const toast = useToast();
  const on = state.roundUpTo !== null;
  const rounding = state.roundUpTo ?? 2;

  return (
    <div>
      {on ? (
        <>
          <p className="text-[12.5px] font-semibold text-mist">
            This week &mdash;{" "}
            <span className="numeric text-ink">{moneyExact(derived.roundUpWeekly)}</span> from{" "}
            {weeklyPurchases.length} purchases
            {derived.roundUpsPaused ? ", paused while a payment is unsettled" : ""}
          </p>

          <ul className="numeric mt-2 divide-y divide-sand/60">
            {weeklyPurchases.map((purchase, index) => {
              const up = roundUpFor(purchase.amount, rounding);
              return (
                <li
                  key={`${purchase.merchant}-${index}`}
                  className="flex items-baseline gap-x-3 py-2 text-[13px]"
                >
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {purchase.merchant}
                    <span className="ml-2 text-[11px] text-clay">{purchase.day}</span>
                  </span>
                  <span className="hidden shrink-0 whitespace-nowrap text-mist sm:block">
                    {moneyExact(purchase.amount)}{" "}
                    <span className="text-ink">&rarr; {moneyExact(purchase.amount + up)}</span>
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
            {roundUps.skippedThisWeek} skipped on {roundUps.skippedDay}{" "}
            &mdash; your balance was under {money(roundUps.balanceFloor)}. We never overdraw you.
          </p>
        </>
      ) : (
        <p className="text-[13px] leading-relaxed text-mist">
          Round-ups are off, so nothing is read from your account and nothing is taken. Pick a
          rounding on the card above to switch them on.
        </p>
      )}

      {/* The two settings and who they involve. */}
      <div className="mt-5 divide-y divide-sand/60 border-t border-sand/60">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-[13px]">
          <span className="text-mist">
            {roundUps.account.bank} &bull;&bull;&bull;&bull; {roundUps.account.last4}, through{" "}
            {roundUps.account.via} since {formatDate(roundUps.account.connectedDate)}
          </span>
          {on ? (
            <button
              type="button"
              onClick={() => setRoundUpTo(null)}
              className="tap font-semibold text-bark underline underline-offset-4 transition-colors hover:text-ink"
            >
              Turn off
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-[13px]">
          <span className="text-mist">
            Automatic top-up &mdash;{" "}
            <strong className="numeric font-semibold text-ink">
              {money(movingFund.autoTopUp)} a week
            </strong>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={state.autoTopUp}
            aria-label="Automatic weekly top-up"
            onClick={() => {
              toggleAutoTopUp();
              toast(
                state.autoTopUp ? "Automatic top-ups paused" : "Automatic top-ups on",
                state.autoTopUp ? "info" : "success"
              );
            }}
            className={clsx(
              "tap relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
              state.autoTopUp ? "bg-brand" : "bg-sand"
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow-sm transition-transform duration-200",
                state.autoTopUp ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* The three restraints, which are product rather than small print. */}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          `Never more than ${money(roundUps.weeklyCap)} in a week`,
          `Skipped whenever your balance is under ${money(roundUps.balanceFloor)}`,
          "Paused if a Litchi payment fails",
        ].map((rule) => (
          <li
            key={rule}
            className="flex items-start gap-2 text-[12.5px] leading-relaxed text-mist"
          >
            <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
            {rule}
          </li>
        ))}
        <li className="flex items-start gap-2 text-[12.5px] leading-relaxed text-mist">
          <Lock className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
          Your money, withdrawable any time
        </li>
      </ul>
    </div>
  );
}
