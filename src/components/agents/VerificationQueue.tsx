"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, Copy, Send } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { agency } from "@/lib/data";
import { formatDateShort, money } from "@/lib/format";
import { verificationRequests, type VerificationStatus } from "@/lib/verification";
import { useVerificationStatus } from "@/lib/verification-store";

/**
 * The queue, and the invitation.
 *
 * Two things an agency actually does with Litchi. The queue is the work —
 * usually none, occasionally one, never more than a few — and the invitation
 * is the reason Litchi cares about agencies at all.
 *
 * The invitation is the strategically important half. A tenant who has just
 * been approved for a rental is at the exact moment this product is worth
 * something, and the property manager is the only person who knows that moment
 * has arrived. A referral link at the bottom of an approval email reaches them
 * on the right day, which no amount of advertising does.
 */
const STATUS_TONE: Record<VerificationStatus, "moss" | "amber" | "outline"> = {
  verified: "moss",
  disputed: "amber",
  awaiting: "outline",
};

const STATUS_TEXT: Record<VerificationStatus, string> = {
  verified: "Verified",
  disputed: "Queried",
  awaiting: "Awaiting you",
};

function QueueRow({ token }: { token: string }) {
  const request = verificationRequests.find((r) => r.token === token);
  const status = useVerificationStatus(token);
  if (!request) return null;

  return (
    /* The status belongs with the tenancy it describes, so the action stays
       alone in the right-hand column and cannot be wrapped under the row. */
    <li className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{request.property}</p>
        <p className="mt-0.5 text-[13px] text-mist">
          {request.tenantName} &middot; {money(request.weeklyRent)} a week &middot; bond{" "}
          {money(request.bond)}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-clay">
          <span>
            Requested {formatDateShort(request.requestedAt)} &middot; {request.source}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Badge tone={STATUS_TONE[status]}>
          {status === "verified" ? (
            <Check className="h-3 w-3" aria-hidden />
          ) : status === "awaiting" ? (
            <Clock className="h-3 w-3" aria-hidden />
          ) : null}
          {STATUS_TEXT[status]}
        </Badge>
        <Link
          href={`/verify/${request.token}`}
          className={clsx(
            "tap text-[13px] font-medium transition-colors",
            status === "awaiting" ? "text-bark hover:text-ink" : "text-mist hover:text-ink"
          )}
        >
          {status === "awaiting" ? "Confirm" : "View"}
        </Link>
      </div>
    </li>
  );
}

export function VerificationQueue() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  // The link carries the agency and the manager, so every application that
  // arrives through it can be attributed without anyone typing a code.
  const referral = "litchi.co.nz/move?agency=example-property&pm=praman";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${referral}`);
      setCopied(true);
      toast("Referral link copied.", "success");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("Couldn't copy — select the link and copy it manually.", "info");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <Card className="flex h-full flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Tenancy verifications</CardTitle>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-mist">
              A tenant asks, you confirm the rent and the bond you already hold, and that is the
              whole of it. Nothing about their finances is shown to you.
            </p>
          </div>
        </div>

        <ul className="mt-5 divide-y divide-sand/70">
          {verificationRequests.map((request) => (
            <QueueRow key={request.token} token={request.token} />
          ))}
        </ul>

        <p className="mt-auto pt-5 text-[13px] leading-relaxed text-clay">
          Verifying is not a reference. It confirms facts from the tenancy agreement and nothing
          more, and it does not make {agency.name} a party to anything the tenant arranges.
        </p>
      </Card>

      <Card tone="cream" className="flex h-full flex-col">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-bark">
          <Send className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <h2 className="mt-4 text-[17px] font-semibold tracking-tight text-ink">
          Send Litchi to a tenant
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-bark">
          The moment worth catching is the approval email. Put this link at the bottom of it and
          the tenant who can afford the rent but not the bond has somewhere to go &mdash; before
          they withdraw.
        </p>

        <div className="mt-5 rounded-tile bg-paper px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
            Your agency&rsquo;s link
          </p>
          <p className="numeric mt-1.5 break-all text-[13px] font-medium text-ink">{referral}</p>
        </div>

        <div className="mt-auto pt-5">
          <Button variant="secondary" onClick={copyLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden />
                Copy link
              </>
            )}
          </Button>
          <p className="mt-4 text-[13px] leading-relaxed text-bark">
            Applications arriving through it are attributed to {agency.manager}, so you can see
            what the channel is actually worth. There is no commission attached &mdash; Litchi is
            paid by the lender, and an agency paid per referral is an agency steering tenants
            towards credit.
          </p>
        </div>
      </Card>
    </div>
  );
}
