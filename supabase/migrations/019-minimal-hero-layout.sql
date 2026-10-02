-- ============================================================================
-- Migration 019 - minimal hero layout
-- Adds the centered, grid-free Minimal hero option.
-- Safe to re-run.
-- ============================================================================

alter table public.site_settings
  drop constraint if exists site_settings_hero_layout_check;

alter table public.site_settings
  add constraint site_settings_hero_layout_check
  check (hero_layout in ('editorial', 'minimal', 'portrait', 'split', 'studio', 'profile'));