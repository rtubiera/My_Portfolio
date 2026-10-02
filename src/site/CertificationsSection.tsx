import type { ReactNode } from 'react'
import { ArrowUpRight, Check } from '../components/Icons'
import { resolveCertsLayout } from '../lib/theme'
import type { Certification } from '../lib/types'

type Props = {
  items: Certification[]
  layout?: string
}

/** Wraps a card in a link only when the entry has a credential URL. */
function MaybeLink({
  url,
  className,
  children,
}: {
  url: string | null
  className: string
  children: ReactNode
}) {
  if (!url) return <div className={className}>{children}</div>
  return (
    <a
      className={className}
      href={url}
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  )
}

export default function CertificationsSection({ items, layout }: Props) {
  const mode = resolveCertsLayout(layout)

  if (mode === 'list') {
    return (
      <ul className="cert-rows">
        {items.map((cert) => (
          <li key={cert.id}>
            <MaybeLink url={cert.url} className="cert-row">
              <span className="cert-row__title">{cert.title}</span>
              <span className="cert-row__meta">
                {cert.issuer}
                {cert.date_label && ` · ${cert.date_label}`}
                {cert.url && <ArrowUpRight size={13} className="arrow" />}
              </span>
            </MaybeLink>
          </li>
        ))}
      </ul>
    )
  }

  if (mode === 'badges') {
    return (
      <ul className="cert-badges">
        {items.map((cert) => (
          <li key={cert.id}>
            <MaybeLink url={cert.url} className="cert-badge">
              <span className="cert-badge__seal" aria-hidden="true">
                <Check size={16} />
              </span>
              <span className="cert-badge__text">
                <span className="cert-badge__title">{cert.title}</span>
                <span className="cert-badge__meta">
                  {cert.issuer}
                  {cert.date_label && ` · ${cert.date_label}`}
                </span>
              </span>
            </MaybeLink>
          </li>
        ))}
      </ul>
    )
  }

  if (mode === 'shelf') {
    return (
      <div className="cert-shelf">
        {items.map((cert) => (
          <MaybeLink key={cert.id} url={cert.url} className="cert-shelf__item">
            <span className="cert-shelf__year">{cert.date_label || 'Verified'}</span>
            <strong>{cert.title}</strong>
            <span>{cert.issuer}</span>
          </MaybeLink>
        ))}
      </div>
    )
  }

  return (
    <div className="cert-list">
      {items.map((cert) => (
        <MaybeLink key={cert.id} url={cert.url} className="cert">
          <h3 className="cert__title">{cert.title}</h3>
          <p className="cert__meta">
            {cert.issuer}
            {cert.date_label && ` · ${cert.date_label}`}
          </p>
        </MaybeLink>
      ))}
    </div>
  )
}
