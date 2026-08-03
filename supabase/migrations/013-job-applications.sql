-- ============================================================================
--  Migration 013 — job application tracker
--  A private table behind the CMS: which companies you applied to, how far
--  each one got, and how it ended.
--  Run in Supabase → SQL Editor. Safe to re-run.
--
--  This is the one table in the schema with NO public read policy. Nothing in
--  it is rendered on the public site, and the anon key cannot see it at all.
-- ============================================================================

create table if not exists public.job_applications (
  id              uuid primary key default gen_random_uuid(),
  company         text not null default '',
  role            text not null default '',
  location        text not null default '',
  work_setup      text not null default 'onsite',   -- onsite | hybrid | remote
  -- Salary is kept as numbers plus a currency and a period so a range can be
  -- compared and formatted, rather than as free text like "80-100k".
  salary_min      int,
  salary_max      int,
  salary_currency text not null default 'PHP',
  salary_period   text not null default 'monthly',  -- hourly | monthly | annual
  applied_on      date,
  -- How far the application got: the interview pipeline, in order.
  stage           text not null default 'none',
  -- How it ended. Separate from stage so "reached final, then rejected" is
  -- recordable — one field could not say both.
  outcome         text not null default 'in_progress',
  next_step_on    date,                             -- upcoming interview / deadline
  job_url         text,
  source          text not null default '',         -- LinkedIn, referral, recruiter…
  contact         text not null default '',         -- recruiter name / email
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

-- The tracker lists newest application first and filters on outcome.
create index if not exists job_applications_applied_on_idx
  on public.job_applications (applied_on desc nulls last);

alter table public.job_applications enable row level security;

-- Deliberately no "public read" policy: private data, signed-in access only.
drop policy if exists "authenticated write job_applications" on public.job_applications;
create policy "authenticated write job_applications"
  on public.job_applications for all to authenticated
  using (true) with check (true);

-- ============================================================================
--  Done. Reload /admin — there is a new "Applications" tab beside the Inbox.
-- ============================================================================
