-- ============================================================================
-- Migration 025 - remove the hard-coded wordmark default
-- Existing saved wordmarks are preserved.
-- Safe to re-run.
-- ============================================================================

alter table public.site_settings
  alter column logo_text set default '';