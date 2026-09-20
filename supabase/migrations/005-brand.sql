-- ============================================================================
--  Migration 005 — editable logo and favicon
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists logo_url     text,
  add column if not exists favicon_url  text,
  -- Wordmark shown when no logo image is set. Defaults to the initials of the
  -- name already on the row, so the nav never falls back to something generic.
  add column if not exists logo_text    text not null default 'DJT';

-- ============================================================================
--  Done. Reload /admin → Theme → Brand.
-- ============================================================================
