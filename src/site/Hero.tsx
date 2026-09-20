import { ChevronDown, Document, SocialIcon } from '../components/Icons'
import { mediaUrl } from '../lib/supabase'
import { resolveHeroLayout } from '../lib/theme'
import type { SiteSettings } from '../lib/types'

export default function Hero({ settings }: { settings: SiteSettings }) {
  const layout = resolveHeroLayout(settings.hero_layout)
  const resume = settings.resume_url ? mediaUrl(settings.resume_url) : null

  // The hero has its own image slot; fall back to the About portrait so the
  // photo layouts still work the moment you switch to them.
  const rawImage = settings.hero_image_url || settings.avatar_url
  const image = rawImage ? mediaUrl(rawImage) : null
  const hasPhoto = layout !== 'editorial' && image !== null

  const status = settings.available_note && (
    <p className="hero__status">
      <span
        className="hero__dot"
        data-available={settings.available}
        aria-hidden="true"
      />
      {settings.available_note}
    </p>
  )

  const headline = (
    <>
      <h1 className="hero__name">{settings.name}</h1>
      <p className="hero__role">
        <span>{settings.role}</span>
        {settings.tagline && (
          <>
            <span className="sep" aria-hidden="true">
              /
            </span>
            <span className="muted">{settings.tagline}</span>
          </>
        )}
      </p>
      <p className="hero__intro">{settings.hero_intro}</p>
    </>
  )

  const actions = (
    <div className="hero__actions">
      <a className="btn btn--primary" href="#work">
        View selected work
      </a>
      {resume && (
        <a className="btn" href={resume} target="_blank" rel="noreferrer noopener">
          <Document />
          Résumé
        </a>
      )}
      {settings.socials.map((social) => (
        <a
          key={social.url}
          className="btn"
          href={social.url}
          target={social.url.startsWith('mailto:') ? undefined : '_blank'}
          rel="noreferrer noopener"
        >
          <SocialIcon label={social.label} />
          {social.label}
        </a>
      ))}
    </div>
  )

  const metrics = settings.metrics.length > 0 && (
    <div className="shell hero__metrics-wrap">
      <dl className="hero__metrics">
        {settings.metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <dd className="metric__value">{metric.value}</dd>
            <dt className="metric__label">{metric.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )

  return (
    <>
      <section className={`hero hero--${layout}`} data-has-photo={hasPhoto}>
        {layout === 'portrait' && hasPhoto && (
          <div className="hero__media" aria-hidden="true">
            <img src={image} alt="" fetchPriority="high" />
            <div className="hero__scrim" />
          </div>
        )}

        <div className="shell hero__inner">
          <div className="hero__copy">
            {status}
            {headline}
            {actions}
          </div>

          {layout === 'split' && hasPhoto && (
            <div className="hero__frame">
              <img
                className="hero__portrait"
                src={image}
                alt={settings.name}
                fetchPriority="high"
              />
            </div>
          )}
        </div>

        {layout === 'portrait' && (
          <a className="hero__scroll" href="#work" aria-label="Scroll to work">
            <ChevronDown size={20} />
          </a>
        )}
      </section>

      {metrics}
    </>
  )
}
