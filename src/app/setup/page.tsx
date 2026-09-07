import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import { SetupFlow } from "@/components/setup/SetupFlow";
import { HOME_HREF } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Set up your plan",
  description:
    "The step between approval and a working account: identity verification, a bank connection, the full agreement disclosed before signing, and the direct debit authority.",
};

/**
 * The missing middle.
 *
 * Sits outside the (app) group with /apply, because someone here has been
 * approved but has not agreed to anything yet — there is no account to sign
 * into and nothing to see behind a sidebar.
 */
export default function SetupPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href={HOME_HREF} className="tap flex items-center gap-3">
          <PiggyBadge />
          <Wordmark className="text-[17px]" />
        </Link>
        <Link
          href="/apply"
          className="tap flex items-center gap-1.5 text-[13px] font-medium text-mist transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to the check
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <div className="pt-6 sm:pt-12">
          <DemoBadge />
          <h1 className="mt-6 text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[44px]">
            Let&rsquo;s get your bond paid
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-mist">
            Four steps, about five minutes, and then the money moves. You&rsquo;ll see every term
            before you agree to anything &mdash; and nothing you type here leaves your browser.
          </p>
        </div>

        <div className="mt-10">
          {/* The flow reads the quote off the URL, which opts it into client
              rendering; the boundary keeps that to the flow itself. */}
          <Suspense fallback={null}>
            <SetupFlow />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
