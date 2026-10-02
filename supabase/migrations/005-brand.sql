-- ============================================================================
--  Migration 005 — editable logo and favicon
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists logo_url     text,
  add column if not exists favicon_url  text,
  -- Empty until a wordmark is configured in the Theme editor.
  add column if not exists logo_text    text not null default '';

-- ============================================================================
--  Done. Reload /admin → Theme → Brand.
-- ============================================================================
