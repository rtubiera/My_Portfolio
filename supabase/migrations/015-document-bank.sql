-- ============================================================================
--  Migration 015 — document bank
--  Private storage for the paperwork a career leaves behind: certificates of
--  employment, training certificates, clearances, contracts, payslips.
--  Run in Supabase → SQL Editor. Safe to re-run.
--
--  Two things here are deliberately unlike the rest of the schema:
--
--   1. The table has NO public read policy, like job_applications. The anon
--      key cannot see it at all.
--   2. The files go in their own bucket, and that bucket is NOT public. The
--      `media` bucket is world-readable by design — right for a project cover,
--      wrong for a document with your name, employer and signature on it.
--      These are read through short-lived signed URLs instead.
-- ============================================================================

create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  -- What sort of paperwork it is. See src/lib/documents.ts for the list.
  kind        text not null default 'other',
  issuer      text not null default '',
  reference   text not null default '',   -- certificate or serial number
  issued_on   date,
  -- Clearances and IDs lapse; the CMS flags these as they approach.
  expires_on  date,
  -- Path inside the `documents` bucket. The row is metadata only.
  file_path   text not null,
  -- The name the file was uploaded under. Stored separately because the path
  -- is generated — real filenames carry spaces, accents and the odd slash.
  file_name   text not null default '',
  file_size   bigint not null default 0,
  mime_type   text not null default '',
  notes       text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),

  constraint documents_kind_check check (kind in
    ('coe', 'certificate', 'diploma', 'clearance', 'government',
     'contract', 'payslip', 'resume', 'other')),
  constraint documents_file_size_check check (file_size >= 0)
);

-- The bank lists newest first and filters on kind.
create index if not exists documents_created_at_idx
  on public.documents (created_at desc);
create index if not exists documents_kind_idx
  on public.documents (kind);

alter table public.documents enable row level security;

-- Deliberately no "public read" policy: private data, signed-in access only.
drop policy if exists "authenticated write documents" on public.documents;
create policy "authenticated write documents"
  on public.documents for all to authenticated
  using (true) with check (true);

-- ============================================================================
--  STORAGE — the private `documents` bucket
--
--  If the insert below fails, your project restricts DDL on the storage
--  schema. Create it in the dashboard instead:
--    Storage → New bucket → name "documents" → leave "Public bucket" OFF
--  then re-run this file for the policies.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

-- Note there is no "public read" policy to match the one on `media`. Reading
-- requires a signed-in session or a signed URL minted by one.
drop policy if exists "authenticated read documents"  on storage.objects;
drop policy if exists "authenticated write documents" on storage.objects;

create policy "authenticated read documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents');

create policy "authenticated write documents"
  on storage.objects for all to authenticated
  using (bucket_id = 'documents') with check (bucket_id = 'documents');

-- ============================================================================
--  Done. Reload /admin — there is a new "Documents" tab beside Applications.
--
--  Drop files onto the panel to add them. Each one gets a title, a kind, who
--  issued it, and optional issue/expiry dates; anything with an expiry is
--  flagged on the card as it approaches.
-- ============================================================================
