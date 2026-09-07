"use client";

import { useState } from "react";
import { Check, ChevronDown, Eye, EyeOff, Landmark } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { agentTenancies, agentVisibility, type AgentTenancy, type BondStage } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

/**
 * The agency's screen.
 *
 * A property manager's first question about Litchi is not "how does the
 * financing work" — it is "what does this change for me". The answer is
 * meant to be almost nothing, and the fastest way to show that is to put
 * their own list in front of them: properties, tenants, bonds, all paid in
 * full, lodged in the normal way.
 *
 * The second question is what they can see about the tenant, and that is why
 * a row opens. Stating the boundary in a paragraph lets you skate over the
 * half that matters; showing a panel of things the agency is not told does
 * not.
 */
const STAGES: Record<BondStage, { label: string; tone: "moss" | "cream" | "amber" | "outline" }> = {
  lodged: { label: "Lodged", tone: "moss" },
  paid: { label: "Paid — to lodge", tone: "amber" },
  approved: { label: "Approved", tone: "cream" },
  applying: { label: "Application in progress", tone: "outline" },
};

/** What the agency has actually been paid, as opposed to what is coming. */
const paid = agentTenancies.filter((t) => t.paidDate !== null);
const paidTotal = paid.reduce((sum, t) => sum + t.bond, 0);
const toLodge = agentTenancies.filter((t) => t.stage === "paid").length;
const inProgress = agentTenancies.filter(
  (t) => t.stage === "approved" || t.stage === "applying"
).length;

const SUMMARY = [
  { label: "Bonds paid to you", value: money(paidTotal), note: `Across ${paid.length} tenancies` },
  { label: "Awaiting lodgement", value: String(toLodge), note: "Your normal process" },
  { label: "In progress", value: String(inProgress), note: "Before move-in" },
  { label: "Cost to your agency", value: money(0), note: "No fee, no commission" },
];

function Row({ tenancy }: { tenancy: AgentTenancy }) {
  const [open, setOpen] = useState(false);
  const stage = STAGES[tenancy.stage];

  return (
    <li className="border-b border-sand/70 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tap flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-cream/60 sm:px-6"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{tenancy.property}</span>
          <span className="mt-0.5 block truncate text-[13px] text-mist">
            {tenancy.suburb} &middot; {tenancy.tenant}
          </span>
        </span>
        <span className="numeric hidden shrink-0 text-sm font-semibold text-ink sm:block">
          {money(tenancy.bond)}
        </span>
        <span className="hidden shrink-0 sm:block">
          <Badge tone={stage.tone}>{stage.label}</Badge>
        </span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 text-clay transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="px-5 pb-6 sm:px-6">
          {/* The phone drops the badge and amount from the row itself, so they
              come back here rather than going missing on the screen a property
              manager is most likely to be holding. */}
          <div className="flex flex-wrap items-center gap-2.5 sm:hidden">
            <span className="numeric text-sm font-semibold text-ink">{money(tenancy.bond)}</span>
            <Badge tone={stage.tone}>{stage.label}</Badge>
          </div>

          <dl className="mt-4 grid gap-x-8 gap-y-3 text-[13px] sm:grid-cols-2 sm:mt-0">
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-mist">Weekly rent</dt>
              <dd className="numeric font-medium text-ink sm:mt-0.5">
                {money(tenancy.weeklyRent)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-mist">Tenant moves in</dt>
              <dd className="font-medium text-ink sm:mt-0.5">{formatDate(tenancy.moveIn)}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-mist">Paid to your trust account</dt>
              <dd className="font-medium text-ink sm:mt-0.5">
                {tenancy.paidDate ? formatDate(tenancy.paidDate) : "On approval"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-mist">Tenancy Services</dt>
              <dd className="numeric font-medium text-ink sm:mt-0.5">
                {tenancy.bondId ?? "Not lodged yet"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-tile bg-moss-soft px-4 py-3.5">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-moss">
                <Eye className="h-3.5 w-3.5" aria-hidden />
                What you see
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {agentVisibility.can.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] leading-relaxed text-moss">
                    <Check className="mt-[3px] h-3 w-3 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-tile bg-cream px-4 py-3.5">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                <EyeOff className="h-3.5 w-3.5" aria-hidden />
                What you don&rsquo;t
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {agentVisibility.cannot.map((item) => (
                  <li key={item} className="text-[13px] leading-relaxed text-bark">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function AgentPortfolio() {
  return (
    <div>
      <dl className="grid gap-px overflow-hidden rounded-card border border-sand bg-sand sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY.map((item) => (
          <div key={item.label} className="bg-paper px-5 py-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
              {item.label}
            </dt>
            <dd className="numeric mt-2 text-[22px] font-semibold tracking-[-0.02em] text-ink">
              {item.value}
            </dd>
            <dd className="mt-1 text-xs text-mist">{item.note}</dd>
          </div>
        ))}
      </dl>

      <Card className="mt-5" padded={false}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-4 pt-5 sm:px-6">
          <h3 className="text-[15px] font-semibold text-ink">Bonds financed by Litchi</h3>
          <p className="text-[13px] text-mist">Open a tenancy to see what we share with you.</p>
        </div>
        <ul className="border-t border-sand/70">
          {agentTenancies.map((tenancy) => (
            <Row key={tenancy.id} tenancy={tenancy} />
          ))}
        </ul>
      </Card>

      <p className="mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-mist">
        <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden />
        <span>
          Every bond above is lodged with Tenancy Services in your name, exactly as it is today.
          Litchi is not a party to the bond and never holds it.
        </span>
      </p>
    </div>
  );
}
