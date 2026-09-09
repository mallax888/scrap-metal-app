import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Banknote, Landmark, RefreshCw } from "lucide-react";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AgentPortfolio } from "@/components/agents/AgentPortfolio";
import { VerificationQueue } from "@/components/agents/VerificationQueue";
import { agency, bond, plan, rent } from "@/lib/data";
import { money } from "@/lib/format";
import { HOME_HREF } from "@/lib/nav";

export const metadata: Metadata = {
  title: "For property managers",
  description:
    "What changes for an agency when Litchi finances a tenant's bond: the bond clears a week before move-in, you lodge it as you always do, and nothing about the repayment reaches you.",
};

/**
 * The agency's side of the product.
 *
 * Litchi reaches renters through property managers, which makes this the page
 * the business actually depends on — and the one the rest of the app could not
 * answer. A property manager does not care how the financing works. They care
 * whether it makes their week harder, whether the money is real, and what they
 * are now expected to know about their tenant.
 *
 * So the promises here are small on purpose. The bond arrives in one payment
 * a week before move-in, it is lodged the usual way in the agency's name, and the
 * repayment is between Litchi and the tenant. An agency that has to chase
 * anything, or is asked to collect anything, is a worse deal than the bond it
 * replaced.
 */
const CHANGES = [
  {
    icon: Banknote,
    title: "The bond arrives before the keys do",
    body: `One cleared payment from our lending partner when the tenancy agreement is signed — in your trust account days before possession, the same as any tenant who had the cash. Nothing in instalments, and nothing to chase on the morning of the move. For ${bond.weeksOfRent} weeks' rent at ${money(
      rent.weekly
    )}, that is ${money(bond.amount)}.`,
  },
  {
    icon: Landmark,
    title: "You lodge it exactly as you do now",
    body: "The bond goes to Tenancy Services in your name, under your process, on your timeline. Litchi is not a party to it, is not named on it, and never holds it.",
  },
  {
    icon: RefreshCw,
    title: "The end of the tenancy is unchanged",
    body: "Same final inspection, same joint refund request, same rules on what can be deducted. Litchi has no claim on the refund even if the tenant still owes us — that balance is ours to carry, not yours to collect.",
  },
];

export default function AgentsPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
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

      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="pt-6 sm:pt-12">
          <DemoBadge />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-clay">
            For property managers
          </p>
          <h1 className="mt-3 max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[46px]">
            The bond turns up. Everything else stays the same.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-mist">
            Litchi finances a tenant&rsquo;s bond so they can move in without finding four
            weeks&rsquo; rent in a week they are already paying for movers and a professional clean.
            For your agency it should feel like a tenant who simply had the money.
          </p>
        </div>

        <section className="mt-12 grid gap-6 sm:mt-16 md:grid-cols-3">
          {CHANGES.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-bark">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold text-ink">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-mist">{item.body}</p>
              </Card>
            );
          })}
        </section>

        <section className="mt-16 sm:mt-24">
          <h2 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[30px]">
            What {agency.manager} sees
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mist">
            A sample portfolio for an agency managing {agency.propertiesManaged}{" "}
            properties. It is a receipt book, not a credit file &mdash; open any tenancy and the
            second half of that sentence is the important one.
          </p>
          <div className="mt-7">
            <AgentPortfolio />
          </div>
        </section>

        {/*
          The only thing Litchi ever asks an agency to do, and the only thing
          it asks them to hand out. Both belong on this page rather than behind
          a portal login, because a property manager will decide whether this
          is worth their time from this screen alone.
        */}
        <section className="mt-16 sm:mt-24">
          <h2 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[30px]">
            What we ask of you
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mist">
            One confirmation per tenancy, from a link, with no account to create. That is the
            entire ask &mdash; and it is what lets a lender treat the rent and bond as facts
            rather than as something a tenant typed.
          </p>
          <div className="mt-7">
            <VerificationQueue />
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:mt-24 lg:grid-cols-2">
          <Card tone="cream">
            <h2 className="text-[19px] font-semibold tracking-tight text-ink">
              It costs your agency nothing
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-bark">
              No fee, no commission, no revenue share, and nothing added to the rent. Litchi charges
              the tenant one flat {plan.feeRate * 100}% of the bond &mdash; {money(plan.fee)} on a{" "}
              {money(plan.principal)}{" "}
              bond &mdash; quoted up front and spread across the weekly payments. There is no
              interest, so it does not grow, and it does not change if they pay late.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-bark">
              We are not asking you to sell anything either. The tenant applies themselves, and the
              first you hear of it is a bond arriving.
            </p>
          </Card>

          <Card>
            <h2 className="text-[19px] font-semibold tracking-tight text-ink">
              Why an agency would bother
            </h2>
            <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-mist">
              <li className="flex items-start gap-3">
                <span
                  className="numeric mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream text-[10px] font-bold text-bark"
                  aria-hidden
                >
                  1
                </span>
                <span>
                  <span className="font-medium text-ink">Fewer good applicants drop out.</span> The
                  bond is what stops a tenant who can plainly afford the rent, and you lose them to
                  the timing rather than the affordability.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="numeric mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream text-[10px] font-bold text-bark"
                  aria-hidden
                >
                  2
                </span>
                <span>
                  <span className="font-medium text-ink">Move-ins happen sooner.</span> A bond
                  that cleared a week ago beats a tenant asking for a fortnight to save one, and an
                  empty week is the expensive part for the owner.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="numeric mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream text-[10px] font-bold text-bark"
                  aria-hidden
                >
                  3
                </span>
                <span>
                  <span className="font-medium text-ink">No part-paid bonds.</span> You are never
                  holding half of one, or reminding anyone about the rest.
                </span>
              </li>
            </ul>
          </Card>
        </section>

        {/*
          A note we would rather make ourselves than be asked about, because a
          property manager will assume the money has a catch and they are right
          to check.
        */}
        <Card className="mt-6">
          <h2 className="text-[15px] font-semibold text-ink">Where the money comes from</h2>
          <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-mist">
            The bond is paid by {plan.partner}, a licensed lender, not by Litchi and not out of
            other tenants&rsquo; money. Litchi arranges the finance and runs the app; the lender
            carries the credit risk. If a tenant stops repaying, that is between the lender and the
            tenant &mdash; it never becomes a claim on the bond, on the owner, or on you.
          </p>
        </Card>

        <section className="mt-16 overflow-hidden rounded-card bg-hero p-8 text-onbrand sm:mt-24 sm:p-12">
          <h2 className="max-w-lg text-[26px] font-semibold leading-tight tracking-tight sm:text-[34px]">
            Start with one tenancy.
          </h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-onbrand/70">
            The honest way to test this is the next applicant who has the income and not the bond.
            One property, one tenant, and you can see for yourself whether it made your week easier
            or harder.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/apply" size="lg" variant="onHero">
              See the tenant&rsquo;s side
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href={HOME_HREF} size="lg" variant="onHeroGhost">
              How Litchi works
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-sand">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="flex items-center gap-2.5">
            <PiggyBadge className="h-7 w-7" />
            <Wordmark className="text-[14px]" />
          </span>
          <p className="max-w-xl text-[13px] leading-relaxed text-clay">
            A design prototype. The agency, the properties and the tenants above are invented, and
            no figure here describes a real account or a live financial product.
          </p>
        </div>
      </footer>
    </div>
  );
}
