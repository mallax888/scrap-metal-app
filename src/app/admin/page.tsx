import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { DemoTag } from "@/components/marketing/DemoTag";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { defaultPartner } from "@/lib/move";
import { HOME_HREF } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Litchi admin",
  description:
    "The internal view: application funnel, acquisition by channel, and what Litchi earns from the finance partner at a given set of commercial terms.",
  robots: { index: false, follow: false },
};

/**
 * Litchi's own view of the platform.
 *
 * Not a customer screen and not a sales screen — the one place the business
 * model is arithmetic rather than a claim. It is in the prototype because the
 * first question any finance partner asks is what Litchi expects to be paid,
 * and the second is whether they can afford it. Both answers should be on a
 * page you can open in the meeting.
 */
export default function AdminPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href={HOME_HREF} className="tap flex items-center gap-3">
          <PiggyBadge />
          <Wordmark className="text-[17px]" />
        </Link>
        <span className="flex items-center gap-3">
          <DemoTag />
          <Link
            href={HOME_HREF}
            className="tap flex items-center gap-1.5 text-[13px] font-medium text-mist transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="pt-6 sm:pt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay">
            Internal
          </p>
          <h1 className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[40px]">
            The book, and what it earns
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-mist">
            Every facility on the platform, where the applicants came from, and what Litchi is paid
            by {defaultPartner.name}{" "}
            for arranging and servicing them. The commercial terms are adjustable, because the
            interesting question is not what they are &mdash; it is where they stop working.
          </p>
        </div>

        <div className="mt-10">
          <AdminConsole />
        </div>

        <p className="mt-10 max-w-3xl text-[13px] leading-relaxed text-clay">
          Sample book. The facilities, agencies and applicants are invented, and the partner
          economics use stated assumptions rather than a real lender&rsquo;s cost base.
        </p>
      </main>
    </div>
  );
}
