-- Litchi: core schema.
--
-- Read docs/data-model.md before changing anything in here. Four decisions in
-- this file are load-bearing and are not stylistic:
--
--   1. Roles live in `user_roles`, never as a column on a row the user can
--      update. A self-writable role column is a one-line privilege escalation.
--   2. `verification_requests` carries its own SNAPSHOT of the five facts an
--      agency confirms. Agents are never granted access to `tenancies` at all.
--      This is not denormalisation for speed — a verification attests to the
--      values as they stood when it was answered, so the copy is the correct
--      record even when the tenancy later changes.
--   3. Money is `numeric(12,2)`. Never float. Postgres `numeric` is exact
--      decimal; `real`/`double precision` are not, and this is a credit ledger.
--   4. Verification tokens are stored hashed. The plaintext exists only in the
--      link that was emailed.
--
-- Amounts are NZD. Dates that are legally significant (tenancy start, bond
-- lodgement) are `date`; everything else is `timestamptz`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

create type app_role as enum ('tenant', 'agent', 'admin');

create type tenancy_status as enum ('draft', 'active', 'ended');

create type verification_status as enum ('awaiting', 'verified', 'disputed', 'expired');

-- Mirrors Coverage in src/lib/move.ts.
create type coverage_choice as enum ('self', 'book', 'litchi');

-- Who the money goes to. 'tenant' is the only one that is not direct, and is
-- tracked separately because it is the single cash-out vector in the product.
create type payee_kind as enum ('agent', 'provider', 'tenant');

create type application_status as enum (
  'draft', 'submitted', 'assessing', 'approved', 'declined', 'withdrawn'
);

create type facility_status as enum ('pending', 'funded', 'repaid', 'defaulted', 'cancelled');

create type repayment_status as enum ('scheduled', 'paid', 'missed', 'moved', 'waived');

create type revenue_kind as enum ('origination', 'servicing', 'revenue_share');

-- How confident the document extraction was. Modelled rather than discarded so
-- the confirmation screen can flag what is worth a second look.
create type extraction_confidence as enum ('high', 'medium', 'low');

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null,
  email       citext not null,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Deliberately NOT a column on `profiles`. Role is authorisation state, and
-- authorisation state must not live on a row its subject can update. Written
-- by service_role only; see 0002_rls.sql.
create table user_roles (
  user_id     uuid not null references auth.users on delete cascade,
  role        app_role not null,
  granted_at  timestamptz not null default now(),
  granted_by  uuid references auth.users,
  primary key (user_id, role)
);

create table agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  nzbn        text,
  created_at  timestamptz not null default now()
);

-- The fix for the spoofing hole in the verification flow: the agent's email
-- arrives on a document the TENANT uploaded, so a tenant and an accomplice
-- could otherwise verify their own tenancy. A request may only be issued to an
-- address whose domain is registered to the agency named on the agreement.
create table agency_domains (
  agency_id   uuid not null references agencies on delete cascade,
  domain      citext not null,
  verified_at timestamptz,
  primary key (agency_id, domain)
);

create table agency_members (
  agency_id   uuid not null references agencies on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (agency_id, user_id)
);

-- ---------------------------------------------------------------------------
-- The tenancy
-- ---------------------------------------------------------------------------

create table properties (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid references agencies on delete set null,
  address_line  text not null,
  suburb        text,
  city          text,
  created_at    timestamptz not null default now()
);

create table tenancies (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references properties on delete restrict,
  tenant_id       uuid not null references auth.users on delete restrict,
  agency_id       uuid references agencies on delete set null,
  weekly_rent     numeric(12,2) not null check (weekly_rent > 0),
  -- RTA s.18: a bond may not exceed four weeks' rent. Enforced here as well as
  -- in the UI, because a cap that only exists in a React component is a
  -- suggestion.
  bond_amount     numeric(12,2) not null check (bond_amount >= 0),
  -- RTA s.18AA, in force 1 December 2025: one pet bond, max two weeks' rent.
  pet_bond_amount numeric(12,2) not null default 0 check (pet_bond_amount >= 0),
  start_date      date not null,
  end_date        date,
  status          tenancy_status not null default 'draft',
  created_at      timestamptz not null default now(),
  constraint bond_within_statutory_cap
    check (bond_amount <= weekly_rent * 4),
  constraint pet_bond_within_statutory_cap
    check (pet_bond_amount <= weekly_rent * 2),
  constraint tenancy_dates_ordered
    check (end_date is null or end_date > start_date)
);

create index on tenancies (tenant_id);
create index on tenancies (agency_id);

-- Files live in Supabase Storage; this is the catalogue. `delete_after` exists
-- so retention is a column somebody can act on rather than a promise in a
-- privacy policy — a tenancy agreement is not needed once the facility is
-- repaid.
create table tenancy_documents (
  id            uuid primary key default gen_random_uuid(),
  tenancy_id    uuid not null references tenancies on delete cascade,
  storage_path  text not null unique,
  content_type  text not null,
  byte_size     bigint not null check (byte_size > 0),
  uploaded_by   uuid not null references auth.users,
  uploaded_at   timestamptz not null default now(),
  delete_after  date
);

create index on tenancy_documents (tenancy_id);

-- What reading the document produced, with the confidence attached. Kept as
-- rows rather than a jsonb blob so a low-confidence field is queryable — "how
-- often do we misread the bond" is a question worth being able to answer.
create table tenancy_extractions (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references tenancy_documents on delete cascade,
  field       text not null,
  value       text,
  confidence  extraction_confidence not null,
  source_ref  text,
  created_at  timestamptz not null default now(),
  unique (document_id, field)
);

-- ---------------------------------------------------------------------------
-- Verification — the part no bank has
-- ---------------------------------------------------------------------------

-- The snapshot columns are the whole point. An agent is granted access to THIS
-- table and never to `tenancies`, so the five facts they are asked to confirm
-- are the only tenancy data that can reach them. Postgres RLS is row-level,
-- not column-level: you cannot hand an agent a row of `tenancies` and withhold
-- a column of it. Copying the five fields is what makes the boundary
-- structural rather than a promise about which columns the API selects.
create table verification_requests (
  id                  uuid primary key default gen_random_uuid(),
  tenancy_id          uuid not null references tenancies on delete cascade,
  agency_id           uuid not null references agencies on delete restrict,
  sent_to_email       citext not null,

  -- The snapshot. Confirmed values as at the moment of asking.
  snapshot_tenant_name  text not null,
  snapshot_address      text not null,
  snapshot_suburb       text,
  snapshot_weekly_rent  numeric(12,2) not null,
  snapshot_bond_amount  numeric(12,2) not null,
  snapshot_start_date   date not null,

  -- Never the token itself. The plaintext exists only in the emailed link.
  token_hash          bytea not null unique,
  expires_at          timestamptz not null,
  status              verification_status not null default 'awaiting',
  created_by          uuid not null references auth.users,
  created_at          timestamptz not null default now(),

  constraint expiry_in_the_future check (expires_at > created_at)
);

create index on verification_requests (agency_id, status);
create index on verification_requests (tenancy_id);

-- A separate table, not columns on the request, because an answer is an event:
-- it is written once, never edited, and it is the thing an auditor asks about.
create table verification_responses (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references verification_requests on delete cascade,
  status         verification_status not null,
  responder_name  text,
  responder_email citext,
  note           text,
  -- Captured because "who confirmed this, and from where" is the question
  -- asked when a verification is later disputed.
  ip             inet,
  user_agent     text,
  responded_at   timestamptz not null default now(),
  constraint answer_is_terminal check (status in ('verified', 'disputed')),
  -- One answer per request. Re-asking issues a new request with a new token.
  unique (request_id)
);

-- ---------------------------------------------------------------------------
-- The move
-- ---------------------------------------------------------------------------

create table move_plans (
  id            uuid primary key default gen_random_uuid(),
  tenancy_id    uuid not null references tenancies on delete cascade,
  tenant_id     uuid not null references auth.users on delete restrict,
  property_size text not null check (property_size in ('small', 'medium', 'large')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on move_plans (tenant_id);

create table move_cost_lines (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references move_plans on delete cascade,
  kind          text not null,
  label         text not null,
  amount        numeric(12,2) not null check (amount >= 0),
  payee_kind    payee_kind not null,
  payee_name    text,
  coverage      coverage_choice not null default 'self',
  -- Where the law caps the line, the cap is recorded with it so the check is
  -- reproducible after the fact rather than recomputed from today's rules.
  statutory_cap numeric(12,2),
  sort_order    integer not null default 0,
  constraint amount_within_statutory_cap
    check (statutory_cap is null or amount <= statutory_cap),
  unique (plan_id, kind)
);

create index on move_cost_lines (plan_id);

-- ---------------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------------

create table finance_partners (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  fspr              text not null,
  disputes_scheme   text not null,
  annual_rate       numeric(6,4) not null check (annual_rate >= 0),
  establishment_fee numeric(12,2) not null check (establishment_fee >= 0),
  min_advance       numeric(12,2) not null check (min_advance > 0),
  max_advance       numeric(12,2) not null,
  terms_weeks       integer[] not null,
  active            boolean not null default true,
  constraint advance_range_ordered check (max_advance >= min_advance)
);

-- Versioned rather than mutable: what Litchi was paid on a facility written in
-- March must still be answerable after the terms are renegotiated in June.
create table partner_commercials (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references finance_partners on delete cascade,
  effective_from    date not null,
  origination_fee   numeric(12,2) not null check (origination_fee >= 0),
  servicing_monthly numeric(12,2) not null check (servicing_monthly >= 0),
  revenue_share     numeric(6,4) not null check (revenue_share between 0 and 1),
  unique (partner_id, effective_from)
);

-- How the applicant reached Litchi. The distribution thesis, made countable.
create table referral_sources (
  id            uuid primary key default gen_random_uuid(),
  code          citext not null unique,
  label         text not null,
  agency_id     uuid references agencies on delete set null,
  agent_user_id uuid references auth.users on delete set null,
  created_at    timestamptz not null default now()
);

create table applications (
  id                 uuid primary key default gen_random_uuid(),
  move_plan_id       uuid not null references move_plans on delete restrict,
  tenant_id          uuid not null references auth.users on delete restrict,
  partner_id         uuid not null references finance_partners on delete restrict,
  referral_source_id uuid references referral_sources on delete set null,
  -- The amount is the sum of the financed lines, never a typed-in figure. The
  -- constraint that it cannot exceed the costed move is enforced in the
  -- application layer against move_cost_lines; see docs/data-model.md.
  amount_requested   numeric(12,2) not null check (amount_requested > 0),
  term_weeks         integer not null check (term_weeks > 0),
  status             application_status not null default 'draft',
  decision_reason    text,
  submitted_at       timestamptz,
  decided_at         timestamptz,
  created_at         timestamptz not null default now(),
  constraint decision_has_a_reason
    check (status not in ('declined') or decision_reason is not null)
);

create index on applications (tenant_id);
create index on applications (status);

create table facilities (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references applications on delete restrict unique,
  amount_advanced   numeric(12,2) not null check (amount_advanced > 0),
  establishment_fee numeric(12,2) not null check (establishment_fee >= 0),
  annual_rate       numeric(6,4) not null check (annual_rate >= 0),
  term_weeks        integer not null check (term_weeks > 0),
  weekly_payment    numeric(12,2) not null check (weekly_payment > 0),
  total_repayable   numeric(12,2) not null check (total_repayable > 0),
  status            facility_status not null default 'pending',
  funded_at         timestamptz,
  created_at        timestamptz not null default now()
);

-- Where the money actually went. This table is the lender pitch: use of funds
-- is a record, not an assertion, and the share of a facility that never
-- touches the tenant's account is a query rather than a claim.
create table disbursements (
  id                uuid primary key default gen_random_uuid(),
  facility_id       uuid not null references facilities on delete cascade,
  move_cost_line_id uuid references move_cost_lines on delete set null,
  payee_kind        payee_kind not null,
  payee_name        text not null,
  amount            numeric(12,2) not null check (amount > 0),
  paid_at           timestamptz,
  created_at        timestamptz not null default now()
);

create index on disbursements (facility_id);

create table repayments (
  id          uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities on delete cascade,
  due_date    date not null,
  amount      numeric(12,2) not null check (amount > 0),
  status      repayment_status not null default 'scheduled',
  paid_at     timestamptz,
  method      text,
  unique (facility_id, due_date)
);

create index on repayments (facility_id, due_date);

-- What Litchi earned, and when. Paid by the partner, never by the tenant.
create table revenue_events (
  id          uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities on delete cascade,
  partner_id  uuid not null references finance_partners on delete restrict,
  kind        revenue_kind not null,
  amount      numeric(12,2) not null,
  occurred_at timestamptz not null default now()
);

create index on revenue_events (facility_id);
create index on revenue_events (occurred_at);

-- ---------------------------------------------------------------------------
-- Cross-cutting
-- ---------------------------------------------------------------------------

-- Consent is evidence, so it records which version of the wording was agreed.
-- "The customer accepted the terms" is not an answer if nobody can say which
-- terms were on the screen.
create table consents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  kind             text not null,
  document_version text not null,
  ip               inet,
  granted_at       timestamptz not null default now(),
  revoked_at       timestamptz
);

create index on consents (user_id, kind);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  channel    text not null check (channel in ('email', 'sms', 'push', 'in_app')),
  kind       text not null,
  payload    jsonb not null default '{}'::jsonb,
  sent_at    timestamptz,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index on notifications (user_id, read_at);

-- Append-only. No UPDATE or DELETE policy exists for any role, including
-- admins; see 0002_rls.sql. An audit log an operator can edit is decoration.
create table audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references auth.users on delete set null,
  actor_role app_role,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  meta       jsonb not null default '{}'::jsonb,
  at         timestamptz not null default now()
);

create index on audit_log (entity, entity_id);
create index on audit_log (at desc);
