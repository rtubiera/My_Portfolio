import { Link } from 'react-router-dom'
import { ArrowUpRight } from '../components/Icons'
import { mediaUrl } from '../lib/supabase'
import { resolveWorkLayout } from '../lib/theme'
import type { Project } from '../lib/types'

type Props = {
  projects: Project[]
  layout?: string
}

export default function WorkList({ projects, layout }: Props) {
  const mode = resolveWorkLayout(layout)

  if (!projects.length) {
    return <p className="empty">No projects published yet.</p>
  }

  if (mode === 'grid') return <WorkGrid projects={projects} />
  if (mode === 'cards') return <WorkCards projects={projects} />
  return <WorkRows projects={projects} />
}

/* -- list: numbered editorial rows ----------------------------------------- */

function WorkRows({ projects }: { projects: Project[] }) {
  return (
    <ol className="work-list">
      {projects.map((project, i) => (
        <li key={project.id}>
          <Link to={`/work/${project.slug}`} className="work-row">
            <span className="work-row__index">
              {String(i + 1).padStart(2, '0')}
            </span>

            <div>
              <h3 className="work-row__title">
                {project.title}
                <ArrowUpRight className="arrow" />
              </h3>
              <p className="work-row__blurb">{project.blurb}</p>
              <ul className="tag-row">
                {project.tech.slice(0, 5).map((tech) => (
                  <li key={tech} className="tag">
                    {tech}
                  </li>
                ))}
                {project.tech.length > 5 && (
                  <li className="tag">+{project.tech.length - 5}</li>
                )}
              </ul>
            </div>

            <div className="work-row__meta">
              {project.featured && (
                <span className="badge-featured">Featured</span>
              )}
              <span className="work-row__year">{project.year}</span>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/* -- grid: image tiles with a caption bar ---------------------------------- */

function WorkGrid({ projects }: { projects: Project[] }) {
  return (
    <ul className="work-grid">
      {projects.map((project) => {
        const cover = project.cover_url ? mediaUrl(project.cover_url) : null
        return (
          <li key={project.id}>
            <Link to={`/work/${project.slug}`} className="work-tile">
              {cover ? (
                <img
                  className="work-tile__img"
                  src={cover}
                  alt=""
                  loading="lazy"
                />
              ) : (
                /* No screenshot yet — a typographic tile beats a grey box. */
                <span className="work-tile__fallback" aria-hidden="true">
                  {project.title.slice(0, 2).toUpperCase()}
                </span>
              )}

              <span className="work-tile__caption">
                <span className="work-tile__title">{project.title}</span>
                <span className="work-tile__meta">
                  {project.tech.slice(0, 3).join(' · ')}
                </span>
              </span>

              {project.featured && (
                <span className="work-tile__flag">Featured</span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/* -- cards: screenshot on top, title, stack, action ------------------------ */

function WorkCards({ projects }: { projects: Project[] }) {
  return (
    <ul className="work-cards">
      {projects.map((project) => {
        const cover = project.cover_url ? mediaUrl(project.cover_url) : null
        return (
          <li key={project.id} className="work-card">
            <Link
              to={`/work/${project.slug}`}
              className="work-card__media"
              tabIndex={-1}
              aria-hidden="true"
            >
              {cover ? (
                <img src={cover} alt="" loading="lazy" />
              ) : (
                <span className="work-card__fallback">
                  {project.title.slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>

            <div className="work-card__body">
              <h3 className="work-card__title">
                <Link to={`/work/${project.slug}`}>{project.title}</Link>
              </h3>
              <p className="work-card__stack">({project.tech.join(', ')})</p>
              <p className="work-card__blurb">{project.blurb}</p>
            </div>

            <div className="work-card__actions">
              <Link className="btn btn--sm" to={`/work/${project.slug}`}>
                Case study
                <ArrowUpRight size={13} />
              </Link>
              {project.live_url && (
                <a
                  className="btn btn--sm btn--ghost"
                  href={project.live_url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Live
                  <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
