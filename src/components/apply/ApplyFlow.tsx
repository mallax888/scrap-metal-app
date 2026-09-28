"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Info, Minus, X } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { StatGrid } from "@/components/ui/StatGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { bond as bondRules, plan } from "@/lib/data";
import { money, moneyExact, percent } from "@/lib/format";
import {
  assess,
  EMPLOYMENT_LABELS,
  RULES,
  type Application,
  type Employment,
} from "@/lib/underwriting";

/**
 * The application, and the decision.
 *
 * Every other screen in this app belongs to someone who was already approved,
 * which left the product with no answer to the first question a lending partner
 * asks after "what happens when they don't pay" — namely, who do you say yes to,
 * and how do you decide.
 *
 * The figures are deliberately editable so the decision can be made to change.
 * A demo that only ever approves is not showing an underwriting model, it is
 * showing a happy path with a form in front of it; being able to drive it into
 * a decline is the whole point.
 *
 * Nothing is submitted anywhere. The assessment runs in the browser and the
 * inputs never leave it.
 */
const STEPS = ["Your tenancy", "About you", "Your offer"] as const;

const DEFAULTS: Application = {
  weeklyRent: 700,
  weeklyIncome: 1600,
  employment: "permanent",
  monthsInRole: 18,
};

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
      {hint ? <span className="mt-0.5 block text-xs text-mist">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

const inputClass =
  "tap w-full rounded-tile border border-sand bg-paper px-4 text-[15px] text-ink outline-none transition-colors focus:border-clay";

export function ApplyFlow() {
  const [step, setStep] = useState(0);
  const [app, setApp] = useState<Application>(DEFAULTS);
  const result = useMemo(() => assess(app), [app]);

  const set = <K extends keyof Application>(key: K, value: Application[K]) =>
    setApp((prev) => ({ ...prev, [key]: value }));

  const OUTCOME = {
    approved: {
      title: "Approved",
      body: `Your bond is covered. ${money(result.bond)} goes to the agent, and you repay ${moneyExact(result.weeklyPayment)} a week for ${result.termWeeks} weeks.`,
      tone: "bg-moss-soft text-moss",
      icon: Check,
    },
    refer: {
      title: "One quick check",
      body: "Everything looks workable, but a person needs to look at it before we commit. That usually takes a few hours during the working day, and we'll call you either way.",
      tone: "bg-amber-soft text-amber-warm",
      icon: Info,
    },
    declined: {
      title: "Not this time",
      body: "On these numbers the repayment would not be affordable alongside your rent, and lending anyway would not be doing you a favour.",
      tone: "bg-blush text-litchi",
      icon: X,
    },
  }[result.outcome];

  const OutcomeIcon = OUTCOME.icon;

  return (
    <div>
      {/* Where you are, without a progress bar pretending this is longer than it is. */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        {STEPS.map((label, index) => (
          <li key={label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-sand">/</span> : null}
            <span
              className={clsx(
                index === step ? "font-semibold text-ink" : "text-mist",
                index < step && "text-moss"
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <Card className="mt-5">
        {step === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Weekly rent" hint="For the place you're applying for.">
              <input
                type="number"
                min={100}
                step={10}
                value={app.weeklyRent}
                onChange={(e) => set("weeklyRent", Number(e.target.value))}
                className={`numeric h-12 ${inputClass}`}
              />
            </Field>
            <div className="rounded-tile bg-cream px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                Bond to finance
              </p>
              <p className="numeric mt-1.5 text-[24px] font-semibold tracking-[-0.02em] text-ink">
                {money(result.bond)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-mist">
                {bondRules.weeksOfRent}{" "}
                weeks&rsquo; rent — the most a landlord can legally take. You don&rsquo;t choose
                this figure and neither do we.
              </p>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Weekly take-home pay" hint="After tax, for everyone on the plan.">
              <input
                type="number"
                min={0}
                step={50}
                value={app.weeklyIncome}
                onChange={(e) => set("weeklyIncome", Number(e.target.value))}
                className={`numeric h-12 ${inputClass}`}
              />
            </Field>
            <Field label="How you're paid">
              <select
                value={app.employment}
                onChange={(e) => set("employment", e.target.value as Employment)}
                className={`h-12 ${inputClass}`}
              >
                {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Months in that role">
              <input
                type="number"
                min={0}
                step={1}
                value={app.monthsInRole}
                onChange={(e) => set("monthsInRole", Number(e.target.value))}
                className={`numeric h-12 ${inputClass}`}
              />
            </Field>
            <div className="rounded-tile bg-cream px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                We don&rsquo;t credit-score you
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-mist">
                Litchi exists for people who can pay a bond weekly but not in one go. Screening on
                a thin credit file would turn away exactly those people, so we test affordability
                instead.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <div className={clsx("flex items-start gap-3 rounded-tile px-5 py-4", OUTCOME.tone)}>
              <OutcomeIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <h2 className="text-[17px] font-semibold">{OUTCOME.title}</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed">{OUTCOME.body}</p>
              </div>
            </div>

            {result.outcome !== "declined" ? (
              <StatGrid
                className="mt-6"
                columns={4}
                items={[
                  { label: "Bond financed", value: money(result.bond) },
                  { label: `Litchi fee (${plan.feeRate * 100}%)`, value: money(result.fee) },
                  { label: "Total repayable", value: money(result.totalRepayable) },
                  { label: "Weekly", value: moneyExact(result.weeklyPayment) },
                ]}
              />
            ) : null}

            {/* The workings, not just the verdict. Someone declined deserves to
                see which test they failed and by how much. */}
            <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
              How we got there
            </h3>
            <ul className="mt-4 space-y-3.5">
              {result.checks.map((check) => (
                <li key={check.key} className="flex items-start gap-3">
                  <span
                    className={clsx(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      check.result === "pass"
                        ? "bg-moss-soft text-moss"
                        : check.result === "refer"
                          ? "bg-amber-soft text-amber-warm"
                          : "bg-blush text-litchi"
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
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{check.label}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-mist">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-mist">Rent and repayment, against take-home pay</span>
                <span className="numeric font-semibold text-ink">
                  {percent(result.housingShare)}
                </span>
              </div>
              <Progress
                value={Math.min(1, result.housingShare)}
                tone={result.outcome === "declined" ? "litchi" : "moss"}
                className="mt-2.5"
                decorative
              />
              <p className="mt-2.5 text-xs leading-relaxed text-mist">
                We refer above {percent(RULES.housingShareRefer)} and decline above{" "}
                {percent(RULES.housingShareMax)}. On these numbers you&rsquo;d have{" "}
                <span className="numeric font-semibold text-ink">
                  {moneyExact(Math.max(0, result.weeklyLeftOver))}
                </span>{" "}
                a week left once rent and the repayment are paid.
              </p>
            </div>

            {/* Approval used to be the end of the road. It is the middle of
                one: nothing has been agreed and no money has moved. */}
            {result.outcome !== "declined" ? (
              <div className="mt-8 border-t border-sand/70 pt-6">
                <h3 className="text-[15px] font-semibold text-ink">What happens next</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
                  Four steps before anything is committed &mdash; we verify who you are, check the
                  repayment against your actual bank account rather than your estimate, show you
                  every term of the agreement, and set up the direct debit. You can walk away at
                  any point in it.
                </p>
                <div className="mt-5">
                  <ButtonLink href={`/setup?rent=${app.weeklyRent}`} size="lg">
                    Set up my plan
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </ButtonLink>
                </div>
              </div>
            ) : null}

            {result.outcome === "declined" ? (
              <div className="mt-6 rounded-tile bg-cream px-5 py-4">
                <p className="text-[13px] leading-relaxed text-bark">
                  <span className="font-semibold text-ink">What you can do.</span> A cheaper
                  property changes this immediately, since the bond follows the rent. Work and
                  Income may be able to help with a Bond Grant. And MoneyTalks offers free,
                  independent financial mentoring — 0800 345 123.
                </p>
              </div>
            ) : null}
          </div>
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
            <Button onClick={() => setStep((s) => s + 1)}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <p className="text-[13px] text-clay">
              Change any figure above and the decision updates.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
