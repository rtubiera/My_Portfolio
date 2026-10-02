-- ============================================================================
-- Migration 016 - hero templates
-- Adds the Studio and Profile hero templates from the Theme editor.
-- Safe to re-run.
-- ============================================================================

alter table public.site_settings
  drop constraint if exists site_settings_hero_layout_check;

alter table public.site_settings
  add constraint site_settings_hero_layout_check
  check (hero_layout in ('editorial', 'portrait', 'split', 'studio', 'profile'));
