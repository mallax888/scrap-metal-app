import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import { MoveFlow } from "@/components/move/MoveFlow";
import { HOME_HREF } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Cost my move",
  description:
    "Upload your tenancy agreement, have your agency confirm it, and see what the move costs and what it would repay. An estimate, not an offer.",
};

/**
 * The front of the Litchi Move journey.
 *
 * Outside the (app) group, like /apply and /setup: someone here has a tenancy
 * but not an account. The first question is deliberately about the move rather
 * than about money — the amount is the last thing decided, and it is capped at
 * what the move actually costs.
 */
export default function MovePage() {
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
          Front page
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <div className="pt-6 sm:pt-12">
          <DemoBadge />
        </div>

        {/* The heading belongs to the flow, not the page: it has to stop
            saying "let's work out the move" once the move is worked out. */}
        <MoveFlow />
      </main>
    </div>
  );
}
