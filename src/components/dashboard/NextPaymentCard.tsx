"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ManagePaymentModal } from "@/components/modals/ManagePaymentModal";
import { formatDayDate, formatDayShort, moneyExact } from "@/lib/format";
import { useActivePaymentMethod, useLitchi } from "@/lib/store";

export function NextPaymentCard() {
  const { derived, ready } = useLitchi();
  const method = useActivePaymentMethod();
  const [open, setOpen] = useState(false);
  const next = derived.nextPayment;
  const after = derived.schedule.slice(1, 4);

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardTitle>Next payment</CardTitle>

        {ready ? (
          <p className="numeric mt-4 text-[38px] font-semibold leading-none text-ink">
            {next ? moneyExact(next.amount) : "—"}
          </p>
        ) : (
          <Skeleton className="mt-4 h-10 w-32" />
        )}

        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-bark">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <dt className="text-mist">Due</dt>
              <dd className="font-medium text-ink">
                {next ? formatDayDate(next.date) : "No payment scheduled"}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-bark">
              <CreditCard className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <dt className="text-mist">Payment method</dt>
              <dd className="font-medium text-ink">
                {method.label} •••• {method.last4}
              </dd>
            </div>
          </div>
        </dl>

        {after.length > 0 ? (
          <div className="mt-6 rounded-tile border border-sand bg-canvas px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
              After that
            </p>
            <ul className="mt-2 space-y-1.5">
              {after.map((payment) => (
                <li
                  key={payment.date}
                  className="flex items-baseline justify-between gap-4 text-sm"
                >
                  <span className="text-mist">{formatDayShort(payment.date)}</span>
                  <span className="numeric font-medium text-ink">
                    {moneyExact(payment.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2 rounded-tile bg-moss-soft px-3.5 py-2.5 text-sm font-medium text-moss">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Payment method active
        </div>

        <div className="mt-auto pt-5">
          <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
            Manage payment
          </Button>
        </div>
      </Card>

      <ManagePaymentModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
