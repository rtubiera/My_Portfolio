-- ============================================================================
-- Migration 022 - dark wordmark favicon default
-- Updates only the original generated-icon colors; custom choices are kept.
-- Safe to re-run.
-- ============================================================================

update public.site_settings
set favicon_bg_color = '#151313'
where favicon_bg_color = '#e9a94b';

update public.site_settings
set favicon_text_color = '#f5f0ef'
where favicon_text_color = '#12100b';

alter table public.site_settings
  alter column favicon_bg_color set default '#151313',
  alter column favicon_text_color set default '#f5f0ef';