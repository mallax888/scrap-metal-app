"use client";

import { CheckCircle2, Landmark } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { bond, plan, tenancy } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export function BondDetailsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rows: { label: string; value: string }[] = [
    { label: "Bond ID", value: bond.bondId },
    { label: "Bond amount", value: money(bond.amount) },
    { label: "Equivalent to", value: `${bond.weeksOfRent} weeks' rent` },
    { label: "Property", value: tenancy.property },
    { label: "Suburb", value: tenancy.suburb },
    { label: "Tenancy start", value: formatDate(tenancy.startDate) },
    { label: "Lodged", value: formatDate(bond.lodgedDate) },
    { label: "Held by", value: bond.lodgedWith },
    { label: "Financed by", value: plan.partner },
    { label: "Agreement", value: plan.agreementRef },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bond details"
      description="Everything on record for your bond."
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="flex items-center gap-3 rounded-tile bg-moss-soft px-4 py-3.5 text-sm text-moss">
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
        <span className="font-medium">Lodged with Tenancy Services on {formatDate(bond.lodgedDate)}</span>
      </div>

      <dl className="mt-5 divide-y divide-sand/80 overflow-hidden rounded-tile border border-sand">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-6 bg-paper px-4 py-3"
          >
            <dt className="text-sm text-mist">{row.label}</dt>
            <dd className="text-right text-sm font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex gap-3 rounded-tile border border-sand bg-canvas p-4">
        <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-clay" aria-hidden />
        <p className="text-xs leading-relaxed text-mist">
          <span className="font-semibold text-ink">Litchi does not hold your bond.</span> Your
          statutory bond is held by Tenancy Services for the whole tenancy, exactly as it would
          be if you had paid it yourself. Litchi financed the amount so you didn{"’"}t have to pay it
          up front, and you repay Litchi separately.
        </p>
      </div>
    </Modal>
  );
}
