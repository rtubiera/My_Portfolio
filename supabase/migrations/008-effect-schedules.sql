-- ============================================================================
--  Migration 008 — scheduled background effects
--  Snow on 25 Dec, confetti on your birthday, and so on.
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Two celebration effects to schedule
-- ---------------------------------------------------------------------------

alter table public.site_settings drop constraint if exists site_settings_background_effect_check;
alter table public.site_settings add constraint site_settings_background_effect_check
  check (background_effect in
    ('none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts'));

-- ---------------------------------------------------------------------------
--  2. Schedules
--
--  Three kinds of rule, each using a different pair of columns:
--
--    annual   month/day → month/day   e.g. 25 Dec, or 25–30 Dec, every year
--    monthly  day → day               e.g. the 1st to the 3rd of every month
--    once     date → date             a specific window, one time only
--
--  Ranges may wrap: 28 Dec → 3 Jan is a valid annual rule, and 28 → 3 is a
--  valid monthly one. The app handles the wrap; see resolveScheduledEffect().
-- ---------------------------------------------------------------------------

create table if not exists public.effect_schedules (
  id          uuid primary key default gen_random_uuid(),
  label       text not null default 'New schedule',
  effect      text not null default 'snow',
  intensity   text not null default 'medium',
  recurrence  text not null default 'annual',

  -- annual (1-12 / 1-31) and monthly (day only)
  start_month int,
  start_day   int,
  end_month   int,
  end_day     int,

  -- once
  start_date  date,
  end_date    date,

  -- Highest priority wins when more than one rule matches today.
  priority    int not null default 0,
  enabled     boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),

  constraint effect_schedules_effect_check check (effect in
    ('none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts')),
  constraint effect_schedules_intensity_check check (intensity in
    ('subtle', 'medium', 'heavy')),
  constraint effect_schedules_recurrence_check check (recurrence in
    ('annual', 'monthly', 'once')),
  constraint effect_schedules_start_month_check check (start_month is null or start_month between 1 and 12),
  constraint effect_schedules_end_month_check   check (end_month   is null or end_month   between 1 and 12),
  constraint effect_schedules_start_day_check   check (start_day   is null or start_day   between 1 and 31),
  constraint effect_schedules_end_day_check     check (end_day     is null or end_day     between 1 and 31)
);

alter table public.effect_schedules enable row level security;

drop policy if exists "public read effect_schedules" on public.effect_schedules;
create policy "public read effect_schedules"
  on public.effect_schedules for select using (true);

drop policy if exists "authenticated write effect_schedules" on public.effect_schedules;
create policy "authenticated write effect_schedules"
  on public.effect_schedules for all to authenticated
  using (true) with check (true);

-- ============================================================================
--  Done. Reload /admin → Theme → Background effect → Schedules.
-- ============================================================================
