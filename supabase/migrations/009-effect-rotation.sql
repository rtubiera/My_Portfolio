-- ============================================================================
--  Migration 009 — automatic effect rotation
--  Picks a different effect each day (or week, or month) with no dates set.
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists effect_rotation text   not null default 'off',
  -- Which effects rotation may choose from. Empty means "all of them".
  add column if not exists rotation_pool   text[] not null default '{}';

alter table public.site_settings drop constraint if exists site_settings_effect_rotation_check;
alter table public.site_settings add constraint site_settings_effect_rotation_check
  check (effect_rotation in ('off', 'daily', 'weekly', 'monthly'));

-- ============================================================================
--  Done. Reload /admin → Theme → Background effect → Rotation.
--
--  Precedence, highest first:
--    1. a matching schedule   (25 Dec always means snow)
--    2. rotation              (a different effect each day)
--    3. the default effect
-- ============================================================================
