"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Clock,
  FileText,
  Info,
  Loader2,
  Minus,
  Lock,
  PiggyBank,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  type Confidence,
} from "@/lib/verification";
import { useVerificationStatus } from "@/lib/verification-store";
import { Disclosure } from "@/components/ui/Disclosure";
import {
  assess,
  EMPLOYMENT_LABELS,
  RULES,
  type Employment,
} from "@/lib/underwriting";
import { Field, inputClass } from "@/components/ui/Field";
import {
  buildTimeline,
  ID_TYPES,
  parseAccountNumber,
  WEEKDAYS,
  type PaymentDay,
} from "@/lib/setup";

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
/*
 * Four steps, one rail.
 *
 * This was five, beside a three-step eligibility check and a four-step set-up
 * at two other URLs — twelve steps over three rails, two of which were both
 * called "Your tenancy". Reading the agreement and checking what we read were
 * never two questions; they were one question and its answer, so they are one
 * step.
 */
const STEPS = ["Your move", "What we cover", "Can we", "Sign"] as const;

/**
 * The last step anyone still looking can reach.
 *
 * They have no tenancy, so there is nothing to check and nothing to sign.
 * The flow ends for them where the costing ends, and says so, rather than
 * walking them into two steps built around a document they do not have.
 */
const LAST_WITHOUT_TENANCY = 1;

/** The first question, and the only one whose answer changes the rest. */
const FORK_CHOICES = [
  {
    key: "signed" as const,
    title: "I\u2019ve signed",
    body: "Upload the agreement. We read the rent, the bond and the dates off it, your agency confirms them, and the figures are exact.",
    tag: "Exact \u00b7 can be funded",
  },
  {
    key: "looking" as const,
    title: "Still looking",
    body: "Tell us the rent you\u2019re seeing. You get the number now and we keep the plan \u2014 finish it when you\u2019ve signed.",
    tag: "Estimate \u00b7 no credit check",
  },
];

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

  /*
   * Where they are up to, which decides what we can honestly tell them.
   *
   * The front page asks a question anyone house-hunting has, and this flow
   * used to open by demanding a signed tenancy agreement — so the page that
   * won someone's attention and the first gate of the funnel were aimed at
   * two different people, and the larger group hit a wall on arrival. Asking
   * outright costs one tap and makes both answers legitimate.
   */
  const [mode, setMode] = useState<"signed" | "looking" | null>(null);

  /*
   * Everything the application itself needs, which used to live at /setup —
   * a separate four-step flow at a separate URL that the path through this
   * one never linked to. Identity and the bank are not paperwork at the end;
   * they are two of the three things that answer "can we", so they are asked
   * where that question is asked.
   */
  const [idType, setIdType] = useState(ID_TYPES[0].value);
  const [idNumber, setIdNumber] = useState("");
  const [bankLinked, setBankLinked] = useState(false);
  const [linking, setLinking] = useState(false);
  const [readDisclosure, setReadDisclosure] = useState(false);
  const [account, setAccount] = useState("");
  const [touchedAccount, setTouchedAccount] = useState(false);
  const [payDay, setPayDay] = useState<PaymentDay>(5);
  const [authorised, setAuthorised] = useState(false);
  const parsedAccount = parseAccountNumber(account);

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

  /*
   * What they typed on the front page, if they came that way.
   *
   * It is an estimate made against a rent they had in their head, not a fact
   * about a tenancy — the figures in this flow come off the agreement. But
   * dropping it silently is what made the first two screens disagree, so it
   * is carried, said out loud on the way in, and reconciled against the
   * document on the step that can correct it.
   */
  const params = useSearchParams();
  const askedRent = Number(params.get("rent"));
  const estimatedOn = Number.isFinite(askedRent) && askedRent > 0 ? askedRent : null;

  const extracted = useMemo(() => (fileName ? extractTenancy(fileName) : null), [fileName]);

  // The confirmation step can correct anything the extraction got wrong, so
  // these are seeded from the document and owned by the tenant thereafter.
  const [rent, setRent] = useState(0);
  /*
   * The bond follows the rent, unless someone says otherwise.
   *
   * It used to be independent state seeded once off the document, while the
   * field's own cap was rent x 4. So lowering the rent clamped the bond,
   * clearing the rent pinned it to zero, and raising the rent again never
   * brought it back — all while the label above promised "everything else is
   * worked out from this". An override that is null means "worked out",
   * which is also how the line amounts on the next step already behave.
   */
  const [bondOverride, setBondOverride] = useState<number | null>(null);
  const [size, setSize] = useState<PropertySize>("medium");

  /** Four weeks' rent — the most a landlord can take, and the default. */
  const bondCap = Math.round(rent * RTA_CAPS.bondWeeks * 100) / 100;
  const bondAmount = bondOverride === null ? bondCap : Math.min(bondOverride, bondCap);

  /*
   * "Would you say yes to me?", for someone who has not signed anything.
   *
   * This was a three-step flow of its own at /apply. For somebody who has a
   * tenancy it is redundant — the bank connection on step three tests the
   * same thing against their actual account rather than against a number they
   * typed. But for someone still looking it is the one question they cannot
   * otherwise answer, and knowing it before they commit to a place is the
   * point. So it lives in the branch that needs it, behind a heading, and
   * nowhere else.
   */
  const [weeklyIncome, setWeeklyIncome] = useState(1600);
  const [employment, setEmployment] = useState<Employment>("permanent");
  const [monthsInRole, setMonthsInRole] = useState(18);
  const eligibility = useMemo(
    () => assess({ weeklyRent: rent || 0, weeklyIncome, employment, monthsInRole }),
    [rent, weeklyIncome, employment, monthsInRole]
  );

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
    setMode(null);
    setIdNumber("");
    setBankLinked(false);
    setReadDisclosure(false);
    setAccount("");
    setTouchedAccount(false);
    setAuthorised(false);
    setFileName(null);
    setConfirmed(false);
    setConsent(false);
    setRent(0);
    setBondOverride(null);
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

  /*
   * The question, reduced to its three real answers.
   *
   * This step used to be two: nine line items with nine amount fields, and
   * then up to three coverage buttons on each of them. Everything in it was
   * true and almost none of it was the decision — which is "how much of this
   * should Litchi carry", and that has three answers. The nine lines are
   * still here, behind a heading, for the minority who want to argue with
   * them; what they are not is the first thing asked.
   *
   * Each option is priced by running the real split and the real quote over
   * a hypothetical coverage map, so the figure on the button is the figure
   * you get by pressing it — including the cheaper product when the bond is
   * the only thing financed.
   */
  const priceOf = (pick: (line: MoveCostLine) => Coverage) => {
    const map: Record<string, Coverage> = {};
    covered.forEach((line) => {
      map[line.id] = pick(line);
    });
    const hypothetical = coverageSplit(lines, map);
    const amount = Math.min(hypothetical.financed, partner.maxAdvance);
    const q = quoteMove(amount, termWeeks, partner);
    const alt = cheaperAlternative(lines, map, q);
    return {
      map,
      amount,
      weekly: amount > 0 ? (alt ? alt.weekly : q.weekly) : 0,
      product: alt ? alt.name : partner.name,
    };
  };

  const COVER_ALL = "all";
  const COVER_BOND = "bond";
  const COVER_NONE = "none";

  const options = useMemo(
    () => [
      {
        key: COVER_ALL,
        title: "All of it",
        body: covered.map((line) => line.label.toLowerCase()).join(", "),
        ...priceOf(() => "litchi"),
      },
      {
        key: COVER_BOND,
        title: "Just the bond",
        body: "The cheaper product: a flat fee and no interest, because a bond comes back to you at the end of the tenancy.",
        ...priceOf((line) => (line.id === "bond" ? "litchi" : "self")),
      },
      {
        key: COVER_NONE,
        title: "Nothing yet",
        body: "Keep the costing and decide later. Your plan is saved either way.",
        ...priceOf(() => "self"),
      },
    ],
    // priceOf closes over everything that moves the figures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, covered, coverage, termWeeks, partner]
  );

  const timeline = useMemo(
    () => buildTimeline(TODAY, payDay, quote.termWeeks),
    [payDay, quote.termWeeks]
  );

  /*
   * Every term that binds you, on one screen, before you sign — which is what
   * the law asks for and roughly the opposite of how most credit is sold.
   * These came off a separate flow at /setup quoting its own figures; here
   * they are derived from the quote this flow has just shown you, so the
   * agreement and the offer cannot drift apart.
   */
  const terms = [
    {
      label: "Creditor",
      value: partner.name,
      note: "Litchi arranges and services the loan. Litchi is not the lender and never holds your money.",
    },
    {
      label: "Total advanced",
      value: money(requested),
      note: "Paid direct to the people owed, on your move dates.",
    },
    {
      label: "Establishment fee",
      value: money(partner.establishmentFee),
      note: "Charged once, at the start, and included in the figures above.",
    },
    {
      label: "Interest rate",
      value: `${percent(partner.annualRate, 2)} p.a.`,
      note: "On the reducing balance, so it falls as you repay.",
    },
    {
      label: "Total repayable",
      value: money(quote.totalRepayable),
      note: "Every dollar you will pay, stated before you sign.",
    },
    {
      label: "Payments",
      value: `${quote.termWeeks} weekly`,
      note: `${moneyExact(quote.weekly)} a week, starting ${formatDate(timeline.firstPayment)}.`,
    },
    {
      label: "Default fees",
      value: "None",
      note: "No late fee, no dishonour fee, no collection fee. A missed payment costs you nothing.",
    },
    {
      label: "Security taken",
      value: "None",
      note: "No claim over your bond refund, your possessions, or anything else. The refund is yours.",
    },
    {
      label: "Right to cancel",
      value: "5 working days",
      note: `Until ${formatDate(timeline.cancelUntil)}. Cancel and you repay what was advanced, nothing more.`,
    },
    {
      label: "Paying it off early",
      value: "Any time, no fee",
      note: "Interest stops with the balance, and nothing is added for settling sooner.",
    },
    {
      label: "If things get hard",
      value: "Hardship applies",
      note: "You can apply to vary the payments and we have to properly consider it.",
    },
    {
      label: "Complaints",
      value: `Free, via ${partner.disputesScheme}`,
      note: "An approved dispute resolution scheme, at no cost to you.",
    },
  ];

  /** Which of the three the current per-line choices actually amount to. */
  const chosen = options.find((option) =>
    covered.every(
      (line) => (coverage[line.id] ?? defaultCoverage(line)) === option.map[line.id]
    )
  );

  const uncertain = extracted ? lowConfidenceFields(extracted) : [];

  /*
   * Note what step 3 no longer requires: a total big enough to lend against.
   * A move that costs less than the smallest facility is still a move worth
   * costing, and the calculator has no business refusing to finish because
   * the answer turned out to be one nobody needs to borrow for.
   */
  const blocked =
    // Step one asks a different thing of each answer: a document and a tick
    // from someone who has signed, a rent from someone who has not.
    (step === 0 && mode === null) ||
    (step === 0 && mode === "signed" && (!extracted || !confirmed || rent < 100)) ||
    (step === 0 && mode === "looking" && rent < 100) ||

    // One step now, so it carries both of what used to gate two: a move
    // worth costing, and consent to the quote if any of it is being financed.
    (step === 1 && (total <= 0 || (financing && (!consent || belowMinimum)))) ||
    // All three checks, not just the agency's: the two that are ours are the
    // ones that make the answer an answer rather than a maybe.
    (step === 2 && (idNumber.trim().length < 5 || !bankLinked || verification !== "verified")) ||
    (step === 3 && (!readDisclosure || !parsedAccount.ok || !authorised));

  /*
   * Someone still looking has no agency to ask, no identity to verify against
   * an application nobody is making, and nothing to sign. The flow ends for
   * them at the costing rather than walking them through two steps built
   * around a document they have not got — so the rail is shorter and the last
   * button saves a costing instead of claiming an application.
   */
  const withoutTenancy = mode === "looking";
  const lastStep = withoutTenancy ? LAST_WITHOUT_TENANCY : STEPS.length - 1;
  const visibleSteps = withoutTenancy ? STEPS.slice(0, lastStep + 1) : [...STEPS];
  const goNext = () => setStep((s) => Math.min(lastStep, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  function readDocument(name: string) {
    setFileName(null);
    setReading(true);
    // A real extraction takes a moment. Showing that beats a screen that
    // pretends reading a scanned PDF is instantaneous.
    window.setTimeout(() => {
      const parsed = extractTenancy(name);
      setFileName(name);
      setRent(parsed.weeklyRent.value);
      // Only hold the document's figure when it differs from the cap; a bond
      // that is simply four weeks' rent should keep tracking the rent.
      const cap = Math.round(parsed.weeklyRent.value * RTA_CAPS.bondWeeks * 100) / 100;
      setBondOverride(parsed.bond.value === cap ? null : parsed.bond.value);
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
          body={`Everything for ${request?.property ?? "your move"} in one place \u2014 what it costs, who is covering each line, and the tenancy behind it.`}
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
        /* The heading has to survive the answer to the fork. "You've got the
           place" and "your agency confirms it" are both false for someone
           still looking, and telling them about a tenancy they do not have is
           how the front page and the first step came to disagree in the first
           place. */
        title={
          mode === "looking"
            ? "What will your move cost?"
            : "You\u2019ve got the place. Let\u2019s work out the move."
        }
        body={
          mode === "looking"
            ? "A rent is enough to price the whole thing \u2014 bond, rent in advance, the truck, the clean. Nothing is checked and nothing is applied for until you have signed somewhere."
            : "We start with your tenancy, not with a number. Your agency confirms it, the costs come off it, and you decide how much of them to cover \u2014 up to what the move actually costs, never more."
        }
      />
      {/* What each step scrolls to: the progress list and the step beneath it,
          so you land on where you are as well as on what is being asked. */}
      <div ref={stepTop} className="scroll-mt-4" />
      <ol className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        {visibleSteps.map((label, index) => (
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

      {/*
       * The fork, above the card, because it decides what the card holds.
       *
       * Both answers are real. Someone who has signed gets exact figures off
       * their agreement and can be funded; someone still looking gets a
       * costing and nothing is checked. What used to happen to the second
       * group was a wall on the first screen.
       */}
      {step === 0 ? (
        <Card className="mt-5">
          <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
            Where are you up to?
          </h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-mist">
            It changes what we can tell you. Both answers are fine, and you can start on one and
            finish on the other.
          </p>
          {/* Said here rather than inside a branch: someone who answered the
              front page should see their number acknowledged on arrival, not
              after they have made another choice. */}
          {estimatedOn ? (
            <p className="numeric mt-3 max-w-[52ch] text-sm leading-relaxed text-bark">
              You costed a move on{" "}
              <strong className="font-semibold text-ink">{money(estimatedOn)} a week</strong>
              . We&rsquo;ll carry that through whichever you pick.
            </p>
          ) : null}
          <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
            {FORK_CHOICES.map((choice) => (
              <button
                key={choice.key}
                type="button"
                aria-pressed={mode === choice.key}
                onClick={() => {
                  setMode(choice.key);
                  // Carrying it through means putting it in the field, not
                  // just mentioning it. The signed branch gets its rent off
                  // the agreement instead, so it is left alone.
                  if (choice.key === "looking" && estimatedOn && rent === 0) setRent(estimatedOn);
                }}
                className={clsx(
                  "tap flex h-full flex-col items-start gap-2 rounded-card border-[1.5px] p-5 text-left transition-colors",
                  mode === choice.key
                    ? "border-bark bg-cream/60"
                    : "border-sand bg-paper hover:border-clay"
                )}
              >
                <span className="text-[16px] font-semibold text-ink">{choice.title}</span>
                <span className="text-[13px] leading-relaxed text-mist">{choice.body}</span>
                <Badge tone="cream">{choice.tag}</Badge>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {/*
       * Still looking: a costing, and an honest account of what it is not.
       *
       * No document, no agency and no credit check, so no application either.
       * The figures come off the same Residential Tenancies Act caps the rest
       * of the flow uses, which is why they still agree with it later.
       */}
      {step === 0 && mode === "looking" ? (
        <Card className="mt-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Rent per week" hint="Of the place you&rsquo;re looking at.">
              <MoneyInput value={rent} onChange={setRent} label="Rent per week" />
            </Field>
            <Field label="Size" hint="Sets the movers and the clean.">
              <div className="flex flex-wrap gap-2">
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
            </Field>
          </div>

          {rent >= 100 ? (
            <div className="mt-7 rounded-card bg-hero px-6 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-onbrand/70">
                Your move, roughly
              </p>
              <p className="numeric mt-2 text-[32px] font-semibold leading-none tracking-[-0.025em] text-onbrand">
                {money(total)}
              </p>
              <p className="numeric mt-3 max-w-[48ch] text-[13.5px] leading-relaxed text-onbrand/80">
                {covered
                  .map((line) => `${line.label.toLowerCase()} ${money(line.amount)}`)
                  .join(" \u00b7 ")}
                . An estimate from the rent you typed, using the Residential Tenancies Act caps.
                Not a credit offer.
              </p>
            </div>
          ) : null}

          {/*
           * The question nobody still looking can otherwise answer.
           *
           * Behind a heading because most people want the number first, and
           * because answering it means handing over income — which should be
           * a choice, not a toll on the way to a costing.
           */}
          {rent >= 100 ? (
            <Disclosure className="mt-7" title="Would we say yes? Check before you commit">
              <p className="max-w-[54ch] text-[13px] leading-relaxed text-mist">
                An affordability test, not a credit check. Nothing is sent anywhere, nothing
                touches your credit file, and the workings are all shown.
              </p>

              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                {/* A plain field rather than MoneyInput: that control is 44px
                    tall and the select beside it is 48px, so the pair sat 4px
                    out of line with each other. */}
                <Field label="Weekly take-home pay" hint="After tax, for everyone on the plan.">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[15px] font-medium text-mist" aria-hidden>
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={weeklyIncome === 0 ? "" : weeklyIncome}
                      aria-label="Weekly take-home pay"
                      onChange={(e) => setWeeklyIncome(Math.max(0, Number(e.target.value)))}
                      className={`numeric h-12 ${inputClass}`}
                    />
                  </span>
                </Field>
                <Field label="How you&rsquo;re paid">
                  <select
                    value={employment}
                    onChange={(e) => setEmployment(e.target.value as Employment)}
                    className={`h-12 ${inputClass}`}
                  >
                    {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-6">
                <Field label="Months in that role">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={monthsInRole}
                    onChange={(e) => setMonthsInRole(Number(e.target.value))}
                    className={`numeric h-12 max-w-[200px] ${inputClass}`}
                  />
                </Field>
              </div>

              <div
                className={clsx(
                  "mt-7 rounded-tile px-5 py-4",
                  eligibility.outcome === "approved"
                    ? "border border-moss/30 bg-moss-soft/40"
                    : eligibility.outcome === "refer"
                      ? "border border-sand bg-amber-soft"
                      : "border border-sand bg-paper"
                )}
                role="status"
              >
                <p className="text-sm font-semibold text-ink">
                  {eligibility.outcome === "approved"
                    ? `On these numbers, yes — ${moneyExact(eligibility.weeklyPayment)} a week for the bond`
                    : eligibility.outcome === "refer"
                      ? "On these numbers, a person would look at it"
                      : "On these numbers, no"}
                </p>
                <p className="numeric mt-1.5 max-w-[54ch] text-[13px] leading-relaxed text-bark">
                  Rent and repayment come to {percent(eligibility.housingShare)} of take-home pay.
                  We refer above {percent(RULES.housingShareRefer)} and decline above{" "}
                  {percent(RULES.housingShareMax)}, which would leave you{" "}
                  {moneyExact(Math.max(0, eligibility.weeklyLeftOver))} a week once both are paid.
                </p>
              </div>

              <ul className="mt-5 space-y-2.5">
                {eligibility.checks.map((check) => (
                  <li key={check.key} className="flex items-start gap-3">
                    <span
                      className={clsx(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        check.result === "pass"
                          ? "bg-moss text-onbrand"
                          : check.result === "refer"
                            ? "bg-amber-soft text-amber-warm"
                            : "bg-cream text-clay"
                      )}
                      aria-hidden
                    >
                      {check.result === "pass" ? (
                        <Check className="h-3 w-3" />
                      ) : check.result === "refer" ? (
                        <Info className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium text-ink">
                        {check.label}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-mist">
                        {check.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-[12.5px] leading-relaxed text-clay">
                A guide, not a decision. Once you have signed somewhere we check the repayment
                against your actual bank account rather than against a number you typed, and the
                lender makes the call.
              </p>
            </Disclosure>
          ) : null}

          <p className="mt-5 text-[13px] leading-relaxed text-clay">
            Nothing is checked and no credit file is touched until you have a signed tenancy.
            We&rsquo;ll keep this costing so you don&rsquo;t type it twice.
          </p>
        </Card>
      ) : null}

      {step > 0 || mode === "signed" ? (
      <Card className="mt-5">
        {step === 0 && mode === "signed" ? (
          <StepPanel
            icon={FileText}
            title="Start with the place you've just got"
            body="Upload your tenancy agreement and we'll read the rent, the bond and the dates off it. It saves you typing them, and it means the figures behind your application came from the document rather than from memory."
          >
            {estimatedOn ? (
              <p className="mt-5 rounded-tile bg-cream px-4 py-3.5 text-[13px] leading-relaxed text-bark">
                You costed a move on{" "}
                <strong className="numeric font-semibold text-ink">
                  {money(estimatedOn)} a week
                </strong>
                . We&rsquo;ll use whatever your agreement actually says, and you can correct it on
                the next screen.
              </p>
            ) : null}

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

        {step === 0 && mode === "signed" && extracted ? (
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
                  // An override only means anything below the cap; at or above
                  // it, it is indistinguishable from four weeks' rent, so it
                  // is dropped and the field goes back to following the rent.
                  onChange={(next) => setBondOverride(next >= bondCap ? null : next)}
                  max={rent * RTA_CAPS.bondWeeks}
                  label="Bond"
                />
              </Field>
            </div>

            {/* The one place the two numbers can be put side by side and
                settled, because this is the step where rent is editable. */}
            {estimatedOn && rent > 0 && estimatedOn !== rent ? (
              <p className="mt-5 text-[13px] leading-relaxed text-mist">
                You estimated on{" "}
                <strong className="numeric font-semibold text-ink">{money(estimatedOn)}</strong>;
                this agreement says{" "}
                <strong className="numeric font-semibold text-ink">{money(rent)}</strong>. The
                agreement wins unless you change it here.
              </p>
            ) : null}

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
            title="Three checks, run together"
            body="Two of them are ours and take a moment. The third is your property manager's, and you do not have to sit here for it."
          >
            {/*
             * The agency used to be a step you sat in, and it was the second
             * thing that happened: you could not price the move until someone
             * else had answered their email. Identity and the bank lived at a
             * different URL entirely, after the decision they are supposed to
             * inform. All three belong here, at the one point where the answer
             * is "can we" — and only one of them waits on another human.
             */}
            <div className="mt-7 space-y-5">
              <div className="rounded-tile border border-sand bg-paper px-5 py-5">
                <div className="flex items-start gap-3">
                  <span
                    className={clsx(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      idNumber.trim().length >= 5 ? "bg-moss text-onbrand" : "bg-cream text-clay"
                    )}
                    aria-hidden
                  >
                    {idNumber.trim().length >= 5 ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-[12px] font-bold">1</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">You are who you say you are</p>
                    <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-mist">
                      A lender in New Zealand is a reporting entity under the AML/CFT Act and has
                      to verify identity before advancing anything. The same check a bank runs
                      when you open an account.
                    </p>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <Field label="Document type">
                        <select
                          value={idType}
                          onChange={(e) => setIdType(e.target.value as typeof idType)}
                          className={`h-12 ${inputClass}`}
                        >
                          {ID_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field
                        label="Document number"
                        hint="Type anything — this demo checks nothing and stores nothing."
                      >
                        <input
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          placeholder="AB123456"
                          className={`numeric h-12 ${inputClass}`}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-tile border border-sand bg-paper px-5 py-5">
                <div className="flex items-start gap-3">
                  <span
                    className={clsx(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      bankLinked ? "bg-moss text-onbrand" : "bg-cream text-clay"
                    )}
                    aria-hidden
                  >
                    {bankLinked ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-[12px] font-bold">2</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      The repayment fits alongside your rent
                    </p>
                    <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-mist">
                      Ninety days of transactions, read with your permission through Akahu, to see
                      that {moneyExact(quote.weekly)} a week sits alongside {money(rent)} of rent
                      rather than on top of it. Your login goes to your bank, never to us, and
                      nothing can be moved out of the account.
                    </p>
                    <div className="mt-4">
                      {bankLinked ? (
                        <Badge tone="moss">
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Connected &middot; income and outgoings check out
                        </Badge>
                      ) : (
                        <Button
                          loading={linking}
                          onClick={async () => {
                            setLinking(true);
                            await new Promise((r) => setTimeout(r, 900));
                            setLinking(false);
                            setBankLinked(true);
                          }}
                        >
                          Connect my bank
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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
                  <span
                    className={clsx(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      verification === "verified" ? "bg-moss text-onbrand" : "bg-paper text-clay"
                    )}
                    aria-hidden
                  >
                    {verification === "verified" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {verification === "verified"
                        ? "Your agency confirmed the tenancy"
                        : verification === "disputed"
                          ? "Your agency has queried the details"
                          : "Your agency is confirming the tenancy"}
                    </p>
                    <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-bark">
                      {verification === "verified"
                        ? `${request?.manager ?? "Your property manager"} confirmed the rent, bond and start date. That is the part that makes the rest of this quick.`
                        : verification === "disputed"
                          ? "They've flagged something that doesn't match their records. Go back and check the figures against your agreement."
                          : // The agency's own name often ends in "Co." or "Ltd.", so a
                            // sentence that ends right after it gets two full stops.
                            `Sent to ${request?.manager ?? "your property manager"} at ${(request?.agencyName ?? "your agency").replace(/\.$/, "")}. About ten seconds, no account needed — and you don't have to wait here, we'll text you.`}
                    </p>
                    {verification === "awaiting" && request ? (
                      <a
                        href={`/verify/${request.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-bark underline underline-offset-4"
                      >
                        Open the agency&rsquo;s link
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* The offer, live underneath, marked for whatever is outstanding
                — so a wait on someone else never blocks reading the terms. */}
            {financing ? (
              <div className="mt-7 rounded-card bg-hero px-6 py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-onbrand/70">
                  {verification === "verified" ? "Your offer" : "Your offer, subject to that tick"}
                </p>
                <p className="numeric mt-2 text-[30px] font-semibold leading-none tracking-[-0.025em] text-onbrand">
                  {money(requested)}{" "}
                  <span className="text-[16px] font-medium text-onbrand/75">
                    at {moneyExact(quote.weekly)} a week for {quote.termWeeks} weeks
                  </span>
                </p>
                <p className="numeric mt-3 max-w-[50ch] text-[13.5px] leading-relaxed text-onbrand/80">
                  {money(partner.establishmentFee)} establishment fee, {percent(partner.annualRate, 2)}{" "}
                  p.a., {money(quote.totalRepayable)} repaid in all &mdash; {money(quote.costOfCredit)}{" "}
                  of that is the cost of credit. {partner.name} is the lender; Litchi is paid by
                  them, not by you.
                </p>
              </div>
            ) : null}

            <p className="mt-5 text-[13px] leading-relaxed text-clay">
              Declining costs you nothing and leaves no mark. Nothing is reported to a credit
              bureau unless you sign.
            </p>
          </StepPanel>
        ) : null}

        {step === 3 ? (
          <StepPanel
            icon={FileText}
            title="Sign, and the money moves"
            body="Two things left — the other two were how we answered the last question. Every term is here in full, before anything is owed."
          >
            <Disclosure
              className="mt-7"
              title={`The whole agreement \u2014 ${terms.length} terms, nothing in fine print`}
            >
              <dl className="overflow-hidden rounded-tile border border-sand">
                {terms.map((row, index) => (
                  <div
                    key={row.label}
                    className={clsx(
                      "grid gap-1 px-4 py-3.5 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-4 sm:px-5",
                      index % 2 === 1 && "bg-cream/50"
                    )}
                  >
                    <dt className="text-[13px] font-semibold text-ink">{row.label}</dt>
                    <dd>
                      <p className="numeric text-[15px] font-semibold text-ink">{row.value}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-mist">{row.note}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </Disclosure>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-tile bg-cream px-4 py-3.5">
              <input
                type="checkbox"
                checked={readDisclosure}
                onChange={(e) => setReadDisclosure(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
              />
              <span className="text-[13px] leading-relaxed text-bark">
                I&rsquo;ve read the agreement in full. I understand what I repay, when it starts,
                and that I can cancel within five working days.
              </span>
            </label>

            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <Field
                label="Account to debit"
                hint="Bank, branch, account, suffix."
                error={touchedAccount && !parsedAccount.ok ? parsedAccount.reason : undefined}
              >
                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  onBlur={() => setTouchedAccount(true)}
                  placeholder="12-3456-0123456-00"
                  inputMode="numeric"
                  aria-invalid={touchedAccount && !parsedAccount.ok}
                  className={`numeric h-12 ${inputClass}`}
                />
              </Field>
              <Field label="Day of the week" hint="Pick the day after your pay lands.">
                <select
                  value={payDay}
                  onChange={(e) => setPayDay(Number(e.target.value) as PaymentDay)}
                  className={`h-12 ${inputClass}`}
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-6 rounded-tile bg-cream px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                Your first payment
              </p>
              <p className="numeric mt-1.5 text-[20px] font-semibold text-ink">
                {moneyExact(quote.weekly)} on {formatDate(timeline.firstPayment)}
              </p>
              <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-bark">
                A week after the money moves, so nothing comes out before you have moved in. Then
                the same amount every{" "}
                {WEEKDAYS.find((d) => d.value === payDay)?.label ?? "week"} until{" "}
                {formatDate(timeline.lastPayment)}.
              </p>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-tile bg-cream px-4 py-3.5">
              <input
                type="checkbox"
                checked={authorised}
                onChange={(e) => setAuthorised(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
              />
              <span className="text-[13px] leading-relaxed text-bark">
                I authorise {partner.name} to debit this account {moneyExact(quote.weekly)} weekly
                under the agreement above. I can cancel this authority with my bank at any time,
                and I know that doing so does not cancel what I owe.
              </span>
            </label>

            <p className="mt-5 text-[13px] leading-relaxed text-clay">
              Your rent is not part of this. {money(rent)} a week keeps going to{" "}
              {request?.agencyName ?? "your agency"}{" "}
              exactly as it does now, and the bond is lodged with Tenancy Services in your
              landlord&rsquo;s name &mdash; Litchi never holds it.
            </p>
          </StepPanel>
        ) : null}

        {step === 1 ? (
          <StepPanel
            icon={Wallet}
            title="How much of it should Litchi cover?"
            body="Capped at what the move actually costs — we can never advance you more than that, whichever you pick."
          >
            <div className="mt-7 grid gap-3">
              {options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={chosen?.key === option.key}
                  onClick={() => setCoverage(option.map)}
                  className={clsx(
                    "tap flex flex-col items-start justify-between gap-4 rounded-card border-[1.5px] p-5 text-left transition-colors sm:flex-row sm:items-start",
                    chosen?.key === option.key
                      ? "border-bark bg-cream/60"
                      : "border-sand bg-paper hover:border-clay"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[15.5px] font-semibold text-ink">
                      {option.title}
                    </span>
                    <span className="mt-1.5 block max-w-[44ch] text-[13px] leading-relaxed text-mist first-letter:uppercase">
                      {option.body}
                    </span>
                  </span>
                  <span className="shrink-0 text-left sm:text-right">
                    <span className="numeric block text-[19px] font-semibold text-ink">
                      {money(option.amount)}
                    </span>
                    <span className="numeric mt-0.5 block text-[12px] text-mist">
                      {option.amount > 0 ? `${moneyExact(option.weekly)} / wk` : "\u00a0"}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {/*
             * The nine lines, behind a heading.
             *
             * They are the whole of what used to be a step of its own, and
             * they still matter — someone who has already booked a truck
             * needs to take it off. But reading nine rows is not how most
             * people answer "how much should you cover", so it is not what
             * they are shown first.
             */}
            <Disclosure
              className="mt-7"
              title={`Change what\u2019s included \u2014 ${covered.length} lines, ${money(total)}`}
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
            </Disclosure>

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

                        {/* This used to leave the flow for /apply, which was
                            a strange thing to do to someone mid-decision —
                            and that page is gone. The cheaper product is one
                            of the three options above, so taking it is a
                            choice made here. */}
                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button
                            size="sm"
                            onClick={() => {
                              const bondOnly = options.find((o) => o.key === COVER_BOND);
                              if (bondOnly) setCoverage(bondOnly.map);
                            }}
                          >
                            Switch to {alternative.name}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </Button>
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

      </Card>
      ) : null}

      {/* The footer belongs to the flow, not to the card: on the first step
          it is the fork and its branch that carry the content, and a card
          holding nothing but two buttons is an empty box. */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-sand/70 pt-6">
        <Button variant="ghost" onClick={goBack} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        {step < lastStep ? (
          <Button onClick={goNext} disabled={blocked}>
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button onClick={() => setSubmitted(true)} disabled={blocked}>
            {/* Someone still looking is not applying for anything — there is
                no tenancy to lend against yet — so the button saves the
                costing and says so. */}
            {withoutTenancy ? "Save this costing" : "Sign and finish"}
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-clay">
        Sample tenancy, sample figures, today&rsquo;s date fixed at {formatDate(TODAY)}. Nothing
        you enter is uploaded or sent anywhere.
      </p>
    </div>
  );
}
