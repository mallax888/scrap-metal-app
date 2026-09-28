-- Litchi: document storage.
--
-- Tenancy agreements are the most sensitive thing the platform touches: a
-- tenant's name, their landlord's details, sometimes a guarantor's. They are
-- collected to read five fields off and are useful for nothing afterwards.
--
-- The bucket is private. Nothing is ever served from a public URL — the app
-- issues a short-lived signed URL when the tenant opens their own document,
-- and the agency is never given one at all.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenancy-documents',
  'tenancy-documents',
  false,
  10 * 1024 * 1024,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do nothing;

-- Path convention: tenancies/<tenancy_id>/<filename>. The tenancy id is the
-- second path segment, which is what the policies key on. Anything written
-- outside that shape matches no policy and is therefore refused.

create policy tenancy_documents_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tenancy-documents'
    and exists (
      select 1 from public.tenancies t
      where t.id::text = (storage.foldername(name))[2]
        and t.tenant_id = (select auth.uid())
    )
  );

create policy tenancy_documents_owner_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tenancy-documents'
    and (storage.foldername(name))[1] = 'tenancies'
    and exists (
      select 1 from public.tenancies t
      where t.id::text = (storage.foldername(name))[2]
        and t.tenant_id = (select auth.uid())
    )
  );

create policy tenancy_documents_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tenancy-documents'
    and exists (
      select 1 from public.tenancies t
      where t.id::text = (storage.foldername(name))[2]
        and t.tenant_id = (select auth.uid())
    )
  );

-- Note what has no policy here: agents and admins. An agency is never sent the
-- document — that is stated on their own verification screen — and staff
-- access to a tenancy agreement is a reviewed service_role action that writes
-- to audit_log, not a click in a dashboard.
--
-- Retention: tenancy_documents.delete_after is set when a facility is repaid
-- or an application is declined. A scheduled job deletes the object and the
-- catalogue row together. Storage does not expire anything on its own, so
-- without that job the column is just a good intention.
