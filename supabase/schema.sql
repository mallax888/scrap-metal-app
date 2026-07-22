-- ScrapExchange schema (MVP)
-- Run against a fresh Supabase project once you're ready to move off mock data.

create table if not exists metals (
  id text primary key,
  label text not null,
  unit text not null default 'kg'
);

insert into metals (id, label, unit) values
  ('copper', 'Copper', 'kg'),
  ('aluminium', 'Aluminium', 'kg'),
  ('steel', 'Steel', 'kg'),
  ('brass', 'Brass', 'kg'),
  ('stainless', 'Stainless Steel', 'kg'),
  ('lead', 'Lead', 'kg'),
  ('insulated-copper-wire', 'Insulated Copper Wire', 'kg')
on conflict (id) do nothing;

create table if not exists metal_prices (
  metal_id text primary key references metals(id),
  price_per_kg numeric(10, 3) not null,
  updated_at timestamptz not null default now()
);

create table if not exists metal_price_history (
  id bigint generated always as identity primary key,
  metal_id text not null references metals(id),
  price_per_kg numeric(10, 3) not null,
  recorded_at timestamptz not null default now()
);

create table if not exists yards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  name text not null,
  suburb text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists yard_buy_prices (
  yard_id uuid not null references yards(id) on delete cascade,
  metal_id text not null references metals(id),
  price_per_kg numeric(10, 3) not null,
  updated_at timestamptz not null default now(),
  primary key (yard_id, metal_id)
);

create table if not exists scrap_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references auth.users(id),
  metal_id text not null references metals(id),
  weight_kg numeric(10, 2) not null,
  quoted_price_per_kg numeric(10, 3) not null,
  quoted_total numeric(12, 2) not null,
  method text not null check (method in ('pickup', 'dropoff')),
  -- Yards aren't real DB-backed accounts yet (no owners/onboarding), so we
  -- store a plain id plus a name/suburb snapshot instead of an FK to the
  -- yards table.
  yard_id text,
  yard_name text,
  yard_suburb text,
  address text,
  status text not null default 'quoted'
    check (status in ('quoted', 'scheduled', 'collected', 'paid')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Phase 2: industrial lot bidding / marketplace
create table if not exists scrap_lots (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references auth.users(id),
  metal_id text not null references metals(id),
  weight_kg numeric(10, 2) not null,
  description text,
  status text not null default 'open' check (status in ('open', 'awarded', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists scrap_lot_bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references scrap_lots(id) on delete cascade,
  yard_id uuid not null references yards(id),
  price_per_kg numeric(10, 3) not null,
  created_at timestamptz not null default now()
);

alter table yards enable row level security;
alter table yard_buy_prices enable row level security;
alter table scrap_requests enable row level security;
alter table scrap_lots enable row level security;
alter table scrap_lot_bids enable row level security;

-- Prices are public read (no auth needed to browse the market screen).
create policy "Public read metals" on metals for select using (true);
create policy "Public read metal prices" on metal_prices for select using (true);
create policy "Public read yards" on yards for select using (true);
create policy "Public read yard buy prices" on yard_buy_prices for select using (true);

-- Sellers can only see and manage their own requests.
create policy "Sellers manage own requests" on scrap_requests
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

-- Yard owners manage their own yard's buy prices.
create policy "Yard owners manage own prices" on yard_buy_prices
  for insert with check (
    exists (select 1 from yards where yards.id = yard_id and yards.owner_id = auth.uid())
  );
create policy "Yard owners update own prices" on yard_buy_prices
  for update using (
    exists (select 1 from yards where yards.id = yard_id and yards.owner_id = auth.uid())
  );
