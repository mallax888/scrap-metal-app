"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MovePaymentModal } from "@/components/modals/MovePaymentModal";
import { ExtraPaymentModal } from "@/components/modals/ExtraPaymentModal";
import { TODAY, tenancy } from "@/lib/data";
import { daysBetween, formatDate, formatDayDate, moneyExact } from "@/lib/format";
import { useActivePaymentMethod, useLitchi } from "@/lib/store";

/**
 * The one line that says what happens next.
 *
 * Every screen in this app answers a question the tenant asked. This answers
 * the one they did not have to ask, which is the whole reason a home screen
 * exists: is anything expected of me this week, and if so what. It sits above
 * the board because a board is for looking things up and this is for being
 * told.
 *
 * It is state-aware or it is pointless. A bar that says the same sentence
 * every week is a header, and people stop reading headers by about the third
 * visit — so each state below has its own tone, its own sentence and its own
 * action, and the quiet state is allowed to say that nothing needs doing.
 *
 * Arrears are deliberately not handled here. A failed payment deserves the
 * staged explanation in MissedPaymentCard rather than one line and a button,
 * so the home screen shows that card instead and this stands down.
 */

/** Inside this many days, the next payment is news rather than reference. */
const SOON_DAYS = 10;
/** Far enough out that costing the next move is still premature. */
const MOVE_HORIZON_WEEKS = 16;

type Tone = "moss" | "amber" | "bark";

const DOT: Record<Tone, string> = {
  moss: "bg-moss",
  amber: "bg-amber-warm",
  bark: "bg-bark",
};

export function NextStep() {
  const { derived } = useLitchi();
  const method = useActivePaymentMethod();
  const [moveOpen, setMoveOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);

  // Arrears have their own card, which says far more than a bar can.
  if (derived.missedPayment) return null;

  const next = derived.nextPayment;
  const daysToPayment = next ? daysBetween(TODAY, next.date) : null;
  const weeksToTermEnd = Math.round(daysBetween(TODAY, tenancy.endDate) / 7);

  let tone: Tone = "moss";
  let eyebrow = "Next, and nothing else needs you";
  let line = "Your plan is paid off — nothing more is due.";
  let note: React.ReactNode = null;
  let actions: React.ReactNode = (
    <ButtonLink href="/payments" variant="onHero" size="md" className="grow sm:grow-0">
      See your payments
      <ArrowRight className="h-4 w-4" aria-hidden />
    </ButtonLink>
  );

  if (next && daysToPayment !== null && daysToPayment <= SOON_DAYS) {
    tone = "amber";
    eyebrow = "Coming up";
    line = `${moneyExact(next.amount)} comes out on ${formatDayDate(next.date)}`;
    note = (
      <>
        Going to be tight? Moving a payment is free, takes a second, and does nothing to your
        Renter Score. Your rent is separate and goes to {tenancy.landlordAgency} as usual.
      </>
    );
    actions = (
      <>
        <Button variant="onHero" className="grow sm:grow-0" onClick={() => setMoveOpen(true)}>
          Move this payment
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="onHeroGhost" className="grow sm:grow-0" onClick={() => setExtraOpen(true)}>
          Pay early instead
        </Button>
      </>
    );
  } else if (weeksToTermEnd <= MOVE_HORIZON_WEEKS && weeksToTermEnd > 0) {
    tone = "bark";
    eyebrow = "Worth starting";
    line = `Your fixed term ends in ${weeksToTermEnd} weeks`;
    note = (
      <>
        Cost the next move before you start looking. Upload the new agreement and every line
        rebuilds off the new rent.
      </>
    );
    actions = (
      <>
        <ButtonLink href="/cost-my-move" variant="onHero" className="grow sm:grow-0">
          Cost my move
          <ArrowRight className="h-4 w-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/payments" variant="onHeroGhost" className="grow sm:grow-0">
          Not yet
        </ButtonLink>
      </>
    );
  } else if (next) {
    line = `${moneyExact(next.amount)} comes out on ${formatDayDate(next.date)}`;
    note = (
      <>
        From {method.brand} &bull;&bull;&bull;&bull; {method.last4}. Your rent is separate and goes
        to {tenancy.landlordAgency} as usual, as it always has.
      </>
    );
  } else {
    note = <>Your tenancy runs to {formatDate(tenancy.endDate)}.</>;
  }

  return (
    <>
      <section className="flex flex-wrap items-center gap-x-6 gap-y-5 rounded-card bg-hero px-5 py-5 text-onbrand shadow-card sm:px-6">
        <div className="min-w-0 flex-1 basis-[22rem]">
          {/* The status dot rides with the eyebrow rather than sitting in the
              row beside it, where wrapping on a phone stranded it on a line of
              its own with nothing to label. */}
          <p className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-onbrand/60">
            <span className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", DOT[tone])} aria-hidden />
            {eyebrow}
          </p>
          <h2 className="numeric mt-1.5 text-[17px] font-semibold tracking-[-0.01em]">{line}</h2>
          {note ? (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-onbrand/70">{note}</p>
          ) : null}
        </div>
        {/* Full width on a phone, where two pill buttons do not fit beside each
            other at their natural size and the second one slid off the edge. */}
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2.5 sm:w-auto">
          {actions}
        </div>
      </section>

      <MovePaymentModal open={moveOpen} onClose={() => setMoveOpen(false)} />
      <ExtraPaymentModal open={extraOpen} onClose={() => setExtraOpen(false)} />
    </>
  );
}
