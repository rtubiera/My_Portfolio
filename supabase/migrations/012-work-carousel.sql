-- ============================================================================
--  Migration 012 — projects carousel + "show more"
--  Adds the 'carousel' work layout and a limit for how many projects the home
--  page lists before the "Show more" button.
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.site_settings drop constraint if exists site_settings_work_layout_check;
alter table public.site_settings add constraint site_settings_work_layout_check
  check (work_layout in ('list', 'grid', 'cards', 'carousel'));

-- 0 means "no limit" — every published project is listed.
alter table public.site_settings
  add column if not exists work_limit int not null default 6;

alter table public.site_settings drop constraint if exists site_settings_work_limit_check;
alter table public.site_settings add constraint site_settings_work_limit_check
  check (work_limit between 0 and 99);

-- ============================================================================
--  Done. Reload /admin → Theme → Projects section. There is a fourth layout,
--  and a "Projects shown at first" row underneath it.
--
--  The carousel pages through every project itself, so the limit only applies
--  to the List, Grid and Cards layouts.
-- ============================================================================
