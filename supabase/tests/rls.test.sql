-- Litchi: adversarial tests for row level security.
--
-- These are attacks, not features. Every one of them is a sentence the product
-- says out loud — "your agency is never told what you applied for", "you
-- cannot borrow more than the move costs" — expressed as a thing that must
-- fail. A policy file that has only been read is a policy file that has not
-- been tested.
--
-- Run with:  supabase test db
--
-- The pattern for impersonation is Supabase's: become the `authenticated`
-- role and set the JWT claims that auth.uid() reads. `set local` keeps it
-- inside the transaction, so each test starts from a known state.

begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

-- ---------------------------------------------------------------------------
-- Fixtures: two tenants at two agencies, one agent, one admin.
-- ---------------------------------------------------------------------------

set local role postgres;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'tenant.a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'tenant.b@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'agent@example-property.test'),
  ('44444444-4444-4444-4444-444444444444', 'admin@litchi.test');

insert into profiles (id, full_name, email) values
  ('11111111-1111-1111-1111-111111111111', 'Tenant A', 'tenant.a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'Tenant B', 'tenant.b@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'Priya Raman', 'agent@example-property.test'),
  ('44444444-4444-4444-4444-444444444444', 'Ops', 'admin@litchi.test');

insert into user_roles (user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'tenant'),
  ('22222222-2222-2222-2222-222222222222', 'tenant'),
  ('33333333-3333-3333-3333-333333333333', 'agent'),
  ('44444444-4444-4444-4444-444444444444', 'admin');

insert into agencies (id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Example Property Co.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Harbourline Realty');

insert into agency_domains (agency_id, domain, verified_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'example-property.test', now());

insert into agency_members (agency_id, user_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333');

insert into properties (id, agency_id, address_line, suburb) values
  ('bbbbbbbb-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001', '12 Example Street', 'Mount Eden'),
  ('bbbbbbbb-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000002', '7 Kereru Lane', 'Massey');

insert into tenancies (id, property_id, tenant_id, agency_id, weekly_rent, bond_amount, start_date, status)
values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001',
   700, 2800, '2026-07-14', 'active'),
  ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000002',
   690, 2760, '2026-10-03', 'active');

insert into move_plans (id, tenancy_id, tenant_id, property_size) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'medium');

insert into move_cost_lines (plan_id, kind, label, amount, payee_kind, coverage) values
  ('dddddddd-0000-0000-0000-000000000001', 'bond', 'Bond', 2800, 'agent', 'litchi'),
  ('dddddddd-0000-0000-0000-000000000001', 'rent-advance', 'Rent in advance', 1400, 'agent', 'self');

insert into finance_partners
  (id, name, fspr, disputes_scheme, annual_rate, establishment_fee, min_advance, max_advance, terms_weeks)
values
  ('eeeeeeee-0000-0000-0000-000000000001', 'Kōwhai Finance Ltd', 'FSP-748219',
   'Financial Services Complaints Ltd', 0.1895, 240, 500, 10000, '{26,39,52}');

insert into applications (id, move_plan_id, tenant_id, partner_id, amount_requested, term_weeks, status)
values
  ('ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'eeeeeeee-0000-0000-0000-000000000001',
   2800, 52, 'submitted');

insert into verification_requests
  (id, tenancy_id, agency_id, sent_to_email,
   snapshot_tenant_name, snapshot_address, snapshot_weekly_rent, snapshot_bond_amount,
   snapshot_start_date, token_hash, expires_at, created_by)
values
  ('99999999-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001', 'agent@example-property.test',
   'Tenant A', '12 Example Street', 700, 2800, '2026-07-14',
   digest('a-secret-token', 'sha256'), now() + interval '7 days',
   '11111111-1111-1111-1111-111111111111');

-- ---------------------------------------------------------------------------
-- Attack 1: one tenant reading another tenant's tenancy.
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*) from tenancies)::int, 1,
  'a tenant sees only their own tenancy'
);

select is(
  (select count(*) from tenancies where tenant_id = '22222222-2222-2222-2222-222222222222')::int, 0,
  'a tenant cannot read another tenant''s tenancy'
);

-- ---------------------------------------------------------------------------
-- Attack 2: privilege escalation by granting yourself a role.
-- ---------------------------------------------------------------------------

select throws_ok(
  $$insert into user_roles (user_id, role)
    values ('11111111-1111-1111-1111-111111111111', 'admin')$$,
  '42501',
  null,
  'a tenant cannot grant themselves admin'
);

select is(
  public.is_admin(), false,
  'and is_admin() still says no'
);

-- ---------------------------------------------------------------------------
-- Attack 3: borrowing more than the move costs.
--
-- The costed move is 2800 + 1400 = 4200. Asking for a cent more must fail
-- regardless of what any client believes.
-- ---------------------------------------------------------------------------

select throws_ok(
  $$insert into applications
      (move_plan_id, tenant_id, partner_id, amount_requested, term_weeks, status)
    values ('dddddddd-0000-0000-0000-000000000001',
            '11111111-1111-1111-1111-111111111111',
            'eeeeeeee-0000-0000-0000-000000000001', 4200.01, 52, 'draft')$$,
  '23514',
  null,
  'a request above the costed move is refused'
);

select lives_ok(
  $$insert into applications
      (move_plan_id, tenant_id, partner_id, amount_requested, term_weeks, status)
    values ('dddddddd-0000-0000-0000-000000000001',
            '11111111-1111-1111-1111-111111111111',
            'eeeeeeee-0000-0000-0000-000000000001', 4200, 52, 'draft')$$,
  'a request equal to the costed move is allowed'
);

-- ---------------------------------------------------------------------------
-- Attack 4: an application filed in somebody else's name.
-- ---------------------------------------------------------------------------

select throws_ok(
  $$insert into applications
      (move_plan_id, tenant_id, partner_id, amount_requested, term_weeks, status)
    values ('dddddddd-0000-0000-0000-000000000001',
            '22222222-2222-2222-2222-222222222222',
            'eeeeeeee-0000-0000-0000-000000000001', 1000, 52, 'draft')$$,
  '42501',
  null,
  'a tenant cannot file an application as another tenant'
);

-- ---------------------------------------------------------------------------
-- Attack 5: the agency reading anything about the tenant's finances.
--
-- This is the promise made on the agent's own screen, so it gets the most
-- tests. The agent is a member of Example Property Co. only.
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is(
  (select count(*) from tenancies)::int, 0,
  'an agent cannot read the tenancies table at all'
);

select is(
  (select count(*) from applications)::int, 0,
  'an agent cannot see that an application exists'
);

select is(
  (select count(*) from move_plans)::int, 0,
  'an agent cannot see the costed move'
);

select is(
  (select count(*) from tenancy_documents)::int, 0,
  'an agent cannot reach the tenancy agreement'
);

-- What they CAN see: the five snapshot fields on their own agency's request.
select is(
  (select count(*) from verification_requests)::int, 1,
  'an agent sees verification requests for their own agency'
);

-- ---------------------------------------------------------------------------
-- Attack 6: an agent at a different agency reading this request.
-- ---------------------------------------------------------------------------

set local role postgres;
insert into auth.users (id, email) values
  ('55555555-5555-5555-5555-555555555555', 'rival@harbourline.test');
insert into user_roles (user_id, role) values
  ('55555555-5555-5555-5555-555555555555', 'agent');
insert into agency_members (agency_id, user_id) values
  ('aaaaaaaa-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555');

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

select is(
  (select count(*) from verification_requests)::int, 0,
  'an agent at another agency sees no requests'
);

-- ---------------------------------------------------------------------------
-- Attack 7: issuing a verification to an address you control.
--
-- The whole moat depends on the agency being real. A tenant naming their own
-- mailbox as the property manager must be refused.
-- ---------------------------------------------------------------------------

set local role postgres;

select throws_ok(
  $$insert into verification_requests
      (tenancy_id, agency_id, sent_to_email,
       snapshot_tenant_name, snapshot_address, snapshot_weekly_rent,
       snapshot_bond_amount, snapshot_start_date, token_hash, expires_at, created_by)
    values ('cccccccc-0000-0000-0000-000000000001',
            'aaaaaaaa-0000-0000-0000-000000000001', 'me@gmail.test',
            'Tenant A', '12 Example Street', 700, 2800, '2026-07-14',
            digest('another-token','sha256'), now() + interval '7 days',
            '11111111-1111-1111-1111-111111111111')$$,
  '23514',
  null,
  'a verification cannot be sent to an unregistered domain'
);

-- ---------------------------------------------------------------------------
-- Attack 8: rewriting history.
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';

select throws_ok(
  $$delete from audit_log$$,
  '42501',
  null,
  'not even an admin can delete the audit log'
);

select * from finish();

rollback;
