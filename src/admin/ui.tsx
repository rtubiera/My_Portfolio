import { useRef, useState, type ReactNode } from 'react'
import { Plus, Trash } from '../components/Icons'
import { mediaUrl, supabase } from '../lib/supabase'

/* -- Field ----------------------------------------------------------------- */

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        className="input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 5,
  mono = false,
  placeholder,
}: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  mono?: boolean
  placeholder?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={mono ? 'textarea textarea--mono' : 'textarea'}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

/* -- Toggle ---------------------------------------------------------------- */

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true" />
      {label}
    </label>
  )
}

/* -- Key/value repeater (socials, metrics) --------------------------------- */

type Pair = Record<string, string>

export function Repeater({
  label,
  hint,
  keys,
  placeholders,
  rows,
  onChange,
}: {
  label: string
  hint?: string
  /** Two object keys, e.g. ['label', 'url'] */
  keys: [string, string]
  placeholders: [string, string]
  rows: Pair[]
  onChange: (rows: Pair[]) => void
}) {
  const update = (index: number, key: string, value: string) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)))

  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="repeater">
        {rows.map((row, i) => (
          <div className="repeater__row" key={i}>
            <input
              className="input"
              value={row[keys[0]] ?? ''}
              placeholder={placeholders[0]}
              onChange={(e) => update(i, keys[0], e.target.value)}
            />
            <input
              className="input"
              value={row[keys[1]] ?? ''}
              placeholder={placeholders[1]}
              onChange={(e) => update(i, keys[1], e.target.value)}
            />
            <button
              type="button"
              className="btn btn--sm btn--ghost btn--danger"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              aria-label={`Remove ${label} row ${i + 1}`}
            >
              <Trash />
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() =>
              onChange([...rows, { [keys[0]]: '', [keys[1]]: '' }])
            }
          >
            <Plus /> Add row
          </button>
        </div>
      </div>
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

/* -- File upload to the `media` bucket ------------------------------------- */

export function FileUpload({
  label,
  hint,
  value,
  onChange,
  accept = 'image/*',
  folder,
  preview = true,
}: {
  label: string
  hint?: string
  value: string | null
  onChange: (path: string | null) => void
  accept?: string
  folder: string
  preview?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    if (!supabase) {
      setError('Supabase is not configured — uploads are unavailable.')
      return
    }
    setBusy(true)
    setError('')

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const path = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file, { cacheControl: '31536000', upsert: false })

    setBusy(false)
    if (uploadError) {
      setError(uploadError.message)
      return
    }
    onChange(path)
  }

  const showPreview = preview && value && !/\.pdf$/i.test(value)

  return (
    <div className="field upload">
      <span className="field__label">{label}</span>
      <div className="upload__row">
        {showPreview && (
          <img className="upload__preview" src={mediaUrl(value)} alt="" />
        )}
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn--sm btn--ghost btn--danger"
            onClick={() => onChange(null)}
          >
            <Trash /> Remove
          </button>
        )}
        {value && (
          <a
            className="btn btn--sm btn--ghost"
            href={mediaUrl(value)}
            target="_blank"
            rel="noreferrer noopener"
          >
            View
          </a>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      {error && <span className="field__hint" style={{ color: 'var(--danger)' }}>{error}</span>}
      {hint && !error && <span className="field__hint">{hint}</span>}
    </div>
  )
}

/* -- Save bar -------------------------------------------------------------- */

export type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'error'

export function SaveBar({
  state,
  error,
  onSave,
  onReset,
}: {
  state: SaveState
  error?: string
  onSave: () => void
  onReset?: () => void
}) {
  const text: Record<SaveState, string> = {
    clean: 'No unsaved changes',
    dirty: 'Unsaved changes',
    saving: 'Saving…',
    saved: 'Saved — live on the site',
    error: error ? `Save failed — ${error}` : 'Save failed',
  }

  const tone =
    state === 'saved'
      ? 'ok'
      : state === 'error'
        ? 'error'
        : state === 'dirty'
          ? 'dirty'
          : 'idle'

  return (
    <div className="savebar">
      <span className="savebar__status" data-tone={tone} role="status">
        {text[state]}
      </span>
      {onReset && (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onReset}
          disabled={state === 'saving' || state === 'clean'}
        >
          Discard
        </button>
      )}
      <button
        type="button"
        className="btn btn--primary"
        onClick={onSave}
        disabled={state === 'saving' || state === 'clean'}
      >
        Save changes
      </button>
    </div>
  )
}
