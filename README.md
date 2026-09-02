# Litchi

**Move in. Pay smarter.**

Litchi is a financial platform for renters. Its first product, **Bond Assist**, has a
lending partner pay a tenant's rental bond up front so they can move in without finding
four weeks' rent in cash — the tenant then repays Litchi a fixed amount each week.

This repository is a functional, interactive prototype of the Litchi renter dashboard,
built to be shown to property managers, investors, lenders and renters.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs entirely on realistic local sample data — no backend, no keys, no setup.
Anything you change (extra payments, Moving Fund top-ups, reward redemptions, payment
method, waitlists) persists to `localStorage`, so the numbers stay consistent as you move
between screens.

## Product positioning

The dashboard is careful about one thing above all else:

| Payment | Goes to | Shown as |
| --- | --- | --- |
| Rent — $700/week | The landlord / property manager | "Rent" |
| Bond repayment — $53.85/week | Litchi | "Litchi bond repayment" |
| **Total weekly housing** | — | **$753.85/week** |

The bond repayment is **never** described as rent, and the UI states clearly that Litchi
does not hold the statutory bond — that sits with Tenancy Services for the whole tenancy.
The Litchi Score is also labelled throughout as Litchi's own measure, not a legally
recognised credit score.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Overview — summary cards, bond hero, repayment chart, next payment, rewards, score, Moving Fund, activity |
| `/bond` | My Bond — balance, lodgement details, how Bond Assist works, end-of-tenancy |
| `/payments` | Payments — next payment, full upcoming schedule, filterable/searchable activity |
| `/rent` | Rent — rent vs Litchi repayment, annual view, rent-payments waitlist |
| `/rewards` | Rewards — points, tier, how they were earned, redeemable catalogue |
| `/score` | Renter Score — score, history chart, weighted factor breakdown, disclaimer |
| `/moving-fund` | Moving Fund — balance, goal, automatic top-ups, contributions |
| `/documents` | Documents — tenancy, bond, Litchi agreement and statements, by category |
| `/support` | Support — contact channels, FAQs, message form |

Everything is interactive: modals for the repayment plan, extra payments, payment method
and bond details; live-updating progress and projections; loading skeletons; and empty
states behind filters and searches.

### Try this

Open **Make extra payment**, type an amount, and watch the balance, weeks remaining and
payoff date update live before you confirm — then see the dashboard, chart and schedule
all move together.

## Brand

- **Palette** — warm off-white canvas `#FAF8F4`, dark brown `#2B211D`, primary brown
  `#6B4635`, soft brown `#A9826A`, cream `#F1E8DE`. Brown is the brand colour; there is no
  blue-fintech styling and no gradient stacks.
- **Type** — Plus Jakarta Sans, with tabular figures wherever a number is money.
- **Mark** — an abstract piggy bank with an `L` cut through the body that doubles as the
  coin slot (`src/components/brand/PiggyMark.tsx`). The same geometry drives the favicon,
  the Apple touch icon and the social share image.

Design tokens live in `src/app/globals.css` as a Tailwind v4 `@theme` block, so
`bg-canvas`, `text-ink`, `bg-bark`, `border-sand` and friends are real utilities.

## Architecture

```
src/
  app/                 route per screen; each has a layout.tsx carrying its metadata
  components/
    brand/             the Litchi mark and wordmark
    layout/            sidebar, mobile drawer, app shell
    ui/                Card, Button, Progress, Modal, Badge, Skeleton, EmptyState, Toast
    dashboard/         the composable dashboard cards, reused across screens
    modals/            repayment plan, extra payment, payment method, bond details, fund
  lib/
    data.ts            all sample data in one place
    store.tsx          client store + every derived number (balance, payoff date, schedule)
    format.ts          money and date formatting (NZD, UTC-safe dates)
```

All repayment maths goes through `projectPlan()` in `src/lib/store.tsx`, so the dashboard,
the chart, the schedule and the "what would an extra payment do?" preview can never
disagree.

## Built for a bigger ecosystem

Bond Assist is the first product. The UI already carries the shape of what comes next —
rent payments, contents insurance, utilities, moving services and furniture finance appear
as clearly-labelled upcoming products with working waitlists, so adding a real one is a
new route plus a card, not a redesign.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · lucide-react
