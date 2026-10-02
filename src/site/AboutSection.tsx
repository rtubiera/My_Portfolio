import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from '../components/Icons'
import { mediaUrl } from '../lib/supabase'
import { resolveAboutLayout } from '../lib/theme'
import type { SiteSettings } from '../lib/types'

function paragraphs(text: string) {
  return text
    .split('\n')
    .map((para) => para.trim())
    .filter(Boolean)
}

/**
 * The about copy, cut off after a few paragraphs with a "Read more" toggle.
 *
 * Whether to offer the toggle is measured rather than counted: a short about
 * text renders in full with no button, and the button appears the moment the
 * copy is long enough to actually be clipped — including when a narrow phone
 * is what makes it long.
 */
function AboutBody({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [clipped, setClipped] = useState(false)
  const body = paragraphs(text)

  useEffect(() => {
    const el = ref.current
    // While expanded there is nothing to measure — the clamp is off, so the
    // element always fits, and re-measuring would hide the "Show less" button.
    if (!el || expanded) return

    const measure = () => setClipped(el.scrollHeight - el.clientHeight > 8)
    measure()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [expanded, text])

  function toggle() {
    // Collapsing a long about section can leave you scrolled past it, staring
    // at the next heading — take the top of the copy back with you.
    if (expanded) {
      const el = ref.current
      if (el && el.getBoundingClientRect().top < 0) {
        const reduced = window.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches
        el.scrollIntoView({
          behavior: reduced ? 'auto' : 'smooth',
          block: 'start',
        })
      }
    }
    setExpanded((e) => !e)
  }

  const clamped = !expanded && clipped

  return (
    <div className="about__prose">
      <div
        id="about-body"
        className="about__body"
        data-clamped={!expanded}
        data-faded={clamped}
        ref={ref}
      >
        {body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {clipped && (
        <div className="about__more">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls="about-body"
          >
            {expanded ? 'Show less' : 'Read more'}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      )}
    </div>
  )
}

function Facts({ settings }: { settings: SiteSettings }) {
  return (
    <>
      <div className="fact">
        <span className="mono">Based in</span>
        <span className="fact__value">{settings.location}</span>
      </div>
      <div className="fact">
        <span className="mono">Email</span>
        <span className="fact__value">
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
        </span>
      </div>
      {settings.phone && (
        <div className="fact">
          <span className="mono">Phone</span>
          <span className="fact__value">{settings.phone}</span>
        </div>
      )}
      <div className="fact">
        <span className="mono">Status</span>
        <span className="fact__value">
          {settings.available
            ? settings.available_note || 'Open to opportunities'
            : 'Not currently looking'}
        </span>
      </div>
    </>
  )
}

export default function AboutSection({ settings }: { settings: SiteSettings }) {
  const mode = resolveAboutLayout(settings.about_layout)
  const avatar = settings.avatar_url ? mediaUrl(settings.avatar_url) : null

  if (mode === 'centered') {
    return (
      <div className="about about--centered">
        {avatar && (
          <img
            className="about__avatar"
            src={avatar}
            alt={settings.name}
            loading="lazy"
          />
        )}
        <AboutBody text={settings.about} />
        <div className="about__facts-strip">
          <Facts settings={settings} />
        </div>
      </div>
    )
  }

  if (mode === 'portrait') {
    return (
      <div className="about about--portrait">
        {avatar && (
          <img
            className="about__figure"
            src={avatar}
            alt={settings.name}
            loading="lazy"
          />
        )}
        <div>
          <AboutBody text={settings.about} />
          <div className="about__facts-strip">
            <Facts settings={settings} />
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'manifesto') {
    return (
      <div className="about about--manifesto">
        <AboutBody text={settings.about} />
        <div className="about__facts-strip"><Facts settings={settings} /></div>
      </div>
    )
  }

  return (
    <div className="about">
      <AboutBody text={settings.about} />

      <aside className="about__aside">
        {avatar && (
          <img
            className="about__portrait"
            src={avatar}
            alt={settings.name}
            loading="lazy"
          />
        )}
        <Facts settings={settings} />
      </aside>
    </div>
  )
}
