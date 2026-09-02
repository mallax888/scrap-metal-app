"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";
import { movingFund } from "@/lib/data";
import { money, percent } from "@/lib/format";
import { useLitchi } from "@/lib/store";

const QUICK_AMOUNTS = [20, 50, 100];

export function MovingFundModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { derived, addToMovingFund } = useLitchi();
  const toast = useToast();
  const [amount, setAmount] = useState("50");
  const [saving, setSaving] = useState(false);

  const parsed = Number.parseFloat(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;
  const projected = valid ? derived.fundSaved + parsed : derived.fundSaved;
  const projectedProgress = Math.min(1, projected / movingFund.goal);

  async function submit() {
    if (!valid) return;
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    addToMovingFund(parsed);
    setSaving(false);
    setAmount("50");
    onClose();
    toast(`${money(parsed)} added to your Moving Fund`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to Moving Fund"
      description="Put money aside for your next move — deposit, movers, the first week of everything."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid} loading={saving}>
            {saving ? "Adding" : `Add ${valid ? money(parsed) : "amount"}`}
          </Button>
        </>
      }
    >
      <label htmlFor="fund-amount" className="text-sm font-medium text-ink">
        Amount
      </label>
      <div className="mt-2 flex items-center rounded-tile border border-sand bg-canvas px-4 focus-within:border-clay">
        <span className="numeric text-2xl font-semibold text-mist">$</span>
        <input
          id="fund-amount"
          type="number"
          inputMode="decimal"
          min="1"
          step="1"
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
      </div>

      <div className="mt-6 rounded-tile bg-cream/70 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            New balance
          </p>
          <p className="numeric text-sm font-semibold text-ink">
            {money(projected)} <span className="font-normal text-mist">of {money(movingFund.goal)}</span>
          </p>
        </div>
        <Progress value={projectedProgress} className="mt-3" label="Moving Fund progress" />
        <p className="mt-2.5 text-xs text-mist">
          {percent(projectedProgress)} of the way toward your next move.
        </p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-mist">
        Your Moving Fund is separate from your bond. It{"’"}s yours — withdraw it any time.
      </p>
    </Modal>
  );
}
