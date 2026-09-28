-- Litchi: business invariants.
--
-- Rules that must hold regardless of which client wrote the row. A rule that
-- lives only in a React component is a suggestion: it survives exactly as long
-- as nobody calls the API directly, writes a second client, or ships a bug.

-- ---------------------------------------------------------------------------
-- You cannot borrow more than the move costs.
--
-- The single most important rule in the product, and the difference between
-- rental-specific finance and a personal loan wearing a moving-themed skin.
-- The UI enforces it by having no field to type a larger number into; this
-- enforces it against anything that talks to the database.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_request_within_costed_move()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  costed numeric(12,2);
begin
  select coalesce(sum(amount), 0)
    into costed
    from public.move_cost_lines
   where plan_id = new.move_plan_id;

  if new.amount_requested > costed then
    raise exception
      'Requested % exceeds the costed move of % for plan %',
      new.amount_requested, costed, new.move_plan_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger applications_within_costed_move
  before insert or update of amount_requested, move_plan_id on applications
  for each row execute function public.enforce_request_within_costed_move();

-- ---------------------------------------------------------------------------
-- A disbursement cannot exceed what was advanced.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_disbursement_within_facility()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  advanced numeric(12,2);
  already  numeric(12,2);
begin
  select amount_advanced into advanced
    from public.facilities where id = new.facility_id;

  select coalesce(sum(amount), 0) into already
    from public.disbursements
   where facility_id = new.facility_id
     and id is distinct from new.id;

  if already + new.amount > advanced then
    raise exception
      'Disbursements of % would exceed the % advanced on facility %',
      already + new.amount, advanced, new.facility_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger disbursements_within_facility
  before insert or update of amount, facility_id on disbursements
  for each row execute function public.enforce_disbursement_within_facility();

-- ---------------------------------------------------------------------------
-- An answer closes its request, and an expired request cannot be answered.
--
-- Both sides matter. Without the first, a request stays 'awaiting' forever and
-- the applicant's screen never moves. Without the second, a link that leaked
-- six months ago still works.
-- ---------------------------------------------------------------------------

create or replace function public.close_verification_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.verification_requests%rowtype;
begin
  select * into req from public.verification_requests where id = new.request_id;

  if req.status <> 'awaiting' then
    raise exception 'Verification request % has already been answered', new.request_id
      using errcode = 'check_violation';
  end if;

  if req.expires_at <= now() then
    update public.verification_requests set status = 'expired' where id = req.id;
    raise exception 'Verification request % expired on %', new.request_id, req.expires_at
      using errcode = 'check_violation';
  end if;

  update public.verification_requests
     set status = new.status
   where id = new.request_id;

  return new;
end;
$$;

create trigger verification_responses_close_request
  after insert on verification_responses
  for each row execute function public.close_verification_request();

-- ---------------------------------------------------------------------------
-- A verification may only be sent to a domain the agency has registered.
--
-- The hole this closes: the agent's email address arrives on a document the
-- TENANT uploaded, so without this a tenant and an accomplice can verify their
-- own tenancy and hand the lender a "source-verified" fiction.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_recipient_domain()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_domain public.citext;
begin
  recipient_domain := split_part(new.sent_to_email::text, '@', 2);

  if not exists (
    select 1 from public.agency_domains
     where agency_id = new.agency_id
       and domain = recipient_domain
       and verified_at is not null
  ) then
    raise exception
      'Domain % is not a verified domain for agency %', recipient_domain, new.agency_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger verification_requests_recipient_domain
  before insert on verification_requests
  for each row execute function public.enforce_recipient_domain();

-- ---------------------------------------------------------------------------
-- Housekeeping
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger move_plans_touch
  before update on move_plans
  for each row execute function public.touch_updated_at();

-- Write an audit row without the caller being able to forge the actor.
create or replace function public.log_audit(
  p_action    text,
  p_entity    text,
  p_entity_id uuid,
  p_meta      jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id, meta)
  values (
    (select auth.uid()),
    (select role from public.user_roles where user_id = (select auth.uid()) limit 1),
    p_action, p_entity, p_entity_id, p_meta
  );
end;
$$;

grant execute on function public.log_audit(text, text, uuid, jsonb) to authenticated;
