import { ArrowRight, Check, Info, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatGrid } from "@/components/ui/StatGrid";
import { money, moneyExact } from "@/lib/format";
import {
  COVERAGE_SHORT,
  defaultCoverage,
  litchiRevenue,
  type Coverage,
  type CoverageSplit,
  type FinancePartner,
  type MoveCostLine,
  type MoveQuote,
} from "@/lib/move";
import { APPLICATION_STAGES, type VerificationRequest } from "@/lib/verification";
import { useLitchi } from "@/lib/store";

/**
 * The saved move plan.
 *
 * Not "your application". The plan is the thing that was made, and it is worth
 * something whether or not any of it is financed — a costed move, a verified
 * tenancy, and a record of who is paying what. Where finance is involved the
 * application appears inside the plan as one section, which is the right
 * proportion: it is part of the move, not the point of it.
 *
 * A separate component from the flow because it is a separate screen rather
 * than a sixth step: it replaces the wizard entirely, takes no part in the
 * stepping, and reads only finished values. Everything it needs arrives as one
 * `plan` object rather than a dozen loose props — threading ten arguments
 * through a boundary is how a split stops being a simplification.
 */
export interface SavedPlan {
  /** Only the lines that are actually in the move. */
  lines: MoveCostLine[];
  coverage: Record<string, Coverage>;
  split: CoverageSplit;
  total: number;
  rent: number;
  /** What was asked of the lender, which is the sum of the financed lines. */
  requested: number;
  financing: boolean;
  quote: MoveQuote;
  partner: FinancePartner;
  tenancy: VerificationRequest | undefined;
}

export function MovePlan({
  plan,
  onStartAgain,
}: {
  plan: SavedPlan;
  onStartAgain: () => void;
}) {
  const { lines, coverage, split, total, rent, requested, financing, quote, partner, tenancy } =
    plan;
  const { openAccount } = useLitchi();

  // The partner is assessing. Everything before that is done; the decision and
  // the drawdown are not ours to claim.
  const current = APPLICATION_STAGES.findIndex((s) => s.key === "assessment");
  const revenue = litchiRevenue(quote, partner);

  return (
    <div className="space-y-6">
      <Card tone="ink">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-onbrand/60">
          Saved
        </p>
        <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">
          {tenancy?.property ?? "Your move"}
        </h2>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-onbrand/75">
          {financing ? (
            <>
              A verified tenancy, {money(total)}{" "}
              of costs, and an application with {partner.name} for the {money(requested)}{" "}
              you asked us to cover.
            </>
          ) : (
            <>
              A verified tenancy and {money(total)}{" "}
              of costs, all covered by you. Nothing was applied for, and you can change any line
              whenever you like.
            </>
          )}
        </p>
      </Card>

      {/* The plan itself comes first, because it is the deliverable. */}
      <Card>
        <CardTitle>The move</CardTitle>
        <ul className="mt-5 divide-y divide-sand/70">
          {lines.map((line) => {
            const how = coverage[line.id] ?? defaultCoverage(line);
            return (
              /*
               * Two columns that cannot swap places.
               *
               * This row used to wrap: the badge and the amount sat in a
               * shrink-0 group, and on a phone a long label pushed that group
               * onto its own line, where justify-between parked it hard left.
               * So "Movers" kept its amount on the right and "Rent in advance"
               * did not, and the column stopped being a column. The badge
               * belongs with the label it describes; the amount is the only
               * thing in the right-hand column, and it never moves.
               */
              <li key={line.id} className="flex items-start justify-between gap-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{line.label}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-mist">
                    <span>{how === "self" ? "You" : line.payeeName}</span>
                    <Badge tone={how === "litchi" ? "bark" : how === "book" ? "cream" : "outline"}>
                      {COVERAGE_SHORT[how]}
                    </Badge>
                  </p>
                </div>
                <span className="numeric w-20 shrink-0 text-right text-sm font-semibold text-ink">
                  {money(line.amount)}
                </span>
              </li>
            );
          })}
        </ul>
        <StatGrid
          className="mt-5"
          items={[
            { label: "You're paying", value: money(split.self) },
            { label: "Booked", value: money(split.booked) },
            { label: "Litchi covers", value: money(split.financed) },
          ]}
        />
      </Card>

      <Card>
        <CardTitle>Your tenancy</CardTitle>
        <dl className="mt-5 divide-y divide-sand/70 text-sm">
          {[
            { label: "Property", value: `${tenancy?.property ?? ""}, ${tenancy?.suburb ?? ""}` },
            { label: "Weekly rent", value: money(rent) },
            {
              label: "Confirmed by",
              value: `${tenancy?.manager ?? ""}, ${tenancy?.agencyName ?? ""}`,
            },
          ].map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-mist">{row.label}</dt>
              <dd className="text-right font-medium text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex items-start gap-3 rounded-tile bg-moss-soft/40 px-4 py-3.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden />
          <p className="text-[13px] leading-relaxed text-ink">
            Verified at source. That is what makes the rest of this quick &mdash; and it is the
            part you keep, whether or not you ever borrow anything.
          </p>
        </div>
      </Card>

      {financing ? (
        <>
          <Card>
            <CardTitle>The application</CardTitle>
            <p className="mt-1.5 text-sm leading-relaxed text-mist">
              For the {money(requested)} you asked Litchi to cover. Everything above stands
              whatever the answer is.
            </p>
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
            <dl className="mt-6 divide-y divide-sand/70 border-t border-sand/70 pt-2 text-sm">
              {[
                { label: "Amount", value: money(quote.amount) },
                { label: "Term", value: `${quote.termWeeks} weeks` },
                { label: "Estimated repayment", value: `${moneyExact(quote.weekly)} a week` },
                { label: "Lender", value: partner.name },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-mist">{row.label}</dt>
                  <dd className="text-right font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Said on the page, not in a footer: a tenant who finds out later
              that the introduction was paid for has been sold something. */}
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
        </>
      ) : null}

      {/*
       * The journey used to stop here.
       *
       * This screen was the end of the road: a plan, and a door into someone
       * else's finished account. Identity, the bank check and the agreement
       * lived at /setup, which nothing on this path linked to — so the two
       * steps that turn a costed move into a funded one were off to the side
       * where nobody walking the flow would find them. The real next thing to
       * do goes first now, and the sample account becomes what it is: a look
       * at the far end, not the way on.
       */}
      {/* Signing happens inside the flow now, so by the time this screen is
          reached there is nothing left to finish elsewhere. It used to send
          people to /setup, which was the only route into the two steps the
          path through here never reached — those are steps three and four of
          this flow now, and this is what comes after them. */}
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/my-tenancy" size="lg" onClick={openAccount}>
          Open your Litchi
          <ArrowRight className="h-4 w-4" aria-hidden />
        </ButtonLink>
        <Button variant="ghost" size="lg" onClick={onStartAgain}>
          Start again
        </Button>
      </div>

      <p className="text-[13px] leading-relaxed text-clay">
        The account is a different tenant&rsquo;s, ten weeks into repaying a bond Litchi covered
        &mdash; it is what this plan looks like once the money has moved.
      </p>
    </div>
  );
}
