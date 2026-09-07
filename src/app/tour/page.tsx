import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import { ButtonLink } from "@/components/ui/Button";
import { TOUR, stopHref } from "@/lib/tour";
import { HOME_HREF } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Take the tour",
  description:
    "Litchi in seven stops: the repayment plan, why rent stays separate, who holds the bond, what happens when a payment fails, and what a property manager sees.",
};

/**
 * The running order.
 *
 * Someone sent a link to a nine-screen prototype opens one screen and leaves.
 * This page exists so there is a front door with a sequence behind it — and so
 * the tour is a thing you can point at ("start here") rather than a mode you
 * have to discover.
 */
export default function TourPage() {
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
            Litchi in seven stops
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-mist">
            The demo behind this is a full working app for one tenancy. The tour walks you through
            it in the order the argument makes sense, a sentence at a time, and you can leave at
            any point and keep clicking around.
          </p>
          <div className="mt-8">
            <ButtonLink href={stopHref(0)} size="lg">
              Start the tour
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>

        <ol className="mt-12 border-t border-sand/70 sm:mt-16">
          {TOUR.map((stop, index) => (
            <li key={stop.href} className="border-b border-sand/70">
              <Link
                href={stopHref(index)}
                className="tap group flex items-start gap-4 py-5 transition-colors hover:bg-cream/50 sm:gap-5"
              >
                <span
                  className="numeric mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream text-[12px] font-bold text-bark"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">{stop.title}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-mist">
                    {stop.look}
                  </span>
                </span>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-clay transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-[13px] leading-relaxed text-clay">
          Every figure in the demo is sample data for a fictional tenancy. Nothing you do in it
          leaves your browser, and there is nothing to sign up for.
        </p>
      </main>
    </div>
  );
}
