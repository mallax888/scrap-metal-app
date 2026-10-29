"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { ButtonLink } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
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
 * The front door: one question, one number, one button.
 *
 * It used to carry a badge, a tagline, a headline, three paragraphs, a rent
 * field, three size chips, seven tick boxes, two funding options, a week
 * panel, a footnote, a legal paragraph and five buttons. Every one of those
 * earned its place in some conversation, and together they turned a question
 * into a form.
 *
 * So the cover now asks the question and shows the answer, and everything
 * that explains the answer sits behind one heading — the same disclosure the
 * tenancy board uses, so the product has one idea rather than two.
 *
 * What stays in front is chosen by what a stranger needs to decide whether to
 * continue: the total, who covers the bond, what that costs a week. What moves
 * behind is what they need to *trust* it: the seven lines, the caps, the
 * comparison between products, and the small print. Detail is credibility, so
 * it is one tap away rather than gone — bury it properly and the big number
 * starts to look invented.
 *
 * The size chips went behind the fold on the same reasoning. Rent alone fixes
 * the bond and the rent in advance, which are most of the number and both set
 * by statute; the size only moves the truck and the clean. One input is worth
 * more than a slightly better estimate.
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

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "text-[11px] font-semibold uppercase tracking-[0.14em] text-clay",
        className
      )}
    >
      {children}
    </p>
  );
}

export function CoverCalculator() {
  const inputId = useId();
  const detailId = useId();
  const [typed, setTyped] = useState("");
  // The sample tenancy is costed at this size everywhere else in the app, so
  // an untouched estimate agrees with the demo account rather than undercutting it.
  const [size, setSize] = useState<PropertySize>("medium");
  /** Only the lines the visitor has changed; the rest keep their default. */
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  /** Which of the two products the week is showing; null until someone picks. */
  const [cover, setCover] = useState<"all" | "bond" | null>(null);
  const [open, setOpen] = useState(false);

  const parsed = Number.parseInt(typed, 10);
  const typedIsUsable =
    Number.isFinite(parsed) && parsed >= MIN_RENT && parsed <= MAX_RENT;
  const outOfRange = typed.length > 0 && !typedIsUsable;
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
  /**
   * When the bond is the only line ticked, the two options are the same money
   * — the choice is of product, not of coverage. Defaulting to "everything"
   * there quoted the dearer of two identical covers, which is the one thing
   * this page exists not to do.
   */
  const sameCoverage = canCoverBondOnly && total === bondAssist.amount;
  const picked = cover ?? (sameCoverage ? "bond" : "all");
  const showing = picked === "bond" && canCoverBondOnly ? "bond" : "all";
  const financed = showing === "bond" ? bondAssist.amount : total;
  const weekly =
    showing === "bond" ? bondAssist.weekly : wholeMove ? wholeMove.weekly : 0;
  const financingSomething = financed > 0 && weekly > 0;
  const rentShare = weeklyRent / (weeklyRent + weekly);

  const tick = useCallback((id: string, next: boolean) => {
    setTicked((prev) => ({ ...prev, [id]: next }));
    // Changing what is covered makes any earlier choice of product a choice
    // about a different move, so it goes back to the default — which is the
    // cheaper one wherever the two cover the same money.
    setCover(null);
  }, []);

  return (
    <div className="mx-auto max-w-[620px] px-1 pt-8 text-center sm:pt-12">
      <DemoBadge />

      <h1 className="mt-7 text-[40px] font-semibold leading-[1.02] tracking-[-0.038em] text-ink sm:text-[58px]">
        What will your
        <br />
        move cost?
      </h1>

      <label htmlFor={inputId} className="mt-9 block text-[13.5px] font-semibold text-ink">
        Weekly rent on your new place
      </label>
      <div
        className={clsx(
          "mx-auto mt-3 flex max-w-[420px] items-center gap-3 rounded-2xl border-[1.5px] bg-paper px-5 py-4 transition-colors",
          "focus-within:border-bark focus-within:ring-[3px] focus-within:ring-bark/20",
          typedIsUsable ? "border-bark" : "border-sand"
        )}
      >
        <span aria-hidden className="text-[22px] font-semibold text-clay">
          $
        </span>
        <input
          id={inputId}
          value={typed}
          onChange={(event) => setTyped(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Rent per week"
          aria-describedby={outOfRange ? `${inputId}-hint` : undefined}
          className="focus-ring-on-wrapper numeric min-w-0 flex-1 bg-transparent text-left text-[28px] font-semibold tracking-[-0.02em] text-ink placeholder:text-[18px] placeholder:font-medium placeholder:tracking-normal placeholder:text-clay"
        />
        <span className="shrink-0 text-[13.5px] text-mist">a week</span>
      </div>

      {outOfRange ? (
        <p id={`${inputId}-hint`} className="mt-2.5 text-[12.5px] text-bark">
          Enter a weekly rent between {money(MIN_RENT)} and {money(MAX_RENT)}.
        </p>
      ) : null}

      {/* The answer, or — before anyone types — the claim in one sentence. */}
      {typedIsUsable ? (
        <section className="mt-10" aria-live="polite">
          <SectionLabel>Your move, estimated</SectionLabel>
          <p className="numeric mt-2.5 text-[58px] font-semibold leading-none tracking-[-0.045em] text-ink sm:text-[74px]">
            {money(total)}
          </p>
          <p className="mx-auto mt-4 max-w-[40ch] text-[15.5px] leading-relaxed text-mist sm:text-[17px]">
            {!financingSomething ? (
              <>Nothing ticked for Litchi to cover &mdash; this is the whole move, paid by you.</>
            ) : financed < total ? (
              <>
                Litchi covers the{" "}
                <strong className="numeric font-semibold text-ink">{money(financed)}</strong>{" "}
                {showing === "bond" ? "bond" : "you ticked"} &mdash;{" "}
                <strong className="numeric font-semibold text-ink">{moneyExact(weekly)}</strong> a
                week.
                <br />
                The rest is yours to find.
              </>
            ) : (
              /* Nothing is left over, so the sentence must not invent a remainder. */
              <>
                Litchi covers all of it &mdash;{" "}
                <strong className="numeric font-semibold text-ink">{moneyExact(weekly)}</strong> a
                week for {wholeMove ? wholeMove.termWeeks : 52} weeks.
              </>
            )}
          </p>
        </section>
      ) : (
        <p className="mx-auto mt-7 max-w-[46ch] text-[15px] leading-relaxed text-mist sm:text-[16px]">
          Type it and we&rsquo;ll price the whole move &mdash; bond, rent in advance, the truck,
          the clean. A {money(sampleRent.weekly)} place comes to about{" "}
          <strong className="numeric font-semibold text-ink">
            {money(costedTotal(buildMoveCosts(sampleRent.weekly, "medium")))}
          </strong>
          .
        </p>
      )}

      <div className="mt-9 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
        <ButtonLink href="/cost-my-move" size="lg">
          Cost my move
          <ArrowRight className="h-4 w-4" aria-hidden />
        </ButtonLink>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={detailId}
          className="tap inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold text-bark transition-colors hover:bg-cream"
        >
          See every line
          <ChevronDown
            className={clsx("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </div>

      {/* Everything that explains the number, one tap away. */}
      <div
        id={detailId}
        hidden={!open}
        className="animate-pop mt-9 border-t border-sand/90 pt-7 text-left"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <SectionLabel>
            {lines.length} lines. Tick what applies.
          </SectionLabel>
          <p className="text-[12px] text-mist">{chosen} ticked</p>
        </div>

        <ul className="mt-3 divide-y divide-sand/60">
          {lines.map((line) => {
            const note = lineNote(line);
            return (
              <li key={line.id}>
                <label className="flex cursor-pointer items-start gap-3.5 py-2.5">
                  <input
                    type="checkbox"
                    checked={line.selected}
                    onChange={(event) => tick(line.id, event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--bark)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={clsx(
                        "block text-[14.5px] font-medium",
                        line.selected ? "text-ink" : "text-mist"
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
                      "numeric shrink-0 text-[14.5px] font-semibold",
                      line.selected ? "text-ink" : "text-clay line-through"
                    )}
                  >
                    {money(line.amount)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {/* The lines add up to something, and before a rent is typed that
            total appears nowhere else on the page. The detail is where
            completeness belongs, so it carries it. */}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-sand pt-3">
          <span className="text-[13px] font-semibold text-ink">
            {typedIsUsable ? "Your move" : `A ${money(sampleRent.weekly)} place`}
          </span>
          <span className="numeric text-[18px] font-semibold tracking-[-0.02em] text-ink">
            {money(total)}
          </span>
        </div>

        {/* Size only moves the truck and the clean, which is why it lives here
            rather than beside the rent. */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>How big is the place?</SectionLabel>
          <div className="flex flex-wrap gap-2" role="group" aria-label="How big is the place?">
            {PROPERTY_SIZES.map((option) => (
              <ChoiceChip
                key={option.value}
                pressed={size === option.value}
                onClick={() => setSize(option.value)}
              >
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </div>

        <SectionLabel className="mt-7">What Litchi would cover</SectionLabel>
        <div className="mt-3 grid gap-2" role="group" aria-label="What Litchi would cover">
          {(
            [
              {
                key: "all" as const,
                label: sameCoverage ? "The bond, as a facility" : "Everything ticked",
                product: "Litchi Move",
                amount: total,
                week: wholeMove?.weekly ?? 0,
              },
              {
                key: "bond" as const,
                label: "Just the bond",
                product: "Bond Assist",
                amount: bondAssist.amount,
                week: bondAssist.weekly,
              },
            ]
          ).map((option) => {
            const available = option.amount > 0;
            const cheaper =
              option.key === "bond" &&
              canCoverBondOnly &&
              bondAssist.weekly < (wholeMove?.weekly ?? 0);
            return (
              <button
                key={option.key}
                type="button"
                disabled={!available}
                aria-pressed={available && showing === option.key}
                onClick={() => setCover(option.key)}
                className={clsx(
                  "tap flex items-center justify-between gap-3 rounded-tile border px-4 py-3 text-left transition-colors",
                  !available && "cursor-not-allowed opacity-45",
                  available && showing === option.key
                    ? "border-bark bg-paper"
                    : "border-transparent bg-cream hover:border-sand"
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-ink">
                    {option.label}
                    {cheaper ? (
                      <span className="ml-2 rounded-full bg-moss-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-moss">
                        Cheaper
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-mist">
                    {available ? (
                      <>
                        <span className="numeric">{money(option.amount)}</span> &middot;{" "}
                        {option.product}
                      </>
                    ) : option.key === "bond" ? (
                      "bond not ticked"
                    ) : (
                      "nothing ticked"
                    )}
                  </span>
                </span>
                <span className="numeric shrink-0 whitespace-nowrap text-[16px] font-semibold text-ink">
                  {available ? moneyExact(option.week) : "—"}
                  <span className="text-[12px] font-medium text-mist"> / wk</span>
                </span>
              </button>
            );
          })}
        </div>

        {financingSomething ? (
          <>
            <SectionLabel className="mt-7">Then your week</SectionLabel>
            <div className="mt-3 rounded-tile bg-cream px-4 py-4">
              <div className="flex h-2 overflow-hidden rounded-full bg-sand" aria-hidden>
                <div className="h-full bg-moss" style={{ width: `${rentShare * 100}%` }} />
                <div className="h-full flex-1 bg-litchi" />
              </div>
              <dl className="numeric mt-3 space-y-2.5">
                <div className="flex items-center justify-between gap-4 text-[13.5px]">
                  <dt className="flex min-w-0 items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-moss" aria-hidden />
                    <span className="font-semibold text-ink">Rent</span>
                    <span className="truncate text-[12px] text-mist">to your landlord</span>
                  </dt>
                  <dd className="shrink-0 whitespace-nowrap font-semibold text-ink">
                    {money(weeklyRent)} / wk
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 text-[13.5px]">
                  <dt className="flex min-w-0 items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-litchi" aria-hidden />
                    <span className="font-semibold text-ink">Litchi</span>
                    <span className="truncate text-[12px] text-mist">
                      {showing === "bond"
                        ? `${bondAssist.termWeeks} weeks, ${money(bondAssist.fee)} flat fee`
                        : wholeMove
                          ? `${wholeMove.termWeeks} weeks, ${percent(wholeMove.annualRate, 2)} p.a.`
                          : ""}
                    </span>
                  </dt>
                  <dd className="shrink-0 whitespace-nowrap font-semibold text-ink">
                    {moneyExact(weekly)} / wk
                  </dd>
                </div>
              </dl>
            </div>
          </>
        ) : null}

        <p className="mt-7 text-[12px] leading-relaxed text-clay">
          An estimate from the rent you typed, using the Residential Tenancies Act caps. Not a
          credit offer, and nothing is confirmed until your property manager verifies the tenancy
          at source. Bond Assist only ever covers a bond, at a flat fee with no interest; Litchi
          Move covers whatever you tick, at an establishment fee and a rate &mdash; which is why
          the bond on its own is the cheaper one.
        </p>
      </div>
    </div>
  );
}
