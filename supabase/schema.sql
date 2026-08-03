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
  logo_text      text not null default 'DJT',        -- wordmark when no logo image
  hero_layout    text not null default 'editorial',  -- editorial | portrait | split
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
  check (hero_layout in ('editorial', 'portrait', 'split'));

-- theme_preset holds either a built-in id or the uuid of a theme_palettes row,
-- so it deliberately has no allow-list constraint.
alter table public.site_settings drop constraint if exists site_settings_theme_preset_check;

alter table public.site_settings drop constraint if exists site_settings_font_pair_check;
alter table public.site_settings add constraint site_settings_font_pair_check
  check (font_pair in ('inter', 'sora', 'space', 'outfit', 'serif'));

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
  check (work_layout in ('list', 'grid', 'cards', 'carousel'));

alter table public.site_settings drop constraint if exists site_settings_work_limit_check;
alter table public.site_settings add constraint site_settings_work_limit_check
  check (work_limit between 0 and 99);

alter table public.site_settings drop constraint if exists site_settings_skills_layout_check;
alter table public.site_settings add constraint site_settings_skills_layout_check
  check (skills_layout in ('grouped', 'icons', 'tiles'));

alter table public.site_settings drop constraint if exists site_settings_experience_layout_check;
alter table public.site_settings add constraint site_settings_experience_layout_check
  check (experience_layout in ('rows', 'timeline', 'cards'));

alter table public.site_settings
  add column if not exists logo_url     text,
  add column if not exists favicon_url  text,
  add column if not exists logo_text    text not null default 'DJT',
  add column if not exists og_image_url text;

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

alter table public.site_settings
  add column if not exists background_effect text not null default 'none',
  add column if not exists effect_intensity  text not null default 'subtle';

alter table public.site_settings drop constraint if exists site_settings_background_effect_check;
alter table public.site_settings add constraint site_settings_background_effect_check
  check (background_effect in (
    'none', 'snow', 'stars', 'constellation', 'aurora', 'confetti', 'hearts',
    'bats', 'fireworks', 'leaves', 'petals', 'fireflies', 'matrix',
    'astronaut', 'websling', 'galaxy'));

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
--  3. STORAGE — bucket for project covers, avatar, resume PDF
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

-- ---------------------------------------------------------------------------
--  4. SEED — your resume content. Only inserts if the table is empty,
--     so re-running this file will never clobber edits you made in /admin.
-- ---------------------------------------------------------------------------

insert into public.site_settings (
  id, name, role, tagline, hero_intro, about, location, email, phone,
  available, available_note, socials, metrics, seo_title, seo_description
) values (
  1,
  'Delson James Tubiera',
  'Software Developer II',
  'Full Stack · .NET / Blazor',
  'I build and maintain enterprise .NET systems for banking — payment platforms, core-banking API integrations, and the automation tooling that keeps them shippable.',
  'I''m a full stack developer based in Makati City, currently building Biller Plus, the enterprise bills payment platform at Rizal Commercial Banking Corporation. My work sits where reliability actually matters: payment posting through Finacle core banking, rate limiting and reverse proxying to keep APIs standing up under load, and production monitoring when something goes wrong at 2am.

Before banking I spent time in GIS web services, billing systems, and financial services production support — the kind of work that teaches you to care about query plans and error logs. I also enjoy building tools for the people around me: most recently a low-code automation testing platform that let QA engineers with no coding background write and run their own test suites.',
  'Makati City, Metro Manila',
  'delsonjames17@gmail.com',
  '+63 908 930 9958',
  true,
  'Open to senior full stack and backend roles',
  '[{"label":"GitHub","url":"https://github.com/Delson-James17"},
    {"label":"LinkedIn","url":"https://www.linkedin.com/in/delson-james-tubiera/"},
    {"label":"Email","url":"mailto:delsonjames17@gmail.com"}]'::jsonb,
  '[{"value":"5+","label":"Years building for the web"},
    {"value":"110x","label":"Faster billing file processing"},
    {"value":"4","label":"Enterprise clients shipped for"}]'::jsonb,
  'Delson James Tubiera — Full Stack .NET Developer',
  'Software Developer II specialising in .NET 8, Blazor, and ASP.NET Core. Building enterprise banking and payment platforms in Metro Manila.'
) on conflict (id) do nothing;

insert into public.projects (slug, title, blurb, description, role, year, tech, highlights, featured, sort_order)
select * from (values
  (
    'biller-plus',
    'Biller Plus',
    'RCBC''s enterprise bills payment platform — .NET 8, Blazor, and Finacle core banking integration.',
    'Biller Plus is Rizal Commercial Banking Corporation''s enterprise bills payment platform. I develop and maintain the system end to end: an ASP.NET Core Web API backend on .NET 8, a Blazor front end, and Microsoft SQL Server for persistence.

The interesting problems here are integration and resilience. Payment posting and account services run through Finacle scripting against the bank''s core system, so correctness is non-negotiable. On the edge, I implemented rate limiting, load balancing, and a reverse proxy layer to hold API throughput and availability up under abusive traffic.',
    'Software Developer II',
    '2025 — Present',
    array['.NET 8','ASP.NET Core Web API','Blazor','SQL Server','Finacle Scripting'],
    array['Integrated payment posting and account services with the bank''s Finacle core',
          'Added rate limiting, load balancing and a reverse proxy to protect API throughput',
          'Maintain production monitoring and incident response for a live banking platform'],
    true, 1
  ),
  (
    'qa-automation-platform',
    'Low-Code QA Automation Platform',
    'A test authoring platform that let QA engineers with zero coding background build and run automated suites.',
    'The team was fully dependent on manual regression testing. I designed and built a low-code automation testing platform on Playwright, Appium, and Electron that lets QA engineers author and execute automated tests without writing code.

It handles single and bulk API testing, web UI testing, and mobile testing from one interface. It runs from a CLI and generates its own CI/CD assets — Dockerfiles plus AWS and Azure YAML pipeline configs. It also performs security scanning for CSRF, brute-force, and SQL injection vulnerabilities, and auto-generates both executable test scripts and test case documentation from whatever the user builds.',
    'Designer & Lead Developer',
    '2025',
    array['Playwright','Appium','Electron','Docker','AWS','Azure','CI/CD'],
    array['Removed the team''s dependency on manual regression testing',
          'One interface for API, web UI, and mobile test authoring',
          'Generates Dockerfiles and AWS/Azure YAML pipeline configuration',
          'Security scanning for CSRF, brute-force and SQL injection',
          'Auto-generates executable scripts and test case documentation'],
    true, 2
  ),
  (
    'billing-system',
    'Billing System — 110x Faster',
    'Cut Excel processing in a production billing module from 15 seconds to 0.135 seconds.',
    'Built and maintained a billing system on ASP.NET Core MVC with Microsoft SQL Server, implementing the business logic and the integration layer.

The result I''m most pleased with is a performance one. The module''s Excel file processing took 15 seconds per run. After reworking how the data was read and processed, the same job finished in 0.135 seconds — a 99.10% reduction, and a 110x speed increase.',
    'Full Stack Developer',
    '2024 — 2025',
    array['ASP.NET Core MVC','C#','SQL Server','Entity Framework'],
    array['15s → 0.135s Excel processing: 99.10% reduction, 110x faster',
          'Designed the database architecture for scalability and maintainability',
          'Built internal C# and JavaScript libraries that cut recurring bugs across projects'],
    true, 3
  ),
  (
    'gis-web-services',
    'GIS Web Services Platform',
    'Scalable ASP.NET Web API and WCF services backing GIS applications on Oracle.',
    'Developed and integrated scalable web services using ASP.NET Web API and WCF for GIS applications, streamlining data management against an Oracle database.

I also led the planning and design of the database architecture across company projects, with a focus on scalability, efficiency, and long-term maintainability — and helped establish the team''s programming practices for keeping the codebase clean and consistent.',
    'Full Stack Developer',
    '2024 — 2025',
    array['ASP.NET Web API','WCF','Oracle','PL/SQL','OpenLayers'],
    array['Led database architecture planning across company projects',
          'Streamlined GIS data management on Oracle',
          'Established team-wide programming standards and review practices'],
    false, 4
  ),
  (
    'pjli-core-platform',
    'Financial Services Core Platform',
    'Feature work, internal APIs, and production support for PJ Lhuillier''s core web platform.',
    'Developed features and resolved defects on the core web platform of a major financial services provider, and built the internal APIs consumed by the organisation''s main web service.

A large part of this role was production support — investigating live errors, performing data fixes, and shipping bug fixes under tight turnaround windows. I also wrote SQL scripts and stored procedures to optimise database operations and extend system functionality.',
    'Software Engineer',
    '2023 — 2024',
    array['C#','ASP.NET MVC','REST API','SQL Server','Jira'],
    array['Top Performer Awardee, PJ Lhuillier Group of Companies (Jan 2024)',
          'Built internal APIs consumed by the organisation''s main web service',
          'Production support: live error investigation, data fixes, tight-turnaround releases'],
    false, 5
  )
) as v
where not exists (select 1 from public.projects);

insert into public.experiences (company, client, role, period, location, summary, bullets, tech, sort_order)
select * from (values
  (
    'Vertere Global Solutions, Inc.',
    'Rizal Commercial Banking Corporation (RCBC)',
    'Software Developer II',
    'Sep 2025 — Present',
    'Makati City',
    'Building and maintaining RCBC''s enterprise bills payment platform, plus the automation tooling around it.',
    array['Develop and maintain Biller Plus, RCBC''s enterprise bills payment platform on .NET 8, ASP.NET Core Web API, Blazor and SQL Server',
          'Build and consume core banking APIs through Finacle scripting for payment posting and account services',
          'Implemented rate limiting, load balancing and a reverse proxy layer to strengthen API throughput and availability',
          'Maintain and monitor production applications, including in-app chat enhancements and incident monitoring',
          'Designed and built a low-code automation testing platform (Playwright, Appium, Electron) for non-coding QA engineers'],
    array['.NET 8','Blazor','ASP.NET Core','SQL Server','Finacle','Playwright'],
    1
  ),
  (
    'Pacific Data Resources (Asia), Inc.',
    '',
    'Software Developer I — Full Stack',
    'Sep 2024 — Sep 2025',
    'Metro Manila',
    'GIS web services, billing systems, and the database architecture behind them.',
    array['Developed scalable web services using ASP.NET Web API and WCF for GIS applications on Oracle',
          'Led planning and design of database architecture across company projects',
          'Built the Billing System on ASP.NET Core MVC with complex business logic and SQL Server integration',
          'Cut Excel file processing from 15s to 0.135s — a 99.10% reduction and 110x speed increase',
          'Created internal C# and JavaScript libraries that reduced recurring bugs across projects',
          'Established best programming practices for clean, readable, consistent code'],
    array['ASP.NET Core MVC','WCF','Oracle','SQL Server','jQuery','Bootstrap'],
    2
  ),
  (
    'Collabera Digital',
    'PJ Lhuillier, Inc. (PJLI)',
    'Software Engineer — Full Stack',
    'Feb 2023 — Jul 2024',
    'Metro Manila',
    'Feature delivery and production support on a financial services core web platform.',
    array['Developed features and resolved defects for a financial services provider''s core web platform',
          'Built internal APIs consumed by the organisation''s main web service',
          'Handled production support: error investigation, data fixes, and bug fixes under tight turnaround',
          'Developed SQL scripts and stored procedures to optimise database operations',
          'Tracked and organised delivery work using Jira boards'],
    array['C#','ASP.NET MVC','REST API','SQL Server','SSMS','Jira'],
    3
  ),
  (
    'Tilden Tasks LLC dba WP Tangerine',
    '',
    'Website Developer',
    'Jan 2020 — Feb 2023',
    'Berkeley, California (Remote)',
    'E-commerce and client web work across .NET, WordPress and Shopify.',
    array['Developed an e-commerce project using C# and ASP.NET Core',
          'Built and customised WordPress and Shopify sites with e-commerce solutions',
          'Applied HTML, CSS, JavaScript, C# and responsive design across client sites'],
    array['C#','ASP.NET Core','WordPress','Shopify','JavaScript'],
    4
  )
) as v
where not exists (select 1 from public.experiences);

insert into public.skill_groups (label, items, sort_order)
select * from (values
  ('Back-End',            array['C#','.NET 8','.NET Core','ASP.NET Core Web API','ASP.NET Core MVC','Entity Framework','LINQ','ADO.NET','WCF','REST API','SOAP API','Finacle Scripting'], 1),
  ('Front-End',           array['Blazor (WASM / Server)','React.js','TypeScript','JavaScript','HTML','CSS','jQuery','SyncFusion','Bootstrap'], 2),
  ('Database',            array['Microsoft SQL Server','Oracle','PL/SQL','MySQL','Stored Procedures','Query Optimization','Supabase','Firebase'], 3),
  ('Architecture & Security', array['Rate Limiting','Load Balancing','Reverse Proxy','API Gateway','CSRF Mitigation','SQL Injection Mitigation','Brute-Force Mitigation','Application Monitoring'], 4),
  ('Testing & Automation',array['Playwright','Appium','Electron','API & UI Automation','Mobile Test Automation','Postman','SoapUI','Test Documentation'], 5),
  ('DevOps & Cloud',      array['Docker','Kubernetes','CI/CD Pipelines','AWS','Azure','YAML Pipelines','IIS','Netlify','Vercel'], 6),
  ('Tools',               array['Git','GitHub','GitLab','Visual Studio','VS Code','Jira','SharePoint','Notion','WordPress','Shopify'], 7)
) as v
where not exists (select 1 from public.skill_groups);

insert into public.certifications (title, issuer, date_label, sort_order)
select * from (values
  ('Top Performer Awardee',                                  'PJ Lhuillier Group of Companies', 'January 2024', 1),
  ('Amazing .NET Developer Training Award, Weeks 1–4',        'Collabera Digital',               'March 2023',   2),
  ('Certificate of Completion: .NET Full Stack',              'Collabera Digital',               'May 2023',     3),
  ('Responsive Web Design Certification',                     'freeCodeCamp',                    'October 2022', 4)
) as v
where not exists (select 1 from public.certifications);

-- ============================================================================
--  Done. Next: Authentication → Users → "Add user" to create your admin login.
-- ============================================================================
