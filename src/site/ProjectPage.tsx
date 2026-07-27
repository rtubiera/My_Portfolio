import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Github } from '../components/Icons'
import { useDocumentMeta } from '../lib/hooks'
import { mediaUrl } from '../lib/supabase'
import type { PortfolioContent } from '../lib/types'

export default function ProjectPage({ content }: { content: PortfolioContent }) {
  const { slug } = useParams<{ slug: string }>()
  const project = content.projects.find((p) => p.slug === slug)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [slug])

  useDocumentMeta(
    project
      ? `${project.title} — ${content.settings.name}`
      : `Not found — ${content.settings.name}`,
    project?.blurb,
  )

  if (!project) {
    return (
      <main id="main" className="shell project-page">
        <Link to="/#work" className="back-link">
          <ArrowLeft /> Back to work
        </Link>
        <h1 className="project-hero__title">Project not found</h1>
        <p className="prose">
          That project doesn't exist, or it isn't published yet.
        </p>
      </main>
    )
  }

  const cover = project.cover_url ? mediaUrl(project.cover_url) : null

  return (
    <main id="main" className="shell project-page">
      <Link to="/#work" className="back-link">
        <ArrowLeft /> Back to work
      </Link>

      <header>
        <p className="mono">
          {project.year}
          {project.role && ` · ${project.role}`}
        </p>
        <h1 className="project-hero__title">{project.title}</h1>
        <p className="project-hero__blurb">{project.blurb}</p>

        <div className="hero__actions" style={{ marginBottom: 0 }}>
          {project.live_url && (
            <a
              className="btn btn--primary"
              href={project.live_url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <ArrowUpRight />
              Live site
            </a>
          )}
          {project.repo_url && (
            <a
              className="btn"
              href={project.repo_url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Github />
              Source
            </a>
          )}
        </div>
      </header>

      {cover && (
        <img
          className="project-cover"
          src={cover}
          alt={`${project.title} screenshot`}
          loading="lazy"
        />
      )}

      <div className="project-body">
        <div>
          <div className="prose">
            {project.description
              .split('\n')
              .map((para) => para.trim())
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>

          {project.highlights.length > 0 && (
            <>
              <h2 className="mono" style={{ marginTop: 'var(--space-l)' }}>
                Highlights
              </h2>
              <ul className="highlight-list">
                {project.highlights.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="project-aside">
          <div className="fact">
            <span className="mono">Role</span>
            <span className="fact__value">{project.role || '—'}</span>
          </div>
          <div className="fact">
            <span className="mono">Timeline</span>
            <span className="fact__value">{project.year || '—'}</span>
          </div>
          <div>
            <span className="mono" style={{ display: 'block', marginBottom: '0.6rem' }}>
              Stack
            </span>
            <ul className="tag-row">
              {project.tech.map((tech) => (
                <li key={tech} className="tag">
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
