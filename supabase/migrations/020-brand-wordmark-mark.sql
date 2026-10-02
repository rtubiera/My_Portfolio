-- ============================================================================
-- Migration 020 - configurable wordmark mark
-- Stores the symbol shown beside the navigation wordmark.
-- Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists logo_mark text not null default 'dot';

alter table public.site_settings
  drop constraint if exists site_settings_logo_mark_check;

alter table public.site_settings
  add constraint site_settings_logo_mark_check
  check (logo_mark in ('dot', 'sparkle', 'flower', 'heart', 'star', 'none'));