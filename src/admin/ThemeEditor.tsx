import { useState } from 'react'
import { Check } from '../components/Icons'
import { supabase } from '../lib/supabase'
import {
  ACCENTS,
  DEFAULT_THEME,
  FONT_PAIRS,
  PRESETS,
  applyFavicon,
  applyTheme,
  type AboutLayout,
  type CertsLayout,
  type ContactLayout,
  type CustomPalette,
  type ExperienceLayout,
  type FontPairId,
  type HeroLayout,
  type PresetId,
  type SkillsLayout,
  type WorkLayout,
} from '../lib/theme'
import { mediaUrl } from '../lib/supabase'
import type { SiteSettings } from '../lib/types'
import PaletteManager from './PaletteManager'
import { FileUpload, SaveBar, TextField, type SaveState } from './ui'

const LAYOUTS: {
  id: HeroLayout
  label: string
  description: string
  needsPhoto: boolean
}[] = [
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Type only. Big name, no photo — the fastest to read.',
    needsPhoto: false,
  },
  {
    id: 'portrait',
    label: 'Portrait',
    description: 'Full-bleed photo with your name over it, and a scroll cue.',
    needsPhoto: true,
  },
  {
    id: 'split',
    label: 'Split',
    description: 'Copy on the left, a ring-framed photo on the right.',
    needsPhoto: true,
  },
]

const WORK_LAYOUTS: { id: WorkLayout; label: string; description: string }[] = [
  {
    id: 'list',
    label: 'List',
    description: 'Numbered rows. Scannable, and works with no screenshots.',
  },
  {
    id: 'grid',
    label: 'Grid',
    description: 'Image tiles with a caption bar. Needs cover images.',
  },
  {
    id: 'cards',
    label: 'Cards',
    description: 'Screenshot, title, stack, and buttons. Needs cover images.',
  },
]

const SKILLS_LAYOUTS: {
  id: SkillsLayout
  label: string
  description: string
}[] = [
  {
    id: 'grouped',
    label: 'Grouped',
    description: 'Category label beside a row of tags. The most compact.',
  },
  {
    id: 'icons',
    label: 'Icon wall',
    description: 'One flat grid of tech logos. Groups are merged.',
  },
  {
    id: 'tiles',
    label: 'Tiles',
    description: 'Bordered cards with a logo, still split by category.',
  },
]

const EXPERIENCE_LAYOUTS: {
  id: ExperienceLayout
  label: string
  description: string
}[] = [
  {
    id: 'rows',
    label: 'Rows',
    description: 'Dates in a left column beside the detail.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'A vertical rail with date chips and accent nodes.',
  },
  {
    id: 'cards',
    label: 'Cards',
    description: 'Each role in its own panel with an accent edge.',
  },
]

const ABOUT_LAYOUTS: { id: AboutLayout; label: string; description: string }[] =
  [
    {
      id: 'sidebar',
      label: 'Sidebar',
      description: 'Prose left, a card of facts and your portrait right.',
    },
    {
      id: 'portrait',
      label: 'Portrait',
      description: 'A tall photo beside the prose, facts in a strip below.',
    },
    {
      id: 'centered',
      label: 'Centered',
      description: 'Round avatar on top, centred prose, facts in a strip.',
    },
  ]

const CERTS_LAYOUTS: { id: CertsLayout; label: string; description: string }[] =
  [
    {
      id: 'grid',
      label: 'Grid',
      description: 'Bordered cards in a responsive grid.',
    },
    {
      id: 'list',
      label: 'List',
      description: 'Hairline rows, title left and issuer right.',
    },
    {
      id: 'badges',
      label: 'Badges',
      description: 'Pill-shaped rows with an accent seal.',
    },
  ]

const CONTACT_LAYOUTS: {
  id: ContactLayout
  label: string
  description: string
}[] = [
  {
    id: 'split',
    label: 'Split',
    description: 'Pitch and direct links left, form right.',
  },
  {
    id: 'centered',
    label: 'Centered',
    description: 'Narrow centred column with the links underneath.',
  },
  {
    id: 'cards',
    label: 'Cards',
    description: 'Contact details in tiles above a panelled form.',
  },
]

/** Miniature wireframe of each hero layout, drawn in CSS-less SVG. */
function LayoutPreview({ id }: { id: HeroLayout }) {
  const line = 'currentColor'
  return (
    <svg
      viewBox="0 0 120 74"
      className="layout-preview"
      role="presentation"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="119"
        height="73"
        rx="3"
        fill="none"
        stroke={line}
        strokeOpacity="0.35"
      />
      {id === 'editorial' && (
        <>
          <rect x="12" y="16" width="66" height="9" rx="1.5" fill={line} />
          <rect x="12" y="30" width="44" height="4" rx="1" fill={line} fillOpacity="0.5" />
          <rect x="12" y="38" width="80" height="3" rx="1" fill={line} fillOpacity="0.3" />
          <rect x="12" y="44" width="62" height="3" rx="1" fill={line} fillOpacity="0.3" />
          <rect x="12" y="55" width="24" height="8" rx="1.5" fill={line} fillOpacity="0.75" />
          <rect x="40" y="55" width="24" height="8" rx="1.5" fill="none" stroke={line} strokeOpacity="0.5" />
        </>
      )}
      {id === 'portrait' && (
        <>
          <rect x="1" y="1" width="118" height="72" rx="3" fill={line} fillOpacity="0.16" />
          <circle cx="86" cy="30" r="13" fill={line} fillOpacity="0.32" />
          <path d="M70 73c0-11 7-18 16-18s16 7 16 18z" fill={line} fillOpacity="0.32" />
          <rect x="10" y="26" width="46" height="8" rx="1.5" fill={line} />
          <rect x="10" y="39" width="32" height="3" rx="1" fill={line} fillOpacity="0.5" />
          <rect x="10" y="49" width="20" height="7" rx="1.5" fill={line} fillOpacity="0.75" />
          <path d="M56 64l4 4 4-4" fill="none" stroke={line} strokeOpacity="0.55" strokeWidth="1.5" />
        </>
      )}
      {id === 'split' && (
        <>
          <rect x="10" y="20" width="44" height="8" rx="1.5" fill={line} />
          <rect x="10" y="33" width="30" height="3" rx="1" fill={line} fillOpacity="0.5" />
          <rect x="10" y="40" width="38" height="3" rx="1" fill={line} fillOpacity="0.3" />
          <rect x="10" y="50" width="20" height="7" rx="1.5" fill={line} fillOpacity="0.75" />
          <circle cx="88" cy="37" r="21" fill="none" stroke={line} strokeOpacity="0.3" />
          <circle cx="88" cy="37" r="17" fill={line} fillOpacity="0.28" />
        </>
      )}
    </svg>
  )
}

/** Wireframes for the Projects / Skills / Experience layout pickers. */
function SectionPreview({
  kind,
}: {
  kind: WorkLayout | SkillsLayout | ExperienceLayout
}) {
  const c = 'currentColor'
  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    o = 0.28,
    r = 1.5,
  ) => <rect key={`${x}-${y}-${w}`} x={x} y={y} width={w} height={h} rx={r} fill={c} fillOpacity={o} />

  return (
    <svg
      viewBox="0 0 120 62"
      className="layout-preview"
      role="presentation"
      aria-hidden="true"
    >
      <rect x="0.5" y="0.5" width="119" height="61" rx="3" fill="none" stroke={c} strokeOpacity="0.35" />

      {/* Projects */}
      {kind === 'list' &&
        [10, 27, 44].map((y) => (
          <g key={y}>
            {box(9, y, 7, 4, 0.55)}
            {box(21, y, 42, 5, 0.75)}
            {box(21, y + 8, 58, 3, 0.28)}
            {box(96, y, 15, 3, 0.3)}
            <rect x="9" y={y + 14} width="102" height="0.8" fill={c} fillOpacity="0.22" />
          </g>
        ))}
      {kind === 'grid' &&
        [0, 1, 2].flatMap((col) =>
          [0, 1].map((row) => (
            <g key={`${col}-${row}`}>
              {box(9 + col * 35, 9 + row * 24, 32, 20, 0.3, 2)}
              {box(11 + col * 35, 24 + row * 24, 20, 3, 0.6)}
            </g>
          )),
        )}
      {kind === 'cards' &&
        [0, 1, 2].map((col) => (
          <g key={col}>
            <rect x={9 + col * 35} y="9" width="32" height="44" rx="2.5" fill="none" stroke={c} strokeOpacity="0.3" />
            {box(9 + col * 35, 9, 32, 18, 0.3, 2)}
            {box(13 + col * 35, 31, 22, 4, 0.7)}
            {box(13 + col * 35, 38, 18, 2.5, 0.3)}
            {box(13 + col * 35, 45, 14, 5, 0.5)}
          </g>
        ))}

      {/* Skills */}
      {kind === 'grouped' &&
        [12, 29, 46].map((y) => (
          <g key={y}>
            {box(9, y, 22, 4, 0.6)}
            {box(38, y, 14, 5, 0.3)}
            {box(55, y, 20, 5, 0.3)}
            {box(78, y, 12, 5, 0.3)}
            {box(93, y, 17, 5, 0.3)}
          </g>
        ))}
      {kind === 'icons' &&
        [0, 1, 2, 3, 4, 5].flatMap((col) =>
          [0, 1].map((row) => (
            <g key={`${col}-${row}`}>
              <circle cx={16 + col * 18} cy={17 + row * 22} r="5.5" fill={c} fillOpacity="0.45" />
              {box(10 + col * 18, 26 + row * 22, 12, 2.5, 0.25)}
            </g>
          )),
        )}
      {kind === 'tiles' && (
        <>
          {box(9, 8, 24, 3.5, 0.6)}
          {[0, 1, 2, 3].map((col) => (
            <g key={col}>
              <rect x={9 + col * 27} y="15" width="24" height="12" rx="2" fill="none" stroke={c} strokeOpacity="0.32" />
              <circle cx={16 + col * 27} cy="21" r="3.5" fill={c} fillOpacity="0.45" />
              {box(22 + col * 27, 20, 9, 2.5, 0.3)}
            </g>
          ))}
          {box(9, 34, 20, 3.5, 0.6)}
          {[0, 1, 2, 3].map((col) => (
            <g key={`b${col}`}>
              <rect x={9 + col * 27} y="41" width="24" height="12" rx="2" fill="none" stroke={c} strokeOpacity="0.32" />
              <circle cx={16 + col * 27} cy="47" r="3.5" fill={c} fillOpacity="0.45" />
              {box(22 + col * 27, 46, 9, 2.5, 0.3)}
            </g>
          ))}
        </>
      )}

      {/* Experience */}
      {kind === 'rows' &&
        [11, 33].map((y) => (
          <g key={y}>
            {box(9, y, 24, 3.5, 0.5)}
            {box(9, y + 7, 16, 2.5, 0.25)}
            {box(43, y, 40, 4.5, 0.7)}
            {box(43, y + 8, 30, 2.5, 0.3)}
            {box(43, y + 13, 56, 2.5, 0.22)}
          </g>
        ))}
      {kind === 'timeline' && (
        <>
          <rect x="14" y="10" width="1" height="43" fill={c} fillOpacity="0.3" />
          {[12, 34].map((y) => (
            <g key={y}>
              <circle cx="14.5" cy={y + 2} r="3.2" fill={c} fillOpacity="0.85" />
              <rect x="24" y={y} width="20" height="6" rx="1.5" fill="none" stroke={c} strokeOpacity="0.4" />
              {box(48, y + 1, 34, 4.5, 0.7)}
              {box(24, y + 10, 60, 2.5, 0.28)}
              {box(24, y + 15, 44, 2.5, 0.22)}
            </g>
          ))}
        </>
      )}
      {kind === 'cards' && null}
    </svg>
  )
}

/** Wireframes for About / Awards / Contact. */
function BlockPreview({
  kind,
}: {
  kind: AboutLayout | CertsLayout | ContactLayout | 'exp-cards'
}) {
  const c = 'currentColor'
  const bar = (x: number, y: number, w: number, h: number, o = 0.28) => (
    <rect key={`${x}-${y}-${w}-${h}`} x={x} y={y} width={w} height={h} rx="1.2" fill={c} fillOpacity={o} />
  )

  return (
    <svg viewBox="0 0 120 62" className="layout-preview" role="presentation" aria-hidden="true">
      <rect x="0.5" y="0.5" width="119" height="61" rx="3" fill="none" stroke={c} strokeOpacity="0.35" />

      {/* About */}
      {kind === 'sidebar' && (
        <>
          {[14, 21, 28, 35, 42].map((y) => bar(9, y, y === 42 ? 42 : 62, 3, 0.26))}
          <rect x="80" y="10" width="31" height="42" rx="2" fill="none" stroke={c} strokeOpacity="0.32" />
          {bar(84, 14, 23, 14, 0.32)}
          {[32, 39, 46].map((y) => bar(84, y, 20, 2.5, 0.24))}
        </>
      )}
      {kind === 'portrait' && (
        <>
          {bar(9, 9, 30, 34, 0.32)}
          {[12, 19, 26, 33].map((y) => bar(45, y, y === 33 ? 44 : 66, 3, 0.26))}
          <rect x="45" y="44" width="66" height="10" rx="1.5" fill="none" stroke={c} strokeOpacity="0.32" />
          {[48, 70, 92].map((x) => bar(x, 47, 15, 4, 0.24))}
        </>
      )}
      {kind === 'centered' && (
        <>
          <circle cx="60" cy="14" r="7" fill={c} fillOpacity="0.35" />
          {[26, 32, 38].map((y) => bar(60 - (y === 38 ? 24 : 34), y, y === 38 ? 48 : 68, 3, 0.26))}
          <rect x="15" y="46" width="90" height="10" rx="1.5" fill="none" stroke={c} strokeOpacity="0.32" />
          {[19, 49, 79].map((x) => bar(x, 49, 22, 4, 0.24))}
        </>
      )}

      {/* Certifications */}
      {kind === 'grid' && [0, 1, 2].flatMap((col) => [0, 1].map((row) => (
        <g key={`${col}-${row}`}>
          <rect x={9 + col * 35} y={10 + row * 23} width="32" height="19" rx="2" fill="none" stroke={c} strokeOpacity="0.32" />
          {bar(13 + col * 35, 15 + row * 23, 22, 4, 0.6)}
          {bar(13 + col * 35, 22 + row * 23, 15, 2.5, 0.26)}
        </g>
      )))}
      {kind === 'list' && [12, 25, 38, 51].map((y) => (
        <g key={y}>
          {bar(9, y - 2, 46, 4, 0.6)}
          {bar(75, y - 1.5, 36, 3, 0.26)}
          <rect x="9" y={y + 5} width="102" height="0.8" fill={c} fillOpacity="0.22" />
        </g>
      ))}
      {kind === 'badges' && [0, 1].flatMap((col) => [0, 1].map((row) => (
        <g key={`${col}-${row}`}>
          <rect x={9 + col * 52} y={12 + row * 24} width="49" height="18" rx="9" fill="none" stroke={c} strokeOpacity="0.32" />
          <circle cx={19 + col * 52} cy={21 + row * 24} r="5.5" fill={c} fillOpacity="0.4" />
          {bar(28 + col * 52, 17 + row * 24, 25, 3.5, 0.55)}
          {bar(28 + col * 52, 23 + row * 24, 18, 2.5, 0.24)}
        </g>
      )))}

      {/* Contact */}
      {kind === 'split' && (
        <>
          {bar(9, 12, 38, 6, 0.6)}
          {[22, 28].map((y) => bar(9, y, 44, 2.5, 0.26))}
          {[36, 43, 50].map((y) => bar(9, y, 40, 3, 0.3))}
          <rect x="62" y="10" width="49" height="42" rx="2" fill="none" stroke={c} strokeOpacity="0.32" />
          {[15, 25, 35].map((y) => bar(66, y, 41, 6, 0.24))}
          {bar(66, 44, 18, 6, 0.55)}
        </>
      )}
      {kind === 'centered' && null}
      {kind === 'cards' && null}

      {kind === 'exp-cards' && null}
    </svg>
  )
}

/** Contact "centered" and "cards" collide with names used above. */
function ContactPreview({ kind }: { kind: 'centered' | 'cards' }) {
  const c = 'currentColor'
  const bar = (x: number, y: number, w: number, h: number, o = 0.28) => (
    <rect x={x} y={y} width={w} height={h} rx="1.2" fill={c} fillOpacity={o} />
  )
  return (
    <svg viewBox="0 0 120 62" className="layout-preview" role="presentation" aria-hidden="true">
      <rect x="0.5" y="0.5" width="119" height="61" rx="3" fill="none" stroke={c} strokeOpacity="0.35" />
      {kind === 'centered' ? (
        <>
          {bar(38, 8, 44, 6, 0.6)}
          {bar(32, 18, 56, 2.5, 0.26)}
          {[25, 34].map((y) => bar(30, y, 60, 6, 0.24))}
          {bar(50, 44, 20, 6, 0.55)}
          <rect x="30" y="55" width="60" height="0.8" fill={c} fillOpacity="0.22" />
        </>
      ) : (
        <>
          {[0, 1, 2, 3].map((col) => (
            <g key={col}>
              <rect x={9 + col * 26} y="8" width="24" height="14" rx="1.5" fill="none" stroke={c} strokeOpacity="0.32" />
              {bar(12 + col * 26, 11, 11, 2.5, 0.45)}
              {bar(12 + col * 26, 16, 17, 2.5, 0.24)}
            </g>
          ))}
          <rect x="9" y="27" width="102" height="26" rx="2.5" fill="none" stroke={c} strokeOpacity="0.32" />
          {bar(14, 31, 40, 5, 0.6)}
          {[39, 46].map((y) => bar(14, y, 92, 5, 0.24))}
        </>
      )}
    </svg>
  )
}

/** Experience "cards" shares an id with the projects one, so it needs its own. */
function ExperienceCardsPreview() {
  const c = 'currentColor'
  return (
    <svg viewBox="0 0 120 62" className="layout-preview" role="presentation" aria-hidden="true">
      <rect x="0.5" y="0.5" width="119" height="61" rx="3" fill="none" stroke={c} strokeOpacity="0.35" />
      {[9, 34].map((y) => (
        <g key={y}>
          <rect x="9" y={y} width="102" height="20" rx="2.5" fill="none" stroke={c} strokeOpacity="0.3" />
          <rect x="9" y={y} width="1.8" height="20" rx="1" fill={c} fillOpacity="0.85" />
          <rect x="16" y={y + 4} width="20" height="5" rx="1.5" fill="none" stroke={c} strokeOpacity="0.4" />
          <rect x="40" y={y + 5} width="34" height="4" rx="1.5" fill={c} fillOpacity="0.7" />
          <rect x="16" y={y + 13} width="70" height="2.5" rx="1" fill={c} fillOpacity="0.26" />
        </g>
      ))}
    </svg>
  )
}

type Props = {
  settings: SiteSettings
  palettes: CustomPalette[]
  onSaved: () => void
  /** Refetch after a palette is created, edited or deleted. */
  onPalettesChanged: () => void
}

type Draft = {
  logo_url: string | null
  favicon_url: string | null
  logo_text: string
  hero_layout: HeroLayout
  hero_image_url: string | null
  theme_preset: PresetId
  accent_color: string
  font_pair: FontPairId
  work_layout: WorkLayout
  skills_layout: SkillsLayout
  experience_layout: ExperienceLayout
  about_layout: AboutLayout
  certs_layout: CertsLayout
  contact_layout: ContactLayout
}

/** Reads the appearance slice off settings, filling gaps with the defaults. */
function toDraft(settings: SiteSettings): Draft {
  return {
    logo_url: settings.logo_url ?? null,
    favicon_url: settings.favicon_url ?? null,
    logo_text: settings.logo_text ?? 'DJT',
    hero_layout: settings.hero_layout ?? DEFAULT_THEME.hero_layout,
    hero_image_url: settings.hero_image_url ?? null,
    theme_preset: settings.theme_preset ?? DEFAULT_THEME.theme_preset,
    accent_color: settings.accent_color ?? DEFAULT_THEME.accent_color,
    font_pair: settings.font_pair ?? DEFAULT_THEME.font_pair,
    work_layout: settings.work_layout ?? 'list',
    skills_layout: settings.skills_layout ?? 'grouped',
    experience_layout: settings.experience_layout ?? 'rows',
    about_layout: settings.about_layout ?? 'sidebar',
    certs_layout: settings.certs_layout ?? 'grid',
    contact_layout: settings.contact_layout ?? 'split',
  }
}

export default function ThemeEditor({
  settings,
  palettes,
  onSaved,
  onPalettesChanged,
}: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings))
  const [state, setState] = useState<SaveState>('clean')
  const [error, setError] = useState('')

  // Re-sync when the parent reloads settings after a save.
  const [lastLoaded, setLastLoaded] = useState(settings)
  if (settings !== lastLoaded) {
    setLastLoaded(settings)
    setDraft(toDraft(settings))
  }

  /** Every change previews immediately — the CMS uses the same design tokens. */
  function edit(patch: Partial<Draft>) {
    const next = { ...draft, ...patch }
    setDraft(next)
    setState('dirty')
    applyTheme(next, palettes)
    // Swap this tab's own icon too, so you can confirm the favicon renders
    // at real size before committing to it.
    if ('favicon_url' in patch) {
      applyFavicon(next.favicon_url ? mediaUrl(next.favicon_url) : null)
    }
  }

  /** Previews an unsaved palette edit without touching the draft. */
  function previewPalette(palette: CustomPalette) {
    applyTheme(draft, [
      palette,
      ...palettes.filter((p) => p.id !== palette.id),
    ])
  }

  async function save() {
    if (!supabase) return
    setState('saving')
    setError('')

    const { error: saveError } = await supabase
      .from('site_settings')
      .update({ ...draft, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (saveError) {
      setState('error')
      setError(saveError.message)
      return
    }

    setState('saved')
    onSaved()
  }

  function reset() {
    const original = toDraft(settings)
    setDraft(original)
    setState('clean')
    applyTheme(original, palettes)
  }

  const layoutNeedsPhoto = LAYOUTS.find((l) => l.id === draft.hero_layout)
    ?.needsPhoto
  const photoMissing =
    layoutNeedsPhoto && !draft.hero_image_url && !settings.avatar_url

  // The theme columns arrived in migration 002. If the row came back without
  // them, saving would fail with a raw Postgres error — say so up front.
  const needsMigration =
    settings.theme_preset === undefined ||
    settings.work_layout === undefined ||
    settings.about_layout === undefined ||
    settings.logo_text === undefined

  return (
    <>
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Theme</h1>
          <p className="admin__subtitle">
            Everything here previews live in this panel as you click. Nothing
            reaches your visitors until you save.
          </p>
        </div>
      </header>

      {needsMigration && (
        <p className="notice notice--error" style={{ marginBottom: 'var(--space-s)' }}>
          Your database is missing some theme columns. Open Supabase → SQL
          Editor and run the files in{' '}
          <code className="code">supabase/migrations/</code> in order (002
          through 005), then reload this page. You can preview choices below,
          but saving will fail until you do.
        </p>
      )}

      {/* -- Brand ---------------------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Brand</h2>
        </div>

        <div className="form">
          <div className="brand-preview">
            <span className="brand-preview__label mono">Nav preview</span>
            <span className="brand-preview__bar">
              {draft.logo_url ? (
                <img
                  className="nav__logo"
                  src={mediaUrl(draft.logo_url)}
                  alt=""
                />
              ) : (
                <span className="nav__brand">
                  {draft.logo_text || 'DJT'}
                  <span>.</span>
                </span>
              )}
            </span>
          </div>

          <FileUpload
            label="Logo"
            hint="Shown in the nav at 24px tall. SVG or a transparent PNG works best — pick one that reads on both the light and dark canvas, since there is a single logo for both."
            folder="brand"
            accept="image/svg+xml,image/png,image/webp,image/jpeg"
            value={draft.logo_url}
            onChange={(path) => edit({ logo_url: path })}
          />

          <TextField
            label="Wordmark"
            hint="Used when no logo image is set. Keep it short — initials read best at nav size. A dot in your accent colour is added automatically."
            value={draft.logo_text}
            onChange={(v) => edit({ logo_text: v })}
            placeholder="DJT"
          />

          <FileUpload
            label="Favicon"
            hint="The browser tab icon. A square SVG or a 512×512 PNG is ideal. Tabs are tiny, so a single letter or mark beats a full logo."
            folder="brand"
            accept="image/svg+xml,image/png,image/x-icon,.ico"
            value={draft.favicon_url}
            onChange={(path) => edit({ favicon_url: path })}
          />
        </div>
      </div>

      {/* -- Hero layout ---------------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Hero layout</h2>
        </div>

        <div className="choice-grid choice-grid--wide">
          {LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              className="choice"
              data-selected={draft.hero_layout === layout.id}
              onClick={() => edit({ hero_layout: layout.id })}
            >
              <LayoutPreview id={layout.id} />
              <span className="choice__label">
                {layout.label}
                {draft.hero_layout === layout.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{layout.description}</span>
            </button>
          ))}
        </div>

        {layoutNeedsPhoto && (
          <div style={{ marginTop: 'var(--space-m)' }}>
            <FileUpload
              label="Hero photo"
              hint={
                draft.hero_layout === 'portrait'
                  ? 'A tall portrait shot works best — it fills the whole screen behind your name.'
                  : 'Cropped to a circle, so keep your face near the centre.'
              }
              folder="hero"
              value={draft.hero_image_url}
              onChange={(path) => edit({ hero_image_url: path })}
            />
            {photoMissing && (
              <p className="notice notice--info" style={{ marginTop: '0.6rem' }}>
                No hero photo yet. This layout falls back to the Editorial
                treatment until you upload one, so the site never shows an empty
                frame.
              </p>
            )}
          </div>
        )}
      </div>

      {/* -- Projects layout ------------------------------------------------ */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Projects section</h2>
        </div>

        <div className="choice-grid choice-grid--wide">
          {WORK_LAYOUTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="choice"
              data-selected={draft.work_layout === option.id}
              onClick={() => edit({ work_layout: option.id })}
            >
              <SectionPreview kind={option.id} />
              <span className="choice__label">
                {option.label}
                {draft.work_layout === option.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{option.description}</span>
            </button>
          ))}
        </div>

        {draft.work_layout !== 'list' && (
          <p className="notice notice--info" style={{ marginTop: 'var(--space-2xs)' }}>
            Grid and Cards are image-led. Any project without a cover image
            falls back to a lettered tile — add covers under Projects → Cover
            image to get the most out of these.
          </p>
        )}
      </div>

      {/* -- Skills layout -------------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Skills section</h2>
        </div>

        <div className="choice-grid choice-grid--wide">
          {SKILLS_LAYOUTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="choice"
              data-selected={draft.skills_layout === option.id}
              onClick={() => edit({ skills_layout: option.id })}
            >
              <SectionPreview kind={option.id} />
              <span className="choice__label">
                {option.label}
                {draft.skills_layout === option.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{option.description}</span>
            </button>
          ))}
        </div>

        {draft.skills_layout !== 'grouped' && (
          <p className="notice notice--info" style={{ marginTop: 'var(--space-2xs)' }}>
            Logos are matched to skill names automatically. Anything without a
            recognised brand mark gets a category glyph (database, cloud,
            testing…) or a lettered badge — nothing is ever left blank.
          </p>
        )}
      </div>

      {/* -- Experience layout ---------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Experience section</h2>
        </div>

        <div className="choice-grid choice-grid--wide">
          {EXPERIENCE_LAYOUTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="choice"
              data-selected={draft.experience_layout === option.id}
              onClick={() => edit({ experience_layout: option.id })}
            >
              {option.id === 'cards' ? (
                <ExperienceCardsPreview />
              ) : (
                <SectionPreview kind={option.id} />
              )}
              <span className="choice__label">
                {option.label}
                {draft.experience_layout === option.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* -- About layout --------------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">About section</h2>
        </div>

        <div className="choice-grid choice-grid--wide">
          {ABOUT_LAYOUTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="choice"
              data-selected={draft.about_layout === option.id}
              onClick={() => edit({ about_layout: option.id })}
            >
              <BlockPreview kind={option.id} />
              <span className="choice__label">
                {option.label}
                {draft.about_layout === option.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{option.description}</span>
            </button>
          ))}
        </div>

        {draft.about_layout !== 'sidebar' && !settings.avatar_url && (
          <p className="notice notice--info" style={{ marginTop: 'var(--space-2xs)' }}>
            This layout is built around your portrait. Upload one under Profile
            → Files; until then the photo is simply omitted.
          </p>
        )}
      </div>

      {/* -- Certifications layout ------------------------------------------ */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Certifications & awards</h2>
        </div>

        <div className="choice-grid choice-grid--wide">
          {CERTS_LAYOUTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="choice"
              data-selected={draft.certs_layout === option.id}
              onClick={() => edit({ certs_layout: option.id })}
            >
              <BlockPreview kind={option.id} />
              <span className="choice__label">
                {option.label}
                {draft.certs_layout === option.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* -- Contact layout ------------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Contact section</h2>
        </div>

        <div className="choice-grid choice-grid--wide">
          {CONTACT_LAYOUTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="choice"
              data-selected={draft.contact_layout === option.id}
              onClick={() => edit({ contact_layout: option.id })}
            >
              {option.id === 'split' ? (
                <BlockPreview kind="split" />
              ) : (
                <ContactPreview kind={option.id} />
              )}
              <span className="choice__label">
                {option.label}
                {draft.contact_layout === option.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* -- Background ----------------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Background</h2>
        </div>

        <div className="choice-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="choice"
              data-selected={draft.theme_preset === preset.id}
              onClick={() => edit({ theme_preset: preset.id as PresetId })}
            >
              <span className="swatch-pair" aria-hidden="true">
                <span style={{ background: preset.dark.bg }} />
                <span style={{ background: preset.dark.surface }} />
                <span style={{ background: preset.light.bg }} />
                <span style={{ background: preset.light.bgInset }} />
              </span>
              <span className="choice__label">
                {preset.label}
                {draft.theme_preset === preset.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{preset.description}</span>
            </button>
          ))}
        </div>
        <p className="field__hint" style={{ marginTop: 'var(--space-2xs)' }}>
          Each preset ships a matching dark and light palette. Your visitors
          still get the light/dark toggle either way.
        </p>

        <div className="palette-section">
          <h3 className="mono">Your palettes</h3>
          <PaletteManager
            palettes={palettes}
            selectedId={draft.theme_preset}
            onSelect={(id) => edit({ theme_preset: id as PresetId })}
            onChanged={onPalettesChanged}
            onPreview={previewPalette}
          />
        </div>
      </div>

      {/* -- Accent --------------------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Accent colour</h2>
        </div>

        <div className="swatch-row">
          {ACCENTS.map((accent) => (
            <button
              key={accent.value}
              type="button"
              className="swatch"
              data-selected={
                draft.accent_color.toLowerCase() === accent.value.toLowerCase()
              }
              style={{ background: accent.value }}
              onClick={() => edit({ accent_color: accent.value })}
              title={accent.label}
              aria-label={accent.label}
            >
              {draft.accent_color.toLowerCase() ===
                accent.value.toLowerCase() && <Check size={14} />}
            </button>
          ))}
        </div>

        <div className="custom-color">
          <label className="field">
            <span className="field__label">Custom</span>
            <div className="custom-color__row">
              <input
                type="color"
                className="color-input"
                value={draft.accent_color}
                onChange={(e) => edit({ accent_color: e.target.value })}
                aria-label="Custom accent colour"
              />
              <input
                className="input"
                value={draft.accent_color}
                onChange={(e) => {
                  const value = e.target.value.trim()
                  setDraft((d) => ({ ...d, accent_color: value }))
                  setState('dirty')
                  // Only repaint once it is a complete hex, or the preview
                  // flickers to the fallback mid-typing.
                  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                    applyTheme({ ...draft, accent_color: value }, palettes)
                  }
                }}
                placeholder="#e9a94b"
                spellCheck={false}
              />
            </div>
            <span className="field__hint">
              Six-digit hex. The light theme automatically gets a darkened
              version of this colour so it stays readable on a pale background.
            </span>
          </label>
        </div>
      </div>

      {/* -- Fonts ---------------------------------------------------------- */}
      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Typography</h2>
        </div>

        <div className="choice-grid choice-grid--wide">
          {FONT_PAIRS.map((pair) => (
            <button
              key={pair.id}
              type="button"
              className="choice choice--font"
              data-selected={draft.font_pair === pair.id}
              onClick={() => edit({ font_pair: pair.id as FontPairId })}
            >
              <span
                className="font-sample"
                style={{ fontFamily: pair.display }}
              >
                Aa
              </span>
              <span className="choice__label">
                {pair.label}
                {draft.font_pair === pair.id && <Check size={13} />}
              </span>
              <span className="choice__desc">{pair.description}</span>
            </button>
          ))}
        </div>
        <p className="field__hint" style={{ marginTop: 'var(--space-2xs)' }}>
          Samples render in the real font once it downloads — give it a moment
          the first time you pick one.
        </p>
      </div>

      <SaveBar state={state} error={error} onSave={save} onReset={reset} />
    </>
  )
}
