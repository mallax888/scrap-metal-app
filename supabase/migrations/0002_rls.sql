-- Litchi: row level security.
--
-- The privacy promise the product makes to both sides lives in this file. To
-- an agency: "you are never told the tenant's finances". To a tenant: "they
-- confirmed four facts they already held". Those are not copy — they are these
-- policies, and if a policy here is wrong the sentence on the screen is a lie.
--
-- Three things worth knowing before editing:
--
--   RLS IS ROW-LEVEL, NOT COLUMN-LEVEL. You cannot hand a role a row of
--   `tenancies` and withhold a column of it. That is why agents have no policy
--   on `tenancies` at all and read the snapshot on `verification_requests`
--   instead. Reaching for a policy on `tenancies` to "just let agents see the
--   rent" would hand them the whole row.
--
--   THE AGENT ANSWERING A LINK IS NOT AUTHENTICATED. There is no auth.uid()
--   for them, so no policy can express "the holder of this token". That path
--   goes through an Edge Function with service_role which validates the token
--   and returns the five fields — never the table. RLS protects the portal;
--   token possession protects the link.
--
--   service_role BYPASSES ALL OF THIS. Anything reachable with the service key
--   is outside these guarantees, so it belongs in reviewed server code, never
--   in anything the browser can reach.

-- ---------------------------------------------------------------------------
-- Nothing is granted by default
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all routines in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
--
-- SECURITY DEFINER with an empty search_path: these run with the definer's
-- rights, so an attacker-controlled search_path would otherwise let them
-- resolve to a different `user_roles`. Everything inside is schema-qualified.
--
-- auth.uid() is wrapped in a scalar sub-select so the planner evaluates it
-- once per statement instead of once per row.
-- ---------------------------------------------------------------------------

create or replace function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = check_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin'::public.app_role);
$$;

create or replace function public.is_member_of(agency uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.agency_members
    where agency_id = agency and user_id = (select auth.uid())
  );
$$;

grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_member_of(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere. A table with RLS off and a grant on is public.
-- ---------------------------------------------------------------------------

alter table profiles               enable row level security;
alter table user_roles             enable row level security;
alter table agencies               enable row level security;
alter table agency_domains         enable row level security;
alter table agency_members         enable row level security;
alter table properties             enable row level security;
alter table tenancies              enable row level security;
alter table tenancy_documents      enable row level security;
alter table tenancy_extractions    enable row level security;
alter table verification_requests  enable row level security;
alter table verification_responses enable row level security;
alter table move_plans             enable row level security;
alter table move_cost_lines        enable row level security;
alter table finance_partners       enable row level security;
alter table partner_commercials    enable row level security;
alter table referral_sources       enable row level security;
alter table applications           enable row level security;
alter table facilities             enable row level security;
alter table disbursements          enable row level security;
alter table repayments             enable row level security;
alter table revenue_events         enable row level security;
alter table consents               enable row level security;
alter table notifications          enable row level security;
alter table audit_log              enable row level security;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

grant select, update on profiles to authenticated;

create policy profiles_self_select on profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());

create policy profiles_self_update on profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Read your own role; never write any. There is deliberately no INSERT,
-- UPDATE or DELETE policy on this table for any application role, which is
-- what stops a tenant granting themselves 'admin'. Role changes are a
-- service_role operation and land in audit_log.
grant select on user_roles to authenticated;

create policy user_roles_self_select on user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

grant select on agencies to authenticated;

create policy agencies_member_select on agencies
  for select to authenticated
  using (public.is_member_of(id) or public.is_admin());

-- Admin only: this is the control that stops a tenant and an accomplice
-- verifying their own tenancy, so agents must not be able to add a domain.
create policy agency_domains_admin on agency_domains
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on agency_domains to authenticated;
grant select on agency_members to authenticated;

create policy agency_members_select on agency_members
  for select to authenticated
  using (public.is_member_of(agency_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- The tenancy
--
-- Note what is absent: any policy granting an agent access to `tenancies`,
-- `tenancy_documents` or `tenancy_extractions`. That absence is the design.
-- ---------------------------------------------------------------------------

grant select on properties to authenticated;

create policy properties_select on properties
  for select to authenticated
  using (
    public.is_admin()
    or public.is_member_of(agency_id)
    or exists (
      select 1 from tenancies t
      where t.property_id = properties.id and t.tenant_id = (select auth.uid())
    )
  );

grant select, insert, update on tenancies to authenticated;

create policy tenancies_own_select on tenancies
  for select to authenticated
  using (tenant_id = (select auth.uid()) or public.is_admin());

create policy tenancies_own_insert on tenancies
  for insert to authenticated
  with check (tenant_id = (select auth.uid()));

-- A tenant may correct their own tenancy, but not reassign it to someone else.
create policy tenancies_own_update on tenancies
  for update to authenticated
  using (tenant_id = (select auth.uid()))
  with check (tenant_id = (select auth.uid()));

-- Documents: the tenant, and nobody else through the API. Not agents, and
-- deliberately not admins either — the agreement is needed to read five fields
-- and for nothing after that, so support access is a reviewed service_role
-- action that writes to audit_log, not a row in somebody's dashboard.
grant select, insert, delete on tenancy_documents to authenticated;

create policy tenancy_documents_own on tenancy_documents
  for all to authenticated
  using (
    exists (
      select 1 from tenancies t
      where t.id = tenancy_documents.tenancy_id and t.tenant_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from tenancies t
      where t.id = tenancy_documents.tenancy_id and t.tenant_id = (select auth.uid())
    )
  );

grant select on tenancy_extractions to authenticated;

create policy tenancy_extractions_own_select on tenancy_extractions
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from tenancy_documents d
      join tenancies t on t.id = d.tenancy_id
      where d.id = tenancy_extractions.document_id and t.tenant_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------

-- The agent's entire window onto a tenancy: five snapshot columns, scoped to
-- their own agency. No INSERT or UPDATE — requests are issued by an Edge
-- Function that checks the recipient domain against agency_domains first.
grant select on verification_requests to authenticated;

create policy verification_requests_agency_select on verification_requests
  for select to authenticated
  using (public.is_member_of(agency_id) or public.is_admin());

create policy verification_requests_tenant_select on verification_requests
  for select to authenticated
  using (
    exists (
      select 1 from tenancies t
      where t.id = verification_requests.tenancy_id and t.tenant_id = (select auth.uid())
    )
  );

grant select, insert on verification_responses to authenticated;

-- An agent signed into the portal may answer. The tokenised link has no
-- authenticated user and goes through service_role instead.
create policy verification_responses_agency_insert on verification_responses
  for insert to authenticated
  with check (
    exists (
      select 1 from verification_requests r
      where r.id = verification_responses.request_id
        and public.is_member_of(r.agency_id)
        and r.status = 'awaiting'
        and r.expires_at > now()
    )
  );

create policy verification_responses_select on verification_responses
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from verification_requests r
      where r.id = verification_responses.request_id
        and (
          public.is_member_of(r.agency_id)
          or exists (
            select 1 from tenancies t
            where t.id = r.tenancy_id and t.tenant_id = (select auth.uid())
          )
        )
    )
  );

-- No UPDATE or DELETE policy anywhere: an answer is written once.

-- ---------------------------------------------------------------------------
-- The move
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on move_plans to authenticated;

create policy move_plans_own on move_plans
  for all to authenticated
  using (tenant_id = (select auth.uid()))
  with check (tenant_id = (select auth.uid()));

create policy move_plans_admin_select on move_plans
  for select to authenticated using (public.is_admin());

grant select, insert, update, delete on move_cost_lines to authenticated;

create policy move_cost_lines_own on move_cost_lines
  for all to authenticated
  using (
    exists (
      select 1 from move_plans p
      where p.id = move_cost_lines.plan_id and p.tenant_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from move_plans p
      where p.id = move_cost_lines.plan_id and p.tenant_id = (select auth.uid())
    )
  );

create policy move_cost_lines_admin_select on move_cost_lines
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------------

-- The lender's name, FSPR number, disputes scheme and rate are disclosure: the
-- applicant is entitled to all of it before applying.
grant select on finance_partners to authenticated;

create policy finance_partners_read on finance_partners
  for select to authenticated using (true);

-- What Litchi is paid is commercially sensitive and is NOT read from here by
-- the app. The tenant-facing disclosure reads revenue_events for their own
-- facility — what was actually earned on their deal, rather than the rate card
-- for everybody's.
create policy partner_commercials_admin on partner_commercials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on partner_commercials to authenticated;

grant select on referral_sources to authenticated;

create policy referral_sources_select on referral_sources
  for select to authenticated
  using (public.is_admin() or public.is_member_of(agency_id));

grant select, insert, update on applications to authenticated;

create policy applications_own_select on applications
  for select to authenticated
  using (tenant_id = (select auth.uid()) or public.is_admin());

create policy applications_own_insert on applications
  for insert to authenticated
  with check (tenant_id = (select auth.uid()) and status = 'draft');

-- A tenant may edit or withdraw their own application while it is still
-- theirs. Once submitted it belongs to the assessment, and only the partner
-- integration (service_role) moves it after that.
create policy applications_own_update on applications
  for update to authenticated
  using (tenant_id = (select auth.uid()) and status in ('draft', 'submitted'))
  with check (tenant_id = (select auth.uid()) and status in ('draft', 'submitted', 'withdrawn'));

grant select on facilities to authenticated;

create policy facilities_own_select on facilities
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from applications a
      where a.id = facilities.application_id and a.tenant_id = (select auth.uid())
    )
  );

grant select on disbursements to authenticated;

create policy disbursements_own_select on disbursements
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from facilities f
      join applications a on a.id = f.application_id
      where f.id = disbursements.facility_id and a.tenant_id = (select auth.uid())
    )
  );

grant select on repayments to authenticated;

create policy repayments_own_select on repayments
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from facilities f
      join applications a on a.id = f.application_id
      where f.id = repayments.facility_id and a.tenant_id = (select auth.uid())
    )
  );

grant select on revenue_events to authenticated;

create policy revenue_events_own_select on revenue_events
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from facilities f
      join applications a on a.id = f.application_id
      where f.id = revenue_events.facility_id and a.tenant_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Cross-cutting
-- ---------------------------------------------------------------------------

grant select, insert on consents to authenticated;

create policy consents_own_select on consents
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy consents_own_insert on consents
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- No UPDATE: withdrawing consent inserts a new row rather than rewriting the
-- record of having given it.

grant select on notifications to authenticated;
-- Column-level privilege, which Postgres does support even though RLS does
-- not: the only thing a recipient may change about a notification is whether
-- they have read it.
grant update (read_at) on notifications to authenticated;

create policy notifications_own_select on notifications
  for select to authenticated using (user_id = (select auth.uid()));

create policy notifications_own_update on notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Append-only, for everyone. There is no UPDATE or DELETE policy and no grant
-- for either, including for admins: an audit log an operator can edit is
-- decoration rather than evidence.
grant select, insert on audit_log to authenticated;

create policy audit_log_admin_select on audit_log
  for select to authenticated using (public.is_admin());

create policy audit_log_insert on audit_log
  for insert to authenticated with check (actor_id = (select auth.uid()));
