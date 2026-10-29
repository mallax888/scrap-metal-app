"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  Lock,
  PiggyBank,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatGrid } from "@/components/ui/StatGrid";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { MovePlan } from "@/components/move/MovePlan";
import { PROPERTY_SIZES, TODAY, type PropertySize } from "@/lib/data";
import { formatDate, money, moneyExact, percent } from "@/lib/format";
import {
  buildMoveCosts,
  canBook,
  cheaperAlternative,
  costedTotal,
  COVERAGE_LABELS,
  coverageSplit,
  defaultCoverage,
  defaultPartner,
  directShare,
  PAYEE_LABELS,
  quoteMove,
  RTA_CAPS,
  type Coverage,
  type MoveCostLine,
} from "@/lib/move";
import {
  DEMO_VERIFICATION_TOKEN,
  extractTenancy,
  findVerification,
  lowConfidenceFields,
  verificationDisclosure,
  type Confidence,
} from "@/lib/verification";
import { useVerificationStatus } from "@/lib/verification-store";
import { Field } from "@/components/ui/Field";

/**
 * Litchi Move: from "I got the place" to a costed, verified move plan.
 *
 * This is a calculator, not a loan application. The distinction is the whole
 * product, and it shows up in three places.
 *
 * The order. Every other lender starts with "how much do you want", which
 * makes the tenant guess and makes the number an ambition. Here the tenancy
 * comes first, the agency confirms it, and the costs fall out of the verified
 * rent — so the figures are facts before anybody discusses money.
 *
 * The amount, which is never typed in. It is the sum of the lines someone
 * chose to have Litchi cover, so it cannot exceed the move: there is no field
 * to put a bigger number in. Wanting less means paying for a line yourself,
 * which is a decision about the move rather than about borrowing.
 *
 * The ending. Financing nothing is a perfectly good outcome and the flow
 * finishes just as happily — you keep a verified tenancy, a costed move and a
 * record of who is paying what. A calculator that only exists to produce a
 * loan application is a loan application with extra steps.
 *
 * Nothing here is submitted anywhere. The whole journey runs in the browser.
 */
const STEPS = [
  "Your tenancy",
  "Check the details",
  "Agency confirms",
  "What it costs",
  "How you'll cover it",
] as const;

const CONFIDENCE_TONE: Record<Confidence, string> = {
  high: "text-moss",
  medium: "text-clay",
  low: "text-litchi",
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "Clear",
  medium: "Check this",
  low: "Please confirm",
};

/* Width is deliberately not set here. Every field on this screen is a
   fixed-width money input, and folding a `w-full` into the shared base would
   put two width utilities on one element with the stylesheet, rather than the
   class order, deciding which one wins. */
const fieldBase =
  "tap rounded-tile border border-sand bg-paper text-[15px] text-ink outline-none transition-colors focus:border-clay disabled:opacity-45";

/** The page's one h1, which has to change when the task is finished. */
function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-10">
      <h1 className="mt-6 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[44px]">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-mist">{body}</p>
    </div>
  );
}

function StepPanel({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: typeof FileText;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-bark">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <h2 className="mt-4 text-[19px] font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">{body}</p>
      {children}
    </div>
  );
}

/** A money field with the dollar sign outside the input, so it never scrolls away. */
function MoneyInput({
  value,
  onChange,
  max,
  label,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  label: string;
  disabled?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[15px] font-medium text-mist" aria-hidden>
        $
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        step={10}
        value={value === 0 ? "" : value}
        placeholder="0"
        aria-label={label}
        disabled={disabled}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isFinite(next) || next < 0) return onChange(0);
          onChange(max === undefined ? next : Math.min(next, max));
        }}
        className={clsx("numeric h-11 w-28 px-3 text-right", fieldBase)}
      />
    </span>
  );
}

export function MoveFlow() {
  const partner = defaultPartner;
  const token = DEMO_VERIFICATION_TOKEN;
  const request = findVerification(token);
  const verification = useVerificationStatus(token);

  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);

  /**
   * Every step starts at its own beginning.
   *
   * Without this, Continue swapped the content underneath an unchanged scroll
   * position — and since you press Continue from the bottom of a long step,
   * you landed 400px below the next step's heading, in the middle of a form,
   * with no idea what was being asked. The taller the step you just finished,
   * the further past the next one you arrive.
   *
   * It scrolls to the step rather than to the top of the document, because the
   * page intro and the progress list sit above it: scrolling to the very top
   * would make someone re-read the same 60 words on the way to every step.
   *
   * Skipped on first render so arriving at the page mid-scroll, from a link
   * with a hash or a restored position, is left alone.
   */
  const mounted = useRef(false);
  const stepTop = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    stepTop.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [step, submitted]);

  const extracted = useMemo(() => (fileName ? extractTenancy(fileName) : null), [fileName]);

  // The confirmation step can correct anything the extraction got wrong, so
  // these are seeded from the document and owned by the tenant thereafter.
  const [rent, setRent] = useState(0);
  const [bondAmount, setBondAmount] = useState(0);
  const [size, setSize] = useState<PropertySize>("medium");

  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [coverage, setCoverage] = useState<Record<string, Coverage>>({});
  const [termWeeks, setTermWeeks] = useState<number>(52);

  /**
   * Back to an empty flow.
   *
   * Every field, not just the step counter — "Start again" that leaves the
   * previous tenancy document loaded is a different button.
   */
  function reset() {
    setSubmitted(false);
    setStep(0);
    setFileName(null);
    setConfirmed(false);
    setConsent(false);
    setRent(0);
    setBondAmount(0);
    setAmounts({});
    setToggles({});
    setCoverage({});
    setTermWeeks(52);
  }

  const agencyName = extracted?.agencyName.value ?? "";

  /*
   * Defaults are derived; edits are an overlay on top of them. Keeping the
   * lines out of state means correcting the rent on step 1 updates the bond
   * and the advance on step 3, which is the whole reason the rent is verified
   * in the first place.
   */
  const baseLines = useMemo(
    () => buildMoveCosts(rent || 0, size, agencyName || undefined),
    [rent, size, agencyName]
  );

  const lines: MoveCostLine[] = baseLines.map((line) => {
    const overridden = amounts[line.id];
    const amount =
      overridden === undefined
        ? line.id === "bond" && bondAmount > 0
          ? Math.min(bondAmount, line.max ?? bondAmount)
          : line.amount
        : line.max === undefined
          ? overridden
          : Math.min(overridden, line.max);
    return { ...line, amount, selected: toggles[line.id] ?? line.selected };
  });

  const total = costedTotal(lines);
  /** The lines actually in the move, which is what every later step iterates. */
  const covered = lines.filter((line) => line.selected && line.amount > 0);

  /*
   * The amount is not typed in. It is the sum of the lines someone chose to
   * finance, which is why it can never exceed the move — there is no field to
   * put a bigger number in. Trimming the request means moving a line back to
   * "I'll pay this myself", which is a decision about the move rather than a
   * decision about how much to borrow.
   */
  const split = coverageSplit(lines, coverage);
  const requested = Math.min(split.financed, partner.maxAdvance);
  const financing = requested > 0;
  const belowMinimum = financing && requested < partner.minAdvance;

  /* The disbursement claim has to be about the financed lines only. Averaging
     it over money the tenant is paying themselves would flatter it. */
  const financedLines = covered.filter(
    (line) => (coverage[line.id] ?? defaultCoverage(line)) === "litchi"
  );
  const direct = directShare(financedLines);


  const quote = useMemo(
    () => quoteMove(requested, termWeeks, partner),
    [requested, termWeeks, partner]
  );

  /* Whether the other product covers this selection for less. Null unless the
     bond is the only thing being financed. */
  const alternative = cheaperAlternative(lines, coverage, quote);

  const uncertain = extracted ? lowConfidenceFields(extracted) : [];

  /*
   * Note what step 3 no longer requires: a total big enough to lend against.
   * A move that costs less than the smallest facility is still a move worth
   * costing, and the calculator has no business refusing to finish because
   * the answer turned out to be one nobody needs to borrow for.
   */
  const blocked =
    (step === 0 && !extracted) ||
    (step === 1 && (!confirmed || rent < 100)) ||
    (step === 2 && verification !== "verified") ||
    (step === 3 && total <= 0) ||
    (step === 4 && financing && (!consent || belowMinimum));

  function readDocument(name: string) {
    setFileName(null);
    setReading(true);
    // A real extraction takes a moment. Showing that beats a screen that
    // pretends reading a scanned PDF is instantaneous.
    window.setTimeout(() => {
      const parsed = extractTenancy(name);
      setFileName(name);
      setRent(parsed.weeklyRent.value);
      setBondAmount(parsed.bond.value);
      setReading(false);
    }, 900);
  }

  /* The saved plan is a screen, not a sixth step: it replaces the wizard
     rather than continuing it, so it lives in its own component. */
  if (submitted) {
    return (
      <>
        <div ref={stepTop} className="scroll-mt-4" />
        <Heading
          title="Your move plan"
          body={`Everything for ${request?.property ?? "your move"} in one place — what it costs, who is covering each line, and the tenancy behind it.`}
        />
        <MovePlan
          plan={{
          lines: covered,
          coverage,
          split,
          total,
          rent,
          requested,
          financing,
          quote,
          partner,
          tenancy: request,
        }}
          onStartAgain={reset}
        />
      </>
    );
  }

  /* ---------------------------------------------------------------- *
   * The flow.
   * ---------------------------------------------------------------- */
  return (
    <div>
      <Heading
        title={"You\u2019ve got the place. Let\u2019s work out the move."}
        body="We start with your tenancy, not with a number. Your agency confirms it, the costs come off it, and you decide how much of them to cover \u2014 up to what the move actually costs, never more."
      />
      {/* What each step scrolls to: the progress list and the step beneath it,
          so you land on where you are as well as on what is being asked. */}
      <div ref={stepTop} className="scroll-mt-4" />
      <ol className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        {STEPS.map((label, index) => (
          <li key={label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-sand">/</span> : null}
            <span
              className={clsx(
                index === step ? "font-semibold text-ink" : "text-mist",
                index < step && "text-moss"
              )}
              aria-current={index === step ? "step" : undefined}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <Card className="mt-5">
        {step === 0 ? (
          <StepPanel
            icon={FileText}
            title="Start with the place you've just got"
            body="Upload your tenancy agreement and we'll read the rent, the bond and the dates off it. It saves you typing them, and it means the figures behind your application came from the document rather than from memory."
          >
            <div className="mt-7">
              {reading ? (
                <div className="flex items-center gap-3 rounded-tile border border-sand bg-cream px-5 py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-bark" aria-hidden />
                  <p className="text-sm font-medium text-ink" role="status">
                    Reading your agreement&hellip;
                  </p>
                </div>
              ) : extracted ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-tile border border-moss/30 bg-moss-soft/40 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 shrink-0 text-moss" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{fileName}</p>
                      <p className="mt-0.5 text-[13px] text-mist">
                        Read. Check what we found on the next step.
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setFileName(null)}>
                    Replace
                  </Button>
                </div>
              ) : (
                <div className="rounded-tile border border-dashed border-sand px-5 py-7 text-center">
                  <p className="text-sm font-medium text-ink">
                    Drop your tenancy agreement here
                  </p>
                  <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-mist">
                    PDF or a photo of the signed copy. In this demo nothing is uploaded &mdash;
                    pick either option below to see what the extraction returns.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Button onClick={() => readDocument("Tenancy agreement.pdf")}>
                      Use a sample PDF
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => readDocument("IMG_4821 scan.jpg")}
                    >
                      Use a phone photo
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-start gap-3 rounded-tile bg-cream px-4 py-3.5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-bark" aria-hidden />
                <p className="text-[13px] leading-relaxed text-bark">
                  Your agreement is used to read those few fields and nothing else. It is never
                  sent to your property manager, and it is not shared with the lender &mdash; they
                  receive the confirmed figures, not the document.
                </p>
              </div>
            </div>
          </StepPanel>
        ) : null}

        {step === 1 && extracted ? (
          <StepPanel
            icon={ClipboardList}
            title="Check what we read"
            body="Everything below came off your agreement. Anything flagged is worth a second look — a scanned or photographed document gives up handwritten fields least reliably."
          >
            {uncertain.length > 0 ? (
              <div className="mt-6 flex items-start gap-3 rounded-tile bg-amber-soft px-4 py-3.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-warm" aria-hidden />
                <p className="text-[13px] leading-relaxed text-amber-warm">
                  We weren&rsquo;t confident about {uncertain.length}{" "}
                  {uncertain.length === 1 ? "field" : "fields"}: {uncertain.join(", ")}. Correct
                  anything that looks wrong before your agency sees it.
                </p>
              </div>
            ) : null}

            <dl className="mt-6 divide-y divide-sand/70">
              {(
                [
                  ["Your name", extracted.tenantName.value, extracted.tenantName],
                  ["Property", extracted.property.value, extracted.property],
                  ["Suburb", extracted.suburb.value, extracted.suburb],
                  ["Start date", formatDate(extracted.startDate.value), extracted.startDate],
                  ["Property manager", extracted.manager.value, extracted.manager],
                  ["Agency", extracted.agencyName.value, extracted.agencyName],
                ] as const
              ).map(([label, value, field]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-[13px] text-mist">{label}</dt>
                  <dd className="flex items-baseline gap-3 text-right">
                    <span className="text-sm font-medium text-ink">{value}</span>
                    <span
                      className={clsx(
                        "shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em]",
                        CONFIDENCE_TONE[field.confidence]
                      )}
                    >
                      {CONFIDENCE_LABEL[field.confidence]}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            {/* The two the whole application is built on, so they are editable
                rather than displayed. */}
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <Field label="Weekly rent" hint="Everything else is worked out from this.">
                <MoneyInput value={rent} onChange={setRent} label="Weekly rent" />
              </Field>
              <Field
                label="Bond"
                hint={`Capped at ${RTA_CAPS.bondWeeks} weeks' rent — ${money(
                  rent * RTA_CAPS.bondWeeks
                )}.`}
              >
                <MoneyInput
                  value={bondAmount}
                  onChange={setBondAmount}
                  max={rent * RTA_CAPS.bondWeeks}
                  label="Bond"
                />
              </Field>
            </div>

            <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-tile bg-cream px-4 py-3.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
              />
              <span className="text-[13px] leading-relaxed text-bark">
                These details match my tenancy agreement, and I&rsquo;m happy for Litchi to ask{" "}
                {extracted.agencyName.value} to confirm them.
              </span>
            </label>
          </StepPanel>
        ) : null}

        {step === 2 ? (
          <StepPanel
            icon={ShieldCheck}
            title="Your agency confirms the tenancy"
            body="We've sent your property manager a link asking them to confirm the rent, the bond and the start date. It takes them about ten seconds and they don't need an account."
          >
            <div className="mt-7">
              <div
                className={clsx(
                  "rounded-tile px-5 py-5",
                  verification === "verified"
                    ? "border border-moss/30 bg-moss-soft/40"
                    : verification === "disputed"
                      ? "border border-sand bg-amber-soft"
                      : "border border-sand bg-cream"
                )}
              >
                <div className="flex items-start gap-3">
                  {verification === "verified" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-moss" aria-hidden />
                  ) : (
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-bark" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {verification === "verified"
                        ? "Tenancy verified"
                        : verification === "disputed"
                          ? "Your agency has queried the details"
                          : "Waiting on your property manager"}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-bark">
                      {verification === "verified"
                        ? `${request?.manager ?? "Your property manager"} confirmed the rent, bond and start date. That goes to the lender with your application.`
                        : verification === "disputed"
                          ? "They've flagged something that doesn't match their records. Go back a step and check the figures against your agreement."
                          : `Sent to ${request?.manager ?? "your property manager"} at ${request?.agencyName ?? "your agency"}. You'll get a text the moment they respond.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* The demo has to be able to stand on both sides of this. */}
              <div className="mt-5 rounded-tile border border-dashed border-sand px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                  Demo
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-mist">
                  This is the one step that needs somebody else. Open the link your property
                  manager was sent, answer it as them, and come back &mdash; the application picks
                  up where their answer left it.
                </p>
                <div className="mt-4">
                  {/* A second tab, so this application keeps its place — and
                      because it really is a different screen for a different
                      person. Answering there updates this one live. */}
                  <ButtonLink
                    href={`/verify/${token}`}
                    variant="secondary"
                    size="sm"
                    target="_blank"
                  >
                    Open the agency&rsquo;s link
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </ButtonLink>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-[13px] font-semibold text-ink">
                  What your property manager is shown
                </h3>
                <ul className="mt-3 space-y-2">
                  {verificationDisclosure.shown.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[13px] leading-relaxed text-mist"
                    >
                      <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-5 text-[13px] font-semibold text-ink">And what they are not</h3>
                <ul className="mt-3 space-y-2">
                  {verificationDisclosure.withheld.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[13px] leading-relaxed text-mist"
                    >
                      <Lock className="mt-[3px] h-3.5 w-3.5 shrink-0 text-clay" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </StepPanel>
        ) : null}

        {step === 3 ? (
          <StepPanel
            icon={Building2}
            title="What this move actually costs"
            body="Bond and rent in advance come off your verified rent, so those two are facts. The rest are the jobs nobody covers — switch off anything you've already sorted."
          >
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-ink">How big is the place?</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Property size">
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

            <ul className="mt-6 divide-y divide-sand/70">
              {lines.map((line) => (
                <li key={line.id} className="flex flex-wrap items-start gap-x-4 gap-y-3 py-4">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={line.selected}
                      onChange={(e) =>
                        setToggles((prev) => ({ ...prev, [line.id]: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--bark)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{line.label}</span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-mist">
                        {line.detail}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge tone={line.payee === "tenant" ? "amber" : "cream"}>
                          {line.payee === "tenant"
                            ? "Paid to you"
                            : `Direct to ${line.payeeName}`}
                        </Badge>
                        {line.capNote ? (
                          <span className="text-[11px] leading-relaxed text-clay">
                            {line.capNote}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </label>
                  <MoneyInput
                    value={line.amount}
                    max={line.max}
                    disabled={!line.selected}
                    label={`${line.label} amount`}
                    onChange={(next) => setAmounts((prev) => ({ ...prev, [line.id]: next }))}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4 rounded-tile bg-cream px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                  Estimated move cost
                </p>
                <p className="mt-1 text-[13px] text-bark">
                  {percent(direct)} of it never touches your account.
                </p>
              </div>
              <p className="numeric text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink">
                {money(total)}
              </p>
            </div>

            {total > 0 && total < partner.minAdvance ? (
              <p className="mt-4 text-[13px] leading-relaxed text-litchi">
                The smallest facility {partner.name} writes is {money(partner.minAdvance)}. Add
                the lines you still need covered, or pay this one outright &mdash; for an amount
                this size that is almost always the better answer.
              </p>
            ) : null}
          </StepPanel>
        ) : null}

        {step === 4 ? (
          <StepPanel
            icon={Wallet}
            title="How you'll cover it"
            body="Line by line. Most people pay for most of it themselves — the question is which parts you can't, and those are the only ones Litchi needs to be involved in."
          >
            <ul className="mt-7 divide-y divide-sand/70">
              {covered.map((line) => {
                const how = coverage[line.id] ?? defaultCoverage(line);
                const options: Coverage[] = canBook(line)
                  ? ["self", "book", "litchi"]
                  : ["self", "litchi"];
                return (
                  <li key={line.id} className="py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-sm font-semibold text-ink">{line.label}</p>
                      <p className="numeric text-sm font-semibold text-ink">
                        {money(line.amount)}
                      </p>
                    </div>
                    <div
                      className="mt-3 flex flex-wrap gap-2"
                      role="group"
                      aria-label={`How to cover ${line.label}`}
                    >
                      {options.map((option) => (
                        <ChoiceChip
                          key={option}
                          pressed={how === option}
                          onClick={() => setCoverage((prev) => ({ ...prev, [line.id]: option }))}
                        >
                          {COVERAGE_LABELS[option]}
                        </ChoiceChip>
                      ))}
                    </div>
                    {how !== "self" ? (
                      <p className="mt-2 text-[12px] leading-relaxed text-clay">
                        {how === "book"
                          ? `Litchi books ${line.payeeName} and you pay them on the day. Nothing is added to their price.`
                          : `Paid direct to ${line.payeeName} on your move date, out of the facility.`}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {/* The three totals, always visible, so the trade is on screen
                rather than one step away. */}
            <StatGrid
              className="mt-6"
              size="lg"
              items={[
                { label: "You're paying", value: money(split.self) },
                { label: "Booked", value: money(split.booked) },
                { label: "Litchi covers", value: money(split.financed) },
              ]}
            />

            {financing ? (
              <div className="mt-8 border-t border-sand/70 pt-7">
                <h3 className="text-[17px] font-semibold tracking-tight text-ink">
                  What the financed part costs
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
                  An indicative quote on the {money(requested)}{" "}
                  above, not an offer. {partner.name} decides the final terms after its own credit
                  and affordability checks.
                </p>

                {/* The screen's most important job when it applies at all. The
                    opening position of this calculator — bond financed, rest
                    paid by you — is Bond Assist's exact product at several
                    times the cost of credit, so leaving the comparison unsaid
                    would be letting people pay more by taking the obvious
                    route through the obvious button. */}
                {alternative ? (
                  <Card tone="cream" className="mt-6">
                    <div className="flex items-start gap-3">
                      <PiggyBank className="mt-0.5 h-5 w-5 shrink-0 text-bark" aria-hidden />
                      <div className="min-w-0">
                        <h4 className="text-[15px] font-semibold text-ink">
                          {alternative.name} would cover this for less
                        </h4>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark">
                          You&rsquo;re only financing the bond, and that is exactly what{" "}
                          {alternative.name} is for. Same {money(alternative.amount)}, same{" "}
                          {alternative.termWeeks}{" "}
                          weeks &mdash; one flat fee instead of an establishment fee and a rate,
                          because a bond comes back to you at the end of the tenancy and a truck
                          does not.
                        </p>

                        <dl className="mt-5 grid gap-px overflow-hidden rounded-tile border border-sand bg-sand sm:grid-cols-2">
                          {[
                            {
                              label: alternative.name,
                              weekly: moneyExact(alternative.weekly),
                              credit: money(alternative.costOfCredit),
                              best: true,
                            },
                            {
                              label: "Litchi Move",
                              weekly: moneyExact(quote.weekly),
                              credit: money(quote.costOfCredit),
                              best: false,
                            },
                          ].map((option) => (
                            <div key={option.label} className="bg-paper px-4 py-3.5">
                              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                                {option.label}
                              </dt>
                              <dd className="numeric mt-1.5 text-[19px] font-semibold text-ink">
                                {option.weekly}
                                <span className="text-[13px] font-medium tracking-normal text-mist">
                                  {" "}
                                  / wk
                                </span>
                                <span className="mt-1 block text-[12px] font-normal tracking-normal text-mist">
                                  {option.credit} cost of credit
                                </span>
                              </dd>
                            </div>
                          ))}
                        </dl>

                        <p className="mt-4 text-sm font-medium text-ink">
                          Switching saves you {money(alternative.saving)}{" "}
                          over the {alternative.termWeeks} weeks.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <ButtonLink href={alternative.href} size="sm">
                            Check {alternative.name} instead
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </ButtonLink>
                        </div>
                        <p className="mt-4 text-[13px] leading-relaxed text-bark">
                          Add another line to the facility and this stops applying &mdash;{" "}
                          {alternative.name} only ever covers a bond.
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="text-[13px] font-semibold text-ink">Over how long?</span>
                  <span className="flex flex-wrap gap-2" role="group" aria-label="Term">
                    {partner.termsWeeks.map((weeks) => (
                      <ChoiceChip
                        key={weeks}
                        pressed={termWeeks === weeks}
                        onClick={() => setTermWeeks(weeks)}
                      >
                        {weeks} weeks
                      </ChoiceChip>
                    ))}
                  </span>
                </div>

                {belowMinimum ? (
                  <p className="mt-5 text-[13px] leading-relaxed text-litchi">
                    {partner.name}{" "}
                    does not write facilities under {money(partner.minAdvance)}. Either cover
                    another line with Litchi, or pay this one outright &mdash; for an amount this
                    size, paying it outright is almost always the better answer.
                  </p>
                ) : (
                  <>
                    <StatGrid
                      className="mt-6"
                      size="lg"
                      items={[
                        { label: "Weekly repayment", value: moneyExact(quote.weekly) },
                        { label: "Term", value: `${quote.termWeeks} weeks` },
                        { label: "Total repayable", value: money(quote.totalRepayable) },
                      ]}
                    />

                    <dl className="mt-5 divide-y divide-sand/70 text-sm">
                      {[
                        { label: "Amount advanced", value: money(quote.amount) },
                        { label: "Establishment fee", value: money(quote.establishmentFee) },
                        {
                          label: "Interest rate",
                          value: `${percent(quote.annualRate, 2)} p.a. on the reducing balance`,
                        },
                        { label: "Total cost of credit", value: money(quote.costOfCredit) },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-baseline justify-between gap-4 py-2.5"
                        >
                          <dt className="text-mist">{row.label}</dt>
                          <dd className="text-right font-medium text-ink">{row.value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-7">
                      <h4 className="text-[13px] font-semibold text-ink">Where the money goes</h4>
                      <ul className="mt-3 space-y-2.5">
                        {covered
                          .filter((line) => (coverage[line.id] ?? defaultCoverage(line)) === "litchi")
                          .map((line) => (
                            <li
                              key={line.id}
                              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[13px]"
                            >
                              <span className="text-mist">
                                {line.label}
                                <span className="text-clay">
                                  {" "}
                                  &mdash; {PAYEE_LABELS[line.payee]}
                                </span>
                              </span>
                              <span className="numeric font-medium text-ink">
                                {money(line.amount)}
                              </span>
                            </li>
                          ))}
                      </ul>
                      <p className="mt-4 text-[13px] leading-relaxed text-mist">
                        Paid on your move dates, straight to the people owed. {percent(direct)}{" "}
                        of this facility never lands in your account, so there is nothing for you
                        to hold, forward or accidentally spend.
                      </p>
                    </div>

                    <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-tile bg-cream px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
                      />
                      <span className="text-[13px] leading-relaxed text-bark">
                        I understand this is an estimate, that {partner.name}{" "}
                        is the lender and makes the decision, and that Litchi may pass my verified
                        tenancy and application details to them to assess it.
                      </span>
                    </label>

                    <p className="mt-4 text-[13px] leading-relaxed text-clay">
                      {partner.name}{" "}
                      is a licensed consumer lender, FSPR {partner.fspr}, and a member of{" "}
                      {partner.disputesScheme}. Litchi arranges and services the facility. Litchi
                      is not the lender and does not decide the outcome.
                    </p>
                  </>
                )}
              </div>
            ) : (
              /* The screen has to work when the answer is "no finance". If it
                 nagged here it would be a loan application wearing a
                 calculator's clothes. */
              <div className="mt-7 flex items-start gap-3 rounded-tile bg-cream px-4 py-4">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-bark" aria-hidden />
                <p className="text-[13px] leading-relaxed text-bark">
                  You&rsquo;re covering the whole move yourself, so there is nothing to apply for.
                  Save the plan and you keep the costed breakdown, your verified tenancy and the
                  dates &mdash; and you can change your mind on any line later.
                </p>
              </div>
            )}
          </StepPanel>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-sand/70 pt-6">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={blocked}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button onClick={() => setSubmitted(true)} disabled={blocked}>
              {financing ? "Save plan and apply" : "Save my move plan"}
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-5 text-[13px] leading-relaxed text-clay">
        Sample tenancy, sample figures, today&rsquo;s date fixed at {formatDate(TODAY)}. Nothing
        you enter is uploaded or sent anywhere.
      </p>
    </div>
  );
}
