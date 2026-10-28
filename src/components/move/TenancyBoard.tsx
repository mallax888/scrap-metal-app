"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Home,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { StatGrid } from "@/components/ui/StatGrid";
import { TileButton, TileLink } from "@/components/ui/Tile";
import {
  TODAY,
  bond,
  myMove,
  plan,
  tenancy,
  type MoveCoverage,
} from "@/lib/data";
import {
  daysBetween,
  formatDate,
  formatDateShort,
  formatDayMonth,
  formatDayShort,
  money,
  moneyExact,
  percent,
} from "@/lib/format";
import { useActivePaymentMethod, useLitchi } from "@/lib/store";

/**
 * The home screen, as a board rather than a stack of arguments.
 *
 * What was here before was six cards, each of which explained itself in a
 * paragraph before showing its figure. That is the right shape for a screen
 * someone reads once and the wrong one for the screen they open every week:
 * by the third visit the paragraphs are furniture and the figures are what
 * they came for.
 *
 * So each block now states one number and one line of context, and the two
 * blocks whose detail genuinely matters — what the agency was shown, and what
 * each line of the move cost — open a panel underneath rather than sending
 * anyone to another screen for something this one already knows.
 *
 * The order is the week: where you live, what you owe, what is about to come
 * out, then the reference material.
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

type Panel = "tenancy" | "cost" | null;

export function TenancyBoard() {
  const { derived } = useLitchi();
  const method = useActivePaymentMethod();
  const [open, setOpen] = useState<Panel>(null);

  const total = myMove.lines.reduce((sum, line) => sum + line.amount, 0);
  const financed = myMove.lines
    .filter((line) => line.coverage === "litchi")
    .reduce((sum, line) => sum + line.amount, 0);
  const booked = myMove.lines
    .filter((line) => line.coverage === "book")
    .reduce((sum, line) => sum + line.amount, 0);
  /** The provider the booked line was paid to, for the services block. */
  const bookedLine = myMove.lines.find((line) => line.coverage === "book");
  const self = total - financed - booked;

  const next = derived.nextPayment;
  const daysToPayment = next ? daysBetween(TODAY, next.date) : null;
  const weeksToTermEnd = Math.round(daysBetween(TODAY, tenancy.endDate) / 7);

  const toggle = (panel: Exclude<Panel, null>) =>
    setOpen((current) => (current === panel ? null : panel));

  return (
    <div className="space-y-4">
      {/*
       * Two columns on a phone rather than one. Six full-width blocks is a
       * scroll rather than a board, and the point of the shape is that you can
       * see it all at once. The two that are a sentence rather than a figure
       * take the full width at every size.
       */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <TileButton
          tone="ink"
          icon={Home}
          label="Your tenancy"
          figure={myMove.property}
          state={
            <>
              {myMove.suburb} &middot; {money(tenancy.rentWeekly)}{" "}
              a week &middot; moved in {formatDayMonth(myMove.movedIn)}
            </>
          }
          chip={
            <Badge tone="onHero">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Verified at source
            </Badge>
          }
          action="What your agency confirmed"
          className="col-span-2 lg:col-span-1"
          onClick={() => toggle("tenancy")}
          expanded={open === "tenancy"}
          controls="panel-tenancy"
        />

        {/*
         * The plan and the next payment are the same fact at two zoom levels,
         * so they share a block: the weekly figure, then the date it next
         * happens and what it comes off. Splitting them bought a second tile
         * that repeated the first one's number.
         */}
        <TileLink
          href="/plan"
          icon={PiggyBank}
          label="Your plan"
          figure={moneyExact(plan.weeklyPayment)}
          unit="a week"
          progress={derived.progress}
          state={
            next ? (
              <>
                Next on{" "}
                <span className="font-semibold text-ink">
                  {formatDayShort(next.date)}
                </span>{" "}
                from {method.brand} &bull;&bull;&bull;&bull; {method.last4}{" "}
                &middot; {derived.weeksRemaining} of {plan.termWeeks} left
              </>
            ) : (
              <>
                {money(derived.totalRepaid)} of {money(plan.totalRepayable)}{" "}
                repaid &middot; {derived.weeksRemaining} weeks left, finishing{" "}
                {formatDateShort(derived.payoffDate)}
              </>
            )
          }
          chip={
            daysToPayment !== null && daysToPayment <= 10 ? (
              <Badge tone="amber">
                {daysToPayment === 0
                  ? "Due today"
                  : `Due in ${daysToPayment} days`}
              </Badge>
            ) : (
              <Badge tone="moss">On track</Badge>
            )
          }
          action="Payments and plan"
        />

        <TileLink
          href="/bond"
          icon={Landmark}
          label="Your bond"
          figure={money(bond.amount)}
          state={
            <>
              Held by {bond.lodgedWith}, not by Litchi &middot; ref{" "}
              <span className="whitespace-nowrap">{bond.bondId}</span>
            </>
          }
          chip={
            <Badge tone="moss">Lodged {formatDayMonth(bond.lodgedDate)}</Badge>
          }
          action="The bond in full"
        />

        <TileButton
          icon={Calculator}
          label="What this move cost"
          figure={money(total)}
          state={
            <>
              You paid {money(self)} &middot; booked {money(booked)}{" "}
              &middot; Litchi covered {money(financed)}
            </>
          }
          chip={<Badge tone="bark">{myMove.lines.length} lines</Badge>}
          action="Every line"
          onClick={() => toggle("cost")}
          expanded={open === "cost"}
          controls="panel-cost"
        />

        {/*
         * The booked line of the move, which is the only block that is about
         * something Litchi does rather than something it financed — and the
         * one a tenant comes back to when the next move starts.
         */}
        <TileLink
          href="/services"
          icon={Truck}
          label="Cleaners &amp; movers"
          figure={money(booked)}
          state={
            bookedLine ? (
              <>
                {bookedLine.paidTo}, booked through Litchi and paid on the day
                you moved
              </>
            ) : (
              <>
                Vetted movers and bond cleans, booked and paid through Litchi.
              </>
            )
          }
          chip={
            <Badge tone="outline">
              {bookedLine ? "Used once" : "Not used yet"}
            </Badge>
          }
          action="Book for the next one"
        />

        <TileLink
          href="/cost-my-move"
          icon={Calculator}
          label="Your next move"
          figure={formatDateShort(tenancy.endDate)}
          state="Your fixed term ends then. Cost the next move whenever you start looking."
          chip={<Badge tone="outline">{weeksToTermEnd} weeks away</Badge>}
          action="Cost my move"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* The panels. Rendered under the whole board rather than inside a tile,
          so opening one never reflows the grid around it. */}
      <div
        id="panel-tenancy"
        hidden={open !== "tenancy"}
        className="animate-pop rounded-card border border-sand/70 bg-paper p-5 sm:p-6"
      >
        <h3 className="text-[15px] font-semibold text-ink">
          What {myMove.agencyName} confirmed, and what they were never told
        </h3>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-mist">
          {myMove.verifiedBy} confirmed{" "}
          {myMove.verifiedFields.join(", ").toLowerCase()} on{" "}
          {formatDate(myMove.verifiedOn)}{" "}
          &mdash; four facts they already held, from a link that took about ten seconds and
          needed no account.
        </p>
        <StatGrid
          className="mt-5"
          columns={4}
          items={[
            { label: "Weekly rent", value: money(tenancy.rentWeekly) },
            { label: "Bond", value: money(bond.amount) },
            { label: "Start date", value: formatDateShort(myMove.movedIn) },
            { label: "Property", value: "Confirmed" },
          ]}
        />
        <p className="mt-5 text-[13px] leading-relaxed text-mist">
          Nothing else was shown to them.{" "}
          <Link
            href="/agents"
            className="tap font-medium text-bark underline underline-offset-4 transition-colors hover:text-ink"
          >
            See exactly what their screen looks like
          </Link>
          .
        </p>
      </div>

      <div
        id="panel-cost"
        hidden={open !== "cost"}
        className="animate-pop rounded-card border border-sand/70 bg-paper p-5 sm:p-6"
      >
        <h3 className="text-[15px] font-semibold text-ink">
          Every line of the move
        </h3>
        <ul className="mt-4 divide-y divide-sand/70">
          {myMove.lines.map((line) => (
            <li
              key={line.id}
              className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-sm font-semibold text-ink">{line.label}</p>
                  <Badge tone={COVERAGE_TONE[line.coverage]}>
                    {COVERAGE_TEXT[line.coverage]}
                  </Badge>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-mist">
                  {line.note}
                </p>
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
          className="mt-5"
          size="lg"
          items={[
            { label: "You paid", value: money(self) },
            { label: "Booked", value: money(booked) },
            { label: "Litchi covered", value: money(financed) },
          ]}
        />
        <p className={clsx("mt-5 text-[13px] leading-relaxed text-mist")}>
          Litchi covered {percent(financed / total)}{" "}
          of this move &mdash; the bond, which is the one line you could not put off. The rest
          you handled yourself, which is how it should be, and why the amount was never a
          slider.
        </p>
        <div className="mt-5">
          <ButtonLink href="/documents" variant="secondary" size="sm">
            Receipts and documents
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
