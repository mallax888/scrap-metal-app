import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { clsx } from "clsx";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { ButtonLink } from "@/components/ui/Button";
import { DemoBadge } from "@/components/marketing/DemoBadge";
import { WeekSplit } from "@/components/marketing/WeekSplit";
import { bond, movingChecklist, plan, rent, tenancy } from "@/lib/data";
import { money, moneyExact, percent } from "@/lib/format";
import { buildMoveCosts, costedTotal, defaultPartner, quoteMove } from "@/lib/move";
import { APP_HOME } from "@/lib/nav";

export const metadata: Metadata = {
  title: {
    absolute: "Litchi — Move in. Pay smarter.",
  },
  description:
    "Moving costs thousands in a single week — bond, rent in advance, movers, a professional clean — and your old bond doesn't come back until after you've paid the new one. Litchi covers the gap and you repay a fixed weekly amount.",
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

/**
 * A move like the sample tenancy's, priced from the same rules the calculator
 * uses. Derived rather than written down, so the figure on the front door can
 * never drift from the one the product quotes.
 */
const SAMPLE_MOVE = costedTotal(buildMoveCosts(tenancy.rentWeekly, "medium"));
const SAMPLE_QUOTE = quoteMove(SAMPLE_MOVE, 52);

const STEPS = [
  {
    n: "01",
    title: "Your tenancy is verified",
    body: "Upload your tenancy agreement and we read the rent, the bond and the dates off it. Your property manager confirms them from a link — no account, about ten seconds — so the figures behind your application are facts rather than something you typed.",
  },
  {
    n: "02",
    title: "Your move is costed",
    body: `Bond, rent in advance, the truck, the clean on the place you're leaving. The two biggest come straight off your verified rent, because the law caps both — ${bond.weeksOfRent} weeks for the bond, two for the rent.`,
  },
  {
    n: "03",
    title: "It's paid where it's owed",
    body: "Straight to your agency's trust account and to the people doing the work, on your move dates. Almost none of it lands in your account, so there is nothing to hold or forward — and one fixed weekly repayment covers the lot.",
  },
];

/**
 * Two products, priced differently, and the difference said out loud.
 *
 * A bond is smaller and comes back at the end of the tenancy, so it can carry
 * a flat fee. A facility covering the whole move is larger, unsecured and
 * gone once it is spent, so it is priced the way consumer credit is normally
 * priced. Pretending both could be the same fee would be the more attractive
 * page and the less honest one.
 */
const PRODUCTS = [
  {
    name: "Bond Assist",
    covers: "The bond, and nothing else",
    amount: money(bond.amount),
    price: `Flat ${plan.feeRate * 100}% fee — ${money(plan.fee)}`,
    weekly: `${moneyExact(plan.weeklyPayment)} a week for ${plan.termWeeks} weeks`,
    points: [
      "No interest, so the amount never grows",
      "Paid straight to your agency, lodged with Tenancy Services",
      "Pay it off early whenever you like",
    ],
    href: "/apply",
    cta: "Check eligibility",
    featured: false,
  },
  {
    name: "Litchi Move",
    covers: "The whole move",
    amount: `Up to ${money(defaultPartner.maxAdvance)}`,
    price: `${money(defaultPartner.establishmentFee)} establishment fee, ${percent(
      defaultPartner.annualRate,
      2
    )} p.a.`,
    weekly: `${moneyExact(SAMPLE_QUOTE.weekly)} a week on a ${money(SAMPLE_MOVE)} move`,
    points: [
      "Bond, rent in advance, movers, cleaning, storage",
      "Capped at what your move actually costs — never more",
      "One application, one repayment, paid direct to each provider",
    ],
    href: "/move",
    cta: "Calculate my move",
    featured: true,
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
    yes: "The price is quoted before you apply",
    body: `On Bond Assist, a flat ${money(plan.fee)} fee on a ${money(
      plan.principal
    )} bond — no interest, so it never grows. On Litchi Move, an establishment fee and a rate, both shown on the estimate screen before anything is submitted.`,
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
            <ButtonLink href="/move" size="sm" variant="secondary">
              Calculate my move
            </ButtonLink>
          </span>
          <ButtonLink href="/tour" size="sm">
            Take the tour
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
              And the money that would cover it is sitting in your old bond, which you don&rsquo;t
              get back until after you&rsquo;ve paid the new one. That gap is usually a few weeks.
              It&rsquo;s the whole problem.
            </p>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-mist sm:text-[19px]">
              Litchi covers it. You repay in a simple, fixed weekly amount &mdash; making moving
              into your next home easier and more manageable.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/move" size="lg">
                Calculate my move
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href={APP_HOME} size="lg" variant="secondary">
                See the demo account
              </ButtonLink>
            </div>
            <p className="mt-4 text-[13px] text-clay">
              Both open an interactive demo. Nothing to sign up for.
            </p>

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
                    {item.bookable ? (
                      <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-bark">
                        Book through Litchi
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

        {/* Two products, and why they are not priced the same. */}
        <section className="mt-24 sm:mt-32">
          <h2 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
            Two ways in
          </h2>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-mist">
            Take the bond on its own, or the whole move. They are priced differently and the
            reason is worth saying: a bond comes back to you at the end of the tenancy, and a
            truck does not.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {PRODUCTS.map((product) => (
              <div
                key={product.name}
                className={clsx(
                  "flex flex-col rounded-card p-6 sm:p-7",
                  product.featured
                    ? "bg-hero text-onbrand"
                    : "border border-sand/70 bg-paper"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className={clsx(
                        "text-[21px] font-semibold tracking-tight",
                        product.featured ? "text-onbrand" : "text-ink"
                      )}
                    >
                      {product.name}
                    </h3>
                    <p
                      className={clsx(
                        "mt-1 text-[13px]",
                        product.featured ? "text-onbrand/70" : "text-mist"
                      )}
                    >
                      {product.covers}
                    </p>
                  </div>
                  <p
                    className={clsx(
                      "numeric whitespace-nowrap text-[19px] font-semibold tracking-[-0.02em]",
                      product.featured ? "text-onbrand" : "text-ink"
                    )}
                  >
                    {product.amount}
                  </p>
                </div>

                <dl className="mt-6 space-y-2 text-[13px]">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <dt className={product.featured ? "text-onbrand/70" : "text-mist"}>
                      What it costs
                    </dt>
                    <dd
                      className={clsx(
                        "text-right font-medium",
                        product.featured ? "text-onbrand" : "text-ink"
                      )}
                    >
                      {product.price}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <dt className={product.featured ? "text-onbrand/70" : "text-mist"}>
                      Repayment
                    </dt>
                    <dd
                      className={clsx(
                        "text-right font-medium",
                        product.featured ? "text-onbrand" : "text-ink"
                      )}
                    >
                      {product.weekly}
                    </dd>
                  </div>
                </dl>

                <ul className="mt-6 space-y-2.5">
                  {product.points.map((point) => (
                    <li
                      key={point}
                      className={clsx(
                        "flex items-start gap-2.5 text-[14px] leading-relaxed",
                        product.featured ? "text-onbrand/80" : "text-mist"
                      )}
                    >
                      <Check
                        className={clsx(
                          "mt-1 h-3.5 w-3.5 shrink-0",
                          product.featured ? "text-onbrand" : "text-moss"
                        )}
                        aria-hidden
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <ButtonLink
                    href={product.href}
                    variant={product.featured ? "onHero" : "secondary"}
                  >
                    {product.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-clay">
            Credit is provided by {defaultPartner.name}, a licensed lender, FSPR{" "}
            {defaultPartner.fspr}, and a member of {defaultPartner.disputesScheme}. Litchi arranges
            and services the facility, is paid by the lender, and does not decide the outcome.
            Lending criteria and a full affordability assessment apply.
          </p>
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
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/tour" size="lg" variant="onHero">
              Take the tour
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/move" size="lg" variant="onHeroGhost">
              Calculate my move
            </ButtonLink>
            <ButtonLink href={APP_HOME} size="lg" variant="onHeroGhost">
              See the demo account
            </ButtonLink>
            <ButtonLink href="/agents" size="lg" variant="onHeroGhost">
              For property managers
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
          <div className="flex flex-col gap-4 sm:items-end">
            <span className="flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href="/agents"
                className="tap text-[13px] font-medium text-mist transition-colors hover:text-ink"
              >
                For property managers
              </Link>
              <Link
                href="/admin"
                className="tap text-[13px] font-medium text-mist transition-colors hover:text-ink"
              >
                The business model
              </Link>
            </span>
            <p className="max-w-xl text-[13px] leading-relaxed text-clay">
              A design prototype. Every figure shown is sample data for a fictional tenancy, not a
              real account or a live financial product.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
