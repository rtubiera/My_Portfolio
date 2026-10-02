import { resolveExperienceLayout } from '../lib/theme'
import type { Experience } from '../lib/types'

type Props = {
  items: Experience[]
  layout?: string
}

export default function ExperienceList({ items, layout }: Props) {
  const mode = resolveExperienceLayout(layout)

  if (!items.length) {
    return <p className="empty">No experience entries yet.</p>
  }

  if (mode === 'timeline') return <ExperienceTimeline items={items} />
  if (mode === 'cards') return <ExperienceCards items={items} />
  if (mode === 'spotlight') {
    return <div className="exp-spotlight"><ExperienceCards items={items} /></div>
  }
  return <ExperienceRows items={items} />
}

/** Shared inner content — the three layouts differ only in their chrome. */
function Body({ item }: { item: Experience }) {
  return (
    <>
      <h3 className="exp__role">{item.role}</h3>
      <p className="exp__company">{item.company}</p>
      {item.client && <p className="exp__client">Client — {item.client}</p>}

      {item.bullets.length > 0 && (
        <ul className="exp__bullets">
          {item.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}

      {item.tech.length > 0 && (
        <ul className="tag-row">
          {item.tech.map((tech) => (
            <li key={tech} className="tag">
              {tech}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/* -- rows: period column beside the detail --------------------------------- */

function ExperienceRows({ items }: { items: Experience[] }) {
  return (
    <div className="exp-list">
      {items.map((item) => (
        <article className="exp" key={item.id}>
          <div className="exp__period">
            {item.period}
            {item.location && <span className="loc">{item.location}</span>}
          </div>
          <div>
            <Body item={item} />
          </div>
        </article>
      ))}
    </div>
  )
}

/* -- timeline: rail, node, and a period chip ------------------------------- */

function ExperienceTimeline({ items }: { items: Experience[] }) {
  return (
    <ol className="exp-timeline">
      {items.map((item) => (
        <li className="exp-tl" key={item.id}>
          <span className="exp-tl__node" aria-hidden="true" />
          <div className="exp-tl__body">
            <p className="exp-tl__period">
              <span className="exp-tl__chip">{item.period}</span>
              {item.location && (
                <span className="exp-tl__loc">{item.location}</span>
              )}
            </p>
            <Body item={item} />
          </div>
        </li>
      ))}
    </ol>
  )
}

/* -- cards: each role in its own panel ------------------------------------- */

function ExperienceCards({ items }: { items: Experience[] }) {
  return (
    <div className="exp-cards">
      {items.map((item) => (
        <article className="exp-card" key={item.id}>
          <header className="exp-card__head">
            <span className="exp-tl__chip">{item.period}</span>
            {item.location && (
              <span className="exp-tl__loc">{item.location}</span>
            )}
          </header>
          <Body item={item} />
        </article>
      ))}
    </div>
  )
}
