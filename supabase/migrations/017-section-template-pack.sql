-- ============================================================================
-- Migration 017 - section template pack
-- Adds new presentation choices across the public portfolio.
-- Safe to re-run.
-- ============================================================================

alter table public.site_settings
  drop constraint if exists site_settings_font_pair_check,
  drop constraint if exists site_settings_work_layout_check,
  drop constraint if exists site_settings_skills_layout_check,
  drop constraint if exists site_settings_experience_layout_check,
  drop constraint if exists site_settings_about_layout_check,
  drop constraint if exists site_settings_certs_layout_check,
  drop constraint if exists site_settings_contact_layout_check,
  drop constraint if exists site_settings_background_effect_check;

alter table public.site_settings
  add constraint site_settings_font_pair_check
    check (font_pair in ('inter', 'sora', 'space', 'outfit', 'serif', 'editorial')),
  add constraint site_settings_work_layout_check
    check (work_layout in ('list', 'grid', 'cards', 'carousel', 'showcase')),
  add constraint site_settings_skills_layout_check
    check (skills_layout in ('grouped', 'icons', 'tiles', 'orbit')),
  add constraint site_settings_experience_layout_check
    check (experience_layout in ('rows', 'timeline', 'cards', 'spotlight')),
  add constraint site_settings_about_layout_check
    check (about_layout in ('sidebar', 'portrait', 'centered', 'manifesto')),
  add constraint site_settings_certs_layout_check
    check (certs_layout in ('grid', 'list', 'badges', 'shelf')),
  add constraint site_settings_contact_layout_check
    check (contact_layout in ('split', 'centered', 'cards', 'signal')),
  add constraint site_settings_background_effect_check
    check (background_effect in (
      'none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts',
      'bats', 'fireworks', 'leaves', 'petals', 'fireflies', 'matrix',
      'astronaut', 'websling', 'galaxy', 'grain'));
