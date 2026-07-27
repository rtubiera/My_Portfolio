import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Close, Menu, Moon, Sun } from './Icons'
import { useActiveSection } from '../lib/hooks'

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]
const SECTION_IDS = SECTIONS.map((s) => s.id)
// Module-level so the identity is stable — an inline [] would re-fire the
// observer effect on every render.
const NO_SECTIONS: string[] = []

type Props = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  /** On the project detail page the in-page anchors need to route home first. */
  anchorsAreLinks?: boolean
  logoUrl?: string | null
  logoText?: string
  siteName?: string
}

export default function Nav({
  theme,
  onToggleTheme,
  anchorsAreLinks = false,
  logoUrl,
  logoText,
  siteName = 'Home',
}: Props) {
  const [open, setOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const active = useActiveSection(anchorsAreLinks ? NO_SECTIONS : SECTION_IDS)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile sheet on resize back to desktop.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 761px)')
    const onChange = () => mq.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <header className="nav" data-stuck={stuck}>
      <div className="shell nav__inner">
        <Link
          to="/"
          className="nav__brand"
          onClick={() => setOpen(false)}
          aria-label={siteName}
        >
          {logoUrl ? (
            <img className="nav__logo" src={logoUrl} alt={siteName} />
          ) : (
            <>
              {logoText || 'DJT'}
              <span>.</span>
            </>
          )}
        </Link>

        <nav className="nav__links" data-open={open} aria-label="Sections">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              className="nav__link"
              href={anchorsAreLinks ? `/#${section.id}` : `#${section.id}`}
              data-active={!anchorsAreLinks && active === section.id}
              onClick={() => setOpen(false)}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <button
            type="button"
            className="icon-btn nav__toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  )
}
