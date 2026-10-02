-- ============================================================================
-- Migration 021 - configurable generated favicon colors
-- Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists favicon_bg_color text not null default '#e9a94b',
  add column if not exists favicon_text_color text not null default '#12100b';

alter table public.site_settings
  drop constraint if exists site_settings_favicon_bg_color_check,
  drop constraint if exists site_settings_favicon_text_color_check;

alter table public.site_settings
  add constraint site_settings_favicon_bg_color_check
    check (favicon_bg_color ~* '^#[0-9a-f]{6}$'),
  add constraint site_settings_favicon_text_color_check
    check (favicon_text_color ~* '^#[0-9a-f]{6}$');