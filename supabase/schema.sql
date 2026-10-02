-- ============================================================================
--  Portfolio CMS — Supabase schema
--  Run this once in: Supabase Dashboard → SQL Editor → New query → Run
--  Safe to re-run: everything is idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. TABLES
-- ---------------------------------------------------------------------------

-- Singleton row (id = 1) holding all the "one of" content: hero, about, contact.
create table if not exists public.site_settings (
  id            int primary key default 1,
  name          text not null default '',
  role          text not null default '',
  tagline       text not null default '',
  hero_intro    text not null default '',
  about         text not null default '',
  location      text not null default '',
  email         text not null default '',
  phone         text not null default '',
  available     boolean not null default true,
  available_note text not null default '',
  avatar_url    text,
  resume_url    text,
  socials       jsonb not null default '[]'::jsonb,   -- [{label, url}]
  metrics       jsonb not null default '[]'::jsonb,   -- [{value, label}]
  seo_title     text not null default '',
  seo_description text not null default '',
  og_image_url  text,                                -- social share card image
  -- Appearance, all editable from the CMS "Theme" tab.
  logo_url       text,
  favicon_url    text,
  logo_text      text not null default '',           -- wordmark when no logo image
  logo_mark      text not null default 'dot',        -- dot | sparkle | flower | heart | star | none
  favicon_bg_color   text not null default '#e9a94b',
  favicon_text_color text not null default '#12100b',
  favicon_match_nav  boolean not null default true,
  hero_layout    text not null default 'editorial',  -- editorial | portrait | split | studio | profile
  hero_image_url text,
  theme_preset   text not null default 'obsidian',   -- obsidian | midnight | slate | espresso
  accent_color   text not null default '#e9a94b',
  font_pair      text not null default 'inter',      -- inter | sora | space | outfit | serif
  work_layout       text not null default 'list',    -- list | grid | cards | carousel
  work_limit        int  not null default 6,          -- projects before "show more"; 0 = all
  skills_layout     text not null default 'grouped', -- grouped | icons | tiles
  experience_layout text not null default 'rows',    -- rows | timeline | cards
  about_layout      text not null default 'sidebar', -- sidebar | portrait | centered
  certs_layout      text not null default 'grid',    -- grid | list | badges
  contact_layout    text not null default 'split',   -- split | centered | cards
  background_effect text not null default 'none',    -- none | snow | stars | constellation | aurora | confetti | hearts
  effect_intensity  text not null default 'subtle',  -- subtle | medium | heavy
  effect_rotation   text not null default 'off',     -- off | minute | hourly | daily | weekly | monthly
  rotation_pool     text[] not null default '{}',    -- empty = every effect
  updated_at    timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

-- Existing installs created before the theme feature pick the columns up here.
alter table public.site_settings
  add column if not exists hero_layout    text not null default 'editorial',
  add column if not exists hero_image_url text,
  add column if not exists theme_preset   text not null default 'obsidian',
  add column if not exists accent_color   text not null default '#e9a94b',
  add column if not exists font_pair      text not null default 'inter';

alter table public.site_settings drop constraint if exists site_settings_hero_layout_check;
alter table public.site_settings add constraint site_settings_hero_layout_check
  check (hero_layout in ('editorial', 'minimal', 'portrait', 'split', 'studio', 'profile'));

-- theme_preset holds either a built-in id or the uuid of a theme_palettes row,
-- so it deliberately has no allow-list constraint.
alter table public.site_settings drop constraint if exists site_settings_theme_preset_check;

alter table public.site_settings drop constraint if exists site_settings_font_pair_check;
alter table public.site_settings add constraint site_settings_font_pair_check
  check (font_pair in ('inter', 'sora', 'space', 'outfit', 'serif', 'editorial'));

alter table public.site_settings drop constraint if exists site_settings_accent_color_check;
alter table public.site_settings add constraint site_settings_accent_color_check
  check (accent_color ~* '^#[0-9a-f]{6}$');

alter table public.site_settings
  add column if not exists work_layout       text not null default 'list',
  add column if not exists work_limit        int  not null default 6,
  add column if not exists skills_layout     text not null default 'grouped',
  add column if not exists experience_layout text not null default 'rows';

alter table public.site_settings drop constraint if exists site_settings_work_layout_check;
alter table public.site_settings add constraint site_settings_work_layout_check
  check (work_layout in ('list', 'grid', 'cards', 'carousel', 'showcase'));

alter table public.site_settings drop constraint if exists site_settings_work_limit_check;
alter table public.site_settings add constraint site_settings_work_limit_check
  check (work_limit between 0 and 99);

alter table public.site_settings drop constraint if exists site_settings_skills_layout_check;
alter table public.site_settings add constraint site_settings_skills_layout_check
  check (skills_layout in ('grouped', 'icons', 'tiles', 'orbit'));

alter table public.site_settings drop constraint if exists site_settings_experience_layout_check;
alter table public.site_settings add constraint site_settings_experience_layout_check
  check (experience_layout in ('rows', 'timeline', 'cards', 'spotlight'));

alter table public.site_settings
  add column if not exists logo_url     text,
  add column if not exists favicon_url  text,
  add column if not exists logo_text    text not null default '',
  add column if not exists logo_mark    text not null default 'dot',
  add column if not exists favicon_bg_color text not null default '#e9a94b',
  add column if not exists favicon_text_color text not null default '#12100b',
  add column if not exists favicon_match_nav boolean not null default true,
  add column if not exists og_image_url text;

alter table public.site_settings drop constraint if exists site_settings_logo_mark_check;
alter table public.site_settings add constraint site_settings_logo_mark_check
  check (logo_mark in ('dot', 'sparkle', 'flower', 'heart', 'star', 'none'));

alter table public.site_settings
  drop constraint if exists site_settings_favicon_bg_color_check,
  drop constraint if exists site_settings_favicon_text_color_check;
alter table public.site_settings
  add constraint site_settings_favicon_bg_color_check
    check (favicon_bg_color ~* '^#[0-9a-f]{6}$'),
  add constraint site_settings_favicon_text_color_check
    check (favicon_text_color ~* '^#[0-9a-f]{6}$');

alter table public.site_settings
  add column if not exists about_layout   text not null default 'sidebar',
  add column if not exists certs_layout   text not null default 'grid',
  add column if not exists contact_layout text not null default 'split';

alter table public.site_settings drop constraint if exists site_settings_about_layout_check;
alter table public.site_settings add constraint site_settings_about_layout_check
  check (about_layout in ('sidebar', 'portrait', 'centered', 'manifesto'));

alter table public.site_settings drop constraint if exists site_settings_certs_layout_check;
alter table public.site_settings add constraint site_settings_certs_layout_check
  check (certs_layout in ('grid', 'list', 'badges', 'shelf'));

alter table public.site_settings drop constraint if exists site_settings_contact_layout_check;
alter table public.site_settings add constraint site_settings_contact_layout_check
  check (contact_layout in ('split', 'centered', 'cards', 'signal'));

alter table public.site_settings
  add column if not exists background_effect text not null default 'none',
  add column if not exists effect_intensity  text not null default 'subtle';

alter table public.site_settings drop constraint if exists site_settings_background_effect_check;
alter table public.site_settings add constraint site_settings_background_effect_check
  check (background_effect in (
    'none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts',
    'bats', 'fireworks', 'leaves', 'petals', 'fireflies', 'matrix',
    'astronaut', 'websling', 'galaxy', 'grain'));

alter table public.site_settings drop constraint if exists site_settings_effect_intensity_check;
alter table public.site_settings add constraint site_settings_effect_intensity_check
  check (effect_intensity in ('subtle', 'medium', 'heavy'));

alter table public.site_settings
  add column if not exists effect_rotation text   not null default 'off',
  add column if not exists rotation_pool   text[] not null default '{}';

alter table public.site_settings drop constraint if exists site_settings_effect_rotation_check;
alter table public.site_settings add constraint site_settings_effect_rotation_check
  check (effect_rotation in
    ('off', 'minute', 'hourly', 'daily', 'weekly', 'monthly'));

-- Date-driven overrides for the background effect. See migrations/008 for the
-- full rationale on the three recurrence kinds and wrap-around ranges.
create table if not exists public.effect_schedules (
  id          uuid primary key default gen_random_uuid(),
  label       text not null default 'New schedule',
  effect      text not null default 'snow',
  intensity   text not null default 'medium',
  recurrence  text not null default 'annual',
  start_month int,
  start_day   int,
  end_month   int,
  end_day     int,
  start_date  date,
  end_date    date,
  priority    int not null default 0,
  enabled     boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  constraint effect_schedules_effect_check check (effect in
    ('none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts',
     'bats', 'fireworks', 'leaves', 'petals', 'fireflies', 'matrix',
     'astronaut', 'websling', 'galaxy')),
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

-- Custom background palettes. See migrations/004 for the full rationale: a
-- palette stores only a background and a text colour per mode, and the app
-- derives every other token from those two.
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

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null default '',
  blurb       text not null default '',
  description text not null default '',
  role        text not null default '',
  year        text not null default '',
  tech        text[] not null default '{}',
  highlights  text[] not null default '{}',
  repo_url    text,
  live_url    text,
  cover_url   text,
  featured    boolean not null default false,
  published   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.experiences (
  id          uuid primary key default gen_random_uuid(),
  company     text not null default '',
  client      text not null default '',
  role        text not null default '',
  period      text not null default '',
  location    text not null default '',
  summary     text not null default '',
  bullets     text[] not null default '{}',
  tech        text[] not null default '{}',
  published   boolean not null default true,
  sort_order  int not null default 0
);

create table if not exists public.skill_groups (
  id          uuid primary key default gen_random_uuid(),
  label       text not null default '',
  items       text[] not null default '{}',
  sort_order  int not null default 0
);

create table if not exists public.certifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  issuer      text not null default '',
  date_label  text not null default '',
  url         text,
  sort_order  int not null default 0
);

-- Contact-form inbox. Anyone may INSERT; only you may READ.
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text not null default '',
  body        text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Private job application tracker. See migrations/013 for the rationale: this
-- is the one table with no public read policy — nothing in it reaches the
-- public site, and the anon key cannot see it at all.
create table if not exists public.job_applications (
  id              uuid primary key default gen_random_uuid(),
  company         text not null default '',
  role            text not null default '',
  location        text not null default '',
  work_setup      text not null default 'onsite',   -- onsite | hybrid | remote
  salary_min      int,
  salary_max      int,
  salary_currency text not null default 'PHP',
  salary_period   text not null default 'monthly',  -- hourly | monthly | annual
  applied_on      date,
  stage           text not null default 'none',     -- interview pipeline, in order
  outcome         text not null default 'in_progress',
  next_step_on    date,
  job_url         text,
  source          text not null default '',
  contact         text not null default '',
  notes           text not null default '',
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  constraint job_applications_work_setup_check
    check (work_setup in ('onsite', 'hybrid', 'remote')),
  constraint job_applications_salary_period_check
    check (salary_period in ('hourly', 'monthly', 'annual')),
  constraint job_applications_salary_min_check
    check (salary_min is null or salary_min >= 0),
  constraint job_applications_salary_max_check
    check (salary_max is null or salary_max >= 0),
  constraint job_applications_stage_check
    check (stage in ('none', 'initial', 'technical', 'code_exam',
                     'assessment', 'final', 'offer')),
  constraint job_applications_outcome_check
    check (outcome in ('in_progress', 'accepted', 'rejected',
                       'declined', 'no_response'))
);

create index if not exists job_applications_applied_on_idx
  on public.job_applications (applied_on desc nulls last);

alter table public.job_applications enable row level security;

drop policy if exists "authenticated write job_applications" on public.job_applications;
create policy "authenticated write job_applications"
  on public.job_applications for all to authenticated
  using (true) with check (true);

-- Private document bank: certificates of employment, clearances, contracts.
-- Metadata only — the files live in the `documents` storage bucket, which is
-- not public. See migrations/015 for the full rationale.
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  kind        text not null default 'other',
  issuer      text not null default '',
  reference   text not null default '',
  issued_on   date,
  expires_on  date,
  file_path   text not null,
  file_name   text not null default '',
  file_size   bigint not null default 0,
  mime_type   text not null default '',
  notes       text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),

  constraint documents_kind_check check (kind in
    ('coe', 'certificate', 'diploma', 'clearance', 'government',
     'contract', 'payslip', 'resume', 'other')),
  constraint documents_file_size_check check (file_size >= 0)
);

create index if not exists documents_created_at_idx
  on public.documents (created_at desc);
create index if not exists documents_kind_idx
  on public.documents (kind);

alter table public.documents enable row level security;

-- Also no "public read" policy: signed-in access only.
drop policy if exists "authenticated write documents" on public.documents;
create policy "authenticated write documents"
  on public.documents for all to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
--  2. ROW LEVEL SECURITY
--     Public (anon key) can read published content and drop a message.
--     Only a signed-in user (you) can write anything.
-- ---------------------------------------------------------------------------

alter table public.site_settings  enable row level security;
alter table public.projects       enable row level security;
alter table public.experiences    enable row level security;
alter table public.skill_groups   enable row level security;
alter table public.certifications enable row level security;
alter table public.messages       enable row level security;

do $$
declare
  t text;
begin
  -- Public read access
  foreach t in array array['site_settings','skill_groups','certifications'] loop
    execute format('drop policy if exists "public read %1$s" on public.%1$I', t);
    execute format('create policy "public read %1$s" on public.%1$I for select using (true)', t);
  end loop;

  -- Public read access, published rows only
  foreach t in array array['projects','experiences'] loop
    execute format('drop policy if exists "public read %1$s" on public.%1$I', t);
    execute format('create policy "public read %1$s" on public.%1$I for select using (published = true)', t);
  end loop;

  -- Authenticated full control on every content table
  foreach t in array array['site_settings','projects','experiences','skill_groups','certifications','messages'] loop
    execute format('drop policy if exists "authenticated write %1$s" on public.%1$I', t);
    execute format(
      'create policy "authenticated write %1$s" on public.%1$I for all
         to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Anyone may send a message (insert only — they cannot read the inbox).
drop policy if exists "anon can send message" on public.messages;
create policy "anon can send message"
  on public.messages for insert to anon with check (true);

-- ---------------------------------------------------------------------------
--  3. STORAGE — the public `media` bucket, and the private `documents` one
--
--  If this section errors with "must be owner of table objects", your project
--  restricts DDL on the storage schema. Do it in the dashboard instead:
--    Storage → New bucket → name "media" → tick "Public bucket"
--    Storage → Policies → allow SELECT for anon, and all actions for
--    authenticated, both scoped to the media bucket.
--  Everything above this point will already have run successfully.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "public read media"        on storage.objects;
drop policy if exists "authenticated write media" on storage.objects;

create policy "public read media"
  on storage.objects for select using (bucket_id = 'media');

create policy "authenticated write media"
  on storage.objects for all to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');

-- The document bank's own bucket, and the one bucket that is NOT public: it
-- holds personal records, read through short-lived signed URLs. In the
-- dashboard it is Storage → New bucket → "documents", "Public bucket" OFF.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

drop policy if exists "authenticated read documents"  on storage.objects;
drop policy if exists "authenticated write documents" on storage.objects;

create policy "authenticated read documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents');

create policy "authenticated write documents"
  on storage.objects for all to authenticated
  using (bucket_id = 'documents') with check (bucket_id = 'documents');

-- ---------------------------------------------------------------------------
--  4. SEED — create only the empty singleton settings row. Add portfolio
--     content in /admin; re-running this file never overwrites existing data.
-- ---------------------------------------------------------------------------

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

-- ============================================================================
--  Done. Next: Authentication → Users → "Add user" to create your admin login.
-- ============================================================================
