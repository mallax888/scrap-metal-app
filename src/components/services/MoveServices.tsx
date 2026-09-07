"use client";

import { useState } from "react";
import { Check, HandCoins, Info, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  moveServices,
  plan,
  PROPERTY_SIZES,
  SERVICE_COMMISSION_RATE,
  type PropertySize,
} from "@/lib/data";
import { money, moneyExact } from "@/lib/format";
import { quoteBasket, quoteService } from "@/lib/services";
import { useLitchi } from "@/lib/store";

/**
 * The two jobs either side of a bond, bookable.
 *
 * The moving checklist has always listed a clean and a truck as things nobody
 * covers. They are the natural second product: the exit clean is what decides
 * whether the bond comes back whole, so Litchi paying the bond in and helping
 * get it back out is one story rather than an upsell bolted to the side.
 *
 * Two things this screen refuses to do. It does not mark the price up — the
 * provider's price is the provider's price, and Litchi is paid by them, which
 * is said on the page rather than in a footer. And it does not lead with
 * financing: paying for a clean outright is what most people should do, so
 * that is the default and spreading it is the alternative.
 */
const ICONS: Record<string, typeof Sparkles> = {
  "bond-clean": Sparkles,
  removals: Truck,
};

export function MoveServices() {
  const { derived } = useLitchi();
  const toast = useToast();
  const [size, setSize] = useState<PropertySize>("medium");
  const [selected, setSelected] = useState<string[]>([]);
  const [finance, setFinance] = useState(false);

  const basket = quoteBasket(selected, size);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  return (
    <div className="space-y-6">
      {/* The reason these two sit inside a bond product at all. */}
      <Card tone="cream">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-bark" aria-hidden />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              A bad exit clean is the most expensive corner you can cut
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark">
              Cleaning is one of the most common things a landlord claims a bond for. A proper
              clean on the way out is what decides how much of the bond Litchi paid comes back to
              you &mdash; all{" "}
              {money(plan.principal)} of it, if you leave the place right.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[19px] font-semibold tracking-tight text-ink">Book a job</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Property size">
            {PROPERTY_SIZES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSize(option.value)}
                aria-pressed={size === option.value}
                className={clsx(
                  "tap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                  size === option.value
                    ? "bg-brand text-onbrand"
                    : "border border-sand text-mist hover:bg-cream hover:text-ink"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {moveServices.map((service) => {
            const Icon = ICONS[service.id] ?? Sparkles;
            const quote = quoteService(service, size);
            const chosen = selected.includes(service.id);
            return (
              // A column, so the provider and the button sit on the floor of
              // the card rather than wherever the copy above happens to end —
              // the two blurbs are different lengths and the sizes change them
              // again, so without this the buttons never line up.
              <Card
                key={service.id}
                className={clsx("flex h-full flex-col", chosen && "ring-2 ring-brand")}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <p className="numeric text-[26px] font-semibold tracking-[-0.02em] text-ink">
                    {money(quote.price)}
                  </p>
                </div>

                <CardTitle className="mt-4">{service.name}</CardTitle>
                <p className="mt-2 text-sm leading-relaxed text-mist">{service.blurb}</p>

                <ul className="mt-4 space-y-2">
                  {service.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[13px] leading-relaxed text-mist"
                    >
                      <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <div className="rounded-tile bg-cream px-4 py-3">
                    <p className="text-[13px] font-medium text-ink">{service.provider}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-bark">
                      {service.providerNote}
                    </p>
                  </div>

                  <Button
                    className="mt-5"
                    variant={chosen ? "secondary" : "primary"}
                    onClick={() => toggle(service.id)}
                  >
                    {chosen ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden />
                        Added
                      </>
                    ) : (
                      "Add to my move"
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardTitle>What you&rsquo;d pay</CardTitle>
        {basket.empty ? (
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Add a job above and the total appears here, along with what it would do to your weekly
            payment if you spread it.
          </p>
        ) : (
          <>
            <dl className="mt-5 space-y-2.5">
              {moveServices
                .filter((s) => selected.includes(s.id))
                .map((s) => (
                  <div key={s.id} className="flex items-baseline justify-between gap-4 text-sm">
                    <dt className="text-mist">{s.name}</dt>
                    <dd className="numeric font-medium text-ink">{money(s.prices[size])}</dd>
                  </div>
                ))}
              <div className="flex items-baseline justify-between gap-4 border-t border-sand/70 pt-3 text-[15px]">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="numeric font-semibold text-ink">{money(basket.price)}</dd>
              </div>
            </dl>

            {/* Paying outright is the default. Financing is the alternative,
                and it is priced identically to the bond so there is nothing to
                work out. */}
            <div className="mt-6 space-y-3">
              <label
                className={clsx(
                  "flex cursor-pointer items-start gap-3 rounded-tile px-4 py-3.5 transition-colors",
                  !finance ? "bg-cream" : "border border-sand"
                )}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={!finance}
                  onChange={() => setFinance(false)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Pay the provider directly &mdash; {money(basket.price)}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-mist">
                    On the day, straight to them. Nothing is added and Litchi is not in the middle
                    of it.
                  </span>
                </span>
              </label>

              <label
                className={clsx(
                  "flex cursor-pointer items-start gap-3 rounded-tile px-4 py-3.5 transition-colors",
                  finance ? "bg-cream" : "border border-sand"
                )}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={finance}
                  onChange={() => setFinance(true)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Add it to my Litchi plan &mdash; {moneyExact(basket.weekly)} a week
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-mist">
                    {money(basket.price)} plus the same flat {plan.feeRate * 100}% fee
                    &mdash; {money(basket.fee)} &mdash; over {basket.termWeeks} weeks. It is a
                    second line, not added to your bond payment.
                  </span>
                </span>
              </label>
            </div>

            {finance ? (
              <dl className="mt-5 grid gap-px overflow-hidden rounded-tile border border-sand bg-sand sm:grid-cols-3">
                {[
                  { label: "Bond repayment", value: moneyExact(plan.weeklyPayment) },
                  { label: "This booking", value: moneyExact(basket.weekly) },
                  {
                    label: `Weekly for ${basket.termWeeks} weeks`,
                    value: moneyExact(plan.weeklyPayment + basket.weekly),
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-paper px-4 py-3.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                      {item.label}
                    </dt>
                    <dd className="numeric mt-1.5 text-[17px] font-semibold text-ink">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-6">
              <Button
                onClick={() =>
                  toast(
                    finance
                      ? `Booked. ${moneyExact(basket.weekly)} a week added for ${basket.termWeeks} weeks.`
                      : "Booked. They'll confirm a time with you today.",
                    "success"
                  )
                }
              >
                Book {selected.length === 1 ? "this job" : "these jobs"}
              </Button>
              {derived.balance > 0 && finance ? (
                <p className="mt-3 text-[13px] leading-relaxed text-mist">
                  Your bond plan is unaffected &mdash; it still finishes on its own date.
                </p>
              ) : null}
            </div>
          </>
        )}
      </Card>

      {/* Said on the page, not in a footer. */}
      <Card>
        <div className="flex items-start gap-3">
          <HandCoins className="mt-0.5 h-5 w-5 shrink-0 text-clay" aria-hidden />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">How Litchi is paid for this</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">
              The provider pays Litchi {SERVICE_COMMISSION_RATE * 100}% of the job. You pay their
              price either way &mdash; booking through Litchi does not add anything to it, and
              nothing here is marked up. We would rather tell you that than have you find out.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="cream">No markup on the price</Badge>
              <Badge tone="cream">A shortlist, not a directory</Badge>
              <Badge tone="cream">We re-book any job that fails an inspection</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-start gap-3 text-[13px] leading-relaxed text-mist">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden />
        <p className="max-w-3xl">
          Two operators, not fifty. A cleaner who does a bad job costs you part of your bond, so
          Litchi sends volume to a small number of people it has checked rather than listing
          everyone who signs up. If a landlord claims for cleaning after a job booked here, we go
          back to the cleaner and get it put right.
        </p>
      </div>
    </div>
  );
}
