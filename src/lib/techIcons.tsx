/* ==========================================================================
   Skill icons

   Three tiers, in order:
     1. A real brand mark from simple-icons, in the brand's own colour.
     2. A generic category glyph (database, cloud, testing, …) matched on
        keywords — used where simple-icons has no mark, which covers most
        Microsoft and Amazon products since they were removed on trademark
        grounds.
     3. A monogram tile with the first letters.

   Tier 2 exists deliberately: inventing a lookalike logo for SQL Server or
   Azure would be worse than an honest generic glyph.
   ========================================================================== */

import type { ReactElement } from 'react'
import {
  siAppium,
  siBlazor,
  siBootstrap,
  siC,
  siCss,
  siDocker,
  siDotnet,
  siElectron,
  siFirebase,
  siGit,
  siGithub,
  siGitlab,
  siHtml5,
  siJavascript,
  siJira,
  siJquery,
  siKubernetes,
  siLinux,
  siMongodb,
  siMysql,
  siNetlify,
  siNodedotjs,
  siNotion,
  siPhp,
  siPostgresql,
  siPostman,
  siPython,
  siReact,
  siRedis,
  siSelenium,
  siShopify,
  siSupabase,
  siTypescript,
  siVercel,
  siWordpress,
} from 'simple-icons'

type Brand = { path: string; hex: string; title: string }

/** Normalises "ASP.NET Core Web API" → "aspnetcorewebapi" for lookup. */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9+#]/g, '')
}

/** Exact-match brand marks, keyed by normalised skill name. */
const BRANDS: Record<string, Brand> = {}

function register(brand: Brand, ...aliases: string[]) {
  for (const alias of aliases) BRANDS[normalize(alias)] = brand
}

register(siDotnet, '.NET', '.NET 8', '.NET Core', '.NET Framework', 'dotnet')
register(siC, 'C#', 'C Sharp', 'CSharp')
register(siBlazor, 'Blazor', 'Blazor WebAssembly', 'Blazor Server', 'Blazor (WASM / Server)')
register(siReact, 'React', 'React.js', 'ReactJS')
register(siTypescript, 'TypeScript')
register(siJavascript, 'JavaScript', 'JS')
register(siHtml5, 'HTML', 'HTML5')
register(siCss, 'CSS', 'CSS3')
register(siJquery, 'jQuery')
register(siBootstrap, 'Bootstrap')
register(siNodedotjs, 'Node', 'Node.js', 'NodeJS')
register(siPython, 'Python')
register(siPhp, 'PHP')
register(siDocker, 'Docker')
register(siKubernetes, 'Kubernetes', 'K8s')
register(siGit, 'Git')
register(siGithub, 'GitHub')
register(siGitlab, 'GitLab')
register(siPostgresql, 'PostgreSQL', 'Postgres')
register(siMysql, 'MySQL')
register(siMongodb, 'MongoDB')
register(siRedis, 'Redis')
register(siSupabase, 'Supabase')
register(siFirebase, 'Firebase')
register(siWordpress, 'WordPress')
register(siShopify, 'Shopify')
register(siPostman, 'Postman')
register(siJira, 'Jira')
register(siNotion, 'Notion')
register(siNetlify, 'Netlify')
register(siVercel, 'Vercel')
register(siLinux, 'Linux')
register(siElectron, 'Electron')
register(siAppium, 'Appium')
register(siSelenium, 'Selenium')

/* -- Generic category glyphs ---------------------------------------------- */

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const GLYPHS: Record<string, ReactElement> = {
  database: (
    <g {...strokeProps}>
      <ellipse cx="12" cy="6" rx="8" ry="3.2" />
      <path d="M4 6v12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V6" />
      <path d="M4 12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2" />
    </g>
  ),
  cloud: (
    <g {...strokeProps}>
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97 6 6 0 0 0-11.6 1.6A3.7 3.7 0 0 0 7 19Z" />
    </g>
  ),
  test: (
    <g {...strokeProps}>
      <path d="M9 3v6.5L4.5 18A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.8-3L15 9.5V3" />
      <path d="M8 3h8M7.5 14h9" />
    </g>
  ),
  shield: (
    <g {...strokeProps}>
      <path d="M12 22s8-3.6 8-9.6V5.5L12 2.5 4 5.5v6.9C4 18.4 12 22 12 22Z" />
      <path d="m9 12 2 2 4-4" />
    </g>
  ),
  api: (
    <g {...strokeProps}>
      <path d="m8 17-5-5 5-5M16 7l5 5-5 5M14 4l-4 16" />
    </g>
  ),
  server: (
    <g {...strokeProps}>
      <rect x="3" y="4" width="18" height="7" rx="1.6" />
      <rect x="3" y="13" width="18" height="7" rx="1.6" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </g>
  ),
  network: (
    <g {...strokeProps}>
      <circle cx="12" cy="5" r="2.4" />
      <circle cx="5" cy="19" r="2.4" />
      <circle cx="19" cy="19" r="2.4" />
      <path d="M12 7.4v4.2M10.4 13 6.6 16.9M13.6 13l3.8 3.9" />
    </g>
  ),
  tool: (
    <g {...strokeProps}>
      <path d="M14.7 6.3a4 4 0 0 1 5 5l-9.6 9.6a2.1 2.1 0 0 1-3-3Z" />
      <path d="m14.5 6.5-9 9" />
    </g>
  ),
  chart: (
    <g {...strokeProps}>
      <path d="M3 21h18M7 21V11M12 21V4M17 21v-7" />
    </g>
  ),
  code: (
    <g {...strokeProps}>
      <path d="m9 18-6-6 6-6M15 6l6 6-6 6" />
    </g>
  ),
  mobile: (
    <g {...strokeProps}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.4" />
      <path d="M10.5 18.5h3" />
    </g>
  ),
  window: (
    <g {...strokeProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M6.5 6.5h.01M9.5 6.5h.01" />
    </g>
  ),
}

/**
 * Keyword → glyph. Order matters: the first substring hit wins, so the more
 * specific patterns come first.
 */
const KEYWORD_GLYPHS: [RegExp, string][] = [
  [/playwright|cypress|test|qa|automation|soapui/, 'test'],
  [/mobile|android|ios|appium/, 'mobile'],
  [/csrf|injection|brute|security|auth|mitigation/, 'shield'],
  [/rate limiting|load balanc|reverse proxy|gateway|proxy/, 'network'],
  [/sql|oracle|database|pl\/sql|stored procedure|query/, 'database'],
  [/aws|azure|cloud|s3|lambda|iis|hosting|deploy/, 'cloud'],
  [/api|rest|soap|wcf|web service|graphql|endpoint/, 'api'],
  [/docker|kubernetes|ci\/cd|pipeline|yaml|devops|container/, 'server'],
  [/monitoring|analytics|optimi[sz]ation|performance/, 'chart'],
  [/syncfusion|telerik|devexpress|kendo|material ui|component/, 'window'],
  [/visual studio|vs code|editor|ide|studio/, 'window'],
  [/jira|sharepoint|notion|basecamp|office|tool|cms/, 'tool'],
  [/entity framework|linq|ado\.net|asp\.net|mvc|razor|scripting|finacle/, 'code'],
]

/** Two-letter monogram: "Finacle Scripting" → "FS", "Oracle" → "OR". */
function monogram(name: string): string {
  const words = name
    .replace(/[^\w\s.#+]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.replace(/[^\w#+]/g, '').slice(0, 2).toUpperCase() || '?'
}

type ResolvedIcon =
  | { kind: 'brand'; path: string; hex: string; title: string }
  | { kind: 'glyph'; node: ReactElement }
  | { kind: 'monogram'; text: string }

function resolveIcon(name: string): ResolvedIcon {
  const brand = BRANDS[normalize(name)]
  if (brand) {
    return {
      kind: 'brand',
      path: brand.path,
      hex: `#${brand.hex}`,
      title: brand.title,
    }
  }

  const lower = name.toLowerCase()
  for (const [pattern, glyph] of KEYWORD_GLYPHS) {
    if (pattern.test(lower)) return { kind: 'glyph', node: GLYPHS[glyph] }
  }

  return { kind: 'monogram', text: monogram(name) }
}

type Props = {
  name: string
  size?: number
  /** Brand marks keep their own colour when true, else inherit currentColor. */
  colored?: boolean
}

export function TechIcon({ name, size = 26, colored = true }: Props) {
  const icon = resolveIcon(name)

  if (icon.kind === 'brand') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="img"
        aria-label={name}
        style={colored ? { color: icon.hex } : undefined}
      >
        <path d={icon.path} fill="currentColor" />
      </svg>
    )
  }

  if (icon.kind === 'glyph') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="img"
        aria-label={name}
      >
        {icon.node}
      </svg>
    )
  }

  return (
    <span className="tech-monogram" aria-label={name} role="img">
      {icon.text}
    </span>
  )
}
