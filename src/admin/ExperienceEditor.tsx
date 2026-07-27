import { Plus } from '../components/Icons'
import { commasToArray, linesToArray } from '../lib/content'
import type { Experience } from '../lib/types'
import CollectionCard from './CollectionCard'
import { useCollection } from './useCollection'
import { SaveBar, TextArea, TextField, Toggle } from './ui'

export default function ExperienceEditor({
  items,
  onChanged,
}: {
  items: Experience[]
  onChanged: () => void
}) {
  const c = useCollection<Experience>('experiences', items, onChanged, () => ({
    company: 'New company',
    client: '',
    role: '',
    period: '',
    location: '',
    summary: '',
    bullets: [],
    tech: [],
    published: true,
    sort_order: 0,
  }))

  return (
    <>
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Experience</h1>
          <p className="admin__subtitle">
            Your work history timeline. Keep the newest role at the top.
          </p>
        </div>
        <div className="admin__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={c.add}
            disabled={c.busy}
          >
            <Plus /> Add role
          </button>
        </div>
      </header>

      {c.rows.length === 0 && (
        <p className="empty">No roles yet. Add your first one above.</p>
      )}

      {c.rows.map((item, i) => (
        <CollectionCard
          key={item.id}
          title={`${item.role || 'Untitled role'} — ${item.company}`}
          index={i}
          total={c.rows.length}
          onMove={(d) => c.move(i, d)}
          onDelete={() => c.remove(item.id)}
          deleteLabel="role"
          badges={
            <span className={item.published ? 'pill pill--on' : 'pill pill--off'}>
              {item.published ? 'Live' : 'Hidden'}
            </span>
          }
        >
          <div className="form__row">
            <TextField
              label="Role"
              value={item.role}
              onChange={(v) => c.edit(item.id, { role: v })}
              placeholder="Software Developer II"
            />
            <TextField
              label="Company"
              value={item.company}
              onChange={(v) => c.edit(item.id, { company: v })}
            />
          </div>

          <div className="form__row">
            <TextField
              label="Client"
              hint="Optional — for consultancy or agency roles."
              value={item.client}
              onChange={(v) => c.edit(item.id, { client: v })}
            />
            <TextField
              label="Period"
              value={item.period}
              onChange={(v) => c.edit(item.id, { period: v })}
              placeholder="Sep 2025 — Present"
            />
            <TextField
              label="Location"
              value={item.location}
              onChange={(v) => c.edit(item.id, { location: v })}
              placeholder="Makati City"
            />
          </div>

          <TextArea
            label="Summary"
            hint="Optional one-liner for internal reference."
            rows={2}
            value={item.summary}
            onChange={(v) => c.edit(item.id, { summary: v })}
          />

          <TextArea
            label="Responsibilities"
            hint="One bullet per line."
            rows={7}
            mono
            value={item.bullets.join('\n')}
            onChange={(v) => c.edit(item.id, { bullets: linesToArray(v) })}
          />

          <TextField
            label="Tech stack"
            hint="Comma separated."
            value={item.tech.join(', ')}
            onChange={(v) => c.edit(item.id, { tech: commasToArray(v) })}
          />

          <Toggle
            label="Show on the site"
            checked={item.published}
            onChange={(v) => c.edit(item.id, { published: v })}
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
