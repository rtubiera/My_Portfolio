-- ============================================================================
-- Migration 024 - match generated favicon to nav preview
-- Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists favicon_match_nav boolean not null default true;