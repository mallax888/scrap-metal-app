"use client";

import { useId, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { ButtonLink } from "@/components/ui/Button";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import {
  PROPERTY_SIZES,
  rent as sampleRent,
  type PropertySize,
} from "@/lib/data";
import { money, moneyExact } from "@/lib/format";
import {
  buildMoveCosts,
  costedTotal,
  quoteBondAssist,
  quoteMove,
} from "@/lib/move";

/**
 * The front door, as the thing the product actually does.
 *
 * What was here before was three paragraphs and then two buttons, so the first
 * act a stranger performed on this page was reading ninety words. The one
 * thing Litchi has that a bank does not is that it can price a move off a
 * single number, and that number is one a renter already knows — so the cover
 * asks for it and answers immediately.
 *
 * Before anyone types, the panel is not empty: it shows the sample tenancy,
 * dimmed and labelled as a sample, so the claim is legible to someone who
 * never interacts with it at all.
 *
 * Two honesty rules the design has to carry, not bury:
 *   - This is an estimate off a typed number. Nothing is verified until the
 *     property manager confirms the tenancy at source, and an estimate is not
 *     a credit offer. That sits under the button, not in a footer.
 *   - Bond Assist is the cheaper product when the bond is all you need, so
 *     the panel quotes it first and names the whole-move figure beside it
 *     rather than quietly steering to the dearer one.
 */

/** Below and above these, a typed rent is a typo rather than a tenancy. */
const MIN_RENT = 100;
const MAX_RENT = 3000;

export function CoverCalculator() {
  const inputId = useId();
  const [typed, setTyped] = useState("");
  // The sample tenancy is costed at this size everywhere else in the app, so
  // the untouched panel agrees with the demo account rather than undercutting it.
  const [size, setSize] = useState<PropertySize>("medium");

  const parsed = Number.parseInt(typed, 10);
  const typedIsUsable =
    Number.isFinite(parsed) && parsed >= MIN_RENT && parsed <= MAX_RENT;
  const outOfRange = typed.length > 0 && !typedIsUsable;

  // With nothing usable typed, the panel falls back to the sample tenancy so
  // the shape of the answer is visible before the question is asked.
  const weeklyRent = typedIsUsable ? parsed : sampleRent.weekly;

  const { lines, total, bondAssist, wholeMove } = useMemo(() => {
    const costed = buildMoveCosts(weeklyRent, size).filter(
      (line) => line.selected && line.amount > 0,
    );
    const sum = costedTotal(costed);
    const bondLine = costed.find((line) => line.id === "bond");
    return {
      lines: costed,
      total: sum,
      bondAssist: quoteBondAssist(bondLine ? bondLine.amount : 0),
      wholeMove: quoteMove(sum, 52),
    };
  }, [weeklyRent, size]);

  const rentShare = weeklyRent / (weeklyRent + bondAssist.weekly);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 pt-8 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14">
      {/*
       * On a phone the three parts are siblings in one column, so the answer
       * can sit between the question and the buttons — type a rent and the
       * figures are right there rather than a screen-and-a-half further down.
       * On a wide screen the wrapper becomes the left column again and the
       * order classes stop meaning anything.
       */}
      <div className="contents lg:block lg:min-w-0">
        <div className="order-1 min-w-0">
          <DemoBadge />
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-clay">
            Move in. Pay smarter.
          </p>
          <h1 className="mt-3.5 max-w-2xl text-[40px] font-semibold leading-[1.05] tracking-[-0.032em] text-ink sm:text-[54px]">
            What will your move actually cost?
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-mist sm:text-[19px]">
            Every line of it, off one number. Litchi covers the bond so you are
            not paying two at once &mdash; and your rent never changes hands
            with us.
          </p>

          <div className="mt-8 max-w-md">
            <label
              htmlFor={inputId}
              className="text-[13px] font-semibold text-ink"
            >
              Weekly rent on the place you&rsquo;re moving into
            </label>
            <div
              className={clsx(
                "mt-2.5 flex items-center gap-2.5 rounded-2xl border-[1.5px] bg-paper px-4 py-3 transition-colors",
                // The ring goes on the field. Left to the global focus style it
                // landed on the input itself, drawing a second box inside the first.
                "focus-within:border-bark focus-within:ring-2 focus-within:ring-bark/30",
                typedIsUsable ? "border-bark" : "border-sand",
              )}
            >
              <span aria-hidden className="text-[20px] font-semibold text-clay">
                $
              </span>
              <input
                id={inputId}
                value={typed}
                onChange={(event) =>
                  setTyped(event.target.value.replace(/[^\d]/g, "").slice(0, 4))
                }
                inputMode="numeric"
                autoComplete="off"
                placeholder="Rent per week"
                aria-describedby={outOfRange ? `${inputId}-hint` : undefined}
                className="focus-ring-on-wrapper numeric min-w-0 flex-1 bg-transparent text-[24px] font-semibold tracking-[-0.02em] text-ink placeholder:text-[17px] placeholder:font-medium placeholder:tracking-normal placeholder:text-clay"
              />
              <span className="shrink-0 text-[13px] text-mist">a week</span>
            </div>

            {outOfRange ? (
              <p
                id={`${inputId}-hint`}
                className="mt-2 text-[12.5px] text-bark"
              >
                Enter a weekly rent between {money(MIN_RENT)} and{" "}
                {money(MAX_RENT)}.
              </p>
            ) : null}

            <fieldset className="mt-4">
              <legend className="sr-only">
                Size of the place you&rsquo;re moving into
              </legend>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_SIZES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSize(option.value)}
                    aria-pressed={size === option.value}
                    className={clsx(
                      "tap rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                      size === option.value
                        ? "border-brand bg-brand text-onbrand"
                        : "border-sand bg-paper text-mist hover:border-clay hover:text-ink",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="order-3 min-w-0 lg:mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/cost-my-move" size="lg">
              {typedIsUsable ? "See the full cost" : "Cost my move"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/apply" size="lg" variant="secondary">
              Just the bond
            </ButtonLink>
          </div>

          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-clay">
            An estimate from the rent you typed, using the Residential Tenancies
            Act caps. It is not a credit offer, and nothing is confirmed until
            your property manager verifies the tenancy at source. Both buttons
            open an interactive demo &mdash; nothing to sign up for.
          </p>
        </div>
      </div>

      {/* The answer. Dimmed until it is the visitor's own. */}
      {/*
       * The sample state is marked by its label and its pill, not by being
       * faded out. Dimming the whole panel dropped the small print below the
       * 4.5:1 contrast floor — an accessibility failure bought with nothing
       * more than a hint, and the hint is already in the words.
       */}
      <div
        aria-live="polite"
        className="order-2 min-w-0 overflow-hidden rounded-card border border-sand/70 bg-paper shadow-lift"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                {typedIsUsable
                  ? "Your move, estimated"
                  : `A sample move at ${money(sampleRent.weekly)} a week`}
              </p>
              <p className="numeric mt-2 text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
                {money(total)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-warm">
              {typedIsUsable ? "Estimate" : "Sample"}
            </span>
          </div>

          <dl className="numeric mt-4">
            {lines.map((line) => (
              <div
                key={line.id}
                className="flex items-baseline justify-between gap-4 py-1.5 text-[13.5px]"
              >
                <dt className="min-w-0 text-mist">{line.label}</dt>
                <dd className="shrink-0 font-semibold text-ink">
                  {money(line.amount)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-cream p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            Then your week looks like this
          </p>
          <div
            className="mt-3.5 flex h-2.5 w-full overflow-hidden rounded-full bg-sand"
            aria-hidden
          >
            <div
              className="h-full bg-moss"
              style={{ width: `${rentShare * 100}%` }}
            />
            <div className="h-full flex-1 bg-litchi" />
          </div>

          <dl className="numeric mt-2 divide-y divide-sand/70">
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-moss"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">
                    Rent
                  </span>
                  <span className="block text-xs text-mist">
                    to your landlord, exactly as before
                  </span>
                </span>
              </dt>
              <dd className="shrink-0 whitespace-nowrap text-[15px] font-semibold text-ink">
                {money(weeklyRent)}
                <span className="text-[13px] font-medium text-mist"> / wk</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-litchi"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">
                    Litchi, for the {money(bondAssist.amount)} bond
                  </span>
                  <span className="block text-xs text-mist">
                    {bondAssist.termWeeks} weeks &middot;{" "}
                    {money(bondAssist.fee)} flat fee, no interest
                  </span>
                </span>
              </dt>
              <dd className="shrink-0 whitespace-nowrap text-[15px] font-semibold text-ink">
                {moneyExact(bondAssist.weekly)}
                <span className="text-[13px] font-medium text-mist"> / wk</span>
              </dd>
            </div>
          </dl>

          <p className="mt-3 border-t border-sand/70 pt-4 text-[12.5px] leading-relaxed text-mist">
            Financing the whole {money(total)} instead is{" "}
            <span className="numeric font-semibold text-ink">
              {moneyExact(wholeMove.weekly)}
            </span>{" "}
            a week over {wholeMove.termWeeks} weeks. We show you both before you
            apply, and the bond on its own is always the cheaper one.
          </p>
        </div>
      </div>
    </div>
  );
}
