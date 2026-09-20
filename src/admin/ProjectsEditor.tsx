import { Plus } from '../components/Icons'
import { commasToArray, linesToArray, slugify } from '../lib/content'
import type { Project } from '../lib/types'
import CollectionCard from './CollectionCard'
import { useCollection } from './useCollection'
import { FileUpload, SaveBar, TextArea, TextField, Toggle } from './ui'

export default function ProjectsEditor({
  projects,
  onChanged,
}: {
  projects: Project[]
  onChanged: () => void
}) {
  const c = useCollection<Project>('projects', projects, onChanged, () => ({
    slug: `new-project-${Date.now().toString(36)}`,
    title: 'New project',
    blurb: '',
    description: '',
    role: '',
    year: '',
    tech: [],
    highlights: [],
    repo_url: null,
    live_url: null,
    cover_url: null,
    featured: false,
    published: false,
    sort_order: 0,
  }))

  return (
    <>
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Projects</h1>
          <p className="admin__subtitle">
            Each project gets its own page at <code className="code">/work/slug</code>.
            Unpublished projects are hidden from visitors but stay editable here.
          </p>
        </div>
        <div className="admin__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={c.add}
            disabled={c.busy}
          >
            <Plus /> Add project
          </button>
        </div>
      </header>

      {c.rows.length === 0 && (
        <p className="empty">No projects yet. Add your first one above.</p>
      )}

      {c.rows.map((project, i) => (
        <CollectionCard
          key={project.id}
          title={project.title}
          index={i}
          total={c.rows.length}
          onMove={(d) => c.move(i, d)}
          onDelete={() => c.remove(project.id)}
          deleteLabel="project"
          badges={
            <>
              {project.featured && <span className="pill pill--accent">Featured</span>}
              <span
                className={project.published ? 'pill pill--on' : 'pill pill--off'}
              >
                {project.published ? 'Live' : 'Draft'}
              </span>
            </>
          }
        >
          <div className="form__row">
            <TextField
              label="Title"
              value={project.title}
              onChange={(v) => c.edit(project.id, { title: v })}
            />
            <div className="field">
              <span className="field__label">URL slug</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  className="input"
                  value={project.slug}
                  onChange={(e) =>
                    c.edit(project.id, { slug: slugify(e.target.value) })
                  }
                />
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() =>
                    c.edit(project.id, { slug: slugify(project.title) })
                  }
                  title="Generate from title"
                >
                  Auto
                </button>
              </div>
              <span className="field__hint">/work/{project.slug || '…'}</span>
            </div>
          </div>

          <TextArea
            label="Blurb"
            hint="One sentence. Shown in the work list on the home page."
            rows={2}
            value={project.blurb}
            onChange={(v) => c.edit(project.id, { blurb: v })}
          />

          <TextArea
            label="Description"
            hint="Full write-up for the project page. Blank line between paragraphs."
            rows={8}
            value={project.description}
            onChange={(v) => c.edit(project.id, { description: v })}
          />

          <div className="form__row">
            <TextField
              label="Your role"
              value={project.role}
              onChange={(v) => c.edit(project.id, { role: v })}
              placeholder="Software Developer II"
            />
            <TextField
              label="Year / timeline"
              value={project.year}
              onChange={(v) => c.edit(project.id, { year: v })}
              placeholder="2025 — Present"
            />
          </div>

          <TextField
            label="Tech stack"
            hint="Comma separated."
            value={project.tech.join(', ')}
            onChange={(v) => c.edit(project.id, { tech: commasToArray(v) })}
            placeholder=".NET 8, Blazor, SQL Server"
          />

          <TextArea
            label="Highlights"
            hint="One per line. Shown as a bulleted list on the project page."
            rows={5}
            mono
            value={project.highlights.join('\n')}
            onChange={(v) =>
              c.edit(project.id, { highlights: linesToArray(v) })
            }
          />

          <div className="form__row">
            <TextField
              label="Live URL"
              value={project.live_url ?? ''}
              onChange={(v) => c.edit(project.id, { live_url: v || null })}
              placeholder="https://…"
            />
            <TextField
              label="Repository URL"
              value={project.repo_url ?? ''}
              onChange={(v) => c.edit(project.id, { repo_url: v || null })}
              placeholder="https://github.com/…"
            />
          </div>

          <FileUpload
            label="Cover image"
            hint="Wide screenshot works best (roughly 16:9)."
            folder="projects"
            value={project.cover_url}
            onChange={(path) => c.edit(project.id, { cover_url: path })}
          />

          <div
            style={{ display: 'flex', gap: 'var(--space-m)', flexWrap: 'wrap' }}
          >
            <Toggle
              label="Published"
              checked={project.published}
              onChange={(v) => c.edit(project.id, { published: v })}
            />
            <Toggle
              label="Featured"
              checked={project.featured}
              onChange={(v) => c.edit(project.id, { featured: v })}
            />
          </div>
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
