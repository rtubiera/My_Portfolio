import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight } from '../components/Icons'
import { mediaUrl } from '../lib/supabase'
import { resolveWorkLayout, resolveWorkLimit } from '../lib/theme'
import type { Project } from '../lib/types'

type Props = {
  projects: Project[]
  layout?: string
  /** Shown before "Show more". 0 = every project. Ignored by the carousel. */
  limit?: number
}

export default function WorkList({ projects, layout, limit }: Props) {
  const mode = resolveWorkLayout(layout)
  const cap = resolveWorkLimit(limit)
  const [expanded, setExpanded] = useState(false)

  // Collapse again if the CMS changes the cap or the layout while the list is
  // expanded — otherwise the page keeps showing more than the setting allows.
  const [lastSetting, setLastSetting] = useState(`${mode}:${cap}`)
  if (lastSetting !== `${mode}:${cap}`) {
    setLastSetting(`${mode}:${cap}`)
    setExpanded(false)
  }

  if (!projects.length) {
    return <p className="empty">No projects published yet.</p>
  }

  if (mode === 'carousel') {
    // The carousel already paginates itself, so it never hides anything.
    return <WorkCarousel projects={projects} />
  }

  const capped = cap > 0 && !expanded && projects.length > cap
  const visible = capped ? projects.slice(0, cap) : projects
  const hidden = projects.length - visible.length

  if (mode === 'showcase') {
    return (
      <div className="work-showcase">
        <WorkGrid projects={visible} />
        {hidden > 0 && (
          <div className="work-more">
            <button type="button" className="btn" onClick={() => setExpanded(true)}>
              Show {hidden} more projects
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {mode === 'grid' ? (
        <WorkGrid projects={visible} />
      ) : mode === 'cards' ? (
        <WorkCards projects={visible} />
      ) : (
        <WorkRows projects={visible} />
      )}

      {hidden > 0 && (
        <div className="work-more">
          <button
            type="button"
            className="btn"
            onClick={() => setExpanded(true)}
          >
            Show {hidden} more {hidden === 1 ? 'project' : 'projects'}
          </button>
        </div>
      )}

      {expanded && cap > 0 && projects.length > cap && (
        <div className="work-more">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setExpanded(false)}
          >
            Show less
          </button>
        </div>
      )}
    </>
  )
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

/** One card. Shared by the cards grid and the carousel track. */
function WorkCard({
  project,
  className = 'work-card',
}: {
  project: Project
  className?: string
}) {
  const cover = project.cover_url ? mediaUrl(project.cover_url) : null

  return (
    <li className={className}>
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
}

function WorkCards({ projects }: { projects: Project[] }) {
  return (
    <ul className="work-cards">
      {projects.map((project) => (
        <WorkCard key={project.id} project={project} />
      ))}
    </ul>
  )
}

/* -- carousel: the cards on a snapping horizontal track -------------------- */

/**
 * A scroll-snap track rather than a transform-driven slider: swiping, the
 * trackpad, and keyboard scrolling all work on their own, and the arrows just
 * scroll it. That also means the whole thing degrades to a plain scrollable
 * row if JavaScript is slow to boot.
 */
function WorkCarousel({ projects }: { projects: Project[] }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)
  const [overflowing, setOverflowing] = useState(false)

  /** Index of the slide currently sitting closest to the left edge. */
  const syncActive = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const slides = Array.from(track.children) as HTMLElement[]
    if (!slides.length) return

    const nearest = slides.reduce((best, slide, i) => {
      const distance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft)
      const bestDistance = Math.abs(
        slides[best].offsetLeft - track.offsetLeft - track.scrollLeft,
      )
      return distance < bestDistance ? i : best
    }, 0)

    setActive(nearest)
    // A track that fits its content has nothing to page through — hide the
    // controls rather than showing dead arrows.
    setOverflowing(track.scrollWidth - track.clientWidth > 4)
  }, [])

  useEffect(() => {
    syncActive()
    const track = trackRef.current
    if (!track || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(syncActive)
    observer.observe(track)
    return () => observer.disconnect()
  }, [syncActive, projects.length])

  function goTo(index: number) {
    const track = trackRef.current
    if (!track) return

    const clamped = Math.max(0, Math.min(projects.length - 1, index))
    const slide = track.children[clamped] as HTMLElement | undefined
    if (!slide) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches
    track.scrollTo({
      left: slide.offsetLeft - track.offsetLeft,
      behavior: reduced ? 'auto' : 'smooth',
    })
  }

  const atStart = active === 0
  const atEnd = active >= projects.length - 1

  return (
    <div className="work-carousel">
      <ul
        className="work-carousel__track"
        ref={trackRef}
        onScroll={syncActive}
        tabIndex={0}
        aria-label="Projects carousel"
      >
        {projects.map((project) => (
          <WorkCard
            key={project.id}
            project={project}
            className="work-card work-carousel__slide"
          />
        ))}
      </ul>

      {overflowing && (
        <div className="work-carousel__controls">
          <div className="work-carousel__dots">
            {projects.map((project, i) => (
              <button
                key={project.id}
                type="button"
                className="work-carousel__dot"
                data-active={i === active}
                onClick={() => goTo(i)}
                aria-label={`Go to ${project.title}`}
                aria-current={i === active}
              />
            ))}
          </div>

          <div className="work-carousel__arrows">
            <button
              type="button"
              className="work-carousel__arrow"
              onClick={() => goTo(active - 1)}
              disabled={atStart}
              aria-label="Previous project"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="work-carousel__arrow"
              onClick={() => goTo(active + 1)}
              disabled={atEnd}
              aria-label="Next project"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
