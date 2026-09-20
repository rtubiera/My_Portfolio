-- ============================================================================
--  Migration 007 — ambient background effects
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists background_effect text not null default 'none',
  add column if not exists effect_intensity  text not null default 'subtle';

alter table public.site_settings drop constraint if exists site_settings_background_effect_check;
alter table public.site_settings add constraint site_settings_background_effect_check
  check (background_effect in ('none', 'snow', 'stars', 'constellation', 'aurora'));

alter table public.site_settings drop constraint if exists site_settings_effect_intensity_check;
alter table public.site_settings add constraint site_settings_effect_intensity_check
  check (effect_intensity in ('subtle', 'medium', 'heavy'));

-- ============================================================================
--  Done. Reload /admin → Theme → Background effect.
-- ============================================================================
