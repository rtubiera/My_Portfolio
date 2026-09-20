import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ContentTable } from '../lib/types'
import type { SaveState } from './ui'
import { useAutosave } from './useAutosave'

type Row = { id: string; sort_order: number }

/**
 * Reconciles a freshly loaded list with a draft that still has unsaved edits.
 *
 * The draft wins on field values and on order — it is what the user is looking
 * at. The server decides membership, so a row added or deleted in another tab
 * still appears or disappears here.
 */
function merge<T extends Row>(loaded: T[], draft: T[]): T[] {
  const loadedIds = new Set(loaded.map((r) => r.id))
  const kept = draft.filter((d) => loadedIds.has(d.id))
  const keptIds = new Set(kept.map((d) => d.id))
  return [...kept, ...loaded.filter((r) => !keptIds.has(r.id))]
}

/**
 * Shared CRUD for the list-shaped tables (projects, experiences, skills,
 * certifications).
 *
 * Adds and deletes hit the database immediately so every row always has a real
 * UUID — edits are then batched. That keeps the UI honest: the list you see is
 * the list that exists. Edits save themselves a moment after you stop typing,
 * and immediately if you leave the window; the Save button is a manual nudge
 * rather than the only way changes survive.
 */
export function useCollection<T extends Row>(
  table: ContentTable,
  initial: T[],
  onChanged: () => void,
  blank: () => Omit<T, 'id'>,
) {
  const [rows, setRows] = useState<T[]>(initial)
  const [state, setState] = useState<SaveState>('clean')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Guards against the idle timer and the leaving-the-window flush firing the
  // same save twice.
  const inFlight = useRef(false)
  // Bumped on every edit so a save can tell whether the draft moved on while
  // it was in flight.
  const version = useRef(0)

  // Re-sync the draft whenever the parent hands us a freshly loaded list
  // (after an add, delete, or save). This is React's "adjusting state when a
  // prop changes" pattern — cheaper and flicker-free compared with an effect.
  const [lastLoaded, setLastLoaded] = useState(initial)
  if (initial !== lastLoaded) {
    setLastLoaded(initial)
    // A reload can land while there are still unsaved edits — a token refresh
    // after alt-tab triggers one. Taking the server copy wholesale there would
    // throw those edits away, so only a settled draft is replaced outright.
    const settled = state === 'clean' || state === 'saved'
    setRows((current) => (settled ? initial : merge(initial, current)))
  }

  function edit(id: string, patch: Partial<T>) {
    version.current += 1
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setState('dirty')
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
    version.current += 1
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    setRows(next.map((r, i) => ({ ...r, sort_order: i + 1 })))
    setState('dirty')
  }

  async function add() {
    if (!supabase) return
    setBusy(true)
    setError('')

    const { error: insertError } = await supabase
      .from(table)
      .insert({ ...blank(), sort_order: rows.length + 1 })

    setBusy(false)
    if (insertError) {
      setState('error')
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
      .from(table)
      .delete()
      .eq('id', id)

    setBusy(false)
    if (deleteError) {
      setState('error')
      setError(deleteError.message)
      return
    }
    onChanged()
  }

  async function save() {
    if (!supabase || inFlight.current) return
    inFlight.current = true
    const savedAt = version.current
    setState('saving')
    setError('')

    const payload = rows.map((r, i) => ({ ...r, sort_order: i + 1 }))
    const { error: saveError } = await supabase.from(table).upsert(payload)
    inFlight.current = false

    if (saveError) {
      setState('error')
      setError(saveError.message)
      return
    }

    // Anything typed while the request was in flight is not in what we just
    // sent, so the draft stays dirty and autosaves again rather than being
    // declared clean and then overwritten by the reload below.
    setState(version.current === savedAt ? 'saved' : 'dirty')
    onChanged()
  }

  useAutosave(state === 'dirty', rows, save)

  function reset() {
    setRows(initial)
    setState('clean')
  }

  return { rows, state, error, busy, edit, move, add, remove, save, reset }
}
