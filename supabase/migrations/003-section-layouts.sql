-- ============================================================================
--  Migration 003 — per-section layouts
--  Lets the CMS switch how Projects, Skills and Experience are presented.
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists work_layout       text not null default 'list',
  add column if not exists skills_layout     text not null default 'grouped',
  add column if not exists experience_layout text not null default 'rows';

alter table public.site_settings drop constraint if exists site_settings_work_layout_check;
alter table public.site_settings add constraint site_settings_work_layout_check
  check (work_layout in ('list', 'grid', 'cards'));

alter table public.site_settings drop constraint if exists site_settings_skills_layout_check;
alter table public.site_settings add constraint site_settings_skills_layout_check
  check (skills_layout in ('grouped', 'icons', 'tiles'));

alter table public.site_settings drop constraint if exists site_settings_experience_layout_check;
alter table public.site_settings add constraint site_settings_experience_layout_check
  check (experience_layout in ('rows', 'timeline', 'cards'));

-- ============================================================================
--  Done. Reload /admin → Theme. Three new layout pickers are available.
-- ============================================================================
