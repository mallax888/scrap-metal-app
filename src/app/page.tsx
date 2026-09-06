import type { Metadata } from "next";
import { ArrowRight, Check, Minus } from "lucide-react";
import { clsx } from "clsx";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { ButtonLink } from "@/components/ui/Button";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import { WeekSplit } from "@/components/marketing/WeekSplit";
import { bond, movingChecklist, plan, rent, tenancy } from "@/lib/data";
import { money } from "@/lib/format";
import { APP_HOME } from "@/lib/nav";

export const metadata: Metadata = {
  title: {
    absolute: "Litchi — Move in. Pay smarter.",
  },
  description:
    "Moving costs thousands in a single week — bond, rent in advance, movers, a professional clean. Litchi pays the bond up front and you repay a fixed weekly amount.",
};

/**
 * The front door.
 *
 * Everything else in this app is a signed-in dashboard for one specific
 * tenant. Sending someone straight there means their first question is "what
 * am I looking at?" rather than anything useful about the product, so this
 * page has one job: explain bond financing plainly, be honest that the
 * dashboard behind it is sample data, and get out of the way.
 */

const STEPS = [
  {
    n: "01",
    title: "Your bond is paid up front",
    body: `Our lending partner pays the full ${money(
      bond.amount
    )} to your landlord's agent on day one. You move in without finding it yourself.`,
  },
  {
    n: "02",
    title: "It is lodged with Tenancy Services",
    body: "The bond goes where every New Zealand bond goes — held by Tenancy Services for the whole tenancy. Litchi never holds it.",
  },
  {
    n: "03",
    title: "You repay a fixed weekly amount",
    body: `${money(plan.weeklyPayment)} a week for ${plan.termWeeks} weeks. One flat ${
      plan.feeRate * 100
    }% fee of ${money(
      plan.fee
    )} is included in that, and it is the only thing Litchi charges. No interest, and you can pay it off early whenever you like.`,
  },
];

/** The distinction the whole product rests on, so it gets stated outright. */
const CLARITY = [
  {
    yes: "Your rent is your rent",
    body: `${money(rent.weekly)} a week still goes to ${
      tenancy.landlordAgency
    }, exactly as it did before. Litchi does not touch it, collect it, or change it.`,
  },
  {
    yes: "Your repayment is separate",
    body: `${money(
      plan.weeklyPayment
    )} a week comes to Litchi for the bond we financed. It is a repayment, not rent, and it is shown separately everywhere in the app.`,
  },
  {
    yes: "One fee, quoted up front",
    body: `${money(plan.principal)} bond plus a flat ${money(plan.fee)} fee — ${money(
      plan.totalRepayable
    )} in total, fixed on day one. No interest, so it never grows, and nothing is added later.`,
  },
];

const NOT = [
  "We are not your landlord or your property manager.",
  "We do not hold your bond — Tenancy Services does.",
  "The Litchi Score is our own read on how you are tracking. It is not a credit score, is not reported to credit bureaux, and has no effect on your credit file.",
];

function Step({ n, title, body }: (typeof STEPS)[number]) {
  return (
    <li className="relative flex flex-col rounded-card border border-sand/70 bg-paper p-6">
      <span className="numeric text-[13px] font-semibold tracking-[0.14em] text-litchi">{n}</span>
      <h3 className="mt-4 text-[19px] font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed text-mist">{body}</p>
    </li>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <span className="flex items-center gap-3">
          <PiggyBadge />
          <Wordmark className="text-[17px]" />
        </span>
        <span className="flex items-center gap-2">
          {/* Two buttons overflow a 390px header, so the secondary one steps
              aside on a phone — the eligibility check is still in the body of
              the page. Wrapped rather than given a "hidden" class: the button's
              own inline-flex is also a display utility, and which of the two
              wins is decided by their order in the stylesheet, not by the order
              they appear in the class attribute. */}
          <span className="hidden sm:block">
            <ButtonLink href="/apply" size="sm" variant="secondary">
              Check eligibility
            </ButtonLink>
          </span>
          <ButtonLink href={APP_HOME} size="sm">
            View the demo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        {/* Hero */}
        <section className="grid items-center gap-12 pt-10 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <div>
            <DemoBadge />
            <h1 className="mt-6 max-w-3xl text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[64px]">
              Move in.
              <br />
              Pay smarter.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-mist sm:text-[19px]">
              A bond is typically four weeks&rsquo; rent &mdash; and it&rsquo;s often the biggest
              cost in a pile of expenses that all hit at once. You&rsquo;re paying rent in advance,
              moving costs, professional cleaning, and getting your power and internet connected,
              all within the same week.
            </p>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-mist sm:text-[19px]">
              Litchi pays your bond upfront. You repay it in a simple, fixed weekly amount &mdash;
              making moving into your next home easier and more manageable.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={APP_HOME} size="lg">
                See how it works
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <p className="text-[13px] text-clay sm:ml-3">
                Opens an interactive demo. Nothing to sign up for.
              </p>
            </div>

            {/* The one figure that makes the case, stated plainly. */}
            <dl className="mt-14 grid w-fit grid-cols-2 gap-x-10 gap-y-6 border-t border-sand pt-8 sm:grid-cols-[repeat(3,auto)] sm:gap-x-16">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                  Bond
                </dt>
                <dd className="numeric mt-1.5 whitespace-nowrap text-[26px] font-semibold tracking-[-0.02em] text-ink">
                  {money(bond.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                  Up front
                </dt>
                <dd className="numeric mt-1.5 whitespace-nowrap text-[26px] font-semibold tracking-[-0.02em] text-moss">
                  {money(0)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-clay">
                  Then
                </dt>
                <dd className="numeric mt-1.5 whitespace-nowrap text-[26px] font-semibold tracking-[-0.02em] text-ink">
                  {money(plan.weeklyPayment)}
                  <span className="text-base font-medium tracking-normal text-mist"> / week</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* The claim the product rests on, drawn rather than described. */}
          <WeekSplit />
        </section>

        {/* The problem, named. "Everything else about moving" means nothing
            until the list is actually written out. Unpriced on purpose. */}
        <section className="mt-24 sm:mt-32">
          <h2 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
            What a move actually involves
          </h2>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-mist">
            All of it inside a fortnight, most of it in the same week. Litchi takes the biggest
            one off the list.
          </p>

          <ul className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
            {movingChecklist.map((item) => (
              <li
                key={item.label}
                className={clsx(
                  "flex items-start gap-3 rounded-card border p-5",
                  item.covered
                    ? "border-moss/30 bg-moss-soft/40"
                    : "border-sand/70 bg-paper"
                )}
              >
                <span
                  className={clsx(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    item.covered ? "bg-moss text-onbrand" : "bg-cream text-clay"
                  )}
                  aria-hidden
                >
                  {item.covered ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3 w-3" />}
                </span>
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
                    {item.label}
                    {item.covered ? (
                      <span className="rounded-full bg-moss-soft px-2 py-0.5 text-[11px] font-semibold text-moss">
                        Litchi covers this
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-mist">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="mt-24 sm:mt-32">
          <h2 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <Step key={step.n} {...step} />
            ))}
          </ol>
        </section>

        {/* Rent vs repayment — the distinction the product rests on */}
        <section className="mt-24 sm:mt-32">
          <h2 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
            Two payments, never confused
          </h2>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-mist">
            The most important thing about Litchi is what it does not change.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CLARITY.map((item) => (
              <div key={item.yes} className="rounded-card border border-sand/70 bg-paper p-6">
                <h3 className="flex items-start gap-2.5 text-[17px] font-semibold tracking-tight text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden />
                  {item.yes}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-mist">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-card bg-cream p-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
              And to be clear
            </h3>
            <ul className="mt-4 space-y-3">
              {NOT.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink">
                  <Minus className="mt-1.5 h-3.5 w-3.5 shrink-0 text-clay" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Close */}
        <section className="mt-24 overflow-hidden rounded-card bg-hero p-8 text-onbrand sm:mt-32 sm:p-12">
          <h2 className="max-w-lg text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">
            Have a look around.
          </h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-onbrand/70">
            The demo is a full working dashboard for one tenant, filled with sample data. Make an
            extra payment, top up the Moving Fund, redeem a reward — everything responds.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={APP_HOME} size="lg" variant="onHero">
              Open the demo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/apply" size="lg" variant="onHeroGhost">
              See if we&rsquo;d cover your bond
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-sand">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="flex items-center gap-2.5">
            <PiggyBadge className="h-7 w-7" />
            <Wordmark className="text-[14px]" />
          </span>
          <p className="max-w-xl text-[13px] leading-relaxed text-clay">
            A design prototype. Every figure shown is sample data for a fictional tenancy, not a
            real account or a live financial product.
          </p>
        </div>
      </footer>
    </div>
  );
}
