-- ============================================================================
--  Migration 002 — theme settings
--  Run this in Supabase → SQL Editor if you already ran schema.sql.
--  (schema.sql now includes these columns, so a fresh install can skip this.)
--  Safe to re-run.
-- ============================================================================

alter table public.site_settings
  add column if not exists hero_layout    text not null default 'editorial',
  add column if not exists hero_image_url text,
  add column if not exists theme_preset   text not null default 'obsidian',
  add column if not exists accent_color   text not null default '#e9a94b',
  add column if not exists font_pair      text not null default 'inter';

-- Guard against typos written straight to the database. The app falls back to
-- the default when it meets a value it doesn't know, but this keeps the data
-- honest at the source.
alter table public.site_settings drop constraint if exists site_settings_hero_layout_check;
alter table public.site_settings add constraint site_settings_hero_layout_check
  check (hero_layout in ('editorial', 'portrait', 'split', 'studio', 'profile'));

alter table public.site_settings drop constraint if exists site_settings_theme_preset_check;
alter table public.site_settings add constraint site_settings_theme_preset_check
  check (theme_preset in ('obsidian', 'midnight', 'slate', 'espresso'));

alter table public.site_settings drop constraint if exists site_settings_font_pair_check;
alter table public.site_settings add constraint site_settings_font_pair_check
  check (font_pair in ('inter', 'sora', 'space', 'outfit', 'serif'));

alter table public.site_settings drop constraint if exists site_settings_accent_color_check;
alter table public.site_settings add constraint site_settings_accent_color_check
  check (accent_color ~* '^#[0-9a-f]{6}$');

-- ============================================================================
--  Done. Reload /admin — a "Theme" tab is now available.
-- ============================================================================
