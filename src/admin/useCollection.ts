import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ContentTable } from '../lib/types'
import type { SaveState } from './ui'

type Row = { id: string; sort_order: number }

/**
 * Shared CRUD for the list-shaped tables (projects, experiences, skills,
 * certifications).
 *
 * Adds and deletes hit the database immediately so every row always has a real
 * UUID — edits are then batched into one Save. That keeps the UI honest: the
 * list you see is the list that exists.
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

  // Re-sync the draft whenever the parent hands us a freshly loaded list
  // (after an add, delete, or save). This is React's "adjusting state when a
  // prop changes" pattern — cheaper and flicker-free compared with an effect.
  const [lastLoaded, setLastLoaded] = useState(initial)
  if (initial !== lastLoaded) {
    setLastLoaded(initial)
    setRows(initial)
  }

  function edit(id: string, patch: Partial<T>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setState('dirty')
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
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
    if (!supabase) return
    setState('saving')
    setError('')

    const payload = rows.map((r, i) => ({ ...r, sort_order: i + 1 }))
    const { error: saveError } = await supabase.from(table).upsert(payload)

    if (saveError) {
      setState('error')
      setError(saveError.message)
      return
    }

    setState('saved')
    onChanged()
  }

  function reset() {
    setRows(initial)
    setState('clean')
  }

  return { rows, state, error, busy, edit, move, add, remove, save, reset }
}
