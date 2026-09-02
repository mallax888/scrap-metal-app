"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { plan } from "@/lib/data";
import { formatDate, money, moneyExact } from "@/lib/format";
import { projectPlan, useLitchi } from "@/lib/store";

const QUICK_AMOUNTS = [53.85, 100, 250];

export function ExtraPaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { derived, makeExtraPayment } = useLitchi();
  const toast = useToast();
  const [amount, setAmount] = useState("100");
  const [submitting, setSubmitting] = useState(false);

  const parsed = Number.parseFloat(amount);
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed <= derived.balance;

  const preview = useMemo(
    () => projectPlan(derived.totalRepaid + (valid ? parsed : 0)),
    [derived.totalRepaid, parsed, valid]
  );

  const weeksCut = derived.weeksRemaining - preview.weeksRemaining;

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    // Stand in for the payment call to Litchi's partner.
    await new Promise((resolve) => setTimeout(resolve, 850));
    makeExtraPayment(parsed);
    setSubmitting(false);
    setAmount("100");
    onClose();
    toast(`${money(parsed)} paid towards your bond`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Make extra payment"
      description="Pay any amount off your bond balance. No fees, no penalty for paying early."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid} loading={submitting}>
            {submitting ? "Processing" : `Pay ${valid ? money(parsed) : "amount"}`}
          </Button>
        </>
      }
    >
      <label htmlFor="extra-amount" className="text-sm font-medium text-ink">
        Amount
      </label>
      <div className="mt-2 flex items-center rounded-tile border border-sand bg-canvas px-4 focus-within:border-clay">
        <span className="numeric text-2xl font-semibold text-mist">$</span>
        <input
          id="extra-amount"
          type="number"
          inputMode="decimal"
          min="1"
          step="0.01"
          max={derived.balance}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="numeric w-full bg-transparent px-2 py-3.5 text-2xl font-semibold text-ink outline-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(String(value))}
            className="numeric rounded-full border border-sand bg-paper px-3.5 py-1.5 text-[13px] font-medium text-bark transition-colors hover:bg-cream"
          >
            {money(value)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAmount(derived.balance.toFixed(2))}
          className="rounded-full border border-sand bg-paper px-3.5 py-1.5 text-[13px] font-medium text-bark transition-colors hover:bg-cream"
        >
          Pay off balance
        </button>
      </div>

      {!valid && amount.trim() !== "" ? (
        <p className="mt-3 text-sm text-amber-warm">
          Enter an amount between $1 and your remaining balance of{" "}
          {moneyExact(derived.balance)}.
        </p>
      ) : null}

      <div className="mt-6 rounded-tile bg-cream/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
          After this payment
        </p>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-mist">Balance</dt>
            <dd className="numeric flex items-center gap-2 font-semibold text-ink">
              <span className="text-mist line-through">{moneyExact(derived.balance)}</span>
              <ArrowRight className="h-3.5 w-3.5 text-clay" aria-hidden />
              {moneyExact(preview.balance)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-mist">Weeks remaining</dt>
            <dd className="numeric font-semibold text-ink">
              {preview.weeksRemaining}
              {weeksCut > 0 ? (
                <span className="ml-2 text-[13px] font-medium text-moss">
                  −{weeksCut} {weeksCut === 1 ? "week" : "weeks"}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-mist">Payoff date</dt>
            <dd className="font-semibold text-ink">
              {preview.balance <= 0 ? "Paid in full" : formatDate(preview.payoffDate)}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-mist">
        Extra payments come off your balance immediately. Your weekly payment stays at{" "}
        {money(plan.weeklyPayment)} — you simply finish sooner.
      </p>
    </Modal>
  );
}
