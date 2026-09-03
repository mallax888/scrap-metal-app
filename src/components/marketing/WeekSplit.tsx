import { plan, rent, tenancy } from "@/lib/data";
import { money } from "@/lib/format";

/**
 * The whole proposition in one card.
 *
 * Litchi's single most important claim is that it does not touch your rent —
 * the money to the landlord and the money to Litchi are separate, and the app
 * never blurs them. Saying that in a paragraph is weaker than drawing it, so
 * the hero shows the actual week: two rows, two colours, two destinations.
 *
 * A static mirror of the dashboard's WeeklyBreakdown rather than the component
 * itself, which is a client component wired to the store. Nothing on this page
 * should need the store to render.
 */
const total = rent.weekly + plan.weeklyPayment;
const rentShare = rent.weekly / total;

const ROWS = [
  {
    label: "Rent",
    to: tenancy.landlordAgency,
    amount: rent.weekly,
    dot: "bg-moss",
  },
  {
    label: "Litchi bond repayment",
    to: "Litchi Bond Assist",
    amount: plan.weeklyPayment,
    dot: "bg-litchi",
  },
];

export function WeekSplit() {
  return (
    <div className="rounded-card border border-sand/70 bg-paper p-6 shadow-card sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">Your week</p>

      <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-sand" aria-hidden>
        <div className="h-full bg-moss" style={{ width: `${rentShare * 100}%` }} />
        <div className="h-full flex-1 bg-litchi" />
      </div>

      <dl className="mt-6 divide-y divide-sand/70">
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3.5">
            <dt className="flex min-w-0 items-center gap-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{row.label}</span>
                <span className="block truncate text-xs text-mist">to {row.to}</span>
              </span>
            </dt>
            <dd className="numeric shrink-0 whitespace-nowrap text-sm font-semibold text-ink">
              {money(row.amount)}
              <span className="font-normal tracking-normal text-mist"> / wk</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-2 flex items-center justify-between gap-4 rounded-tile bg-cream px-4 py-3">
        <span className="text-sm font-medium text-ink">Total weekly housing</span>
        <span className="numeric whitespace-nowrap text-sm font-semibold text-ink">
          {money(total)}
        </span>
      </div>
    </div>
  );
}
