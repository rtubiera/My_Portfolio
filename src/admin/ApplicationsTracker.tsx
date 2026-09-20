import { useCallback, useEffect, useState } from 'react'
import { Plus } from '../components/Icons'
import {
  CURRENCIES,
  OUTCOMES,
  SALARY_PERIODS,
  STAGES,
  WORK_SETUPS,
  describeWhen,
  formatDate,
  formatSalary,
  outcomeMeta,
  stageIndex,
  stageLabel,
  summarise,
  today,
} from '../lib/applications'
import { supabase } from '../lib/supabase'
import type { JobApplication } from '../lib/types'
import CollectionCard from './CollectionCard'
import { useCollection } from './useCollection'
import { SaveBar, SelectField, TextArea, TextField } from './ui'

type Filter = 'all' | 'active' | 'offers' | 'closed'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'In progress' },
  { id: 'offers', label: 'Offers' },
  { id: 'closed', label: 'Closed' },
]

const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ id: code, label: code }))

/** Empty string from a number input means "not set", not zero. */
function toNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null
}

function matches(app: JobApplication, query: string): boolean {
  if (!query) return true
  const haystack = [
    app.company,
    app.role,
    app.location,
    app.source,
    app.contact,
    app.notes,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function passesFilter(app: JobApplication, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return app.outcome === 'in_progress'
  if (filter === 'offers') return app.stage === 'offer'
  return app.outcome !== 'in_progress'
}

/* -- CSV ------------------------------------------------------------------- */

const CSV_HEADERS = [
  'Company',
  'Role',
  'Location',
  'Work setup',
  'Salary',
  'Applied',
  'Stage',
  'Outcome',
  'Next step',
  'Source',
  'Contact',
  'Job URL',
  'Notes',
]

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function downloadCsv(rows: JobApplication[]) {
  const lines = rows.map((app) =>
    [
      app.company,
      app.role,
      app.location,
      app.work_setup,
      formatSalary(app),
      app.applied_on ?? '',
      stageLabel(app.stage),
      outcomeMeta(app.outcome).label,
      app.next_step_on ?? '',
      app.source,
      app.contact,
      app.job_url ?? '',
      app.notes.replace(/\n/g, ' '),
    ]
      .map(csvCell)
      .join(','),
  )

  // Leading BOM so Excel reads the currency symbols and en dashes as UTF-8.
  const csv = ['﻿' + CSV_HEADERS.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `applications-${today()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/* -- Screen ---------------------------------------------------------------- */

/**
 * Loads the tracker's own rows rather than taking them from the shared content
 * fetch: this table is private, and the public site has no business asking for
 * it. The inner component does the editing so the collection hook always runs.
 */
export default function ApplicationsTracker({
  onChanged,
}: {
  onChanged: () => void
}) {
  const [rows, setRows] = useState<JobApplication[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!supabase) {
      setRows([])
      return
    }
    const { data, error: loadError } = await supabase
      .from('job_applications')
      .select('*')
      .order('applied_on', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (loadError) {
      setError(loadError.message)
      setRows([])
      return
    }
    setError('')
    setRows((data ?? []) as JobApplication[])
    onChanged()
  }, [onChanged])

  // Fetch-on-mount — see the note in App.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!rows) {
    return (
      <>
        <Head onAdd={null} onExport={null} busy />
        <p className="empty">Loading applications…</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Head onAdd={null} onExport={null} busy />
        <p className="notice notice--error">{error}</p>
        <p className="field__hint">
          If this says the table does not exist, run{' '}
          <code className="code">supabase/migrations/013-job-applications.sql</code>{' '}
          in the Supabase SQL editor.
        </p>
      </>
    )
  }

  return <Tracker items={rows} onChanged={load} />
}

function Head({
  onAdd,
  onExport,
  busy,
}: {
  onAdd: (() => void) | null
  onExport: (() => void) | null
  busy: boolean
}) {
  return (
    <header className="admin__head">
      <div>
        <h1 className="admin__title">Applications</h1>
        <p className="admin__subtitle">
          Where every application stands. Private to this CMS — none of it
          appears on your public site.
        </p>
      </div>
      <div className="admin__actions">
        {onExport && (
          <button type="button" className="btn btn--sm" onClick={onExport}>
            Export CSV
          </button>
        )}
        {onAdd && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={onAdd}
            disabled={busy}
          >
            <Plus /> Add application
          </button>
        )}
      </div>
    </header>
  )
}

function Tracker({
  items,
  onChanged,
}: {
  items: JobApplication[]
  onChanged: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const c = useCollection<JobApplication>(
    'job_applications',
    items,
    onChanged,
    () => ({
      company: 'New application',
      role: '',
      location: '',
      work_setup: 'onsite',
      salary_min: null,
      salary_max: null,
      salary_currency: 'PHP',
      salary_period: 'monthly',
      applied_on: today(),
      stage: 'none',
      outcome: 'in_progress',
      next_step_on: null,
      job_url: null,
      source: '',
      contact: '',
      notes: '',
      sort_order: 0,
    }),
  )

  const stats = summarise(c.rows)
  const visible = c.rows.filter(
    (app) => passesFilter(app, filter) && matches(app, query),
  )

  return (
    <>
      <Head
        onAdd={() => void c.add()}
        onExport={() => downloadCsv(c.rows)}
        busy={c.busy}
      />

      <div className="stats">
        <Stat label="Total" value={stats.total} />
        <Stat label="In progress" value={stats.active} tone="accent" />
        <Stat label="Interviewing" value={stats.interviewing} />
        <Stat label="Offers" value={stats.offers} tone="ok" />
        <Stat label="Closed" value={stats.closed} />
      </div>

      <div className="apps__filters">
        <div className="seg">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="seg__btn"
              data-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="input"
          type="search"
          value={query}
          placeholder="Search company, role, notes…"
          aria-label="Search applications"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {c.rows.length === 0 && (
        <p className="empty">
          No applications tracked yet. Add your first one above.
        </p>
      )}

      {c.rows.length > 0 && visible.length === 0 && (
        <p className="empty">Nothing matches that filter.</p>
      )}

      {visible.map((app, i) => {
        const outcome = outcomeMeta(app.outcome)
        const salary = formatSalary(app)

        return (
          <CollectionCard
            key={app.id}
            title={app.company || 'Untitled'}
            index={i}
            total={visible.length}
            onDelete={() => c.remove(app.id)}
            deleteLabel="application"
            badges={
              <>
                <span className="pill" data-tone={outcome.tone}>
                  {outcome.label}
                </span>
                <span className="pill pill--accent">
                  {stageLabel(app.stage)}
                </span>
                {app.role && <span className="card__meta">{app.role}</span>}
                {app.applied_on && (
                  <span className="card__meta">
                    {formatDate(app.applied_on)}
                  </span>
                )}
                {app.outcome === 'in_progress' && app.next_step_on && (
                  <span className="pill pill--on">
                    Next {describeWhen(app.next_step_on)}
                  </span>
                )}
              </>
            }
          >
            <div className="form__row">
              <TextField
                label="Company"
                value={app.company}
                onChange={(v) => c.edit(app.id, { company: v })}
                placeholder="Acme Corp"
              />
              <TextField
                label="Role"
                value={app.role}
                onChange={(v) => c.edit(app.id, { role: v })}
                placeholder="Senior .NET Developer"
              />
            </div>

            <div className="form__row">
              <TextField
                label="Location"
                value={app.location}
                onChange={(v) => c.edit(app.id, { location: v })}
                placeholder="Makati City"
              />
              <SelectField
                label="Work setup"
                value={app.work_setup}
                onChange={(v) => c.edit(app.id, { work_setup: v })}
                options={WORK_SETUPS}
              />
              <TextField
                label="Source"
                hint="Where you found it."
                value={app.source}
                onChange={(v) => c.edit(app.id, { source: v })}
                placeholder="LinkedIn, referral, recruiter…"
              />
            </div>

            <div className="field">
              <span className="field__label">Interview stage</span>
              <div
                className="stage-rail"
                role="group"
                aria-label="Interview stage"
              >
                {STAGES.map((stage, index) => (
                  <button
                    key={stage.id}
                    type="button"
                    className="stage-rail__step"
                    data-done={index <= stageIndex(app.stage)}
                    data-current={stage.id === app.stage}
                    data-tone={outcome.tone}
                    aria-pressed={stage.id === app.stage}
                    title={stage.label}
                    onClick={() => c.edit(app.id, { stage: stage.id })}
                  >
                    <i aria-hidden="true" />
                    {stage.short}
                  </button>
                ))}
              </div>
              <span className="field__hint">
                Click the stage you have reached. Where it ended up is the
                outcome below.
              </span>
            </div>

            <div className="form__row">
              <SelectField
                label="Outcome"
                value={app.outcome}
                onChange={(v) => c.edit(app.id, { outcome: v })}
                options={OUTCOMES}
              />
              <TextField
                label="Date applied"
                type="date"
                value={app.applied_on ?? ''}
                onChange={(v) => c.edit(app.id, { applied_on: v || null })}
              />
              <TextField
                label="Next step"
                hint="Upcoming interview or deadline."
                type="date"
                value={app.next_step_on ?? ''}
                onChange={(v) => c.edit(app.id, { next_step_on: v || null })}
              />
            </div>

            <div className="field">
              <span className="field__label">Salary range</span>
              <div className="salary-row">
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={app.salary_min ?? ''}
                  placeholder="Minimum"
                  aria-label="Minimum salary"
                  onChange={(e) =>
                    c.edit(app.id, { salary_min: toNumber(e.target.value) })
                  }
                />
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={app.salary_max ?? ''}
                  placeholder="Maximum"
                  aria-label="Maximum salary"
                  onChange={(e) =>
                    c.edit(app.id, { salary_max: toNumber(e.target.value) })
                  }
                />
                <select
                  className="select"
                  value={app.salary_currency}
                  aria-label="Currency"
                  onChange={(e) =>
                    c.edit(app.id, { salary_currency: e.target.value })
                  }
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="select"
                  value={app.salary_period}
                  aria-label="Salary period"
                  onChange={(e) =>
                    c.edit(app.id, {
                      salary_period: e.target
                        .value as JobApplication['salary_period'],
                    })
                  }
                >
                  {SALARY_PERIODS.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className="field__hint">
                {salary ? `Shows as ${salary}` : 'Leave blank if undisclosed.'}
              </span>
            </div>

            <div className="form__row">
              <TextField
                label="Contact"
                hint="Recruiter or hiring manager."
                value={app.contact}
                onChange={(v) => c.edit(app.id, { contact: v })}
                placeholder="Jane Cruz — jane@acme.com"
              />
              <TextField
                label="Job posting"
                value={app.job_url ?? ''}
                onChange={(v) => c.edit(app.id, { job_url: v || null })}
                placeholder="https://…"
              />
            </div>

            <TextArea
              label="Notes"
              hint="Interview questions, salary talk, who you spoke to."
              rows={4}
              value={app.notes}
              onChange={(v) => c.edit(app.id, { notes: v })}
            />
          </CollectionCard>
        )
      })}

      <SaveBar
        state={c.state}
        error={c.error}
        onSave={c.save}
        onReset={c.reset}
      />
    </>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'accent' | 'ok'
}) {
  return (
    <div className="stat" data-tone={tone}>
      <span className="stat__value">{value}</span>
      <span className="stat__label mono">{label}</span>
    </div>
  )
}
