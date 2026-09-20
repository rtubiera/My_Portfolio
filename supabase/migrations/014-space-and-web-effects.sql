-- ============================================================================
--  Migration 014 — space and web effects
--  Adds astronaut (drifting astronauts, a moon and a starfield),
--  websling (figures swinging past on webs), and galaxy (the Milky Way band).
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

-- One list, used by both the site default and every schedule.
alter table public.site_settings drop constraint if exists site_settings_background_effect_check;
alter table public.site_settings add constraint site_settings_background_effect_check
  check (background_effect in (
    'none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts',
    'bats', 'fireworks', 'leaves', 'petals', 'fireflies', 'matrix',
    'astronaut', 'websling', 'galaxy'
  ));

alter table public.effect_schedules drop constraint if exists effect_schedules_effect_check;
alter table public.effect_schedules add constraint effect_schedules_effect_check
  check (effect in (
    'none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts',
    'bats', 'fireworks', 'leaves', 'petals', 'fireflies', 'matrix',
    'astronaut', 'websling', 'galaxy'
  ));

-- ============================================================================
--  Done. Reload /admin → Theme → Background effect.
--
--  Spacewalk and Web-slinger are scenes rather than particle storms — they
--  draw a handful of large figures, so "Heavy" adds one or two more rather
--  than filling the screen. Milky Way behaves the usual way: intensity scales
--  the star count and how strongly the clouds show. All three are eligible for
--  rotation like every other effect.
-- ============================================================================
