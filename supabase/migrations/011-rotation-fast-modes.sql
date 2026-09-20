-- ============================================================================
--  Migration 011 — faster rotation intervals
--  Adds 'minute' (for checking rotation works without waiting a day)
--  and 'hourly'.
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.site_settings drop constraint if exists site_settings_effect_rotation_check;
alter table public.site_settings add constraint site_settings_effect_rotation_check
  check (effect_rotation in
    ('off', 'minute', 'hourly', 'daily', 'weekly', 'monthly'));

-- ============================================================================
--  Done. Reload /admin → Theme → Background effect → Rotation.
--
--  'minute' is a testing aid — it changes the effect every 60 seconds, which
--  is far too busy for real visitors. Switch back to daily once you have seen
--  it working.
-- ============================================================================
