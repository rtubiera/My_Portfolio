import { useCallback, useEffect, useRef, useState } from 'react'
import { Document } from '../components/Icons'
import {
  DOCUMENTS_BUCKET,
  DOCUMENT_KINDS,
  MAX_FILE_BYTES,
  expiryState,
  fileExtension,
  formatBytes,
  formatDate,
  guessKind,
  kindLabel,
  summarise,
  titleFromFileName,
} from '../lib/documents'
import { documentUrl, supabase } from '../lib/supabase'
import type { StoredDocument } from '../lib/types'
import CollectionCard from './CollectionCard'
import { useCollection } from './useCollection'
import { SaveBar, SelectField, TextArea, TextField } from './ui'

const KIND_FILTERS = [{ id: 'all', label: 'All kinds' }, ...DOCUMENT_KINDS]

function matches(doc: StoredDocument, query: string): boolean {
  if (!query) return true
  const haystack = [
    doc.title,
    doc.issuer,
    doc.reference,
    doc.notes,
    doc.file_name,
    kindLabel(doc.kind),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

/**
 * Loads its own rows, like the applications tracker: this table is private and
 * the public site has no business asking for it. The inner component does the
 * editing so the collection hook always runs.
 */
export default function DocumentBank({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<StoredDocument[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!supabase) {
      setRows([])
      return
    }
    const { data, error: loadError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (loadError) {
      setError(loadError.message)
      setRows([])
      return
    }
    setError('')
    setRows((data ?? []) as StoredDocument[])
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
        <Head />
        <p className="empty">Loading documents…</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Head />
        <p className="notice notice--error">{error}</p>
        <p className="field__hint">
          If this says the table does not exist, run{' '}
          <code className="code">supabase/migrations/015-document-bank.sql</code>{' '}
          in the Supabase SQL editor.
        </p>
      </>
    )
  }

  return <Bank items={rows} onChanged={load} />
}

function Head() {
  return (
    <header className="admin__head">
      <div>
        <h1 className="admin__title">Documents</h1>
        <p className="admin__subtitle">
          Your certificates of employment, training certificates and other
          paperwork, kept in one place. Private to this CMS — the files are not
          publicly readable, and nothing here appears on your site.
        </p>
      </div>
    </header>
  )
}

function Bank({
  items,
  onChanged,
}: {
  items: StoredDocument[]
  onChanged: () => void
}) {
  const [kind, setKind] = useState('all')
  const [query, setQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Rows are created by uploading a file, never by an "add empty row" button —
  // a document with no document in it is not a thing. The hook is still what
  // owns editing, autosave and deletion.
  const c = useCollection<StoredDocument>('documents', items, onChanged, () => ({
    title: 'Untitled',
    kind: 'other',
    issuer: '',
    reference: '',
    issued_on: null,
    expires_on: null,
    file_path: '',
    file_name: '',
    file_size: 0,
    mime_type: '',
    notes: '',
    sort_order: 0,
    created_at: new Date().toISOString(),
  }))

  const stats = summarise(c.rows)
  const visible = c.rows.filter(
    (doc) => (kind === 'all' || doc.kind === kind) && matches(doc, query),
  )

  async function upload(files: FileList | File[]) {
    if (!supabase) {
      setUploadError('Supabase is not configured — uploads are unavailable.')
      return
    }
    setUploading(true)
    const failures: string[] = []

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        failures.push(`${file.name} is over ${formatBytes(MAX_FILE_BYTES)}`)
        continue
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
      // Stored under a generated name: the original is kept in the row, and
      // real filenames carry spaces, accents and the occasional slash.
      const path = `bank/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`

      const { error: uploadFailed } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        })

      if (uploadFailed) {
        failures.push(`${file.name}: ${uploadFailed.message}`)
        continue
      }

      const { error: insertFailed } = await supabase.from('documents').insert({
        title: titleFromFileName(file.name),
        kind: guessKind(file.name),
        issuer: '',
        reference: '',
        issued_on: null,
        expires_on: null,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        notes: '',
        sort_order: 0,
      })

      if (insertFailed) {
        // Take the file back out rather than leaving it orphaned in the
        // bucket, where nothing would ever list it again.
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([path])
        failures.push(`${file.name}: ${insertFailed.message}`)
      }
    }

    setUploading(false)
    setUploadError(failures.join(' · '))
    onChanged()
  }

  async function remove(doc: StoredDocument) {
    if (supabase && doc.file_path) {
      // File first: a row with no file is visible noise you can delete again,
      // a file with no row is invisible and stays for ever.
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.file_path])
    }
    await c.remove(doc.id)
  }

  return (
    <>
      <Head />

      <div className="stats">
        <Stat label="Documents" value={String(stats.total)} />
        <Stat
          label="Expiring soon"
          value={String(stats.expiring)}
          tone={stats.expiring ? 'accent' : undefined}
        />
        <Stat label="Expired" value={String(stats.expired)} />
        <Stat label="Stored" value={formatBytes(stats.bytes)} />
      </div>

      <div
        className="dropzone"
        data-dragging={dragging}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) void upload(e.dataTransfer.files)
        }}
      >
        <Document size={20} />
        <p className="dropzone__text">
          Drop files here, or{' '}
          <button
            type="button"
            className="linklike"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            browse
          </button>
          . PDFs, images and Office files, up to{' '}
          {formatBytes(MAX_FILE_BYTES)} each.
        </p>
        {uploading && <span className="mono dropzone__busy">Uploading…</span>}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {uploadError && <p className="notice notice--error">{uploadError}</p>}

      <div className="apps__filters">
        <select
          className="select"
          value={kind}
          aria-label="Filter by kind"
          onChange={(e) => setKind(e.target.value)}
        >
          {KIND_FILTERS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="search"
          value={query}
          placeholder="Search title, issuer, notes…"
          aria-label="Search documents"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {c.rows.length === 0 && (
        <p className="empty">
          Nothing stored yet. Upload your first document above.
        </p>
      )}

      {c.rows.length > 0 && visible.length === 0 && (
        <p className="empty">Nothing matches that filter.</p>
      )}

      {visible.map((doc, i) => {
        const expiry = expiryState(doc.expires_on)

        return (
          <CollectionCard
            key={doc.id}
            title={doc.title || doc.file_name || 'Untitled'}
            index={i}
            total={visible.length}
            onDelete={() => void remove(doc)}
            deleteLabel="document"
            badges={
              <>
                <span className="pill pill--accent">{kindLabel(doc.kind)}</span>
                <span className="pill">{fileExtension(doc.file_name)}</span>
                {expiry && (
                  <span className="pill" data-tone={expiry.tone}>
                    {expiry.label}
                  </span>
                )}
                {doc.issuer && <span className="card__meta">{doc.issuer}</span>}
                {doc.issued_on && (
                  <span className="card__meta">{formatDate(doc.issued_on)}</span>
                )}
                <span className="card__meta">{formatBytes(doc.file_size)}</span>
              </>
            }
          >
            <FileRow doc={doc} />

            <div className="form__row">
              <TextField
                label="Title"
                value={doc.title}
                onChange={(v) => c.edit(doc.id, { title: v })}
                placeholder="Certificate of Employment — Acme Corp"
              />
              <SelectField
                label="Kind"
                value={doc.kind}
                onChange={(v) => c.edit(doc.id, { kind: v })}
                options={DOCUMENT_KINDS}
              />
            </div>

            <div className="form__row">
              <TextField
                label="Issued by"
                value={doc.issuer}
                onChange={(v) => c.edit(doc.id, { issuer: v })}
                placeholder="Acme Corp, TESDA, NBI…"
              />
              <TextField
                label="Reference no."
                hint="Certificate or serial number, if it has one."
                value={doc.reference}
                onChange={(v) => c.edit(doc.id, { reference: v })}
              />
            </div>

            <div className="form__row">
              <TextField
                label="Issued on"
                type="date"
                value={doc.issued_on ?? ''}
                onChange={(v) => c.edit(doc.id, { issued_on: v || null })}
              />
              <TextField
                label="Expires on"
                hint="Leave empty if it does not expire."
                type="date"
                value={doc.expires_on ?? ''}
                onChange={(v) => c.edit(doc.id, { expires_on: v || null })}
              />
            </div>

            <TextArea
              label="Notes"
              hint="Where the original is, who signed it, what you needed it for."
              value={doc.notes}
              onChange={(v) => c.edit(doc.id, { notes: v })}
              rows={3}
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

/**
 * The file itself, with the actions that need a signed URL.
 *
 * Every link is minted on click and expires, so none of them can be stored,
 * bookmarked, or leaked by a shared screenshot of the page.
 */
function FileRow({ doc }: { doc: StoredDocument }) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function open() {
    // The tab is opened before the await: browsers block window.open once the
    // click that caused it has been forgotten.
    const tab = window.open('', '_blank')
    if (tab) tab.opener = null
    setBusy(true)
    const url = await documentUrl(doc.file_path, 120)
    setBusy(false)

    if (!url) {
      tab?.close()
      setError('Could not open that file.')
      return
    }
    if (tab) tab.location.href = url
    else window.location.href = url
  }

  async function download() {
    setBusy(true)
    // Content-Disposition has to come from the signed URL: a download
    // attribute on the anchor is ignored cross-origin.
    const url = await documentUrl(doc.file_path, 120, doc.file_name)
    setBusy(false)
    if (!url) {
      setError('Could not prepare that download.')
      return
    }
    const link = document.createElement('a')
    link.href = url
    link.rel = 'noreferrer noopener'
    link.click()
  }

  async function copyLink() {
    setBusy(true)
    const url = await documentUrl(doc.file_path, 3600)
    setBusy(false)
    if (!url) {
      setError('Could not create a link.')
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="field">
      <span className="field__label">File</span>
      <div className="docfile">
        <span className="docfile__name mono">{doc.file_name}</span>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => void open()}
          disabled={busy}
        >
          Open
        </button>
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          onClick={() => void download()}
          disabled={busy}
        >
          Download
        </button>
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          onClick={() => void copyLink()}
          disabled={busy}
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <span className="field__hint">
        {error ||
          'Links are signed and temporary — Open and Download last two minutes, a copied link one hour.'}
      </span>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'accent' | 'ok'
}) {
  return (
    <div className="stat" data-tone={tone}>
      <span className="stat__value">{value}</span>
      <span className="stat__label mono">{label}</span>
    </div>
  )
}
