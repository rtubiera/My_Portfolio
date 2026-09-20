-- ============================================================================
--  Migration 010 — holiday effects
--  Adds bats (Halloween), fireworks (New Year), leaves (autumn),
--  petals (spring), fireflies, and matrix.
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

-- One list, used by both the site default and every schedule.
alter table public.site_settings drop constraint if exists site_settings_background_effect_check;
alter table public.site_settings add constraint site_settings_background_effect_check
  check (background_effect in (
    'none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts',
    'bats', 'fireworks', 'leaves', 'petals', 'fireflies', 'matrix'
  ));

alter table public.effect_schedules drop constraint if exists effect_schedules_effect_check;
alter table public.effect_schedules add constraint effect_schedules_effect_check
  check (effect in (
    'none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts',
    'bats', 'fireworks', 'leaves', 'petals', 'fireflies', 'matrix'
  ));

-- ============================================================================
--  Done. Reload /admin → Theme → Background effect.
--
--  The Schedules panel has an "Add holiday presets" button that creates the
--  common ones in one go — every date is editable afterwards, and nothing is
--  duplicated if you press it twice.
-- ============================================================================
