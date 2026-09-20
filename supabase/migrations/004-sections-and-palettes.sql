-- ============================================================================
--  Migration 004 — About / Awards / Contact layouts, and custom palettes
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Layout choices for the three remaining sections
-- ---------------------------------------------------------------------------

alter table public.site_settings
  add column if not exists about_layout   text not null default 'sidebar',
  add column if not exists certs_layout   text not null default 'grid',
  add column if not exists contact_layout text not null default 'split';

alter table public.site_settings drop constraint if exists site_settings_about_layout_check;
alter table public.site_settings add constraint site_settings_about_layout_check
  check (about_layout in ('sidebar', 'portrait', 'centered'));

alter table public.site_settings drop constraint if exists site_settings_certs_layout_check;
alter table public.site_settings add constraint site_settings_certs_layout_check
  check (certs_layout in ('grid', 'list', 'badges'));

alter table public.site_settings drop constraint if exists site_settings_contact_layout_check;
alter table public.site_settings add constraint site_settings_contact_layout_check
  check (contact_layout in ('split', 'centered', 'cards'));

-- ---------------------------------------------------------------------------
--  2. Custom background palettes
--
--  A palette is defined by just four colours — a background and a text colour
--  for each of the dark and light modes. Every other token (panels, borders,
--  muted text) is derived from those in the app, which is what stops a
--  hand-rolled palette from falling apart.
-- ---------------------------------------------------------------------------

create table if not exists public.theme_palettes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'My palette',
  dark_bg    text not null default '#0a0a0b',
  dark_ink   text not null default '#f2f2f4',
  light_bg   text not null default '#fbfaf8',
  light_ink  text not null default '#16161a',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint theme_palettes_dark_bg_check   check (dark_bg   ~* '^#[0-9a-f]{6}$'),
  constraint theme_palettes_dark_ink_check  check (dark_ink  ~* '^#[0-9a-f]{6}$'),
  constraint theme_palettes_light_bg_check  check (light_bg  ~* '^#[0-9a-f]{6}$'),
  constraint theme_palettes_light_ink_check check (light_ink ~* '^#[0-9a-f]{6}$')
);

alter table public.theme_palettes enable row level security;

drop policy if exists "public read theme_palettes" on public.theme_palettes;
create policy "public read theme_palettes"
  on public.theme_palettes for select using (true);

drop policy if exists "authenticated write theme_palettes" on public.theme_palettes;
create policy "authenticated write theme_palettes"
  on public.theme_palettes for all to authenticated
  using (true) with check (true);

-- theme_preset now holds either a built-in id ('obsidian', 'midnight', …) or
-- the uuid of a row above, so the fixed allow-list has to go.
alter table public.site_settings drop constraint if exists site_settings_theme_preset_check;

-- ============================================================================
--  Done. Reload /admin → Theme.
-- ============================================================================
