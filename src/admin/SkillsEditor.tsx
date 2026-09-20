import { Plus } from '../components/Icons'
import { commasToArray } from '../lib/content'
import type { SkillGroup } from '../lib/types'
import CollectionCard from './CollectionCard'
import { useCollection } from './useCollection'
import { SaveBar, TextArea, TextField } from './ui'

export default function SkillsEditor({
  groups,
  onChanged,
}: {
  groups: SkillGroup[]
  onChanged: () => void
}) {
  const c = useCollection<SkillGroup>('skill_groups', groups, onChanged, () => ({
    label: 'New group',
    items: [],
    sort_order: 0,
  }))

  return (
    <>
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Skills</h1>
          <p className="admin__subtitle">
            Grouped by category. Lead with the group a recruiter is hiring for.
          </p>
        </div>
        <div className="admin__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={c.add}
            disabled={c.busy}
          >
            <Plus /> Add group
          </button>
        </div>
      </header>

      {c.rows.length === 0 && (
        <p className="empty">No skill groups yet. Add your first one above.</p>
      )}

      {c.rows.map((group, i) => (
        <CollectionCard
          key={group.id}
          title={group.label}
          index={i}
          total={c.rows.length}
          onMove={(d) => c.move(i, d)}
          onDelete={() => c.remove(group.id)}
          deleteLabel="group"
          badges={<span className="pill">{group.items.length} skills</span>}
        >
          <TextField
            label="Group label"
            value={group.label}
            onChange={(v) => c.edit(group.id, { label: v })}
            placeholder="Back-End"
          />
          <TextArea
            label="Skills"
            hint="Comma separated. They render as tags in the order you list them."
            rows={4}
            mono
            value={group.items.join(', ')}
            onChange={(v) => c.edit(group.id, { items: commasToArray(v) })}
            placeholder="C#, .NET 8, ASP.NET Core Web API"
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
