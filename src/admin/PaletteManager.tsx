import { useState } from 'react'
import { Check, Plus, Trash } from '../components/Icons'
import { supabase } from '../lib/supabase'
import {
  PALETTE_DEFAULTS,
  PRESETS,
  contrastRatio,
  derivePalette,
  type CustomPalette,
} from '../lib/theme'

const HEX = /^#[0-9a-fA-F]{6}$/

/** Renders the eleven derived tokens so you can see what two colours produce. */
function PalettePreview({ bg, ink }: { bg: string; ink: string }) {
  const p = derivePalette(bg, ink)
  return (
    <span className="palette-preview" aria-hidden="true">
      {[p.bg, p.bgRaised, p.surface, p.line, p.inkFaint, p.inkMuted, p.inkSoft, p.ink].map(
        (colour, i) => (
          <span key={i} style={{ background: colour }} />
        ),
      )}
    </span>
  )
}

/**
 * WCAG readout for the background/text pair. 4.5 is the AA threshold for body
 * text — worth surfacing, because it is the one way a hand-picked combination
 * can genuinely fail rather than just look unusual.
 */
function ContrastNote({ bg, ink }: { bg: string; ink: string }) {
  if (!HEX.test(bg) || !HEX.test(ink)) return null
  const ratio = contrastRatio(bg, ink)
  const rounded = Math.round(ratio * 10) / 10
  const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fails AA'
  const ok = ratio >= 4.5

  return (
    <span
      className="contrast-note"
      data-ok={ok}
      title="WCAG contrast ratio between background and text"
    >
      {rounded}:1 · {level}
      {!ok && ' — body text will be hard to read'}
    </span>
  )
}

function ColourField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="custom-color__row">
        <input
          type="color"
          className="color-input"
          value={HEX.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          spellCheck={false}
        />
      </div>
    </label>
  )
}

type Props = {
  palettes: CustomPalette[]
  selectedId: string
  onSelect: (id: string) => void
  /** Called after a create/update/delete so the parent can refetch. */
  onChanged: () => void
  /** Live-previews an edit before it is saved. */
  onPreview: (palette: CustomPalette) => void
}

export default function PaletteManager({
  palettes,
  selectedId,
  onSelect,
  onChanged,
  onPreview,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<CustomPalette | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function beginEdit(palette: CustomPalette) {
    setEditing(palette.id)
    setDraft({ ...palette })
    setError('')
  }

  function editDraft(patch: Partial<CustomPalette>) {
    if (!draft) return
    const next = { ...draft, ...patch }
    setDraft(next)
    // Only preview once every colour is a complete hex, or the page flickers
    // to a fallback while you are mid-way through typing one.
    const complete = [next.dark_bg, next.dark_ink, next.light_bg, next.light_ink].every(
      (c) => HEX.test(c),
    )
    if (complete && selectedId === next.id) onPreview(next)
  }

  async function create() {
    if (!supabase) return
    setBusy(true)
    setError('')

    // Seed a new palette from the built-in default so it is immediately usable.
    const { data, error: insertError } = await supabase
      .from('theme_palettes')
      .insert({
        name: `My palette ${palettes.length + 1}`,
        ...PALETTE_DEFAULTS,
        sort_order: palettes.length + 1,
      })
      .select()
      .single()

    setBusy(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    onChanged()
    if (data) beginEdit(data as CustomPalette)
  }

  async function save() {
    if (!supabase || !draft) return

    const bad = [draft.dark_bg, draft.dark_ink, draft.light_bg, draft.light_ink].find(
      (c) => !HEX.test(c),
    )
    if (bad) {
      setError(`"${bad}" is not a six-digit hex colour.`)
      return
    }

    setBusy(true)
    setError('')

    const { error: saveError } = await supabase
      .from('theme_palettes')
      .update({
        name: draft.name.trim() || 'Untitled palette',
        dark_bg: draft.dark_bg,
        dark_ink: draft.dark_ink,
        light_bg: draft.light_bg,
        light_ink: draft.light_ink,
      })
      .eq('id', draft.id)

    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }

    setEditing(null)
    setDraft(null)
    onChanged()
  }

  async function remove(id: string) {
    if (!supabase) return
    setBusy(true)
    setError('')

    const { error: deleteError } = await supabase
      .from('theme_palettes')
      .delete()
      .eq('id', id)

    setBusy(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    // Anything pointing at a deleted palette falls back to the first built-in.
    if (selectedId === id) onSelect(PRESETS[0].id)
    setEditing(null)
    setDraft(null)
    onChanged()
  }

  return (
    <>
      {palettes.length > 0 && (
        <div className="choice-grid">
          {palettes.map((palette) => (
            <div
              key={palette.id}
              className="choice choice--palette"
              data-selected={selectedId === palette.id}
            >
              <button
                type="button"
                className="choice__hit"
                onClick={() => onSelect(palette.id)}
              >
                <span className="swatch-pair" aria-hidden="true">
                  <span style={{ background: palette.dark_bg }} />
                  <span style={{ background: palette.dark_ink }} />
                  <span style={{ background: palette.light_bg }} />
                  <span style={{ background: palette.light_ink }} />
                </span>
                <span className="choice__label">
                  {palette.name}
                  {selectedId === palette.id && <Check size={13} />}
                </span>
              </button>

              <span className="choice__tools">
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() =>
                    editing === palette.id ? setEditing(null) : beginEdit(palette)
                  }
                >
                  {editing === palette.id ? 'Close' : 'Edit'}
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost btn--danger"
                  onClick={() => void remove(palette.id)}
                  disabled={busy}
                  aria-label={`Delete ${palette.name}`}
                >
                  <Trash />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {editing && draft && (
        <div className="palette-editor">
          <label className="field">
            <span className="field__label">Palette name</span>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => editDraft({ name: e.target.value })}
              placeholder="Ocean, Warm grey, Client brand…"
            />
          </label>

          <div className="palette-editor__modes">
            <fieldset className="palette-mode">
              <legend className="mono">Dark mode</legend>
              <ColourField
                label="Background"
                value={draft.dark_bg}
                onChange={(v) => editDraft({ dark_bg: v })}
              />
              <ColourField
                label="Text"
                value={draft.dark_ink}
                onChange={(v) => editDraft({ dark_ink: v })}
              />
              <ContrastNote bg={draft.dark_bg} ink={draft.dark_ink} />
              {HEX.test(draft.dark_bg) && HEX.test(draft.dark_ink) && (
                <PalettePreview bg={draft.dark_bg} ink={draft.dark_ink} />
              )}
            </fieldset>

            <fieldset className="palette-mode">
              <legend className="mono">Light mode</legend>
              <ColourField
                label="Background"
                value={draft.light_bg}
                onChange={(v) => editDraft({ light_bg: v })}
              />
              <ColourField
                label="Text"
                value={draft.light_ink}
                onChange={(v) => editDraft({ light_ink: v })}
              />
              <ContrastNote bg={draft.light_bg} ink={draft.light_ink} />
              {HEX.test(draft.light_bg) && HEX.test(draft.light_ink) && (
                <PalettePreview bg={draft.light_bg} ink={draft.light_ink} />
              )}
            </fieldset>
          </div>

          <p className="field__hint">
            You choose two colours per mode; panels, borders and muted text are
            derived from them. That is what keeps a hand-picked combination
            coherent — you can't end up with a border brighter than your body
            text.
          </p>

          {error && <p className="notice notice--error">{error}</p>}

          <div className="palette-editor__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => void save()}
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Save palette'}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => {
                setEditing(null)
                setDraft(null)
                onChanged()
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-2xs)' }}>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => void create()}
          disabled={busy}
        >
          <Plus /> New palette
        </button>
      </div>

      {error && !editing && <p className="notice notice--error">{error}</p>}
    </>
  )
}
