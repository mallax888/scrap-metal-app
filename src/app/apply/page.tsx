import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import { HOME_HREF } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Apply",
  description:
    "See whether Litchi can finance your bond. An affordability check, not a credit score, with the decision and its workings shown in full.",
};

/**
 * Sits outside the (app) group on purpose: someone applying is not a customer
 * yet, so there is no sidebar, no account, and nothing to sign in to.
 */
export default function ApplyPage() {
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
            See if we can cover your bond
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-mist">
            Three questions, an answer straight away, and the workings shown in full. Nothing you
            type here is sent anywhere &mdash; the check runs in your browser.
          </p>
        </div>

        <div className="mt-10">
          <ApplyFlow />
        </div>
      </main>
    </div>
  );
}
