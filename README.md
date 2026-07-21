# ScrapExchange

"Sharesies for scrap metal" — a live price ticker for scrap metal, an instant sell quote
calculator, a portfolio-style dashboard for sellers, and a dealer dashboard for yards.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app currently runs entirely on mock/local data (live prices simulate small live
ticks in the browser; requests and yard prices persist to `localStorage`) so you can try
every flow with zero setup.

## App structure

- `/` — Market screen: live price ticker per metal, no login required.
- `/sell` — Instant quote calculator: pick a metal + weight, then request a pickup or
  choose a nearby yard to drop off at.
- `/portfolio` — Seller dashboard: total sold this year, request history, and a
  quoted → scheduled → collected → paid status tracker per request.
- `/dealer` — Yard dashboard: set your own buy prices per metal, and manage the incoming
  request queue.

Phase 2 (not yet built): industrial lot bidding, where a seller posts a large lot and
multiple yards bid on it.

## Going live with Supabase

The app is structured so swapping mock data for a real backend is additive, not a
rewrite:

1. Create a Supabase project.
2. Run `supabase/schema.sql` against it (tables for metals, live prices, yards, yard buy
   prices, requests, and the phase-2 lot/bid tables — with RLS policies already wired
   so market data is public-read and sellers/yard owners only manage their own rows).
3. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Swap `src/lib/store.tsx` (currently an in-memory + localStorage context) for data
   fetched via `src/lib/supabase/client.ts` (browser) / `src/lib/supabase/server.ts`
   (server components), and add Supabase Auth for seller/dealer login.

## Tech stack

Next.js (App Router) + TypeScript + Tailwind CSS, Recharts for the price sparklines,
Supabase for auth/data once connected.
