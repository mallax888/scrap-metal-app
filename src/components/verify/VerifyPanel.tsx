"use client";

import { useState } from "react";
import { AlertCircle, Check, Clock, Lock, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, money } from "@/lib/format";
import { verificationDisclosure, type VerificationRequest } from "@/lib/verification";
import { respondToVerification, useVerificationStatus } from "@/lib/verification-store";

/**
 * The property manager's ten seconds.
 *
 * This is the only Litchi screen a property manager has to use, so it does one
 * thing and asks for nothing. No account, no password, no portal tour — a link
 * from an email, five facts they already hold, and two buttons.
 *
 * The restraint is the design. Every field an agent is asked to confirm is one
 * they wrote themselves, so answering discloses nothing new about the tenant;
 * and nothing about the finance appears here at all, because whether their
 * tenant is borrowing, how much, or whether they were approved is none of the
 * agency's business and telling them would make Litchi a party to the tenancy
 * relationship it is trying to stay out of.
 */
export function VerifyPanel({ request }: { request: VerificationRequest }) {
  const status = useVerificationStatus(request.token);
  const [justAnswered, setJustAnswered] = useState(false);

  const rows = [
    { label: "Tenant", value: request.tenantName },
    { label: "Property", value: `${request.property}, ${request.suburb}` },
    { label: "Weekly rent", value: money(request.weeklyRent) },
    { label: "Bond", value: money(request.bond) },
    { label: "Tenancy starts", value: formatDate(request.startDate) },
  ];

  const answered = status !== "awaiting";

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
            <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle>Confirm these tenancy details</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              {request.tenantName} has applied to Litchi to help with the cost of moving in, and
              gave us the details below. Please confirm they match your records.
            </p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-sand/70">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-[13px] text-mist">{row.label}</dt>
              <dd className="text-right text-[15px] font-medium text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        {answered ? (
          <div
            className={clsx(
              "mt-6 flex items-start gap-3 rounded-tile px-4 py-4",
              status === "verified"
                ? "border border-moss/30 bg-moss-soft/40"
                : "border border-sand bg-amber-soft"
            )}
            role="status"
          >
            {status === "verified" ? (
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-moss" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-warm" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {status === "verified" ? "Tenancy verified" : "Thanks — we'll come back to them"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-bark">
                {status === "verified"
                  ? `Recorded against ${request.property} as confirmed by ${request.manager}. Nothing further is needed from you, and you can close this page.`
                  : "We've told the tenant the details didn't match and asked them to check their agreement. You won't be asked again unless they resubmit."}
              </p>
              {justAnswered ? (
                <button
                  type="button"
                  onClick={() => {
                    respondToVerification(request.token, "awaiting");
                    setJustAnswered(false);
                  }}
                  className="tap mt-3 text-[13px] font-medium text-bark underline underline-offset-4 transition-colors hover:text-ink"
                >
                  That wasn&rsquo;t right &mdash; undo
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => {
                respondToVerification(request.token, "verified");
                setJustAnswered(true);
              }}
            >
              <Check className="h-4 w-4" aria-hidden />
              Verify tenancy
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                respondToVerification(request.token, "disputed");
                setJustAnswered(true);
              }}
            >
              Details incorrect
            </Button>
          </div>
        )}
      </Card>

      <Card tone="cream">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-bark" aria-hidden />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              What this does and does not tell you
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-bark">
              Everything above is something your agency already holds, so confirming it tells us
              nothing new about your tenant.
            </p>
            <ul className="mt-4 space-y-2">
              {verificationDisclosure.withheld.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[13px] leading-relaxed text-bark"
                >
                  <Lock className="mt-[3px] h-3.5 w-3.5 shrink-0 text-clay" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-bark">
              Confirming a tenancy is not a reference and not a recommendation. It does not make
              your agency a party to anything your tenant arranges with Litchi, and it has no
              bearing on the tenancy itself.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-start gap-3 text-[13px] leading-relaxed text-mist">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden />
        <p>
          This link was sent to {request.manager} at {request.agencyName} on{" "}
          {formatDate(request.requestedAt)}. It opens one tenancy, expires after seven days, and
          cannot be used to see anything else.
        </p>
      </div>
    </div>
  );
}
