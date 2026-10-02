-- ============================================================================
-- Migration 018 - allow built-in and saved theme preset ids
-- Safe to re-run.
-- ============================================================================

alter table public.site_settings
  drop constraint if exists site_settings_theme_preset_check;