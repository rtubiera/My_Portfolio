import type { SiteSettings } from '../lib/types'

export default function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <span>
          © {new Date().getFullYear()} {settings.name}
        </span>
        <ul className="footer__links">
          {settings.socials.map((social) => (
            <li key={social.url}>
              <a
                href={social.url}
                target={social.url.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer noopener"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
