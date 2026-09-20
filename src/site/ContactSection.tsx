import { ArrowUpRight, Mail, SocialIcon } from '../components/Icons'
import { resolveContactLayout } from '../lib/theme'
import type { SiteSettings } from '../lib/types'
import ContactForm from './ContactForm'

const LEAD = "Let's build something reliable."
const SUB =
  'Open to full stack and backend roles, contract work, and interesting problems in .NET. The fastest way to reach me is the form — it lands straight in my inbox.'

function DirectLinks({ settings }: { settings: SiteSettings }) {
  return (
    <div className="contact__direct">
      <a href={`mailto:${settings.email}`}>
        {settings.email}
        <ArrowUpRight className="arrow" />
      </a>
      {settings.socials.map((social) => (
        <a
          key={social.url}
          href={social.url}
          target={social.url.startsWith('mailto:') ? undefined : '_blank'}
          rel="noreferrer noopener"
        >
          {social.label}
          <ArrowUpRight className="arrow" />
        </a>
      ))}
    </div>
  )
}

export default function ContactSection({
  settings,
}: {
  settings: SiteSettings
}) {
  const mode = resolveContactLayout(settings.contact_layout)

  if (mode === 'centered') {
    return (
      <div className="contact contact--centered">
        <h3 className="contact__lead">{LEAD}</h3>
        <p className="contact__sub">{SUB}</p>
        <ContactForm email={settings.email} />
        <ul className="contact__social-row">
          <li>
            <a href={`mailto:${settings.email}`}>
              <Mail size={14} />
              {settings.email}
            </a>
          </li>
          {settings.socials.map((social) => (
            <li key={social.url}>
              <a
                href={social.url}
                target={social.url.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer noopener"
              >
                <SocialIcon label={social.label} size={14} />
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (mode === 'cards') {
    return (
      <div className="contact contact--cards">
        <ul className="contact-cards">
          <li className="contact-card">
            <span className="mono">Email</span>
            <a className="contact-card__value" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
          </li>
          {settings.phone && (
            <li className="contact-card">
              <span className="mono">Phone</span>
              <span className="contact-card__value">{settings.phone}</span>
            </li>
          )}
          <li className="contact-card">
            <span className="mono">Location</span>
            <span className="contact-card__value">{settings.location}</span>
          </li>
          <li className="contact-card">
            <span className="mono">Elsewhere</span>
            <span className="contact-card__links">
              {settings.socials.map((social) => (
                <a
                  key={social.url}
                  href={social.url}
                  target={
                    social.url.startsWith('mailto:') ? undefined : '_blank'
                  }
                  rel="noreferrer noopener"
                  title={social.label}
                  aria-label={social.label}
                >
                  <SocialIcon label={social.label} size={16} />
                </a>
              ))}
            </span>
          </li>
        </ul>

        <div className="contact-panel">
          <h3 className="contact__lead">{LEAD}</h3>
          <p className="contact__sub">{SUB}</p>
          <ContactForm email={settings.email} />
        </div>
      </div>
    )
  }

  return (
    <div className="contact">
      <div>
        <h3 className="contact__lead">{LEAD}</h3>
        <p className="contact__sub">{SUB}</p>
        <DirectLinks settings={settings} />
      </div>
      <ContactForm email={settings.email} />
    </div>
  )
}
