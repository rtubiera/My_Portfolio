import { Plus } from '../components/Icons'
import type { Certification } from '../lib/types'
import CollectionCard from './CollectionCard'
import { useCollection } from './useCollection'
import { SaveBar, TextField } from './ui'

export default function CertificationsEditor({
  items,
  onChanged,
}: {
  items: Certification[]
  onChanged: () => void
}) {
  const c = useCollection<Certification>(
    'certifications',
    items,
    onChanged,
    () => ({
      title: 'New certification',
      issuer: '',
      date_label: '',
      url: null,
      sort_order: 0,
    }),
  )

  return (
    <>
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Certifications & awards</h1>
          <p className="admin__subtitle">
            Add a URL and the card becomes a link to the credential.
          </p>
        </div>
        <div className="admin__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={c.add}
            disabled={c.busy}
          >
            <Plus /> Add entry
          </button>
        </div>
      </header>

      {c.rows.length === 0 && (
        <p className="empty">
          Nothing here yet — the section is hidden on the site while empty.
        </p>
      )}

      {c.rows.map((item, i) => (
        <CollectionCard
          key={item.id}
          title={item.title}
          index={i}
          total={c.rows.length}
          onMove={(d) => c.move(i, d)}
          onDelete={() => c.remove(item.id)}
          deleteLabel="entry"
          badges={item.url ? <span className="pill">Linked</span> : null}
        >
          <TextField
            label="Title"
            value={item.title}
            onChange={(v) => c.edit(item.id, { title: v })}
          />
          <div className="form__row">
            <TextField
              label="Issuer"
              value={item.issuer}
              onChange={(v) => c.edit(item.id, { issuer: v })}
              placeholder="Collabera Digital"
            />
            <TextField
              label="Date"
              value={item.date_label}
              onChange={(v) => c.edit(item.id, { date_label: v })}
              placeholder="March 2023"
            />
          </div>
          <TextField
            label="Credential URL"
            hint="Optional."
            value={item.url ?? ''}
            onChange={(v) => c.edit(item.id, { url: v || null })}
            placeholder="https://…"
          />
        </CollectionCard>
      ))}

      <SaveBar
        state={c.state}
        error={c.error}
        onSave={c.save}
        onReset={c.reset}
      />
    </>
  )
}
