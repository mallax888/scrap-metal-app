"use client";

import { useState } from "react";
import { Banknote, Check, CreditCard, Plus } from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { paymentMethods } from "@/lib/data";
import { useLitchi } from "@/lib/store";

export function ManagePaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setPaymentMethod } = useLitchi();
  const toast = useToast();
  const [selected, setSelected] = useState(state.activePaymentMethodId);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setPaymentMethod(selected);
    setSaving(false);
    onClose();
    toast("Payment method updated");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage payment"
      description="Choose where your weekly Litchi payment is taken from."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {saving ? "Saving" : "Save changes"}
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="sr-only">Payment method</legend>
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const active = selected === method.id;
            const Icon = method.kind === "card" ? CreditCard : Banknote;
            return (
              <label
                key={method.id}
                className={clsx(
                  "flex cursor-pointer items-center gap-4 rounded-tile border p-4 transition-colors",
                  active ? "border-bark bg-cream/60" : "border-sand bg-paper hover:bg-cream/30"
                )}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={method.id}
                  checked={active}
                  onChange={() => setSelected(method.id)}
                  className="sr-only"
                />
                <span
                  className={clsx(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    active ? "bg-brand text-onbrand" : "bg-cream text-bark"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {method.label} •••• {method.last4}
                  </span>
                  <span className="block text-xs text-mist">
                    {method.kind === "card" ? `Expires ${method.expiry}` : "Direct debit"}
                  </span>
                </span>
                {active ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-onbrand">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        disabled
        className="mt-3 flex w-full items-center gap-3 rounded-tile border border-dashed border-sand px-4 py-3.5 text-sm text-mist"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream text-clay">
          <Plus className="h-4 w-4" aria-hidden />
        </span>
        Add a new payment method
        <span className="ml-auto text-xs">Coming soon</span>
      </button>

      <p className="mt-5 text-xs leading-relaxed text-mist">
        Payments are taken every Friday. If a payment is going to be tight, change it here
        before the due date and it won{"’"}t affect your Litchi Score.
      </p>
    </Modal>
  );
}
