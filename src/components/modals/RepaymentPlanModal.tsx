"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { plan } from "@/lib/data";
import { formatDate, formatDayShort, money, moneyExact } from "@/lib/format";
import { useLitchi } from "@/lib/store";

const PREVIEW_ROWS = 5;

export function RepaymentPlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { derived } = useLitchi();
  const { schedule } = derived;

  const upcoming = schedule.slice(0, PREVIEW_ROWS);
  const final = schedule.length > PREVIEW_ROWS ? schedule[schedule.length - 1] : null;
  const hidden = Math.max(0, schedule.length - PREVIEW_ROWS - (final ? 1 : 0));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your repayment plan"
      description={`${plan.partner} · Agreement ${plan.agreementRef}`}
      size="lg"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-tile border border-sand bg-sand sm:grid-cols-4">
        {[
          { label: "Bond financed", value: money(plan.principal) },
          { label: "Weekly payment", value: money(plan.weeklyPayment) },
          { label: "Repaid so far", value: moneyExact(derived.totalRepaid) },
          { label: "Balance", value: moneyExact(derived.balance) },
        ].map((item) => (
          <div key={item.label} className="bg-paper px-4 py-3.5">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
              {item.label}
            </dt>
            <dd className="numeric mt-1.5 text-lg font-semibold text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-mist">
        <Badge tone="cream">{derived.weeksRemaining} payments left</Badge>
        <Badge tone="moss">
          {plan.interestRate === 0 ? "0% interest" : `${plan.interestRate}% interest`}
        </Badge>
        <Badge tone="outline">No early repayment fee</Badge>
      </div>

      <h3 className="mt-7 text-sm font-semibold text-ink">Upcoming payments</h3>
      <ul className="mt-3 divide-y divide-sand/80 overflow-hidden rounded-tile border border-sand">
        {upcoming.map((payment, index) => (
          <li
            key={payment.date}
            className="flex items-center justify-between gap-4 bg-paper px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span className="numeric flex h-7 w-7 items-center justify-center rounded-full bg-cream text-[11px] font-semibold text-bark">
                {index + 1}
              </span>
              <span className="text-sm text-ink">{formatDayShort(payment.date)}</span>
            </span>
            <span className="numeric text-sm font-semibold text-ink">
              {moneyExact(payment.amount)}
            </span>
          </li>
        ))}

        {hidden > 0 ? (
          <li className="bg-canvas px-4 py-2.5 text-center text-xs text-mist">
            + {hidden} more weekly payments of {moneyExact(plan.weeklyPayment)}
          </li>
        ) : null}

        {final ? (
          <li className="flex items-center justify-between gap-4 bg-cream/60 px-4 py-3">
            <span className="flex items-center gap-3">
              <span className="numeric flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-onbrand">
                {schedule.length}
              </span>
              <span className="text-sm font-medium text-ink">
                Final payment · {formatDate(final.date)}
              </span>
            </span>
            <span className="numeric text-sm font-semibold text-ink">
              {moneyExact(final.amount)}
            </span>
          </li>
        ) : null}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-mist">
        The final payment clears any rounding left on the balance. Payments are taken every
        Friday. Your rent is paid separately to {"“"}Example Property Co.{"”"} and is
        not part of this plan.
      </p>
    </Modal>
  );
}
