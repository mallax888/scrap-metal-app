"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Check, Clock, Lock } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
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
 *
 * Two things had crept in front of the task: a card heading that repeated the
 * page heading, and a paragraph of reassurance. Both pushed the buttons off a
 * phone screen, which made a ten-second job start with a scroll. The facts and
 * the buttons come first now; the reassurance is behind a heading, where
 * someone who wants it will look for it.
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
        <dl className="divide-y divide-sand/70">
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
                  ? `Recorded against ${request.property} as confirmed by ${request.manager}. Nothing further is needed from you.`
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
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

      {/*
       * Somewhere to go once the job is done.
       *
       * The page used to end here with nothing but an undo link: an agent
       * arrived from an email, spent ten seconds, and was left on a dead page
       * with no route anywhere — not even back to the site they had just
       * helped. Closing the tab is still the right answer for most of them,
       * which is why it is said; but it should not be the only one available.
       */}
      {answered ? (
        <Card tone="cream">
          <h2 className="text-[15px] font-semibold text-ink">That&rsquo;s it — you can close this page</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-bark">
            Your tenant takes it from here. If you want to know what Litchi does for the agencies
            it works with, and what it never asks of them, that is one page.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/agents">
              What this means for your agency
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Litchi home
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      <div className="rounded-card border border-sand/70 bg-paper px-5">
        <Disclosure title="What this does and does not tell you" className="border-t-0">
          <p className="max-w-2xl text-sm leading-relaxed text-mist">
            Everything above is something your agency already holds, so confirming it tells us
            nothing new about your tenant.
          </p>
          <ul className="mt-4 space-y-2">
            {verificationDisclosure.withheld.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[13px] leading-relaxed text-mist"
              >
                <Lock className="mt-[3px] h-3.5 w-3.5 shrink-0 text-clay" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-mist">
            Confirming a tenancy is not a reference and not a recommendation. It does not make
            your agency a party to anything your tenant arranges with Litchi, and it has no
            bearing on the tenancy itself.
          </p>
        </Disclosure>
      </div>

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
