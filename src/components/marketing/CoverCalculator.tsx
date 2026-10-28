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
import { money, moneyExact, percent } from "@/lib/format";
import {
  RTA_CAPS,
  buildMoveCosts,
  costedTotal,
  quoteBondAssist,
  quoteMove,
  type MoveCostLine,
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
 *
 * And the estimate is a list, not a lump. A move is not one number, it is
 * seven of them, and which ones apply is the renter's call — a pet bond only
 * if a pet is coming, carpet cleaning only if the agreement demands it. So
 * every line is a tick box and the total is what is ticked.
 */

/** Below and above these, a typed rent is a typo rather than a tenancy. */
const MIN_RENT = 100;
const MAX_RENT = 3000;

/**
 * One short line under each cost, in the terms it is set by.
 *
 * The three capped lines say what caps them, because "four weeks' rent" is the
 * claim that this estimate is derived rather than invented. The rest name who
 * gets paid, since Litchi books them and the money goes straight there.
 */
function lineNote(line: MoveCostLine): string | null {
  if (line.id === "bond") return `${RTA_CAPS.bondWeeks} weeks’ rent — the legal cap`;
  if (line.id === "rent-advance")
    return `${RTA_CAPS.rentInAdvanceWeeks} weeks — the most that can be asked for`;
  if (line.id === "pet-bond") return `${RTA_CAPS.petBondWeeks} weeks, if a pet is coming`;
  if (line.payee === "provider") return line.payeeName;
  return null;
}

export function CoverCalculator() {
  const inputId = useId();
  const [typed, setTyped] = useState("");
  // The sample tenancy is costed at this size everywhere else in the app, so
  // the untouched panel agrees with the demo account rather than undercutting it.
  const [size, setSize] = useState<PropertySize>("medium");
  /** Only the lines the visitor has changed; the rest keep their default. */
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  /**
   * Which of the two products the week is showing.
   *
   * It starts on everything, because ticking a line is someone saying they
   * want that line dealt with — a panel that answers by quoting the bond
   * regardless is ignoring what they just told it. The cheaper option sits
   * beside it with its own price, so the steer is still there and is now a
   * choice rather than a default nobody was shown.
   */
  const [cover, setCover] = useState<"all" | "bond">("all");

  const parsed = Number.parseInt(typed, 10);
  const typedIsUsable =
    Number.isFinite(parsed) && parsed >= MIN_RENT && parsed <= MAX_RENT;
  const outOfRange = typed.length > 0 && !typedIsUsable;

  // With nothing usable typed, the panel falls back to the sample tenancy so
  // the shape of the answer is visible before the question is asked.
  const weeklyRent = typedIsUsable ? parsed : sampleRent.weekly;

  const { lines, total, chosen, bondAssist, wholeMove } = useMemo(() => {
    // A line with no figure cannot be priced off a rent — storage depends on
    // how long the gap is — so those stay in the full calculator next door.
    const priced = buildMoveCosts(weeklyRent, size)
      .filter((line) => line.amount > 0)
      .map((line) => ({ ...line, selected: ticked[line.id] ?? line.selected }));
    const sum = costedTotal(priced);
    const bondLine = priced.find((line) => line.id === "bond" && line.selected);
    return {
      lines: priced,
      total: sum,
      chosen: priced.filter((line) => line.selected).length,
      bondAssist: quoteBondAssist(bondLine ? bondLine.amount : 0),
      wholeMove: sum > 0 ? quoteMove(sum, 52) : null,
    };
  }, [weeklyRent, size, ticked]);

  const canCoverBondOnly = bondAssist.amount > 0;
  // The bond-only option disappears when the bond is not ticked, and the
  // selection has to fall back rather than quote a product for nothing.
  const showing = cover === "bond" && canCoverBondOnly ? "bond" : "all";
  const financed = showing === "bond" ? bondAssist.amount : total;
  const weekly =
    showing === "bond" ? bondAssist.weekly : wholeMove ? wholeMove.weekly : 0;
  const terms =
    showing === "bond"
      ? `${bondAssist.termWeeks} weeks · ${money(bondAssist.fee)} flat fee, no interest`
      : wholeMove
        ? `${wholeMove.termWeeks} weeks · ${money(wholeMove.establishmentFee)} establishment fee, ${percent(wholeMove.annualRate, 2)} p.a.`
        : "";
  const financingSomething = financed > 0 && weekly > 0;
  const rentShare = weeklyRent / (weeklyRent + weekly);

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
              <p className="mt-2 text-[12.5px] text-mist">
                {chosen} of {lines.length} lines
                {chosen === lines.length ? " — everything" : ", tick what applies"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-warm">
              {typedIsUsable ? "Estimate" : "Sample"}
            </span>
          </div>

          {/* Every line is the renter's call. The two capped ones are ticked
              by default because they are not optional in practice; the rest
              start off and wait to be asked for. */}
          <ul className="mt-4 divide-y divide-sand/60">
            {lines.map((line) => {
              const note = lineNote(line);
              return (
                <li key={line.id}>
                  <label className="flex cursor-pointer items-start gap-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={line.selected}
                      onChange={(event) =>
                        setTicked((prev) => ({
                          ...prev,
                          [line.id]: event.target.checked,
                        }))
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={clsx(
                          "block text-[13.5px] font-medium",
                          line.selected ? "text-ink" : "text-mist",
                        )}
                      >
                        {line.label}
                      </span>
                      {note ? (
                        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-clay">
                          {note}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={clsx(
                        "numeric shrink-0 text-[13.5px] font-semibold",
                        line.selected ? "text-ink" : "text-clay line-through",
                      )}
                    >
                      {money(line.amount)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-cream p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            What Litchi would cover
          </p>

          {/* Both products, both prices, side by side. The cheaper one is
              labelled as cheaper rather than chosen on the visitor's behalf. */}
          <div className="mt-3 grid gap-2" role="group" aria-label="What Litchi would cover">
            {(
              [
                { key: "all" as const, label: "Everything ticked", amount: total, week: wholeMove?.weekly ?? 0 },
                { key: "bond" as const, label: "Just the bond", amount: bondAssist.amount, week: bondAssist.weekly },
              ]
            ).map((option) => {
              const available = option.amount > 0;
              const cheaper =
                option.key === "bond" && canCoverBondOnly && bondAssist.weekly < (wholeMove?.weekly ?? 0);
              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={!available}
                  aria-pressed={available && showing === option.key}
                  onClick={() => setCover(option.key)}
                  className={clsx(
                    "tap flex items-center justify-between gap-3 rounded-tile border px-3.5 py-2.5 text-left transition-colors",
                    !available && "cursor-not-allowed opacity-45",
                    available && showing === option.key
                      ? "border-bark bg-paper"
                      : "border-transparent bg-paper/60 hover:border-sand",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink">
                      {option.label}
                      {cheaper ? (
                        <span className="ml-2 rounded-full bg-moss-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-moss">
                          Cheaper
                        </span>
                      ) : null}
                    </span>
                    <span className="numeric mt-0.5 block text-[12px] text-mist">
                      {available ? money(option.amount) : "nothing ticked"}
                    </span>
                  </span>
                  <span className="numeric shrink-0 whitespace-nowrap text-[15px] font-semibold text-ink">
                    {available ? moneyExact(option.week) : "—"}
                    <span className="text-[12px] font-medium text-mist"> / wk</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            Then your week looks like this
          </p>
          <div
            className="mt-3.5 flex h-2.5 w-full overflow-hidden rounded-full bg-sand"
            aria-hidden
          >
            <div
              className="h-full bg-moss"
              style={{ width: `${(financingSomething ? rentShare : 1) * 100}%` }}
            />
            {financingSomething ? <div className="h-full flex-1 bg-litchi" /> : null}
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
            {financingSomething ? (
              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-litchi"
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">
                      Litchi, for the {money(financed)}{" "}
                      {showing === "bond" ? "bond" : "you ticked"}
                    </span>
                    <span className="block text-xs text-mist">{terms}</span>
                  </span>
                </dt>
                <dd className="shrink-0 whitespace-nowrap text-[15px] font-semibold text-ink">
                  {moneyExact(weekly)}
                  <span className="text-[13px] font-medium text-mist"> / wk</span>
                </dd>
              </div>
            ) : null}
          </dl>

          {/* What the other way of paying for it would cost, said plainly
              rather than left for the visitor to discover after applying. */}
          {/* Why the two prices differ, rather than leaving someone to work it
              out from the figures. A flat fee on a refundable bond and a rate
              on an unsecured facility are not the same product. */}
          <p className="mt-3 border-t border-sand/70 pt-4 text-[12.5px] leading-relaxed text-mist">
            {total === 0 ? (
              <>Nothing ticked yet. Choose the lines that apply and the week fills in.</>
            ) : !canCoverBondOnly ? (
              <>
                The bond is not ticked, so there is nothing for Bond Assist to cover &mdash;
                Litchi Move takes whatever you have ticked instead.
              </>
            ) : (
              <>
                Bond Assist only ever covers a bond, at a flat{" "}
                {money(bondAssist.fee)} fee with no interest, because a bond comes back to you
                at the end of the tenancy. Litchi Move covers whatever you tick, at a{" "}
                {money(wholeMove ? wholeMove.establishmentFee : 0)} establishment fee and{" "}
                {percent(wholeMove ? wholeMove.annualRate : 0, 2)} p.a., because a truck does
                not. That is why the bond on its own is the cheaper one.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
