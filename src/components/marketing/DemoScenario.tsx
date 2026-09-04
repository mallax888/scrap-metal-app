"use client";

import { FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { plan } from "@/lib/data";
import { formatDayShort } from "@/lib/format";
import { useLitchi } from "@/lib/store";

/**
 * A demo control, not a product feature.
 *
 * Every other screen shows a plan that is going well, which means the one flow
 * that answers "what happens when someone can't pay" would never be seen by
 * anyone being shown this. Rather than leave it undiscoverable, this switches
 * the scenario on directly.
 *
 * Marked plainly as a demo device and confined to this page — a real account
 * would obviously never let someone declare their own payment failed.
 */
export function DemoScenario() {
  const { derived, setMissedPayment } = useLitchi();
  const missed = derived.missedPayment !== null;

  return (
    <Card tone="cream" className="border-dashed border-clay/40">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas text-clay"
            aria-hidden
          >
            <FlaskConical className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Demo control</h2>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-mist">
              {missed ? (
                <>
                  You&rsquo;re looking at the missed-payment scenario. The alert appears here and
                  on your overview.
                </>
              ) : (
                <>
                  This account is up to date, so the missed-payment flow is hidden. Switch it on
                  to see what a renter sees when {formatDayShort(plan.nextPaymentDate)}&rsquo;s
                  payment fails.
                </>
              )}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMissedPayment(missed ? null : plan.nextPaymentDate)}
        >
          {missed ? "Back to on track" : "Show a missed payment"}
        </Button>
      </div>
    </Card>
  );
}
