-- ============================================================================
-- Migration 023 - gold wordmark favicon default
-- Restores the referenced gold tile with dark lettering.
-- Safe to re-run.
-- ============================================================================

update public.site_settings
set favicon_bg_color = '#e9a94b'
where favicon_bg_color = '#151313';

update public.site_settings
set favicon_text_color = '#12100b'
where favicon_text_color = '#f5f0ef';

alter table public.site_settings
  alter column favicon_bg_color set default '#e9a94b',
  alter column favicon_text_color set default '#12100b';