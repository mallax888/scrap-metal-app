import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { DemoTag } from "@/components/marketing/DemoTag";
import { VerifyPanel } from "@/components/verify/VerifyPanel";
import { Card } from "@/components/ui/Card";
import { findVerification, verificationRequests } from "@/lib/verification";
import { HOME_HREF } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Tenancy verification",
  description:
    "Confirm a tenant's rent, bond and start date. No account needed, and nothing about their finances is shown.",
  robots: { index: false, follow: false },
};

/** The sample links, so the known tokens are prerendered rather than rendered on demand. */
export function generateStaticParams() {
  return verificationRequests.map((request) => ({ token: request.token }));
}

/**
 * The agency's side of the product, at the end of a link.
 *
 * Deliberately not behind the agent portal. A property manager who has to
 * create an account before they can answer a ten-second question will not
 * answer it, and the verification is the thing the whole application waits on.
 * The portal at /agents is for the agencies that come back; this is for
 * everyone else.
 */
export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const request = findVerification(token);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href={HOME_HREF} className="tap flex items-center gap-3">
          <PiggyBadge />
          <Wordmark className="text-[17px]" />
        </Link>
        <DemoTag />
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-24 sm:px-8">
        <div className="pt-6 sm:pt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            Tenancy verification
          </p>
          {/* The heading asks for the thing. It used to announce who had been
              named, which the agency already knows, and left the actual
              request to a card heading further down the page. */}
          <h1 className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            {request ? "Does this look right?" : "This link has expired"}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-mist sm:text-[17px]">
            {request
              ? `${request.tenantName} has applied to Litchi for help with the cost of moving in, and gave us these details. Confirm they match your records — about ten seconds, no account, and nothing else will be asked of you.`
              : "Verification links open a single tenancy and stop working after seven days."}
          </p>
        </div>

        <div className="mt-8">
          {request ? (
            <VerifyPanel request={request} />
          ) : (
            <Card>
              <div className="flex items-start gap-3">
                <LinkIcon className="mt-0.5 h-5 w-5 shrink-0 text-clay" aria-hidden />
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">
                    We can&rsquo;t open this one
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-mist">
                    Either the link has expired or it has already been answered. If your tenant is
                    still waiting, ask them to resend it from their application &mdash; a fresh
                    link is issued each time, and old ones stop working.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
