"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  FileText,
  Landmark,
  Lock,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { bond as bondRules, plan, tenancy, TODAY } from "@/lib/data";
import { formatDate, money, moneyExact } from "@/lib/format";
import { APP_HOME } from "@/lib/nav";
import {
  buildTimeline,
  parseAccountNumber,
  quoteFor,
  WEEKDAYS,
  type PaymentDay,
} from "@/lib/setup";

/**
 * Approved, to a working account.
 *
 * Everything else in the app assumes this step already happened, which meant
 * the product had no answer to the two questions that actually decide whether
 * a lender will back it: what do you check before you hand over the money, and
 * how do you get paid back.
 *
 * Four steps, in the order the obligations fall. Identity first, because a
 * consumer lender is a reporting entity under the AML/CFT Act and cannot skip
 * it. The bank connection second, because an affordability assessment that
 * takes the applicant's word for their income is not an assessment. Then
 * disclosure of the key terms *before* the contract is entered, which is the
 * CCCFA's requirement and the reason this screen exists at all. The direct
 * debit authority last, because that is the commitment.
 *
 * Nothing is submitted anywhere. The whole thing runs in the browser.
 */
const STEPS = ["Who you are", "Your bank", "Your agreement", "Payment set-up"] as const;

/** What is actually read off a bank connection, and what is not. */
const BANK_READS = [
  "90 days of transactions, to see income and regular outgoings",
  "The account name, to confirm it is yours",
  "Enough to check the repayment fits alongside your rent",
];
const BANK_NEVER = [
  "Your login. It goes to your bank, never to us",
  "The ability to move money out of your account",
  "Anything after the check — the connection ends when it is done",
];

/** The documents an applicant can verify with, under standard CDD. */
const ID_TYPES = [
  { value: "licence", label: "NZ driver licence" },
  { value: "passport", label: "Passport" },
  { value: "kiwiaccess", label: "Kiwi Access card" },
] as const;

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-mist">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
      {error ? <span className="mt-1.5 block text-xs font-medium text-litchi">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "tap w-full rounded-tile border border-sand bg-paper px-4 text-[15px] text-ink outline-none transition-colors focus:border-clay";

function StepPanel({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: typeof ScanFace;
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

export function SetupFlow() {
  const params = useSearchParams();

  // Carried from the application, so the figures on this screen are the ones
  // the applicant was just quoted rather than a fresh set.
  const rent = Number(params.get("rent"));
  const weeklyRent = Number.isFinite(rent) && rent >= 100 ? rent : tenancy.rentWeekly;
  const q = useMemo(() => quoteFor(weeklyRent), [weeklyRent]);

  const [step, setStep] = useState(0);
  const [idType, setIdType] = useState<string>("licence");
  const [idNumber, setIdNumber] = useState("");
  const [bankLinked, setBankLinked] = useState(false);
  const [linking, setLinking] = useState(false);
  const [readDisclosure, setReadDisclosure] = useState(false);
  const [account, setAccount] = useState("");
  const [payDay, setPayDay] = useState<PaymentDay>(5);
  const [authorised, setAuthorised] = useState(false);
  const [done, setDone] = useState(false);

  const parsed = parseAccountNumber(account);
  const [touchedAccount, setTouchedAccount] = useState(false);
  const timeline = useMemo(
    () => buildTimeline(TODAY, payDay, q.termWeeks),
    [payDay, q.termWeeks]
  );

  // Each step gates the next one. A flow you can click straight through is not
  // showing a process, it is showing a slideshow of one.
  const blocked =
    (step === 0 && idNumber.trim().length < 5) ||
    (step === 1 && !bankLinked) ||
    (step === 2 && !readDisclosure) ||
    (step === 3 && (!parsed.ok || !authorised));

  const DISCLOSURE: { label: string; value: string; note: string }[] = [
    {
      label: "Creditor",
      value: plan.partner,
      note: "Litchi arranges and services the loan. Litchi is not the lender and never holds your money.",
    },
    {
      label: "Total advanced",
      value: money(q.bondAmount),
      note: `${bondRules.weeksOfRent} weeks' rent, paid to your agent so they can lodge it with ${bondRules.lodgedWith}.`,
    },
    {
      label: "Credit fee",
      value: money(q.fee),
      note: `A flat ${plan.feeRate * 100}% of the bond, charged once at the start. It is the only fee.`,
    },
    {
      label: "Annual interest rate",
      value: "0%",
      note: "Fixed for the term. What you owe never grows.",
    },
    {
      label: "Total repayable",
      value: money(q.total),
      note: "Every dollar you will pay, stated before you sign.",
    },
    {
      label: "Payments",
      value: `${q.termWeeks} weekly`,
      note: `${moneyExact(q.weekly)} a week, with a final payment of ${moneyExact(q.last)} to settle the rounding.`,
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
      note: "The credit fee is charged once, so it does not shrink — but nothing else is added either.",
    },
    {
      label: "If things get hard",
      value: "Hardship applies",
      note: "You can apply to vary the payments and we have to properly consider it.",
    },
    {
      label: "Complaints",
      value: "Free, independent",
      note: "An approved dispute resolution scheme, at no cost to you. Details are in your agreement.",
    },
  ];

  if (done) {
    return (
      <div>
        <div className="flex items-start gap-3 rounded-tile bg-moss-soft px-5 py-4 text-moss">
          <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <h2 className="text-[17px] font-semibold">That&rsquo;s it. Your bond is covered.</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed">
              Nothing else is needed from you. Here is exactly when the money moves.
            </p>
          </div>
        </div>

        <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
          What happens, and when
        </h3>
        <ol className="mt-5 space-y-5">
          {([
            {
              icon: FileText,
              date: timeline.signed,
              title: "You signed",
              body: `Your agreement and disclosure are in Documents. You can cancel until ${formatDate(timeline.cancelUntil)} and owe nothing but the advance.`,
            },
            {
              icon: Banknote,
              date: timeline.bondPaid,
              title: `${plan.partner} pays ${money(q.bondAmount)}`,
              body: `Straight to your agent's trust account, referenced so they can match it — not to us and not to you. Payments settle in business-day batches, so it lands the working day after you sign rather than tonight, and that is why we ask you to apply at least ${bondRules.clearDaysBeforeMoveIn} days before you move: the bond should never be the thing holding up your keys.`,
            },
            {
              icon: Landmark,
              // A deadline, not a scheduled event — and putting its date in the
              // column made the list read out of order, because the landlord's
              // 23 working days run past the first repayment.
              when: "Within 23 working days",
              title: "Your agent lodges the bond",
              body: `${bondRules.lodgedWith} holds it for the whole tenancy, in the landlord's name, exactly as it would if you had paid it yourself. The deadline is ${formatDate(timeline.lodgedBy)}, and it is the agent's to meet, not yours.`,
            },
            {
              icon: Building2,
              date: timeline.firstPayment,
              title: `First payment of ${moneyExact(q.weekly)}`,
              body: `Debited from ${parsed.formatted} every ${WEEKDAYS.find((d) => d.value === payDay)?.label}. Tell us before a payment is due and we will move it, free.`,
            },
            {
              icon: Check,
              date: timeline.lastPayment,
              title: "Last payment",
              body: `A final ${moneyExact(q.last)} settles the ${money(q.total)}. The bond stays where it is until your tenancy ends, and the refund goes to you.`,
            },
          ] as { icon: typeof FileText; date?: string; when?: string; title: string; body: string }[]).map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="numeric text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                    {item.when ?? formatDate(item.date!)}
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-mist">{item.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-9 flex flex-wrap gap-3 border-t border-sand/70 pt-7">
          <ButtonLink href={APP_HOME} size="lg">
            Open your Litchi
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <Button variant="ghost" onClick={() => { setDone(false); setStep(0); }}>
            Start again
          </Button>
        </div>
      </div>
    );
  }

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
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <Card className="mt-5">
        {step === 0 ? (
          <StepPanel
            icon={ScanFace}
            title="First, we have to know who you are"
            body="Not a formality we invented — a lender in New Zealand is a reporting entity under the AML/CFT Act and has to verify identity before advancing anything. It is the same check a bank runs when you open an account."
          >
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <Field label="Document type">
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
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
            <div className="mt-6 flex items-start gap-3 rounded-tile bg-cream px-4 py-3.5">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-bark" aria-hidden />
              <p className="text-[13px] leading-relaxed text-bark">
                In the real thing this runs against the issuing authority through a verification
                provider, and the document itself is not kept afterwards. Your agent never sees any
                of it.
              </p>
            </div>
          </StepPanel>
        ) : null}

        {step === 1 ? (
          <StepPanel
            icon={Landmark}
            title="Connect the account you get paid into"
            body="This does two jobs at once: it proves the account is yours before we debit it, and it lets us check the repayment actually fits — rather than taking your word for your income, which is not an affordability assessment."
          >
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div className="rounded-tile bg-moss-soft px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-moss">
                  What we read
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {BANK_READS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-moss"
                    >
                      <Check className="mt-[3px] h-3 w-3 shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-tile bg-cream px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                  What we never get
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {BANK_NEVER.map((item) => (
                    <li key={item} className="text-[13px] leading-relaxed text-bark">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-7">
              {bankLinked ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="moss">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Connected
                  </Badge>
                  <p className="text-[13px] text-mist">
                    Income and outgoings check out against what you told us.
                  </p>
                </div>
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
          </StepPanel>
        ) : null}

        {step === 2 ? (
          <StepPanel
            icon={FileText}
            title="The whole agreement, before you sign it"
            body="Every term that binds you, on one screen, in advance — which is what the law requires and roughly the opposite of how most credit is sold. Nothing here appears later in fine print, because there is no later and no fine print."
          >
            <dl className="mt-7 overflow-hidden rounded-tile border border-sand">
              {DISCLOSURE.map((row, index) => (
                <div
                  key={row.label}
                  className={clsx(
                    "grid gap-1 px-4 py-3.5 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-4 sm:px-5",
                    index % 2 === 1 && "bg-cream/50"
                  )}
                >
                  <dt className="text-[13px] font-semibold text-ink">{row.label}</dt>
                  <dd>
                    <span className="numeric text-[13px] font-semibold text-ink">{row.value}</span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-mist">
                      {row.note}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-tile bg-cream px-4 py-3.5">
              <input
                type="checkbox"
                checked={readDisclosure}
                onChange={(e) => setReadDisclosure(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
              />
              <span className="text-[13px] leading-relaxed text-bark">
                I&rsquo;ve read these terms and I understand I&rsquo;m borrowing{" "}
                {money(q.bondAmount)} and repaying {money(q.total)}.
              </span>
            </label>
          </StepPanel>
        ) : null}

        {step === 3 ? (
          <StepPanel
            icon={ShieldCheck}
            title="How the repayments come out"
            body="A direct debit, on a day you choose. It is the cheapest way to move the money, which matters when the fee has to cover a year of payments — a card would eat a quarter of it, and that cost would end up back in the price."
          >
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <Field
                label="Account to debit"
                hint="Bank, branch, account, suffix."
                error={touchedAccount && !parsed.ok ? parsed.reason : undefined}
              >
                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  onBlur={() => setTouchedAccount(true)}
                  placeholder="12-3456-0123456-00"
                  inputMode="numeric"
                  aria-invalid={touchedAccount && !parsed.ok}
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

            <div className="mt-6 rounded-tile bg-cream px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                Your first payment
              </p>
              <p className="numeric mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-ink">
                {moneyExact(q.weekly)} on {formatDate(timeline.firstPayment)}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-mist">
                A week after the bond is paid, so nothing comes out before you have moved in. Then
                the same amount every {WEEKDAYS.find((d) => d.value === payDay)?.label} until{" "}
                {formatDate(timeline.lastPayment)}.
              </p>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-tile border border-sand px-4 py-3.5">
              <input
                type="checkbox"
                checked={authorised}
                onChange={(e) => setAuthorised(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bark)]"
              />
              <span className="text-[13px] leading-relaxed text-bark">
                I authorise {plan.partner} to debit this account {moneyExact(q.weekly)} weekly under
                the agreement above. I can cancel this authority with my bank at any time, and I
                know that doing so does not cancel what I owe.
              </span>
            </label>
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
            <Button onClick={() => setDone(true)} disabled={blocked}>
              Sign and finish
              <Check className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
