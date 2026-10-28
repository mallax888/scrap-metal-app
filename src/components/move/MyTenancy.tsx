"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Check,
  Landmark,
  Lock,
  PiggyBank,
  ShieldCheck,
} from "lucide-react";
import { clsx } from "clsx";
import { Card, CardLabel, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { StatGrid } from "@/components/ui/StatGrid";
import { bond, myMove, plan, tenancy, type MoveCoverage } from "@/lib/data";
import { formatDate, formatDateShort, money, moneyExact, percent } from "@/lib/format";
import { withheldFromAgency } from "@/lib/verification";
import { useLitchi } from "@/lib/store";

/**
 * The centre of the app.
 *
 * For a long time the first screen behind the sidebar was a repayment
 * dashboard, which quietly said that the loan is what Litchi is. It isn't.
 * The loan is one line of a move, and on this tenancy it was a bit over half
 * of one — the rent in advance and the exit clean were paid outright and the
 * truck was booked and paid on the day.
 *
 * So the move is what leads, and the two things no bank has sit at the top of
 * it: a tenancy an agency confirmed at source, and a costed record of what the
 * move actually took. The repayment is a card further down with a link to the
 * detail, which is the correct proportion for something that is a quarter of
 * the story.
 */
const COVERAGE_TONE: Record<MoveCoverage, "bark" | "cream" | "outline"> = {
  litchi: "bark",
  book: "cream",
  self: "outline",
};

const COVERAGE_TEXT: Record<MoveCoverage, string> = {
  litchi: "Litchi covered",
  book: "Booked through Litchi",
  self: "You paid",
};

export function MyTenancy() {
  const { derived } = useLitchi();

  const total = myMove.lines.reduce((sum, line) => sum + line.amount, 0);
  const financed = myMove.lines
    .filter((line) => line.coverage === "litchi")
    .reduce((sum, line) => sum + line.amount, 0);
  const booked = myMove.lines
    .filter((line) => line.coverage === "book")
    .reduce((sum, line) => sum + line.amount, 0);
  const self = total - financed - booked;

  return (
    <div className="space-y-6">
      {/* The verification, first, because it is the thing that is actually
          different. Everything downstream is quicker or cheaper because of it. */}
      <Card tone="ink">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-onbrand/60">
              Your tenancy
            </p>
            <h2 className="mt-2.5 text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">
              {myMove.property}
            </h2>
            <p className="mt-1 text-[15px] text-onbrand/70">{myMove.suburb}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-onbrand/15 px-3 py-1.5 text-[12px] font-semibold text-onbrand">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Verified at source
          </span>
        </div>

        <dl className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-3">
          {[
            { label: "Weekly rent", value: money(tenancy.rentWeekly) },
            { label: "Bond", value: money(bond.amount) },
            { label: "Moved in", value: formatDate(myMove.movedIn) },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-onbrand/60">
                {item.label}
              </dt>
              <dd className="numeric mt-1.5 text-[20px] font-semibold tracking-[-0.01em]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-7 border-t border-onbrand/15 pt-5 text-[13px] leading-relaxed text-onbrand/75">
          Confirmed by {myMove.verifiedBy} at {myMove.agencyName} on{" "}
          {formatDate(myMove.verifiedOn)} &mdash; {myMove.verifiedFields.join(", ").toLowerCase()}.
          They were shown nothing about your finances, and they never saw your agreement.
        </p>
      </Card>

      {/* The move itself: what it took, and who paid each part. */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>What the move cost</CardTitle>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-mist">
              Every line, and how it was handled. Litchi covered the one you could not, which is
              the whole job.
            </p>
          </div>
          <p className="numeric text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink">
            {money(total)}
          </p>
        </div>

        <ul className="mt-7 divide-y divide-sand/70">
          {myMove.lines.map((line) => (
            <li
              key={line.id}
              className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-sm font-semibold text-ink">{line.label}</p>
                  <Badge tone={COVERAGE_TONE[line.coverage]}>
                    {COVERAGE_TEXT[line.coverage]}
                  </Badge>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-mist">{line.note}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-clay">
                  {line.paidTo} &middot; {formatDateShort(line.date)}
                </p>
              </div>
              <p className="numeric shrink-0 text-sm font-semibold text-ink">
                {money(line.amount)}
              </p>
            </li>
          ))}
        </ul>

        <StatGrid
          className="mt-6"
          size="lg"
          items={[
            { label: "You paid", value: money(self) },
            { label: "Booked", value: money(booked) },
            { label: "Litchi covered", value: money(financed) },
          ]}
        />

        <p className="mt-5 text-[13px] leading-relaxed text-mist">
          Litchi covered {percent(financed / total)}{" "}
          of this move. The rest you handled yourself &mdash; which is how it should be, and why
          the amount was never a slider.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* The bond, which is where most of the financed money went. */}
        <Card className="flex h-full min-w-0 flex-col">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-bark">
            <Landmark className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <CardTitle className="mt-4">Where your bond is</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Held by {bond.lodgedWith} in your landlord&rsquo;s name, reference{" "}
            <span className="numeric font-medium text-ink">{bond.bondId}</span>, lodged{" "}
            {formatDate(bond.lodgedDate)}. Litchi has never held it and has no claim on the refund
            &mdash; not even if you still owe us.
          </p>
          <div className="mt-auto pt-5">
            <ButtonLink href="/bond" variant="secondary" size="sm">
              The bond in full
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </Card>

        {/* The repayment. One card, not the whole app. */}
        <Card className="flex h-full min-w-0 flex-col">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-bark">
            <PiggyBank className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <CardTitle className="mt-4">Repaying the {money(financed)}</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            {moneyExact(plan.weeklyPayment)} a week, {derived.weeksRemaining} weeks left, finishing{" "}
            {formatDate(derived.payoffDate)}.
          </p>
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-4">
              <CardLabel>Repaid</CardLabel>
              <span className="numeric text-[13px] font-semibold text-ink">
                {money(derived.totalRepaid)} of {money(plan.totalRepayable)}
              </span>
            </div>
            {/* The figures are stated in the row above, so announcing them
                again as a progressbar just makes the card longer to listen to. */}
            <Progress value={derived.progress} className="mt-2.5" decorative />
          </div>
          <div className="mt-auto pt-5">
            <ButtonLink href="/dashboard" variant="secondary" size="sm">
              Your plan in full
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </Card>
      </div>

      {/* The calculator does not disappear once you have moved. Renters move
          again, and this is the screen they should come back to. */}
      <Card tone="cream">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-bark">
              <Calculator className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight text-ink">
                Costing your next move
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-bark">
                Your fixed term runs to {formatDate(tenancy.endDate)}. When you start looking,
                upload the new agreement and the whole thing above rebuilds itself &mdash; costs
                off the new rent, verification to the new agency, and a decision on each line.
              </p>
            </div>
          </div>
          <ButtonLink href="/cost-my-move" variant="secondary">
            Cost my move
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </Card>

      {/* The privacy boundary, restated where the tenant can see it rather
          than only on the agent's screen. */}
      <Card>
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-clay" aria-hidden />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              What your agency was never told
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {withheldFromAgency.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[13px] leading-relaxed text-mist"
                >
                  <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-mist">
              They confirmed four facts they already held.{" "}
              <Link
                href="/agents"
                className={clsx(
                  "tap font-medium text-bark underline underline-offset-4",
                  "transition-colors hover:text-ink"
                )}
              >
                See exactly what their screen looks like
              </Link>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
