"use client";

import { useState } from "react";
import { CalendarDays, Check } from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { plan } from "@/lib/data";
import { addDays, formatDayDate, moneyExact } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * Move a payment before it is due.
 *
 * This is the cheapest risk control the product has. A renter who tells you on
 * Wednesday that Friday is going to be tight costs almost nothing to handle; the
 * same renter who says nothing costs a failed direct debit, a retry, a phone
 * call, and a relationship. So the flow is deliberately frictionless — no fee,
 * no points, no score consequence, no reason given — because anything that makes
 * someone hesitate to use it pushes them into the expensive path instead.
 *
 * The 21-day cap is not a punishment, it is the honest edge of what can be
 * absorbed without extending the term.
 */
const OPTIONS = [7, 14, 21] as const;

export function MovePaymentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { movePayment } = useLitchi();
  const toast = useToast();
  const [days, setDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);

  const newDate = addDays(plan.nextPaymentDate, days);

  async function confirm() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    movePayment(newDate);
    setSaving(false);
    onClose();
    toast(`Payment moved to ${formatDayDate(newDate)}`, "success");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Move this payment"
      description="Tell us before it's due and we'll move it. No fee, and it won't touch your Litchi Score."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={confirm} loading={saving}>
            {saving ? "Moving" : "Move payment"}
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
          Move it by
        </legend>
        <div className="mt-3 grid gap-2">
          {OPTIONS.map((option) => {
            const selected = days === option;
            return (
              <label
                key={option}
                className={clsx(
                  "tap flex cursor-pointer items-center justify-between gap-3 rounded-tile border px-4 py-3 transition-colors",
                  selected
                    ? "border-bark/40 bg-cream"
                    : "border-sand bg-paper hover:bg-cream/50"
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="move-payment"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setDays(option)}
                  />
                  <span
                    className={clsx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-bark bg-bark text-onbrand" : "border-sand"
                    )}
                    aria-hidden
                  >
                    {selected ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className="text-sm font-medium text-ink">{option} days</span>
                </span>
                <span className="numeric text-[13px] text-mist">
                  {formatDayDate(addDays(plan.nextPaymentDate, option))}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex items-start gap-3 rounded-tile bg-moss-soft px-4 py-3.5">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden />
        <p className="text-[13px] leading-relaxed text-moss">
          <span className="numeric font-semibold">{moneyExact(plan.weeklyPayment)}</span> comes
          out on {formatDayDate(newDate)}{" "}
          instead. Your other payments don&rsquo;t change, and your payoff date stays where it
          is.
        </p>
      </div>
    </Modal>
  );
}
