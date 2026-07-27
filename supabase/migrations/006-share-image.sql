-- ============================================================================
--  Migration 006 — social share image
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

-- The image shown when your link is pasted into LinkedIn, Slack, X, iMessage…
-- Falls back to the hero photo, then the portrait, when left empty.
alter table public.site_settings
  add column if not exists og_image_url text;

-- ============================================================================
--  Done. Set it under /admin → Profile → SEO → Share image.
--  Remember: social previews are baked in at build time, so redeploy after
--  changing anything in the SEO card.
-- ============================================================================
