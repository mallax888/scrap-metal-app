import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { clsx } from "clsx";
import { PiggyBadge, Wordmark } from "@/components/brand/PiggyMark";
import { ButtonLink } from "@/components/ui/Button";
import { CoverCalculator } from "@/components/marketing/CoverCalculator";
import { bond, movingChecklist, plan, tenancy } from "@/lib/data";
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
    /*
     * The rule, not one tenant's figure.
     *
     * These cards sit under a calculator the visitor has just typed their own
     * rent into. Printing the sample tenancy's $2,800 bond and $140 fee
     * underneath it put two different answers for the same move on one
     * screen — so the card states what is true for everyone and leaves the
     * arithmetic to the calculator that has the actual number.
     */
    amount: `${bond.weeksOfRent} weeks' rent`,
    price: `Flat ${plan.feeRate * 100}% fee, no interest`,
    weekly: `Repaid weekly over ${plan.termWeeks} weeks`,
    points: [
      "No interest, so the amount never grows",
      "Paid straight to your agency, lodged with Tenancy Services",
      "Pay it off early whenever you like",
    ],
    href: "/cost-my-move",
    cta: "Cost my move",
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
    href: "/cost-my-move",
    cta: "Cost my move",
    featured: true,
  },
];

/** The distinction the whole product rests on, so it gets stated outright. */
const CLARITY = [
  {
    yes: "Your rent is your rent",
    body: `It still goes to your property manager, exactly as it did before, on the same day and for the same amount. Litchi does not touch it, collect it, or change it.`,
  },
  {
    yes: "Your repayment is separate",
    body: `One weekly payment comes to Litchi for what we financed. It is a repayment, not rent, it is never added to your rent, and the two are shown apart everywhere in the app.`,
  },
  {
    yes: "The price is quoted before you apply",
    body: `On Bond Assist, a flat ${plan.feeRate * 100}% of the bond — no interest, so it never grows. On Litchi Move, an establishment fee and a rate, both shown on the estimate screen before anything is submitted.`,
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
        {/* Bigger than the in-app lockup. This is the only screen where the
            mark has to introduce the company rather than label a sidebar. */}
        <span className="flex items-center gap-3.5">
          <PiggyBadge className="h-11 w-11" />
          <Wordmark className="text-[21px]" />
        </span>
        <span className="flex items-center gap-2">
          {/* One button. "Cost my move" sat here as well as on the cover
              itself, two inches below — the same door twice. */}
          <ButtonLink href="/tour" size="sm">
            Take the tour
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        {/* The cover.

            It asks for the one number a renter already knows and answers with
            their own move, rather than spending three paragraphs explaining
            what a bond is to someone who has just paid one. */}
        <CoverCalculator />

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

          {/* Three across on a wide screen, not two inside a narrower cap.
              This was the one grid on the page with a max-width of its own,
              so it stopped short of the column every other section fills and
              read as misaligned rather than as a deliberate measure. Six
              items divide evenly three ways, which fills the column without
              stretching each tile across half of it. */}
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  {/* No wrap: the value is a column, and a wrapped one lands
                      under its own label at the left margin. */}
                  <div className="flex justify-between gap-4">
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
                  {/* No wrap: the value is a column, and a wrapped one lands
                      under its own label at the left margin. */}
                  <div className="flex justify-between gap-4">
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
            <ButtonLink href="/cost-my-move" size="lg" variant="onHeroGhost">
              Cost my move
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
