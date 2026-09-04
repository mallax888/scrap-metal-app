"use client";

import { useState } from "react";
import { CalendarClock, CalendarDays, CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ManagePaymentModal } from "@/components/modals/ManagePaymentModal";
import { MovePaymentModal } from "@/components/modals/MovePaymentModal";
import { formatDayDate, formatDayShort, moneyExact } from "@/lib/format";
import { useActivePaymentMethod, useLitchi } from "@/lib/store";

export function NextPaymentCard() {
  const { derived, ready } = useLitchi();
  const method = useActivePaymentMethod();
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const next = derived.nextPayment;
  const after = derived.schedule.slice(1, 4);

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardTitle>Next payment</CardTitle>

        {ready ? (
          <p className="numeric mt-4 text-[38px] font-semibold tracking-[-0.02em] leading-none text-ink">
            {next ? moneyExact(next.amount) : "—"}
          </p>
        ) : (
          <Skeleton className="mt-4 h-10 w-32" />
        )}

        <dl className="mt-6 space-y-4 text-sm">
          {/*
            The icon sits inside the <dt> rather than beside it. A <div> inside a
            <dl> may hold only <dt>/<dd>, and the pair has to stay a direct child
            of one — bracketing them in a second div so they could sit next to the
            icon broke that, and the label stopped being related to its value for
            anyone using a screen reader. The dd's left padding (32px icon + 12px
            gap) keeps the value aligned under the label, so it draws the same.
          */}
          <div>
            <dt className="flex items-center gap-3 text-mist">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-bark">
                <CalendarDays className="h-4 w-4" aria-hidden />
              </span>
              Due
            </dt>
            <dd className="mt-1 pl-11 font-medium text-ink">
              {next ? formatDayDate(next.date) : "No payment scheduled"}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-3 text-mist">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-bark">
                <CreditCard className="h-4 w-4" aria-hidden />
              </span>
              Payment method
            </dt>
            <dd className="mt-1 pl-11 font-medium text-ink">
              {method.label} •••• {method.last4}
            </dd>
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

        {/* Two actions, and the order is deliberate. Moving a payment is the
            thing a renter in trouble needs and the thing Litchi most wants them
            to do, so it is not buried inside "Manage payment". */}
        <div className="mt-auto flex flex-col gap-2.5 pt-5">
          <Button variant="secondary" className="w-full" onClick={() => setMoveOpen(true)}>
            <CalendarClock className="h-4 w-4" aria-hidden />
            Move this payment
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setOpen(true)}>
            Manage payment
          </Button>
        </div>
      </Card>

      <ManagePaymentModal open={open} onClose={() => setOpen(false)} />
      <MovePaymentModal open={moveOpen} onClose={() => setMoveOpen(false)} />
    </>
  );
}
