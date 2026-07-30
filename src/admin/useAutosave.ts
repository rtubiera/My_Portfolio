import { useEffect, useRef } from 'react'

/** Idle time after the last keystroke before a draft saves itself. */
const IDLE_DELAY = 1600

/**
 * Saves a dirty draft without being asked.
 *
 * Two triggers: a pause in typing, and the moment the window stops being the
 * one you are looking at — alt-tab, switching apps, closing the tab. The
 * second is the important one. Supabase refreshes its token when a tab regains
 * focus, which reloads CMS content, so anything typed but not saved before
 * leaving used to be replaced by the server copy on the way back.
 *
 * `data` is whatever object the draft lives in. It only has to change identity
 * on every edit — that is what restarts the idle timer.
 */
export function useAutosave(
  dirty: boolean,
  data: unknown,
  save: () => void | Promise<void>,
  delay = IDLE_DELAY,
) {
  // Event listeners are registered once, so they read the current draft
  // through a ref rather than closing over a stale one.
  const latest = useRef({ dirty, save })
  useEffect(() => {
    latest.current = { dirty, save }
  })

  // Pause in typing.
  useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(() => void latest.current.save(), delay)
    return () => clearTimeout(timer)
    // The timer restarts on `data`, i.e. on an edit. Calling through the ref
    // rather than depending on `save` keeps a plain re-render from pushing the
    // save further away.
  }, [dirty, data, delay])

  // Leaving the window.
  useEffect(() => {
    const flush = () => {
      if (latest.current.dirty) void latest.current.save()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    // A save started here is a normal async request, and the browser may kill
    // it mid-flight if the tab is actually closing — so still ask first.
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (latest.current.dirty) event.preventDefault()
    }

    window.addEventListener('blur', flush)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('blur', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [])
}
