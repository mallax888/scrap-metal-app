"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, SlidersHorizontal, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buildFunnel, buildSources, buildTotals, facilities } from "@/lib/admin";
import { formatDateShort, money, percent } from "@/lib/format";
import { defaultPartner, ECONOMICS_ASSUMPTIONS } from "@/lib/move";

/**
 * The internal console.
 *
 * The levers at the bottom are the reason this screen exists. Litchi's revenue
 * comes out of the partner's cost of credit, so every dollar of origination fee
 * is a dollar the partner cannot spend on funding or absorb in losses. Written
 * down as fixed numbers that relationship is invisible; made adjustable, the
 * ceiling shows up immediately — and it is lower than the illustrative
 * $200–250 per funded customer assumes.
 *
 * That is not an argument against the fee. It is an argument for measuring
 * whether verified tenancies actually move the loss rate, because that is the
 * only thing that pays for it.
 */
/* dt/dd rather than two paragraphs: these sit directly inside a <dl>, and a
   description list may only contain term/description pairs (grouped in a div). */
function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-paper px-4 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">{label}</dt>
      <dd className="numeric mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-ink">
        {value}
        {note ? (
          <span className="mt-1 block text-[12px] font-normal leading-relaxed tracking-normal text-mist">
            {note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function Lever({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label className="text-[13px] font-semibold text-ink" htmlFor={`lever-${label}`}>
          {label}
        </label>
        <span className="numeric text-[15px] font-semibold text-ink">{format(value)}</span>
      </div>
      <input
        id={`lever-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sand accent-[var(--bark)]"
      />
      <p className="mt-2 text-[12px] leading-relaxed text-mist">{hint}</p>
    </div>
  );
}

export function AdminConsole() {
  const partner = defaultPartner;

  const [originationFee, setOriginationFee] = useState(partner.commercials.originationFee);
  const [servicingMonthly, setServicingMonthly] = useState(partner.commercials.servicingMonthly);
  const [revenueShare, setRevenueShare] = useState(partner.commercials.revenueShare);
  const [lossRate, setLossRate] = useState(ECONOMICS_ASSUMPTIONS.lossRate);
  const [costOfFunds, setCostOfFunds] = useState(ECONOMICS_ASSUMPTIONS.costOfFunds);

  const commercials = useMemo(
    () => ({ originationFee, servicingMonthly, revenueShare }),
    [originationFee, servicingMonthly, revenueShare]
  );

  const totals = useMemo(
    () => buildTotals(commercials, lossRate, costOfFunds, partner),
    [commercials, lossRate, costOfFunds, partner]
  );
  const sources = useMemo(() => buildSources(commercials, partner), [commercials, partner]);
  const funnel = useMemo(() => buildFunnel(), []);

  const viable = totals.partnerMargin > 0;

  return (
    <div className="space-y-6">
      <dl className="grid gap-px overflow-hidden rounded-card border border-sand bg-sand sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Funded"
          value={String(totals.funded)}
          note={`${totals.declined} declined, ${totals.submitted - totals.funded - totals.declined} still assessing`}
        />
        <Stat label="Approval rate" value={percent(totals.approvalRate)} note="Of decisions returned" />
        <Stat
          label="Originated"
          value={money(totals.originated)}
          note={`${money(totals.averageFacility)} average facility`}
        />
        <Stat
          label="Litchi revenue"
          value={money(totals.revenue)}
          note={`${money(totals.revenuePerFunded)} per funded customer`}
        />
      </dl>

      {/* min-w-0 on the grid children: a grid item defaults to min-width:auto,
          so the wide table inside the scroller stretches the track and the
          whole page scrolls sideways on a phone instead of just the table. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardTitle>The funnel</CardTitle>
          <p className="mt-1.5 text-sm leading-relaxed text-mist">
            Where people stop. The gap between uploading a tenancy and having it verified is the
            one worth watching &mdash; it is the step that depends on somebody else.
          </p>
          <ul className="mt-6 space-y-4">
            {funnel.map((stage, index) => (
              <li key={stage.label}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[13px] font-medium text-ink">{stage.label}</span>
                  <span className="numeric text-[13px] text-mist">
                    {stage.count}
                    {index > 0 ? (
                      <span className="text-clay"> &middot; {percent(stage.ofPrevious)}</span>
                    ) : null}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(stage.count / funnel[0].count) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="min-w-0">
          <CardTitle>Where they came from</CardTitle>
          <p className="mt-1.5 text-sm leading-relaxed text-mist">
            Property managers are the channel the platform is built around, so this is the table
            that says whether that was right.
          </p>
          {/* Focusable, because a region you can only reach by dragging is
              unreachable from a keyboard. */}
          <div
            className="mt-6 overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Applications and revenue by acquisition source"
          >
            <table className="w-full min-w-[380px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-sand/70 text-[11px] uppercase tracking-[0.1em] text-clay">
                  <th scope="col" className="pb-2.5 font-semibold">
                    Source
                  </th>
                  <th scope="col" className="pb-2.5 text-right font-semibold">
                    Funded
                  </th>
                  <th scope="col" className="pb-2.5 text-right font-semibold">
                    Originated
                  </th>
                  <th scope="col" className="pb-2.5 text-right font-semibold">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {sources.map((row) => (
                  <tr key={row.source}>
                    <td className="py-2.5 pr-3 font-medium text-ink">{row.source}</td>
                    <td className="numeric py-2.5 text-right text-mist">
                      {row.funded}/{row.submitted}
                    </td>
                    <td className="numeric py-2.5 text-right text-mist">{money(row.originated)}</td>
                    <td className="numeric py-2.5 text-right font-medium text-ink">
                      {money(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* The commercial terms, and whether the other side can afford them. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
              <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <CardTitle>Commercial terms</CardTitle>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">
                What {partner.name} pays Litchi, and the assumptions behind whether they can.
                Configurable per partner rather than compiled in.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-6">
            <Lever
              label="Origination fee"
              hint="Paid once, when a customer is funded."
              value={originationFee}
              min={0}
              max={400}
              step={5}
              format={money}
              onChange={setOriginationFee}
            />
            <Lever
              label="Servicing, per month"
              hint="Paid for as long as the facility is running."
              value={servicingMonthly}
              min={0}
              max={12}
              step={0.5}
              format={money}
              onChange={setServicingMonthly}
            />
            <Lever
              label="Revenue share"
              hint="Litchi's share of the partner's cost of credit on the facility."
              value={revenueShare}
              min={0}
              max={0.4}
              step={0.01}
              format={(n) => percent(n)}
              onChange={setRevenueShare}
            />
            <div className="border-t border-sand/70 pt-6">
              <Lever
                label="Expected loss rate"
                hint="Share of the amount advanced the partner expects to write off. The number verified tenancies have to move."
                value={lossRate}
                min={0}
                max={0.15}
                step={0.005}
                format={(n) => percent(n, 1)}
                onChange={setLossRate}
              />
            </div>
            <Lever
              label="Partner's cost of funds"
              hint="What the money costs the lender before it lends it."
              value={costOfFunds}
              min={0.03}
              max={0.15}
              step={0.005}
              format={(n) => percent(n, 1)}
              onChange={setCostOfFunds}
            />
          </div>
        </Card>

        <Card className="flex h-full flex-col">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
              <TrendingUp className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <CardTitle>Does the deal work?</CardTitle>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">
                Across the funded book, at the terms on the left.
              </p>
            </div>
          </div>

          <dl className="mt-7 divide-y divide-sand/70 text-sm">
            {[
              { label: "Litchi revenue", value: money(totals.revenue) },
              { label: "Revenue per funded customer", value: money(totals.revenuePerFunded) },
              {
                label: "Partner's margin after Litchi",
                value: money(totals.partnerMargin),
                warn: !viable,
              },
              {
                label: "Break-even loss rate",
                value: percent(totals.breakEvenLossRate, 1),
              },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-mist">{row.label}</dt>
                <dd
                  className={clsx(
                    "numeric text-right font-semibold",
                    row.warn ? "text-litchi" : "text-ink"
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div
            className={clsx(
              "mt-auto flex items-start gap-3 rounded-tile px-4 py-4",
              viable ? "bg-moss-soft/50" : "bg-amber-soft"
            )}
          >
            {viable ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-warm" aria-hidden />
            )}
            <p
              className={clsx(
                "text-[13px] leading-relaxed",
                viable ? "text-ink" : "text-amber-warm"
              )}
            >
              {viable ? (
                <>
                  The partner keeps {money(totals.partnerMargin)}{" "}
                  across this book after funding, losses and Litchi&rsquo;s cut. It stays positive
                  while losses run under {percent(totals.breakEvenLossRate, 1)} of the amount
                  advanced.
                </>
              ) : (
                <>
                  At these terms the partner loses {money(Math.abs(totals.partnerMargin))}{" "}
                  on this book. Losses would have to come in under{" "}
                  {percent(totals.breakEvenLossRate, 1)}{" "}
                  for it to wash its face &mdash; so either the origination fee comes down, or
                  verified tenancies have to demonstrably beat that.
                </>
              )}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Applications</CardTitle>
        <div
          className="mt-5 overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="All applications"
        >
          <table className="w-full min-w-[620px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-sand/70 text-[11px] uppercase tracking-[0.1em] text-clay">
                <th scope="col" className="pb-2.5 font-semibold">
                  Reference
                </th>
                <th scope="col" className="pb-2.5 font-semibold">
                  Agency
                </th>
                <th scope="col" className="pb-2.5 text-right font-semibold">
                  Amount
                </th>
                <th scope="col" className="pb-2.5 text-right font-semibold">
                  Term
                </th>
                <th scope="col" className="pb-2.5 text-right font-semibold">
                  Submitted
                </th>
                <th scope="col" className="pb-2.5 text-right font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/70">
              {facilities.map((facility) => (
                <tr key={facility.id}>
                  <td className="numeric py-3 pr-3 font-medium text-ink">{facility.id}</td>
                  <td className="py-3 pr-3 text-mist">{facility.agencyName}</td>
                  <td className="numeric py-3 text-right text-mist">{money(facility.amount)}</td>
                  <td className="numeric py-3 text-right text-mist">{facility.termWeeks}w</td>
                  <td className="numeric py-3 text-right text-mist">
                    {formatDateShort(facility.submittedOn)}
                  </td>
                  <td className="py-3 text-right">
                    <Badge
                      tone={
                        facility.status === "funded"
                          ? "moss"
                          : facility.status === "declined"
                            ? "amber"
                            : "outline"
                      }
                    >
                      {facility.status === "funded"
                        ? "Funded"
                        : facility.status === "declined"
                          ? "Declined"
                          : "Assessing"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-5 space-y-2">
          {facilities
            .filter((f) => f.reason)
            .map((f) => (
              <li key={f.id} className="text-[13px] leading-relaxed text-mist">
                <span className="numeric font-medium text-ink">{f.id}</span> declined &mdash;{" "}
                {f.reason}
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
