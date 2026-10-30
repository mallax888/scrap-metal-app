"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import { HOME_HREF } from "@/lib/nav";
import { TOUR_PARAM } from "@/lib/tour";
import { useLitchi } from "@/lib/store";

/**
 * The door to the signed-in account.
 *
 * Nobody arrives here as a client. In the real product these screens exist
 * only after an application has been approved and an agreement signed, and a
 * prototype that drops a stranger straight into a funded account is quietly
 * lying about the order — it shows the ending and calls it the product.
 *
 * So a first visit lands on the order instead: what has to happen before this
 * screen exists, and where that starts. It is a door rather than a lock. The
 * whole point of a prototype is that someone can look at it, so the way past
 * is on the same screen, said plainly, and taken once it stays taken.
 *
 * Three things open it without asking:
 *
 *   - finishing set-up, which is where a real client crosses this line;
 *   - the saved move plan's "See a funded account", which already explains
 *     that it is showing a different tenant's account once a lender has said
 *     yes — asking again right after would be pedantry;
 *   - the tour, which is a narrated walkthrough of these same screens and
 *     makes its own introductions at every stop.
 */
/* Hydration, asked as a question React will answer without a re-render loop:
   the server snapshot is false, the client snapshot is true, and nothing ever
   fires a change in between. */
const NEVER_CHANGES = () => () => {};
const onClient = () => true;
const onServer = () => false;

function Gate({ children }: { children: React.ReactNode }) {
  const { state, openAccount } = useLitchi();
  const params = useSearchParams();

  /*
   * Decide only once there is something to decide from.
   *
   * The store's server snapshot has nobody signed in, because the server
   * cannot see localStorage — so for the first paint a returning visitor
   * looks new, and the gate would flash up in front of someone who went
   * through it days ago.
   *
   * This waits exactly one paint, not the store's 550ms `ready` flag. That
   * flag exists so individual screens can show skeletons while their own
   * figures settle; hanging a whole-app gate off it left every signed-in
   * screen blank for half a second, which is a worse thing to show than
   * either answer.
   */
  const decided = useSyncExternalStore(NEVER_CHANGES, onClient, onServer);
  if (!decided) return null;

  if (state.accountOpened || params.get(TOUR_PARAM) !== null) return <>{children}</>;

  const STEPS = [
    { label: "Cost the move", detail: "From your tenancy agreement, not from a number you pick." },
    { label: "Be approved", detail: "An affordability check. You see every test it runs." },
    { label: "Sign the agreement", detail: "Every term, before anything is owed." },
    { label: "The bond is paid", detail: "And this account exists." },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href={HOME_HREF} className="tap flex items-center gap-3">
          <PiggyBadge />
          <Wordmark className="text-[17px]" />
        </Link>
        <Link
          href={HOME_HREF}
          className="tap flex items-center gap-1.5 text-[13px] font-medium text-mist transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <div className="pt-6 sm:pt-12">
          <DemoBadge />
          <h1 className="mt-6 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[44px]">
            This part comes last
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-mist">
            The account behind this link belongs to someone whose bond Litchi has already paid.
            You reach it by being approved and signing &mdash; four steps, and you can walk all of
            them here.
          </p>
        </div>

        <Card className="mt-9">
          <ol className="space-y-5">
            {STEPS.map((step, index) => (
              <li key={step.label} className="flex items-start gap-4">
                <span
                  className="numeric mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sand text-[13px] font-semibold text-bark"
                  aria-hidden
                >
                  {index === STEPS.length - 1 ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">{step.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-mist">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-3 border-t border-sand/70 pt-6 sm:flex-row">
            <ButtonLink href="/cost-my-move" size="lg">
              Start at the beginning
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/cost-my-move" size="lg" variant="secondary">
              Just see what it would cost
            </ButtonLink>
          </div>
        </Card>

        {/*
         * The way past, said plainly rather than hidden.
         *
         * Most people opening this link are looking at the product, not
         * applying for a bond, and making them walk four steps to see a
         * dashboard would lose them. The order is the point; enforcing it
         * is not.
         */}
        <div className="mt-6 flex flex-col items-start gap-3 rounded-card border border-sand/70 bg-paper px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[52ch] text-sm leading-relaxed text-mist">
            Here to look at the product rather than to move house? Go straight in &mdash; it is a
            sample account either way, and you will not be asked again.
          </p>
          <Button variant="secondary" onClick={openAccount} className="shrink-0">
            Skip ahead
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </main>
    </div>
  );
}

export function AccountGate({ children }: { children: React.ReactNode }) {
  // useSearchParams opts the tree into client rendering; the boundary keeps
  // that scoped to the gate rather than every screen behind it.
  return (
    <Suspense fallback={null}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
