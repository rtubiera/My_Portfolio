/* ==========================================================================
   Theme engine
   Turns the CMS appearance settings into CSS custom properties at runtime.

   Everything is injected as one <style> element containing a :root block and
   a :root[data-theme='light'] block, so the light/dark toggle keeps working —
   inline styles on <html> would override both at once.
   ========================================================================== */

export type HeroLayout = 'editorial' | 'minimal' | 'portrait' | 'split' | 'studio' | 'profile'
export type WorkLayout = 'list' | 'grid' | 'cards' | 'carousel' | 'showcase'
export type SkillsLayout = 'grouped' | 'icons' | 'tiles' | 'orbit'
export type ExperienceLayout = 'rows' | 'timeline' | 'cards' | 'spotlight'
export type AboutLayout = 'sidebar' | 'portrait' | 'centered' | 'manifesto'
export type CertsLayout = 'grid' | 'list' | 'badges' | 'shelf'
export type ContactLayout = 'split' | 'centered' | 'cards' | 'signal'
export type BackgroundEffect =
  | 'none'
  | 'snow'
  | 'stars'
  | 'constellation'
  | 'aurora'
  | 'confetti'
  | 'hearts'
  | 'bats'
  | 'fireworks'
  | 'leaves'
  | 'petals'
  | 'fireflies'
  | 'matrix'
  | 'astronaut'
  | 'websling'
  | 'galaxy'
  | 'grain'
export type EffectIntensity = 'subtle' | 'medium' | 'heavy'
export type PresetId = 'obsidian' | 'midnight' | 'slate' | 'espresso' | 'petal'
export type FontPairId = 'inter' | 'sora' | 'space' | 'outfit' | 'serif' | 'editorial'
export type LogoMarkId = 'dot' | 'sparkle' | 'flower' | 'heart' | 'star' | 'none'

export const LOGO_MARKS: { id: LogoMarkId; label: string; glyph: string }[] = [
  { id: 'dot', label: 'Dot', glyph: '.' },
  { id: 'sparkle', label: 'Sparkle', glyph: '✦' },
  { id: 'flower', label: 'Flower', glyph: '✿' },
  { id: 'heart', label: 'Heart', glyph: '♥' },
  { id: 'star', label: 'Star', glyph: '★' },
  { id: 'none', label: 'None', glyph: '' },
]

export const DEFAULT_FAVICON_COLORS = {
  background: '#e9a94b',
  text: '#12100b',
}

export type ThemeChoice = {
  hero_layout: HeroLayout
  theme_preset: PresetId
  accent_color: string
  font_pair: FontPairId
}

/* -- Background / ink presets --------------------------------------------- */

type Palette = {
  bg: string
  bgRaised: string
  bgInset: string
  surface: string
  surfaceHover: string
  line: string
  lineStrong: string
  ink: string
  inkSoft: string
  inkMuted: string
  inkFaint: string
}

export type Preset = {
  id: PresetId
  label: string
  description: string
  dark: Palette
  light: Palette
}

export const PRESETS: Preset[] = [
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'Neutral off-black and warm paper. The default.',
    dark: {
      bg: '#0a0a0b',
      bgRaised: '#101012',
      bgInset: '#08080a',
      surface: '#141417',
      surfaceHover: '#1a1a1e',
      line: '#26262b',
      lineStrong: '#35353c',
      ink: '#f2f2f4',
      inkSoft: '#b7b7c0',
      inkMuted: '#7e7e8a',
      inkFaint: '#55555f',
    },
    light: {
      bg: '#fbfaf8',
      bgRaised: '#ffffff',
      bgInset: '#f3f1ed',
      surface: '#ffffff',
      surfaceHover: '#f6f4f0',
      line: '#e3dfd8',
      lineStrong: '#cdc7bd',
      ink: '#16161a',
      inkSoft: '#43434c',
      inkMuted: '#6e6e79',
      inkFaint: '#9a9aa4',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Deep navy. Reads as engineered and corporate.',
    dark: {
      bg: '#0b1120',
      bgRaised: '#111a2e',
      bgInset: '#070d18',
      surface: '#16203a',
      surfaceHover: '#1c2745',
      line: '#22304d',
      lineStrong: '#33456b',
      ink: '#eef2fb',
      inkSoft: '#b3c0d8',
      inkMuted: '#7d8daa',
      inkFaint: '#55637d',
    },
    light: {
      bg: '#f7f9fd',
      bgRaised: '#ffffff',
      bgInset: '#eef2f9',
      surface: '#ffffff',
      surfaceHover: '#f1f5fb',
      line: '#dde5f0',
      lineStrong: '#c3cfe0',
      ink: '#0f1729',
      inkSoft: '#3d4a63',
      inkMuted: '#66748f',
      inkFaint: '#94a1b8',
    },
  },
  {
    id: 'slate',
    label: 'Slate',
    description: 'Cool neutral grey. Quiet and screenshot-friendly.',
    dark: {
      bg: '#101113',
      bgRaised: '#17191c',
      bgInset: '#0c0d0f',
      surface: '#1c1f23',
      surfaceHover: '#23272c',
      line: '#2c3137',
      lineStrong: '#3d444c',
      ink: '#f1f3f5',
      inkSoft: '#b8bfc6',
      inkMuted: '#838c95',
      inkFaint: '#5b636b',
    },
    light: {
      bg: '#f8f9fa',
      bgRaised: '#ffffff',
      bgInset: '#f1f3f5',
      surface: '#ffffff',
      surfaceHover: '#f1f3f5',
      line: '#e1e5e9',
      lineStrong: '#c7cdd3',
      ink: '#14171a',
      inkSoft: '#414850',
      inkMuted: '#6b737c',
      inkFaint: '#99a1a9',
    },
  },
  {
    id: 'espresso',
    label: 'Espresso',
    description: 'Warm near-black and cream. Softer, more editorial.',
    dark: {
      bg: '#0d0b0a',
      bgRaised: '#14110f',
      bgInset: '#0a0807',
      surface: '#1a1613',
      surfaceHover: '#211c18',
      line: '#2b2521',
      lineStrong: '#3d352f',
      ink: '#f5f1ec',
      inkSoft: '#c0b6ab',
      inkMuted: '#8b8074',
      inkFaint: '#5f574e',
    },
    light: {
      bg: '#fdfaf6',
      bgRaised: '#ffffff',
      bgInset: '#f5efe6',
      surface: '#ffffff',
      surfaceHover: '#f8f3ec',
      line: '#e8e0d4',
      lineStrong: '#d0c5b5',
      ink: '#1a1512',
      inkSoft: '#4a4038',
      inkMuted: '#766a5e',
      inkFaint: '#a3968a',
    },
  },
  {
    id: 'petal',
    label: 'Petal',
    description: 'Minimalist rose-tinted neutrals with a soft editorial feel.',
    dark: {
      bg: '#151313',
      bgRaised: '#1c1919',
      bgInset: '#100e0e',
      surface: '#211d1d',
      surfaceHover: '#292424',
      line: '#383030',
      lineStrong: '#4a3e3f',
      ink: '#f5f0ef',
      inkSoft: '#c8bdbc',
      inkMuted: '#958788',
      inkFaint: '#685d5e',
    },
    light: {
      bg: '#fbf8f7',
      bgRaised: '#ffffff',
      bgInset: '#f4eceb',
      surface: '#ffffff',
      surfaceHover: '#f8f2f1',
      line: '#e8dedd',
      lineStrong: '#d4c5c4',
      ink: '#282223',
      inkSoft: '#55494a',
      inkMuted: '#817475',
      inkFaint: '#a99c9c',
    },
  },
]

/* -- Accent swatches ------------------------------------------------------- */

export const ACCENTS: { value: string; label: string }[] = [
  { value: '#e9a94b', label: 'Amber' },
  { value: '#7ac142', label: 'Lime' },
  { value: '#3ecf8e', label: 'Emerald' },
  { value: '#f2643f', label: 'Coral' },
  { value: '#e5484d', label: 'Crimson' },
  { value: '#4c8dff', label: 'Azure' },
  { value: '#9b7cf6', label: 'Violet' },
  { value: '#37c8d4', label: 'Cyan' },
]

/* -- Font pairings --------------------------------------------------------- */

export type FontPair = {
  id: FontPairId
  label: string
  description: string
  display: string
  sans: string
  mono: string
  /** Google Fonts family params, or null when nothing extra is needed. */
  families: string[]
  /** Headings in this pair need looser tracking than the tight default. */
  displayTracking?: string
}

const FALLBACK_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const FALLBACK_MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'inter',
    label: 'Inter + JetBrains Mono',
    description: 'The default. Neutral, dense, excellent on screen.',
    display: `'Inter', ${FALLBACK_SANS}`,
    sans: `'Inter', ${FALLBACK_SANS}`,
    mono: `'JetBrains Mono', ${FALLBACK_MONO}`,
    families: ['Inter:wght@400;500;600', 'JetBrains+Mono:wght@400;500;600'],
  },
  {
    id: 'sora',
    label: 'Sora + IBM Plex Mono',
    description: 'Geometric and confident. Strong headline presence.',
    display: `'Sora', ${FALLBACK_SANS}`,
    sans: `'Inter', ${FALLBACK_SANS}`,
    mono: `'IBM Plex Mono', ${FALLBACK_MONO}`,
    families: [
      'Sora:wght@500;600;700',
      'Inter:wght@400;500;600',
      'IBM+Plex+Mono:wght@400;500;600',
    ],
  },
  {
    id: 'space',
    label: 'Space Grotesk + Space Mono',
    description: 'Technical and distinctive. Leans developer.',
    display: `'Space Grotesk', ${FALLBACK_SANS}`,
    sans: `'Space Grotesk', ${FALLBACK_SANS}`,
    mono: `'Space Mono', ${FALLBACK_MONO}`,
    families: ['Space+Grotesk:wght@400;500;600;700', 'Space+Mono:wght@400;700'],
  },
  {
    id: 'outfit',
    label: 'Outfit + JetBrains Mono',
    description: 'Rounded and approachable, closer to a product site.',
    display: `'Outfit', ${FALLBACK_SANS}`,
    sans: `'Outfit', ${FALLBACK_SANS}`,
    mono: `'JetBrains Mono', ${FALLBACK_MONO}`,
    families: ['Outfit:wght@400;500;600;700', 'JetBrains+Mono:wght@400;500;600'],
    displayTracking: '-0.015em',
  },
  {
    id: 'serif',
    label: 'Instrument Serif + Inter',
    description: 'Magazine headlines over a plain body. High contrast.',
    display: `'Instrument Serif', Georgia, 'Times New Roman', serif`,
    sans: `'Inter', ${FALLBACK_SANS}`,
    mono: `'JetBrains Mono', ${FALLBACK_MONO}`,
    families: [
      'Instrument+Serif:ital@0;1',
      'Inter:wght@400;500;600',
      'JetBrains+Mono:wght@400;500;600',
    ],
    displayTracking: '-0.01em',
  },
  {
    id: 'editorial',
    label: 'Manrope + DM Mono',
    description: 'Clean, wide and contemporary for a confident portfolio voice.',
    display: `'Manrope', ${FALLBACK_SANS}`,
    sans: `'Manrope', ${FALLBACK_SANS}`,
    mono: `'DM Mono', ${FALLBACK_MONO}`,
    families: ['Manrope:wght@400;500;600;700;800', 'DM+Mono:wght@400;500'],
    displayTracking: '-0.035em',
  },
]

/* -- Colour maths ---------------------------------------------------------- */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

const toHex = (n: number) =>
  Math.round(Math.min(255, Math.max(0, n)))
    .toString(16)
    .padStart(2, '0')

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function rgbToHsl(hex: string): [number, number, number] {
  const [r255, g255, b255] = hexToRgb(hex)
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  if (s === 0) {
    const v = l * 255
    return rgbToHex(v, v, v)
  }
  const hue = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return rgbToHex(
    hue(p, q, h + 1 / 3) * 255,
    hue(p, q, h) * 255,
    hue(p, q, h - 1 / 3) * 255,
  )
}

function rgbaString(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Blends `amount` of `b` into `a`. mix('#000','#fff',0.5) → mid grey. */
function mix(a: string, b: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const t = Math.min(1, Math.max(0, amount))
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  )
}

/** WCAG contrast ratio between two colours, 1 (identical) to 21 (black/white). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/* -- Custom palettes ------------------------------------------------------- */

export type CustomPalette = {
  id: string
  name: string
  dark_bg: string
  dark_ink: string
  light_bg: string
  light_ink: string
  sort_order: number
}

export const PALETTE_DEFAULTS = {
  dark_bg: '#0a0a0b',
  dark_ink: '#f2f2f4',
  light_bg: '#fbfaf8',
  light_ink: '#16161a',
}

/**
 * Expands a background + text pair into the full eleven-token palette.
 *
 * Panels and borders are steps from the background towards the text colour,
 * and the muted text tiers are steps back towards the background. Deriving
 * rather than asking for eleven colours is what keeps a hand-picked
 * combination coherent — you cannot accidentally pick a border that is
 * brighter than your body text.
 */
export function derivePalette(bg: string, ink: string): Palette {
  const toward = (amount: number) => mix(bg, ink, amount)
  const back = (amount: number) => mix(ink, bg, amount)
  const isDark = luminance(bg) < luminance(ink)

  return {
    bg,
    // "Inset" always reads as recessed, which means darker in both modes.
    bgInset: isDark ? mix(bg, '#000000', 0.4) : mix(bg, ink, 0.05),
    bgRaised: toward(0.035),
    surface: toward(0.06),
    surfaceHover: toward(0.1),
    line: toward(0.16),
    lineStrong: toward(0.26),
    ink,
    inkSoft: back(0.22),
    inkMuted: back(0.45),
    inkFaint: back(0.62),
  }
}

export function paletteToPreset(palette: CustomPalette): Preset {
  return {
    id: palette.id as PresetId,
    label: palette.name,
    description: 'Custom palette',
    dark: derivePalette(palette.dark_bg, palette.dark_ink),
    light: derivePalette(palette.light_bg, palette.light_ink),
  }
}

/**
 * The accent the user picks is tuned for the dark canvas. On the light canvas
 * that same colour is usually too pale to read, so we darken it until it has
 * real contrast against near-white while keeping the hue.
 */
function accentForLight(hex: string): string {
  const [h, s, l] = rgbToHsl(hex)
  return hslToHex(h, Math.min(1, s * 1.05), Math.min(l, 0.32))
}

/** Black or white text, whichever is legible on top of the accent fill. */
function inkOnAccent(hex: string): string {
  return luminance(hex) > 0.42 ? '#12100b' : '#ffffff'
}

const isHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value)

/* -- Resolution + application ---------------------------------------------- */

export const DEFAULT_THEME: ThemeChoice = {
  hero_layout: 'editorial',
  theme_preset: 'obsidian',
  accent_color: '#e9a94b',
  font_pair: 'inter',
}

/**
 * `theme_preset` holds either a built-in id or the uuid of a saved palette,
 * so both are searched. A deleted palette falls back to the default rather
 * than leaving the site unstyled.
 */
export function resolvePreset(
  id: string | undefined,
  custom: CustomPalette[] = [],
): Preset {
  const builtin = PRESETS.find((p) => p.id === id)
  if (builtin) return builtin

  const saved = custom.find((p) => p.id === id)
  if (saved) return paletteToPreset(saved)

  return PRESETS[0]
}

export function resolveFontPair(id: string | undefined): FontPair {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0]
}

export function resolveHeroLayout(id: string | undefined): HeroLayout {
  return id === 'minimal' || id === 'portrait' || id === 'split' || id === 'studio' || id === 'profile'
    ? id
    : 'editorial'
}

export function resolveWorkLayout(id: string | undefined): WorkLayout {
  return id === 'grid' || id === 'cards' || id === 'carousel' || id === 'showcase' ? id : 'list'
}

/** How many projects the work section shows before "Show more". */
export const DEFAULT_WORK_LIMIT = 6

/** Options offered in the CMS. 0 means "no limit — show every project". */
export const WORK_LIMITS = [3, 4, 6, 8, 12, 0]

/**
 * Guards the stored limit. A missing column (pre-migration 012) or a hand-
 * edited nonsense value falls back to the default rather than hiding the whole
 * section or dumping fifty projects on the page.
 */
export function resolveWorkLimit(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_WORK_LIMIT
  }
  return Math.min(99, Math.max(0, Math.round(value)))
}

export function resolveSkillsLayout(id: string | undefined): SkillsLayout {
  return id === 'icons' || id === 'tiles' || id === 'orbit' ? id : 'grouped'
}

export function resolveExperienceLayout(
  id: string | undefined,
): ExperienceLayout {
  return id === 'timeline' || id === 'cards' || id === 'spotlight' ? id : 'rows'
}

export function resolveAboutLayout(id: string | undefined): AboutLayout {
  return id === 'portrait' || id === 'centered' || id === 'manifesto' ? id : 'sidebar'
}

export function resolveCertsLayout(id: string | undefined): CertsLayout {
  return id === 'list' || id === 'badges' || id === 'shelf' ? id : 'grid'
}

export function resolveContactLayout(id: string | undefined): ContactLayout {
  return id === 'centered' || id === 'cards' || id === 'signal' ? id : 'split'
}

// Keep in step with the effect_schedules / site_settings check constraints
// in supabase/schema.sql — an id accepted there but missing here silently
// degrades to 'none'.
const EFFECT_IDS: BackgroundEffect[] = [
  'none',
  'snow',
  'stars',
  'constellation',
  'aurora',
  'confetti',
  'hearts',
  'bats',
  'fireworks',
  'leaves',
  'petals',
  'fireflies',
  'matrix',
  'astronaut',
  'websling',
  'galaxy',
  'grain',
]

/** Label and one-line description for every effect, shared by the pickers. */
export const EFFECT_META: Record<
  BackgroundEffect,
  { label: string; description: string }
> = {
  none: { label: 'None', description: 'No animation.' },
  snow: { label: 'Snow', description: 'Drifting flakes. Christmas, winter.' },
  stars: { label: 'Stars', description: 'A still field that slowly twinkles.' },
  constellation: {
    label: 'Constellation',
    description: 'Drifting nodes joined by accent-coloured lines.',
  },
  aurora: {
    label: 'Aurora',
    description: 'Slow accent glow behind the content.',
  },
  confetti: {
    label: 'Confetti',
    description: 'Tumbling colour. Birthdays, launches.',
  },
  hearts: {
    label: 'Hearts',
    description: 'Rising hearts in your accent. Valentine’s.',
  },
  bats: {
    label: 'Bats',
    description: 'Silhouettes flapping across. Halloween.',
  },
  fireworks: {
    label: 'Fireworks',
    description: 'Bursts with gravity and fade. New Year.',
  },
  leaves: {
    label: 'Falling leaves',
    description: 'Autumn colours swinging down.',
  },
  petals: {
    label: 'Petals',
    description: 'Blossom drifting slowly. Spring.',
  },
  fireflies: {
    label: 'Fireflies',
    description: 'Wandering warm glows. Summer evenings.',
  },
  matrix: {
    label: 'Code rain',
    description: 'Falling glyph columns. Very developer.',
  },
  astronaut: {
    label: 'Spacewalk',
    description: 'Astronauts drifting past a moon, over a starfield.',
  },
  websling: {
    label: 'Web-slinger',
    description: 'Masked figures swinging by on webs. Spider-Man flavour.',
  },
  galaxy: {
    label: 'Milky Way',
    description: 'The galactic band — nebula clouds, dust lanes, drifting stars.',
  },
  grain: {
    label: 'Film grain',
    description: 'A subtle paper-like texture with no moving particles.',
  },
}

export function resolveEffect(id: string | undefined): BackgroundEffect {
  return EFFECT_IDS.includes(id as BackgroundEffect)
    ? (id as BackgroundEffect)
    : 'none'
}

export function resolveIntensity(id: string | undefined): EffectIntensity {
  return id === 'medium' || id === 'heavy' ? id : 'subtle'
}

/** Multiplies particle count and opacity. Kept low — this is background. */
export const INTENSITY_SCALE: Record<
  EffectIntensity,
  { density: number; opacity: number }
> = {
  subtle: { density: 0.55, opacity: 0.5 },
  medium: { density: 1, opacity: 0.75 },
  heavy: { density: 1.7, opacity: 1 },
}

function paletteVars(p: Palette): string {
  return [
    `--bg:${p.bg}`,
    `--bg-raised:${p.bgRaised}`,
    `--bg-inset:${p.bgInset}`,
    `--surface:${p.surface}`,
    `--surface-hover:${p.surfaceHover}`,
    `--line:${p.line}`,
    `--line-strong:${p.lineStrong}`,
    `--ink:${p.ink}`,
    `--ink-soft:${p.inkSoft}`,
    `--ink-muted:${p.inkMuted}`,
    `--ink-faint:${p.inkFaint}`,
  ].join(';')
}

function accentVars(accent: string): string {
  return [
    `--accent:${accent}`,
    `--accent-ink:${inkOnAccent(accent)}`,
    `--accent-soft:${rgbaString(accent, 0.13)}`,
    `--accent-line:${rgbaString(accent, 0.32)}`,
  ].join(';')
}

const STYLE_ID = 'theme-overrides'
const FONT_LINK_ID = 'theme-fonts'

type FaviconOptions = {
  faviconUrl?: string | null
  logoUrl?: string | null
  logoText?: string | null
  logoMark?: LogoMarkId
  faviconBgColor?: string | null
  faviconTextColor?: string | null
  accentColor?: string | null
  matchNavColors?: boolean
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    }
    return entities[char]
  })
}

function wordmarkFavicon(
  text: string,
  markId: LogoMarkId,
  rawBackground: string,
  rawTextColor: string,
  rawMarkColor: string,
) {
  const monogram = [...(text.trim() || 'D')].slice(0, 3).join('').toUpperCase()
  const fontSize = monogram.length === 1 ? 36 : monogram.length === 2 ? 28 : 22
  const background = isHex(rawBackground)
    ? rawBackground
    : DEFAULT_FAVICON_COLORS.background
  const textColor = isHex(rawTextColor)
    ? rawTextColor
    : DEFAULT_FAVICON_COLORS.text
  const markColor = isHex(rawMarkColor) ? rawMarkColor : textColor
  const glyph = LOGO_MARKS.find((mark) => mark.id === markId)?.glyph ?? '.'
  const mark = !glyph
    ? ''
    : markId === 'dot'
      ? `<circle cx="53" cy="52" r="3.5" fill="${markColor}"/>`
      : `<text x="53" y="56" font-family="sans-serif" font-size="17" text-anchor="middle" fill="${markColor}">${escapeXml(glyph)}</text>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${background}"/><text x="32" y="39" font-family="sans-serif" font-size="${fontSize}" font-weight="700" text-anchor="middle" fill="${textColor}">${escapeXml(monogram)}</text>${mark}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Uses an explicit favicon, then the logo image, then a generated wordmark icon. */
export function applyFavicon({
  faviconUrl,
  logoUrl,
  logoText = 'Portfolio',
  logoMark = 'dot',
  faviconBgColor = DEFAULT_FAVICON_COLORS.background,
  faviconTextColor = DEFAULT_FAVICON_COLORS.text,
  accentColor = DEFAULT_THEME.accent_color,
  matchNavColors = true,
}: FaviconOptions) {
  if (typeof document === 'undefined') return

  const rootStyle = getComputedStyle(document.documentElement)
  const navBackground = rootStyle.getPropertyValue('--bg').trim()
  const navText = rootStyle.getPropertyValue('--ink').trim()
  const navAccent = rootStyle.getPropertyValue('--accent').trim()
  const background = matchNavColors && isHex(navBackground)
    ? navBackground
    : faviconBgColor || DEFAULT_FAVICON_COLORS.background
  const textColor = matchNavColors && isHex(navText)
    ? navText
    : faviconTextColor || DEFAULT_FAVICON_COLORS.text
  const markColor = isHex(navAccent)
    ? navAccent
    : accentColor || DEFAULT_THEME.accent_color
  const href =
    faviconUrl ||
    logoUrl ||
    wordmarkFavicon(
      logoText || 'P',
      logoMark,
      background,
      textColor,
      markColor,
    )
  const ext = href.split('?')[0].split('.').pop()?.toLowerCase()
  const type = href.startsWith('data:image/svg+xml')
    ? 'image/svg+xml'
    : ext === 'svg'
      ? 'image/svg+xml'
      : ext === 'png'
        ? 'image/png'
        : ext === 'ico'
          ? 'image/x-icon'
          : ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : ''

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  if (type) link.type = type
  else link.removeAttribute('type')
  if (link.href !== href) link.href = href
}

/** Injects (or updates) the Google Fonts link for the chosen pairing. */
function loadFonts(pair: FontPair) {
  const href = `https://fonts.googleapis.com/css2?${pair.families
    .map((f) => `family=${f}`)
    .join('&')}&display=swap`

  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.href !== href) link.href = href
}

/**
 * Applies a theme choice to the document. Idempotent — call it as often as
 * you like, including on every keystroke of the colour picker.
 */
export function applyTheme(
  choice: Partial<ThemeChoice> | null | undefined,
  custom: CustomPalette[] = [],
) {
  if (typeof document === 'undefined') return

  const preset = resolvePreset(choice?.theme_preset, custom)
  const pair = resolveFontPair(choice?.font_pair)
  const rawAccent = choice?.accent_color ?? DEFAULT_THEME.accent_color
  const accent = isHex(rawAccent) ? rawAccent : DEFAULT_THEME.accent_color

  loadFonts(pair)

  const fontVars = [
    `--font-display:${pair.display}`,
    `--font-sans:${pair.sans}`,
    `--font-mono:${pair.mono}`,
    `--tracking-display:${pair.displayTracking ?? '-0.022em'}`,
  ].join(';')

  const css = [
    `:root{${paletteVars(preset.dark)};${accentVars(accent)};${fontVars}}`,
    `:root[data-theme='light']{${paletteVars(preset.light)};${accentVars(
      accentForLight(accent),
    )}}`,
  ].join('')

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  if (style.textContent !== css) style.textContent = css

  // Keep the browser chrome in step with the canvas.
  const isLight = document.documentElement.dataset.theme === 'light'
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isLight ? preset.light.bg : preset.dark.bg)
}
