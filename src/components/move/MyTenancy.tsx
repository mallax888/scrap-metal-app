import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { MissedPaymentCard } from "@/components/dashboard/MissedPaymentCard";
import { NextStep } from "@/components/move/NextStep";
import { TenancyBoard } from "@/components/move/TenancyBoard";
import { withheldFromAgency } from "@/lib/verification";

/**
 * The centre of the app.
 *
 * For a long time the first screen behind the sidebar was a repayment
 * dashboard, which quietly said that the loan is what Litchi is. It isn't.
 * The loan is one line of a move, and on this tenancy it was a bit over half
 * of one — the rent in advance and the exit clean were paid outright and the
 * truck was booked and paid on the day.
 *
 * Three things, in the order a tenant needs them: what is expected of them
 * this week, the board of everything the tenancy consists of, and the one
 * argument that is a sentence rather than a figure. Arrears, when there are
 * any, come before all of it — the staged card says far more than the bar
 * could, so the bar stands down and lets it lead.
 */
export function MyTenancy() {
  return (
    <div className="space-y-5">
      <MissedPaymentCard />
      <NextStep />
      <TenancyBoard />

      {/* The privacy boundary, restated where the tenant can see it rather
          than only on the agent's screen. It stays in the open: it is the
          claim the product rests on, and a claim behind a click is a footnote. */}
      <Card>
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-clay" aria-hidden />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              What your agency was never told
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {withheldFromAgency.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[13px] leading-relaxed text-mist"
                >
                  <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-moss" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-mist">
              They confirmed four facts they already held.{" "}
              <Link
                href="/agents"
                className={clsx(
                  "tap font-medium text-bark underline underline-offset-4",
                  "transition-colors hover:text-ink"
                )}
              >
                See exactly what their screen looks like
              </Link>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
