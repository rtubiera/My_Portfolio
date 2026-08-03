/**
 * Vocabulary and formatting for the job application tracker.
 *
 * Two independent fields describe where an application stands. `stage` is how
 * far it got through the interview pipeline; `outcome` is how it ended. Keeping
 * them apart is what makes "reached the final interview, then rejected"
 * recordable — and what makes "which stage do I keep losing at" answerable.
 *
 * This is private CMS data. None of it is rendered on the public site.
 */

import type { JobApplication } from './types'

export type WorkSetup = 'onsite' | 'hybrid' | 'remote'
export type SalaryPeriod = 'hourly' | 'monthly' | 'annual'

export type ApplicationStage =
  | 'none'
  | 'initial'
  | 'technical'
  | 'code_exam'
  | 'assessment'
  | 'final'
  | 'offer'

export type ApplicationOutcome =
  | 'in_progress'
  | 'accepted'
  | 'rejected'
  | 'declined'
  | 'no_response'

export const WORK_SETUPS: { id: WorkSetup; label: string }[] = [
  { id: 'onsite', label: 'On-site' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'remote', label: 'Remote' },
]

export const SALARY_PERIODS: {
  id: SalaryPeriod
  label: string
  suffix: string
}[] = [
  { id: 'monthly', label: 'Per month', suffix: '/mo' },
  { id: 'annual', label: 'Per year', suffix: '/yr' },
  { id: 'hourly', label: 'Per hour', suffix: '/hr' },
]

/** The pipeline in order — the array index doubles as "how far it got". */
export const STAGES: {
  id: ApplicationStage
  label: string
  short: string
}[] = [
  { id: 'none', label: 'None — applied', short: 'Applied' },
  { id: 'initial', label: 'Initial interview', short: 'Initial' },
  { id: 'technical', label: 'Technical interview', short: 'Technical' },
  { id: 'code_exam', label: 'Code exam', short: 'Code exam' },
  { id: 'assessment', label: 'Assessment', short: 'Assessment' },
  { id: 'final', label: 'Final interview', short: 'Final' },
  { id: 'offer', label: 'Job offer', short: 'Offer' },
]

export type OutcomeTone = 'live' | 'good' | 'bad' | 'idle'

export const OUTCOMES: {
  id: ApplicationOutcome
  label: string
  tone: OutcomeTone
}[] = [
  { id: 'in_progress', label: 'In progress', tone: 'live' },
  { id: 'accepted', label: 'Offer accepted', tone: 'good' },
  { id: 'rejected', label: 'Rejected', tone: 'bad' },
  { id: 'declined', label: 'I declined', tone: 'idle' },
  { id: 'no_response', label: 'No response', tone: 'idle' },
]

export const CURRENCIES = [
  'PHP',
  'USD',
  'SGD',
  'AUD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AED',
]

const SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  SGD: 'S$',
  AUD: 'A$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
}

export function stageLabel(id: string): string {
  return STAGES.find((s) => s.id === id)?.short ?? id
}

export function outcomeMeta(id: string) {
  return OUTCOMES.find((o) => o.id === id) ?? OUTCOMES[0]
}

export function workSetupLabel(id: string): string {
  return WORK_SETUPS.find((w) => w.id === id)?.label ?? id
}

/** Position in the pipeline — drives which steps of the rail are filled in. */
export function stageIndex(id: string): number {
  return Math.max(
    0,
    STAGES.findIndex((s) => s.id === id),
  )
}

/* -- Money ----------------------------------------------------------------- */

export function formatSalary(app: {
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  salary_period: string
}): string {
  const { salary_min: min, salary_max: max } = app
  if (min == null && max == null) return ''

  const symbol = SYMBOLS[app.salary_currency] ?? `${app.salary_currency} `
  const amount = (value: number) => symbol + value.toLocaleString('en-US')
  const suffix =
    SALARY_PERIODS.find((p) => p.id === app.salary_period)?.suffix ?? ''

  const range =
    min != null && max != null
      ? min === max
        ? amount(min)
        : `${amount(min)} – ${amount(max)}`
      : min != null
        ? `${amount(min)}+`
        : `up to ${amount(max as number)}`

  return `${range} ${suffix}`.trim()
}

/* -- Dates ----------------------------------------------------------------- */

/** Today as `yyyy-mm-dd` in local time — `toISOString` would use UTC. */
export function today(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * A `yyyy-mm-dd` value as a local Date at midday. Passing the string straight
 * to `new Date()` parses it as UTC, which lands on the previous day for anyone
 * west of Greenwich — midday keeps it on the intended date everywhere.
 */
function parseDate(value: string): Date | null {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 12)
}

export function formatDate(value: string | null): string {
  if (!value) return ''
  const date = parseDate(value)
  if (!date) return value
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Whole days from today to `value`; negative for dates already past. */
export function daysUntil(value: string): number | null {
  const target = parseDate(value)
  if (!target) return null
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

/** "Today", "in 3 days", "5 days ago" — for the next-step chip. */
export function describeWhen(value: string): string {
  const days = daysUntil(value)
  if (days === null) return ''
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`
}

/* -- Roll-up --------------------------------------------------------------- */

export type ApplicationStats = {
  total: number
  active: number
  interviewing: number
  offers: number
  closed: number
}

export function summarise(rows: JobApplication[]): ApplicationStats {
  const active = rows.filter((r) => r.outcome === 'in_progress')
  return {
    total: rows.length,
    active: active.length,
    // Past the "applied and waiting" stage but not yet at an offer.
    interviewing: active.filter(
      (r) => r.stage !== 'none' && r.stage !== 'offer',
    ).length,
    offers: rows.filter((r) => r.stage === 'offer').length,
    closed: rows.length - active.length,
  }
}
