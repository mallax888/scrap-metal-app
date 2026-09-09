"use client";

import { useMemo, useState } from "react";
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
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PROPERTY_SIZES, TODAY, type PropertySize } from "@/lib/data";
import { formatDate, money, moneyExact, percent } from "@/lib/format";
import {
  buildMoveCosts,
  costedTotal,
  defaultPartner,
  directShare,
  litchiRevenue,
  PAYEE_LABELS,
  quoteMove,
  RTA_CAPS,
  type MoveCostLine,
} from "@/lib/move";
import {
  APPLICATION_STAGES,
  DEMO_VERIFICATION_TOKEN,
  extractTenancy,
  findVerification,
  lowConfidenceFields,
  verificationDisclosure,
  type Confidence,
} from "@/lib/verification";
import { useVerificationStatus } from "@/lib/verification-store";

/**
 * Litchi Move, from "I got the place" to "it's submitted".
 *
 * The order of these steps is the product. Every other lender starts with "how
 * much do you want", which makes the tenant guess and makes the number an
 * ambition rather than a fact. Here the tenancy comes first, the agency
 * confirms it, the costs fall out of it, and the amount is the last thing
 * decided — capped at what the move actually costs.
 *
 * That cap is not a nicety. An open-ended request on a screen headed with a
 * calculated total is an invitation to round up, and the difference between a
 * rental-specific facility and a personal loan in a moving-themed skin is
 * exactly whether the money is tied to the costs. You can take less than your
 * move costs. You cannot take more.
 *
 * Nothing here is submitted anywhere. The whole journey runs in the browser.
 */
const STEPS = [
  "Your tenancy",
  "Check the details",
  "Agency confirms",
  "What it costs",
  "Your estimate",
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-mist">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
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

  const extracted = useMemo(() => (fileName ? extractTenancy(fileName) : null), [fileName]);

  // The confirmation step can correct anything the extraction got wrong, so
  // these are seeded from the document and owned by the tenant thereafter.
  const [rent, setRent] = useState(0);
  const [bondAmount, setBondAmount] = useState(0);
  const [size, setSize] = useState<PropertySize>("medium");

  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [requestedOverride, setRequestedOverride] = useState<number | null>(null);
  const [termWeeks, setTermWeeks] = useState<number>(52);

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
  const direct = directShare(lines);

  // The amount can be trimmed but never inflated: the ceiling is the move.
  const ceiling = Math.min(total, partner.maxAdvance);
  const requested = Math.max(
    0,
    Math.min(requestedOverride === null ? ceiling : requestedOverride, ceiling)
  );
  const belowMinimum = requested > 0 && requested < partner.minAdvance;

  const quote = useMemo(
    () => quoteMove(requested, termWeeks, partner),
    [requested, termWeeks, partner]
  );

  const uncertain = extracted ? lowConfidenceFields(extracted) : [];

  const blocked =
    (step === 0 && !extracted) ||
    (step === 1 && (!confirmed || rent < 100)) ||
    (step === 2 && verification !== "verified") ||
    (step === 3 && (total <= 0 || total < partner.minAdvance)) ||
    (step === 4 && (!consent || requested <= 0 || belowMinimum));

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

  /* ---------------------------------------------------------------- *
   * Submitted: the tracker.
   * ---------------------------------------------------------------- */
  if (submitted) {
    // The partner is assessing. Everything before that is done; the decision
    // and the drawdown are not ours to claim.
    const current = APPLICATION_STAGES.findIndex((s) => s.key === "assessment");
    const revenue = litchiRevenue(quote, partner);

    return (
      <div className="space-y-6">
        <Card tone="ink">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-onbrand/60">
            Application {request?.token.toUpperCase() ?? "LM-000000"}
          </p>
          <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">
            We&rsquo;re reviewing your application
          </h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-onbrand/75">
            Submitted to {partner.name}{" "}
            with your verified tenancy attached. Most decisions come back the same day, and
            you&rsquo;ll hear from us either way.
          </p>
        </Card>

        <Card>
          <CardTitle>Where it&rsquo;s up to</CardTitle>
          <ol className="mt-6 space-y-5">
            {APPLICATION_STAGES.map((stage, index) => {
              const state = index < current ? "done" : index === current ? "now" : "todo";
              return (
                <li key={stage.key} className="flex items-start gap-4">
                  <span
                    className={clsx(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      state === "done" && "bg-moss text-onbrand",
                      state === "now" && "bg-brand text-onbrand",
                      state === "todo" && "border border-sand bg-paper text-clay"
                    )}
                    aria-hidden
                  >
                    {state === "done" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : state === "now" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={clsx(
                        "text-[15px] font-semibold",
                        state === "todo" ? "text-clay" : "text-ink"
                      )}
                    >
                      {stage.label}
                      <span className="sr-only">
                        {state === "done"
                          ? " — done"
                          : state === "now"
                            ? " — in progress"
                            : " — not started"}
                      </span>
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-mist">{stage.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card>
          <CardTitle>What you applied for</CardTitle>
          <dl className="mt-5 divide-y divide-sand/70 text-sm">
            {[
              { label: "Amount", value: money(quote.amount) },
              { label: "Term", value: `${quote.termWeeks} weeks` },
              { label: "Estimated repayment", value: `${moneyExact(quote.weekly)} a week` },
              { label: "Lender", value: partner.name },
              { label: "Tenancy", value: `${request?.property ?? ""} — verified` },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-mist">{row.label}</dt>
                <dd className="text-right font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* The commercial side, shown rather than hidden. Litchi is paid by the
            lender for the introduction and the platform, and a tenant who
            finds that out later has been sold something. */}
        <Card tone="cream">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-bark" aria-hidden />
            <div>
              <h2 className="text-[15px] font-semibold text-ink">How Litchi is paid for this</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark">
                {partner.name}{" "}
                pays Litchi for introducing and servicing this facility &mdash; about{" "}
                {money(revenue.total)} across the {quote.termWeeks} weeks. It is paid by the
                lender, not added to what you repay, and it is the same whether you borrow{" "}
                {money(partner.minAdvance)} or {money(partner.maxAdvance)}.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/dashboard" size="lg">
            See a funded account
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              setSubmitted(false);
              setStep(0);
            }}
          >
            Start again
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- *
   * The flow.
   * ---------------------------------------------------------------- */
  return (
    <div>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
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
            title="Your estimate"
            body="An indicative quote, not an offer. The lender decides the final terms after its own credit and affordability checks."
          >
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <Field
                label="How much should Litchi cover?"
                hint={`Anything up to your move cost of ${money(total)}. You can take less.`}
              >
                <MoneyInput
                  value={requested}
                  max={ceiling}
                  onChange={(next) => setRequestedOverride(next)}
                  label="Amount requested"
                />
              </Field>
              <Field label="Over how long?" hint="A shorter term costs less overall.">
                <div className="flex flex-wrap gap-2">
                  {partner.termsWeeks.map((weeks) => (
                    <button
                      key={weeks}
                      type="button"
                      onClick={() => setTermWeeks(weeks)}
                      aria-pressed={termWeeks === weeks}
                      className={clsx(
                        "tap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                        termWeeks === weeks
                          ? "bg-brand text-onbrand"
                          : "border border-sand text-mist hover:bg-cream hover:text-ink"
                      )}
                    >
                      {weeks} weeks
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {requestedOverride !== null && requested < total ? (
              <p className="mt-4 text-[13px] leading-relaxed text-mist">
                You&rsquo;re covering {money(total - requested)} of the move yourself.
              </p>
            ) : null}
            {belowMinimum ? (
              <p className="mt-4 text-[13px] leading-relaxed text-litchi">
                {partner.name} does not write facilities under {money(partner.minAdvance)}.
              </p>
            ) : null}

            <dl className="mt-7 grid gap-px overflow-hidden rounded-tile border border-sand bg-sand sm:grid-cols-3">
              {[
                { label: "Weekly repayment", value: moneyExact(quote.weekly) },
                { label: "Term", value: `${quote.termWeeks} weeks` },
                { label: "Total repayable", value: money(quote.totalRepayable) },
              ].map((item) => (
                <div key={item.label} className="bg-paper px-4 py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                    {item.label}
                  </dt>
                  <dd className="numeric mt-1.5 text-[19px] font-semibold text-ink">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

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
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-mist">{row.label}</dt>
                  <dd className="text-right font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* Where it goes. The part that makes this a move facility rather
                than cash. */}
            <div className="mt-7">
              <h3 className="text-[13px] font-semibold text-ink">Where the money goes</h3>
              <ul className="mt-3 space-y-2.5">
                {lines
                  .filter((line) => line.selected && line.amount > 0)
                  .map((line) => (
                    <li
                      key={line.id}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[13px]"
                    >
                      <span className="text-mist">
                        {line.label}
                        <span className="text-clay"> &mdash; {PAYEE_LABELS[line.payee]}</span>
                      </span>
                      <span className="numeric font-medium text-ink">{money(line.amount)}</span>
                    </li>
                  ))}
              </ul>
              <p className="mt-4 text-[13px] leading-relaxed text-mist">
                Paid on your move dates, straight to the people owed. {percent(direct)} of this
                facility never lands in your account, so there is nothing for you to hold, forward
                or accidentally spend.
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
                I understand this is an estimate, that {partner.name} is the lender and makes the
                decision, and that Litchi may pass my verified tenancy and application details to
                them to assess it.
              </span>
            </label>

            <p className="mt-4 text-[13px] leading-relaxed text-clay">
              {partner.name} is a licensed consumer lender, FSPR {partner.fspr}, and a member of{" "}
              {partner.disputesScheme}. Litchi arranges and services the facility. Litchi is not
              the lender and does not decide the outcome.
            </p>
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
              Submit application
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
