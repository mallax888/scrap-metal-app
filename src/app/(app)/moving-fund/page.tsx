"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";
import { ActivityRow } from "@/components/dashboard/ActivityFeed";
import { MovingFundModal } from "@/components/modals/MovingFundModal";
import { FundVerdict } from "@/components/fund/FundVerdict";
import { RoundUpDetail } from "@/components/fund/RoundUpDetail";
import { RoundUpMoment } from "@/components/fund/RoundUpMoment";
import { bond, movingFund, tenancy } from "@/lib/data";
import { formatDate, money } from "@/lib/format";
import { buildMoveCosts, costedTotal } from "@/lib/move";
import { useLitchi } from "@/lib/store";

/**
 * The Moving Fund, asking its question first.
 *
 * It had seven blocks: a balance, a top-up card, the notification, a
 * round-up card, a projection, three tiles of marketing copy, and the feed.
 * The answer to the only question that matters — will the money be there on
 * the day I move — was in the fifth of them, under a balance that looked like
 * good news on its own.
 *
 * So the question is the heading, the balance and the verdict sit under it,
 * the notification is the one thing that makes the habit stick, and the
 * machinery is behind two headings. The three "uses" tiles are gone: marketing
 * copy on a screen for somebody who already has the product.
 */

/* What the goal is derived from rather than a number someone chose: a move on
   this tenancy, less the bond Litchi finances. */
const nextMoveCost = costedTotal(buildMoveCosts(tenancy.rentWeekly, "medium"));

export default function MovingFundPage() {
  const { derived } = useLitchi();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const contributions = derived.activity.filter((item) => item.kind === "fund");

  return (
    <>
      <div className="mx-auto max-w-[620px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-clay">
          Moving Fund
        </p>
        <h1 className="mt-2.5 text-[32px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[38px]">
          Will it be there
          <br />
          when you move?
        </h1>

        <p className="numeric mt-8 text-[48px] font-semibold leading-none tracking-[-0.04em] text-ink sm:text-[56px]">
          {money(derived.fundSaved)}
        </p>
        <p className="mt-2.5 max-w-[42ch] text-sm leading-relaxed text-mist">
          of <strong className="numeric font-semibold text-ink">{money(movingFund.goal)}</strong>{" "}
          &mdash; the part of your next move Litchi doesn&rsquo;t finance. It costs about{" "}
          {money(nextMoveCost)}, and the {money(bond.amount)} bond is the bit we cover.
        </p>

        <Progress
          value={derived.fundProgress}
          tone="moss"
          size="lg"
          className="mt-5"
          label="Moving Fund progress"
        />

        <FundVerdict />

        <div className="mt-6">
          <RoundUpMoment />
        </div>

        <div className="mt-8">
          <Disclosure title="Where the money comes from">
            <RoundUpDetail />
          </Disclosure>

          <Disclosure title="Everything that has gone in">
            {contributions.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No contributions yet"
                description="Add your first amount and it'll show up here."
                action={
                  <Button size="sm" onClick={() => setOpen(true)}>
                    Add to Moving Fund
                  </Button>
                }
              />
            ) : (
              <>
                <p className="text-[12.5px] text-mist">
                  Opened {formatDate(movingFund.openedDate)}
                </p>
                <ul className="mt-2 divide-y divide-sand/60">
                  {contributions.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </ul>
              </>
            )}
          </Disclosure>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={() => setOpen(true)}>Add to Moving Fund</Button>
          <Button
            variant="secondary"
            onClick={() => toast("Withdrawals arrive in 1–2 business days", "info")}
          >
            Withdraw
          </Button>
        </div>

        <p className="mt-6 text-[12px] leading-relaxed text-clay">
          Held separately from your bond and from your Litchi repayments. Adding to it never
          changes what you owe, and you can take it out whenever you like.
        </p>
      </div>

      <MovingFundModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
