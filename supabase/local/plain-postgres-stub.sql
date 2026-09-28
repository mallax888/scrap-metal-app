-- Stand-ins for what Supabase provides, so the migrations and the RLS tests
-- can be run against a plain PostgreSQL 16 without a Supabase project.
--
-- Deliberately in neither migrations/ nor tests/: `supabase db reset` applies
-- everything in the first, and `supabase test db` runs everything in the
-- second. This belongs to neither — against a real project all of it already
-- exists.
--
--   createdb litchi
--   psql -d litchi -f supabase/local/plain-postgres-stub.sql
--   psql -d litchi -c 'create schema if not exists extensions'
--   psql -d litchi -c 'create extension pgtap with schema extensions'
--   psql -d litchi -c 'grant usage on schema extensions to authenticated'
--   psql -d litchi -c 'grant execute on all functions in schema extensions to authenticated'
--   psql -d litchi -f supabase/migrations/0001_schema.sql   # ...and 0002-0004
--   psql -d litchi -f supabase/tests/rls.test.sql
--
-- It is a stub: auth.uid() here trusts the session setting, and the real one
-- does not. Passing against this is necessary, not sufficient.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- Roles are cluster-wide, so creating them twice is an error rather than a
-- no-op. Supabase ships them already made.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon')
    then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated')
    then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role')
    then create role service_role nologin bypassrls; end if;
end $$;

create schema auth;
create schema storage;

create table auth.users (
  id    uuid primary key,
  email text
);

-- Supabase reads the caller's identity out of the request's JWT claims. The
-- real one is stricter; this is enough to drive the policies.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json ->> 'sub', ''
  )::uuid;
$$;

create table storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean not null default false,
  file_size_limit    bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets,
  name       text,
  owner      uuid
);

alter table storage.objects enable row level security;

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select string_to_array(name, '/');
$$;

grant usage on schema auth, storage, public to anon, authenticated, service_role;
grant select on auth.users to service_role;
