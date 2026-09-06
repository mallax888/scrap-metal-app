"use client";

import { ArrowRight, Check, Info } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { bond, plan, tenancy } from "@/lib/data";
import { daysBetween, formatDate, money, moneyExact } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * What happens when the tenancy ends.
 *
 * The app used to stop before the story did — the old copy said any balance
 * "is settled then", which is the kind of sentence that sounds reassuring and
 * answers nothing.
 *
 * The honest mechanics matter here. Tenancy Services refunds the bond to the
 * tenant's own nominated account; there is no arrangement by which Litchi is
 * paid out of it first. So the bond is not security, the refund is the
 * renter's money, and if a balance is still outstanding the plan simply
 * carries on at the same weekly amount. Saying that plainly is better than
 * implying a claim over someone's refund that does not exist.
 */
const REFUND_STEPS = [
  {
    label: "You give notice",
    detail: `${tenancy.noticeDays} days for a periodic tenancy. A fixed term ends on its own date.`,
  },
  {
    label: "Final inspection",
    detail: "You and the agent walk through and agree the state of the place.",
  },
  {
    label: "You both request the refund",
    detail: `${bond.lodgedWith} needs the request from both sides. Disagree, and the Tenancy Tribunal decides.`,
  },
  {
    label: "It lands in your account",
    detail: "Usually within a few working days of both sides agreeing.",
  },
];

/** What a landlord can actually claim out of it — a closed list, not a free hand. */
const DEDUCTIONS = [
  "Rent you still owe",
  "Damage beyond fair wear and tear",
  "Cleaning, if the place is left worse than you found it",
  "Anything the Tenancy Tribunal has ordered",
];

export function EndOfTenancy() {
  const { derived } = useLitchi();

  // Whether the plan finishes before the tenancy does decides which story this
  // card tells, so it is worked out rather than assumed.
  const daysOfSlack = daysBetween(derived.payoffDate, tenancy.endDate);
  const clearsFirst = daysOfSlack >= 0;

  return (
    <Card>
      <CardTitle>When your tenancy ends</CardTitle>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist">
        Your fixed term runs to {formatDate(tenancy.endDate)}. Here&rsquo;s what happens to the{" "}
        {money(bond.amount)} then.
      </p>

      <div className="mt-7 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            Getting your bond back
          </h3>
          <ol className="mt-4 space-y-3.5">
            {REFUND_STEPS.map((step, index) => (
              <li key={step.label} className="flex items-start gap-3">
                <span
                  className="numeric mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream text-[10px] font-bold text-bark"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{step.label}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-mist">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* The single most misunderstood part of the product. */}
          <div className="mt-6 flex items-start gap-3 rounded-tile bg-moss-soft px-4 py-3.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden />
            <p className="text-[13px] leading-relaxed text-moss">
              The refund goes to <span className="font-semibold">you</span>, not to Litchi. We have
              no claim on it and never take our repayments out of it.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            What your landlord can deduct
          </h3>
          <ul className="mt-4 space-y-2.5">
            {DEDUCTIONS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[13px] leading-relaxed text-mist"
              >
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] leading-relaxed text-mist">
            That&rsquo;s between you and your landlord. A deduction doesn&rsquo;t change what you
            owe Litchi, and it doesn&rsquo;t touch your Litchi Score.
          </p>

          <div
            className={clsx(
              "mt-6 rounded-tile px-4 py-4",
              clearsFirst ? "bg-cream" : "bg-amber-soft"
            )}
          >
            <h4 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              {clearsFirst ? (
                <Check className="h-4 w-4 shrink-0 text-moss" aria-hidden />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-amber-warm" aria-hidden />
              )}
              {clearsFirst ? "Your plan finishes first" : "Your plan runs past your tenancy"}
            </h4>
            <p className="mt-2 text-[13px] leading-relaxed text-mist">
              {clearsFirst ? (
                <>
                  Your last payment is {formatDate(derived.payoffDate)} &mdash;{" "}
                  {Math.round(daysOfSlack)} days before your tenancy ends. Nothing is outstanding,
                  so the whole {money(bond.amount)} comes back to you.
                </>
              ) : (
                <>
                  On the current schedule you&rsquo;d still owe{" "}
                  <span className="numeric font-semibold text-ink">
                    {moneyExact(derived.balance)}
                  </span>{" "}
                  when the tenancy ends.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* The case that actually carries the risk, stated rather than avoided. */}
      <div className="mt-8 border-t border-sand/70 pt-6">
        <h3 className="text-[15px] font-semibold text-ink">If you move out early and still owe</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist">
          The plan carries on exactly as it is &mdash; same{" "}
          {moneyExact(plan.weeklyPayment)}{" "}
          a week, same payoff date, no change and no fee for leaving. Or, once your bond is
          refunded to you, you can use it to clear the balance in one go and be done. Either way
          it&rsquo;s your call, and telling us you&rsquo;re moving costs you nothing.
        </p>
      </div>
    </Card>
  );
}
