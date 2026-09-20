import { useState } from 'react'
import { Plus, Trash } from '../components/Icons'
import {
  HOLIDAY_PRESETS,
  describeSchedule,
  resolveScheduledEffect,
  scheduleMatches,
  type EffectSchedule,
  type Recurrence,
} from '../lib/schedule'
import { supabase } from '../lib/supabase'
import {
  EFFECT_META,
  type BackgroundEffect,
  type EffectIntensity,
} from '../lib/theme'
import { SaveBar, TextField, Toggle, type SaveState } from './ui'

const EFFECT_OPTIONS = (
  Object.keys(EFFECT_META) as BackgroundEffect[]
).map((id) => ({
  id,
  label: id === 'none' ? 'None (suppress)' : EFFECT_META[id].label,
}))

const RECURRENCES: { id: Recurrence; label: string; hint: string }[] = [
  { id: 'annual', label: 'Every year', hint: 'e.g. 25 Dec, or 25–30 Dec' },
  { id: 'monthly', label: 'Every month', hint: 'e.g. the 1st to the 3rd' },
  { id: 'once', label: 'One time', hint: 'a specific date range' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1)

type Props = {
  schedules: EffectSchedule[]
  /** The site-wide fallbacks, for the "what shows today" readout. */
  defaultEffect: string
  defaultIntensity: string
  rotation: string
  rotationPool: string[]
  onChanged: () => void
}

export default function ScheduleManager({
  schedules,
  defaultEffect,
  defaultIntensity,
  rotation,
  rotationPool,
  onChanged,
}: Props) {
  const [rows, setRows] = useState<EffectSchedule[]>(schedules)
  const [state, setState] = useState<SaveState>('clean')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Lets you check a rule without waiting for the date to arrive.
  const [testDate, setTestDate] = useState('')

  const [lastLoaded, setLastLoaded] = useState(schedules)
  if (schedules !== lastLoaded) {
    setLastLoaded(schedules)
    setRows(schedules)
  }

  // Parsed as local midday: `new Date('2026-12-25')` is parsed as UTC and can
  // land on the previous day for anyone west of Greenwich.
  const simulated = (() => {
    if (!testDate) return new Date()
    const [y, m, d] = testDate.split('-').map(Number)
    if (!y || !m || !d) return new Date()
    return new Date(y, m - 1, d, 12)
  })()

  const active = resolveScheduledEffect({
    defaultEffect,
    defaultIntensity,
    schedules: rows,
    rotation,
    rotationPool,
    now: simulated,
  })

  function edit(id: string, patch: Partial<EffectSchedule>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setState('dirty')
  }

  async function add() {
    if (!supabase) return
    setBusy(true)
    setError('')
    const { error: insertError } = await supabase
      .from('effect_schedules')
      .insert({
        label: 'New schedule',
        effect: 'snow',
        intensity: 'medium',
        recurrence: 'annual',
        start_month: 12,
        start_day: 25,
        end_month: 12,
        end_day: 25,
        sort_order: rows.length + 1,
      })
    setBusy(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onChanged()
  }

  /** Creates the common occasions in one go, skipping any already present. */
  async function addPresets() {
    if (!supabase) return
    setBusy(true)
    setError('')

    const existing = new Set(rows.map((r) => r.label.trim().toLowerCase()))
    const missing = HOLIDAY_PRESETS.filter(
      (p) => !existing.has(p.label.toLowerCase()),
    )

    if (missing.length === 0) {
      setBusy(false)
      setError('All the presets are already here — nothing to add.')
      return
    }

    const { error: insertError } = await supabase
      .from('effect_schedules')
      .insert(
        missing.map((p, i) => ({
          label: p.label,
          effect: p.effect,
          intensity: p.intensity,
          recurrence: 'annual',
          start_month: p.start_month,
          start_day: p.start_day,
          end_month: p.end_month,
          end_day: p.end_day,
          priority: p.priority,
          enabled: true,
          sort_order: rows.length + i + 1,
        })),
      )

    setBusy(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onChanged()
  }

  async function remove(id: string) {
    if (!supabase) return
    setBusy(true)
    setError('')
    const { error: deleteError } = await supabase
      .from('effect_schedules')
      .delete()
      .eq('id', id)
    setBusy(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    onChanged()
  }

  async function save() {
    if (!supabase) return
    setState('saving')
    setError('')

    // Blank out the columns the chosen recurrence doesn't use, so a rule
    // switched from "once" to "annual" can't keep stale dates around.
    const payload = rows.map((r, i) => ({
      ...r,
      sort_order: i + 1,
      start_date: r.recurrence === 'once' ? r.start_date : null,
      end_date: r.recurrence === 'once' ? r.end_date : null,
      start_month: r.recurrence === 'annual' ? r.start_month : null,
      end_month: r.recurrence === 'annual' ? r.end_month : null,
      start_day: r.recurrence === 'once' ? null : r.start_day,
      end_day: r.recurrence === 'once' ? null : r.end_day,
    }))

    const { error: saveError } = await supabase
      .from('effect_schedules')
      .upsert(payload)

    if (saveError) {
      setState('error')
      setError(saveError.message)
      return
    }
    setState('saved')
    onChanged()
  }

  return (
    <>
      <div className="sched-status">
        <div>
          <span className="mono">
            {testDate ? `Showing on ${testDate}` : 'Showing right now'}
          </span>
          <p className="sched-status__value">
            <strong>{active.effect}</strong> ({active.intensity}){' '}
            {active.origin === 'schedule' && (
              <>— from schedule “{active.source?.label}”</>
            )}
            {active.origin === 'rotation' && <>— picked by rotation</>}
            {active.origin === 'default' && (
              <>— the site default, nothing else applies</>
            )}
          </p>
        </div>
        <label className="field sched-status__test">
          <span className="field__label">Preview a date</span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <input
              className="input"
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
            />
            {testDate && (
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => setTestDate('')}
              >
                Today
              </button>
            )}
          </div>
        </label>
      </div>

      {rows.length === 0 && (
        <p className="empty">
          No schedules. The site default runs all year.
        </p>
      )}

      {rows.map((row) => {
        const matchesNow = scheduleMatches(row, simulated)
        return (
          <div className="sched" key={row.id} data-active={matchesNow}>
            <div className="sched__head">
              <div className="sched__title">
                <strong>{row.label || 'Untitled'}</strong>
                <span className="pill">{describeSchedule(row)}</span>
                {matchesNow && <span className="pill pill--on">Active</span>}
                {!row.enabled && <span className="pill pill--off">Off</span>}
              </div>
              <button
                type="button"
                className="btn btn--sm btn--ghost btn--danger"
                onClick={() => void remove(row.id)}
                disabled={busy}
                aria-label={`Delete ${row.label}`}
              >
                <Trash />
              </button>
            </div>

            <div className="form">
              <div className="form__row">
                <TextField
                  label="Name"
                  value={row.label}
                  onChange={(v) => edit(row.id, { label: v })}
                  placeholder="Christmas, My birthday…"
                />
                <label className="field">
                  <span className="field__label">Effect</span>
                  <select
                    className="select"
                    value={row.effect}
                    onChange={(e) =>
                      edit(row.id, {
                        effect: e.target.value as BackgroundEffect,
                      })
                    }
                  >
                    {EFFECT_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Intensity</span>
                  <select
                    className="select"
                    value={row.intensity}
                    onChange={(e) =>
                      edit(row.id, {
                        intensity: e.target.value as EffectIntensity,
                      })
                    }
                  >
                    <option value="subtle">Subtle</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span className="field__label">Repeats</span>
                <div className="seg">
                  {RECURRENCES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="seg__btn"
                      data-selected={row.recurrence === r.id}
                      onClick={() => edit(row.id, { recurrence: r.id })}
                      title={r.hint}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </label>

              {row.recurrence === 'annual' && (
                <div className="form__row">
                  <label className="field">
                    <span className="field__label">From</span>
                    <div className="date-pair">
                      <select
                        className="select"
                        value={row.start_month ?? 12}
                        onChange={(e) =>
                          edit(row.id, { start_month: Number(e.target.value) })
                        }
                      >
                        {MONTHS.map((m, i) => (
                          <option key={m} value={i + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        className="select"
                        value={row.start_day ?? 25}
                        onChange={(e) =>
                          edit(row.id, { start_day: Number(e.target.value) })
                        }
                      >
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label className="field">
                    <span className="field__label">To</span>
                    <div className="date-pair">
                      <select
                        className="select"
                        value={row.end_month ?? row.start_month ?? 12}
                        onChange={(e) =>
                          edit(row.id, { end_month: Number(e.target.value) })
                        }
                      >
                        {MONTHS.map((m, i) => (
                          <option key={m} value={i + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        className="select"
                        value={row.end_day ?? row.start_day ?? 25}
                        onChange={(e) =>
                          edit(row.id, { end_day: Number(e.target.value) })
                        }
                      >
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="field__hint">
                      Same as “From” for a single day. An end before the start
                      wraps the year — 28 Dec to 3 Jan works.
                    </span>
                  </label>
                </div>
              )}

              {row.recurrence === 'monthly' && (
                <div className="form__row">
                  <label className="field">
                    <span className="field__label">From day</span>
                    <select
                      className="select"
                      value={row.start_day ?? 1}
                      onChange={(e) =>
                        edit(row.id, { start_day: Number(e.target.value) })
                      }
                    >
                      {dayOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field__label">To day</span>
                    <select
                      className="select"
                      value={row.end_day ?? row.start_day ?? 1}
                      onChange={(e) =>
                        edit(row.id, { end_day: Number(e.target.value) })
                      }
                    >
                      {dayOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <span className="field__hint">
                      Days beyond a short month simply never match — day 31
                      skips February.
                    </span>
                  </label>
                </div>
              )}

              {row.recurrence === 'once' && (
                <div className="form__row">
                  <label className="field">
                    <span className="field__label">Start date</span>
                    <input
                      className="input"
                      type="date"
                      value={row.start_date ?? ''}
                      onChange={(e) =>
                        edit(row.id, { start_date: e.target.value || null })
                      }
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">End date</span>
                    <input
                      className="input"
                      type="date"
                      value={row.end_date ?? ''}
                      onChange={(e) =>
                        edit(row.id, { end_date: e.target.value || null })
                      }
                    />
                    <span className="field__hint">
                      Leave empty for a single day. This rule never repeats.
                    </span>
                  </label>
                </div>
              )}

              <div className="form__row">
                <TextField
                  label="Priority"
                  hint="Higher wins when two schedules overlap."
                  type="number"
                  value={String(row.priority)}
                  onChange={(v) =>
                    edit(row.id, { priority: Number(v) || 0 })
                  }
                />
                <div className="field">
                  <span className="field__label">Enabled</span>
                  <div style={{ paddingTop: '0.5rem' }}>
                    <Toggle
                      label="Active"
                      checked={row.enabled}
                      onChange={(v) => edit(row.id, { enabled: v })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {error && <p className="notice notice--error">{error}</p>}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem',
          marginTop: 'var(--space-2xs)',
        }}
      >
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => void add()}
          disabled={busy}
        >
          <Plus /> New schedule
        </button>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => void addPresets()}
          disabled={busy}
          title={HOLIDAY_PRESETS.map((p) => p.label).join(', ')}
        >
          <Plus /> Add holiday presets
        </button>
      </div>

      <p className="field__hint" style={{ marginTop: '0.4rem' }}>
        Presets cover {HOLIDAY_PRESETS.map((p) => p.label).join(', ')}. They're
        a starting point — every date, effect and intensity stays editable, and
        pressing the button twice won't duplicate anything.
      </p>

      <SaveBar
        state={state}
        error={error}
        onSave={save}
        onReset={() => {
          setRows(schedules)
          setState('clean')
        }}
      />
    </>
  )
}
