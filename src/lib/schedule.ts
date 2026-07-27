import type { BackgroundEffect, EffectIntensity } from './theme'
import { resolveEffect, resolveIntensity } from './theme'

/* ==========================================================================
   Scheduled background effects

   A schedule turns the background effect on for a window of the calendar —
   snow over Christmas, confetti on a birthday — and reverts to the default
   outside it.

   Dates are evaluated in the *visitor's* local timezone, not the site
   owner's. Someone in Manila and someone in Berlin both see snow on the day
   their own calendar says 25 December, which is what people expect from a
   seasonal effect.
   ========================================================================== */

export type Recurrence = 'annual' | 'monthly' | 'once'

export type EffectSchedule = {
  id: string
  label: string
  effect: BackgroundEffect
  intensity: EffectIntensity
  recurrence: Recurrence
  start_month: number | null
  start_day: number | null
  end_month: number | null
  end_day: number | null
  start_date: string | null
  end_date: string | null
  priority: number
  enabled: boolean
  sort_order: number
}

/** Month and day collapsed into a comparable MMDD integer. */
const monthDayKey = (month: number, day: number) => month * 100 + day

/** Local-date ISO string (YYYY-MM-DD). `toISOString()` would shift to UTC. */
export function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Inclusive range test that also accepts ranges wrapping past the end of the
 * cycle — 28 Dec to 3 Jan, or the 28th to the 3rd of the month.
 */
function inCycle(value: number, start: number, end: number): boolean {
  return start <= end
    ? value >= start && value <= end
    : value >= start || value <= end
}

export function scheduleMatches(schedule: EffectSchedule, now: Date): boolean {
  if (!schedule.enabled) return false

  if (schedule.recurrence === 'annual') {
    const { start_month, start_day, end_month, end_day } = schedule
    if (start_month == null || start_day == null) return false

    // An unset end means a single day.
    const em = end_month ?? start_month
    const ed = end_day ?? start_day

    return inCycle(
      monthDayKey(now.getMonth() + 1, now.getDate()),
      monthDayKey(start_month, start_day),
      monthDayKey(em, ed),
    )
  }

  if (schedule.recurrence === 'monthly') {
    const { start_day, end_day } = schedule
    if (start_day == null) return false
    return inCycle(now.getDate(), start_day, end_day ?? start_day)
  }

  // once — plain lexicographic comparison, valid for zero-padded ISO dates.
  const { start_date } = schedule
  if (!start_date) return false
  const today = localDateKey(now)
  return today >= start_date && today <= (schedule.end_date ?? start_date)
}

/* -- Automatic rotation ---------------------------------------------------- */

export type RotationMode =
  | 'off'
  | 'minute'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'

const ROTATION_MODES: RotationMode[] = [
  'off',
  'minute',
  'hourly',
  'daily',
  'weekly',
  'monthly',
]

export function resolveRotation(value: string | undefined): RotationMode {
  return ROTATION_MODES.includes(value as RotationMode)
    ? (value as RotationMode)
    : 'off'
}

/**
 * How often the app should re-check which effect is due.
 *
 * The fast modes exist so rotation can be verified without waiting a day, and
 * they need a matching fast poll — a 15-minute check would never show a
 * per-minute change. The cost is only a small React re-render: the canvas
 * itself is keyed on effect and intensity, so it does not restart unless the
 * effect actually changes.
 */
export function rotationTickMs(mode: string | undefined): number {
  switch (resolveRotation(mode)) {
    case 'minute':
      return 5_000
    case 'hourly':
      return 60_000
    default:
      return 15 * 60_000
  }
}

/** Every effect rotation may choose from when no pool is configured. */
export const ROTATABLE_EFFECTS: BackgroundEffect[] = [
  'snow',
  'stars',
  'constellation',
  'aurora',
  'confetti',
  'hearts',
  'bats',
  'fireworks',
  'leaves',
  'petals',
  'fireflies',
  'matrix',
]

/** FNV-1a. Small, fast, and stable across engines — unlike Math.random(). */
function hash32(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Local calendar day as a whole number, used to derive week and month keys. */
function epochDay(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
}

/**
 * A monotonically increasing index for the current rotation period.
 *
 * Weeks are shifted by 3 so they break on Monday: epoch day 0 was a Thursday,
 * and an unaligned `day / 7` would change the effect mid-week.
 */
function periodIndex(mode: RotationMode, now: Date): number {
  // Sub-day periods come straight off the clock; no calendar involved, so no
  // timezone handling is needed for them.
  if (mode === 'minute') return Math.floor(now.getTime() / 60_000)
  if (mode === 'hourly') return Math.floor(now.getTime() / 3_600_000)
  if (mode === 'monthly') return now.getFullYear() * 12 + now.getMonth()
  const day = epochDay(now)
  return mode === 'weekly' ? Math.floor((day + 3) / 7) : day
}

/** xorshift32 — deterministic, and adequate for shuffling a six-item list. */
function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items]
  let state = seed >>> 0 || 1
  const next = () => {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = next() % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Deterministically picks an effect for the current period.
 *
 * Determinism matters: every visitor on a given day must see the same effect,
 * and it must not change as they navigate between pages. Seeding from the date
 * rather than Math.random() is what guarantees that.
 *
 * Rather than hashing each period independently — which clusters, and can
 * repeat back-to-back — periods are grouped into blocks the size of the pool
 * and each block is a seeded shuffle of it. Every effect therefore appears
 * exactly once per block, and the only place a repeat could occur is across a
 * block boundary, which is checked and swapped away.
 */
export function pickRotatedEffect(
  mode: RotationMode,
  pool: string[],
  now: Date,
): BackgroundEffect | null {
  if (mode === 'off') return null

  const valid = pool
    .map((id) => resolveEffect(id))
    .filter((id) => id !== 'none')
  const options = valid.length > 0 ? valid : ROTATABLE_EFFECTS

  if (options.length === 0) return null
  if (options.length === 1) return options[0]

  const size = options.length
  const index = periodIndex(mode, now)
  // Floor division keeps blocks contiguous for negative indices too.
  const block = Math.floor(index / size)
  const position = index - block * size

  const order = shuffled(options, hash32(`block:${block}`))

  // The boundary swap has to be applied for every position in the block, not
  // only position 0 — otherwise position 1 hands back the un-swapped value and
  // duplicates whatever position 0 just showed.
  const previous = shuffled(options, hash32(`block:${block - 1}`))
  if (order[0] === previous[size - 1]) {
    ;[order[0], order[1]] = [order[1], order[0]]
  }

  return order[position]
}

export type ActiveEffect = {
  effect: BackgroundEffect
  intensity: EffectIntensity
  /** Which layer decided the effect. */
  origin: 'schedule' | 'rotation' | 'default'
  /** The schedule that won, when origin is 'schedule'. */
  source: EffectSchedule | null
}

export type EffectResolution = {
  defaultEffect: string | undefined
  defaultIntensity: string | undefined
  schedules: EffectSchedule[]
  rotation?: string | undefined
  rotationPool?: string[] | undefined
  now?: Date
}

/**
 * Decides what renders right now, in three tiers:
 *
 *   1. schedule  — a dated rule wins outright, so 25 Dec always means snow
 *                  even while rotation is on
 *   2. rotation  — a different effect each day/week/month
 *   3. default   — the effect chosen in the Theme tab
 *
 * Schedule ties break on priority, then sort_order, then label, so the winner
 * is stable rather than dependent on however the rows came back.
 */
export function resolveScheduledEffect({
  defaultEffect,
  defaultIntensity,
  schedules,
  rotation,
  rotationPool,
  now = new Date(),
}: EffectResolution): ActiveEffect {
  const intensity = resolveIntensity(defaultIntensity)
  const matching = schedules.filter((s) => scheduleMatches(s, now))

  if (matching.length > 0) {
    const winner = matching.reduce((best, candidate) => {
      if (candidate.priority !== best.priority) {
        return candidate.priority > best.priority ? candidate : best
      }
      if (candidate.sort_order !== best.sort_order) {
        return candidate.sort_order < best.sort_order ? candidate : best
      }
      return candidate.label.localeCompare(best.label) < 0 ? candidate : best
    })

    return {
      effect: resolveEffect(winner.effect),
      intensity: resolveIntensity(winner.intensity),
      origin: 'schedule',
      source: winner,
    }
  }

  const rotated = pickRotatedEffect(
    resolveRotation(rotation),
    rotationPool ?? [],
    now,
  )
  if (rotated) {
    return { effect: rotated, intensity, origin: 'rotation', source: null }
  }

  return {
    effect: resolveEffect(defaultEffect),
    intensity,
    origin: 'default',
    source: null,
  }
}

/* -- Holiday presets ------------------------------------------------------- */

export type SchedulePreset = {
  label: string
  effect: BackgroundEffect
  intensity: EffectIntensity
  start_month: number
  start_day: number
  end_month: number
  end_day: number
  priority: number
}

/**
 * Common occasions, ready to insert as annual schedules.
 *
 * These are a starting point, not a definitive calendar — holidays vary by
 * country and belief, and every field stays editable once created. Priorities
 * are spaced so a personal date (a birthday, added by hand at a higher
 * number) can be made to win over a seasonal one that overlaps it.
 */
export const HOLIDAY_PRESETS: SchedulePreset[] = [
  {
    label: 'New Year',
    effect: 'fireworks',
    intensity: 'medium',
    start_month: 12, start_day: 31,
    end_month: 1, end_day: 2,
    priority: 30,
  },
  {
    label: "Valentine's Day",
    effect: 'hearts',
    intensity: 'medium',
    start_month: 2, start_day: 13,
    end_month: 2, end_day: 15,
    priority: 30,
  },
  {
    label: 'Spring',
    effect: 'petals',
    intensity: 'subtle',
    start_month: 3, start_day: 20,
    end_month: 4, end_day: 15,
    priority: 10,
  },
  {
    label: 'Autumn',
    effect: 'leaves',
    intensity: 'subtle',
    start_month: 9, start_day: 22,
    end_month: 10, end_day: 20,
    priority: 10,
  },
  {
    label: 'Halloween',
    effect: 'bats',
    intensity: 'medium',
    start_month: 10, start_day: 24,
    end_month: 11, end_day: 1,
    priority: 30,
  },
  {
    label: 'Christmas',
    effect: 'snow',
    intensity: 'medium',
    start_month: 12, start_day: 16,
    end_month: 12, end_day: 26,
    priority: 30,
  },
]

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Human-readable summary of when a rule fires, for the admin list. */
export function describeSchedule(schedule: EffectSchedule): string {
  if (schedule.recurrence === 'annual') {
    const { start_month, start_day, end_month, end_day } = schedule
    if (start_month == null || start_day == null) return 'Incomplete'

    const from = `${start_day} ${MONTHS[start_month - 1]}`
    const em = end_month ?? start_month
    const ed = end_day ?? start_day
    if (em === start_month && ed === start_day) return `${from}, every year`
    return `${from} – ${ed} ${MONTHS[em - 1]}, every year`
  }

  if (schedule.recurrence === 'monthly') {
    const { start_day, end_day } = schedule
    if (start_day == null) return 'Incomplete'
    const ed = end_day ?? start_day
    if (ed === start_day) return `Day ${start_day} of every month`
    return `Days ${start_day}–${ed} of every month`
  }

  if (!schedule.start_date) return 'Incomplete'
  if (!schedule.end_date || schedule.end_date === schedule.start_date) {
    return `${schedule.start_date}, once`
  }
  return `${schedule.start_date} → ${schedule.end_date}, once`
}
