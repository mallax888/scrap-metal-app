"use client";

import { useState } from "react";
import { Check, Landmark } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BondDetailsModal } from "@/components/modals/BondDetailsModal";
import { bond, tenancy } from "@/lib/data";
import { formatDate, money } from "@/lib/format";

export function BondLodgementCard() {
  const [open, setOpen] = useState(false);

  const rows = [
    { label: "Bond amount", value: money(bond.amount) },
    { label: "Property", value: tenancy.property },
    { label: "Tenancy start", value: formatDate(tenancy.startDate) },
  ];

  return (
    <>
      <Card className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Your bond</CardTitle>
            <p className="numeric mt-1 text-sm text-mist">Bond ID: {bond.bondId}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
            <Landmark className="h-[18px] w-[18px]" aria-hidden />
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2.5 rounded-tile bg-moss-soft px-3.5 py-3 text-sm font-medium text-moss">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moss text-moss-soft">
            <Check className="h-3 w-3" aria-hidden />
          </span>
          Lodged with {bond.lodgedWith}
        </div>

        <dl className="mt-5 divide-y divide-sand/70 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-mist">{row.label}</dt>
              <dd className="text-right font-medium text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 rounded-tile border border-sand bg-canvas px-3.5 py-3 text-xs leading-relaxed text-mist">
          <span className="font-semibold text-ink">Litchi doesn{"’"}t hold your bond.</span> It sits
          with Tenancy Services for the whole tenancy. Litchi only holds the finance agreement you
          repay each week.
        </p>

        <Button variant="secondary" className="mt-5 w-full" onClick={() => setOpen(true)}>
          View bond details
        </Button>
      </Card>

      <BondDetailsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
