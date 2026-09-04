"use client";

import { useState } from "react";
import { Check, Clock, Phone } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MovePaymentModal } from "@/components/modals/MovePaymentModal";
import { formatDayShort, moneyExact } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * What the renter sees when a payment fails.
 *
 * The tone is the design. Everything else in this app is built for someone
 * whose plan is going well; this is the one screen for someone whose week went
 * wrong, and the temptation is to shout at them in red. Red is the colour of
 * something broken, and a missed weekly payment on a $2,940 plan is not
 * broken — it is Tuesday. Amber, plain language, and the next step stated
 * before any request for money.
 *
 * The staged list matters more than it looks. Most lending products leave the
 * borrower guessing what happens next, and the guessing is what makes people
 * stop opening the app. Showing the whole sequence, dated, is the difference
 * between a demand and a conversation.
 */
export function MissedPaymentCard() {
  const { derived, catchUpPayment } = useLitchi();
  const toast = useToast();
  const [moveOpen, setMoveOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const missed = derived.missedPayment;
  if (!missed) return null;

  async function payNow() {
    setPaying(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    catchUpPayment();
    setPaying(false);
    toast("Payment received — you're back on track", "success");
  }

  return (
    <>
      <Card className="border-amber-warm/30 bg-amber-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-warm/15 text-amber-warm">
              <Clock className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight text-ink">
                {formatDayShort(missed.date)}&rsquo;s payment didn&rsquo;t go through
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-mist">
                <span className="numeric font-semibold text-ink">
                  {moneyExact(missed.amount)}
                </span>{" "}
                is outstanding. There&rsquo;s no late fee, nothing has been reported to any
                credit agency, and this doesn&rsquo;t affect your bond.
              </p>
            </div>
          </div>
        </div>

        {/* The whole sequence, dated. Nobody should have to ring to find out
            what happens next. */}
        <ol className="mt-6 space-y-3.5">
          {missed.stages.map((stage) => (
            <li key={stage.key} className="flex items-start gap-3">
              <span
                className={clsx(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  stage.done
                    ? "bg-amber-warm text-canvas"
                    : "border border-sand bg-paper text-clay"
                )}
                aria-hidden
              >
                {stage.done ? <Check className="h-3 w-3" /> : null}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-ink">
                  {stage.label}
                  <span className="numeric text-xs font-normal text-clay">
                    {formatDayShort(stage.date)}
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-mist">{stage.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button onClick={payNow} loading={paying}>
            {paying ? "Paying" : `Pay ${moneyExact(missed.amount)} now`}
          </Button>
          <Button variant="secondary" onClick={() => setMoveOpen(true)}>
            <Phone className="h-4 w-4" aria-hidden />
            Set up a plan instead
          </Button>
        </div>
      </Card>

      <MovePaymentModal open={moveOpen} onClose={() => setMoveOpen(false)} />
    </>
  );
}
