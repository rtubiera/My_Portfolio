import { mediaUrl } from '../lib/supabase'
import { resolveAboutLayout } from '../lib/theme'
import type { SiteSettings } from '../lib/types'

function paragraphs(text: string) {
  return text
    .split('\n')
    .map((para) => para.trim())
    .filter(Boolean)
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
  const body = paragraphs(settings.about)

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
        <div className="about__body">
          {body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
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
          <div className="about__body">
            {body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="about__facts-strip">
            <Facts settings={settings} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="about">
      <div className="about__body">
        {body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

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
