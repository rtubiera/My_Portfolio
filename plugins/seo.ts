import type { Plugin } from 'vite'

/* ==========================================================================
   Build-time SEO

   Social unfurlers (LinkedIn, Slack, X, iMessage, Discord) fetch a URL and
   read the HTML *without executing JavaScript*. That means the runtime
   document.title / meta updates the app does on load are invisible to them —
   whatever ships in index.html is what gets shown.

   So this plugin reads your live content from Supabase during `vite build`
   and bakes the real title, description, canonical URL and share image into
   the HTML, then emits a sitemap covering every published project.

   Consequence worth knowing: changing SEO fields in the CMS does not update
   link previews until the site is redeployed. Everything else in the CMS is
   still instant — this is the one exception, and it is inherent to static
   hosting rather than a shortcut taken here.
   ========================================================================== */

type Settings = {
  name?: string
  role?: string
  seo_title?: string
  seo_description?: string
  hero_intro?: string
  og_image_url?: string | null
  hero_image_url?: string | null
  avatar_url?: string | null
  favicon_url?: string | null
}

type ProjectRow = { slug: string }

type SeoData = {
  title: string
  description: string
  image: string | null
  favicon: string | null
  siteUrl: string
  projectSlugs: string[]
}

/** Resolves a storage path to its absolute public URL. */
function mediaUrl(supabaseUrl: string, path: string | null | undefined) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${supabaseUrl}/storage/v1/object/public/media/${path}`
}

/** Trailing slashes cause duplicate-content warnings on canonical URLs. */
function normalizeSiteUrl(raw: string | undefined): string {
  if (!raw) return ''
  return raw.trim().replace(/\/+$/, '')
}

async function fetchJson<T>(url: string, key: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function loadSeo(
  supabaseUrl: string,
  anonKey: string,
  siteUrl: string,
): Promise<SeoData | null> {
  const rows = await fetchJson<Settings[]>(
    `${supabaseUrl}/rest/v1/site_settings?select=*&id=eq.1`,
    anonKey,
  )
  const settings = rows?.[0]
  if (!settings) return null

  const projects =
    (await fetchJson<ProjectRow[]>(
      `${supabaseUrl}/rest/v1/projects?select=slug&published=eq.true&order=sort_order`,
      anonKey,
    )) ?? []

  const title =
    settings.seo_title ||
    [settings.name, settings.role].filter(Boolean).join(' — ') ||
    'Portfolio'

  const description = settings.seo_description || settings.hero_intro || ''

  // Prefer a purpose-made share image, then the hero photo, then the portrait.
  // All three are raster uploads; SVG is rejected by most unfurlers.
  const image =
    mediaUrl(supabaseUrl, settings.og_image_url) ??
    mediaUrl(supabaseUrl, settings.hero_image_url) ??
    mediaUrl(supabaseUrl, settings.avatar_url)

  return {
    title,
    description,
    image,
    favicon: mediaUrl(supabaseUrl, settings.favicon_url),
    siteUrl,
    projectSlugs: projects.map((p) => p.slug).filter(Boolean),
  }
}

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Replaces a meta tag's content if present, otherwise appends the tag. */
function upsertMeta(
  html: string,
  attr: 'name' | 'property',
  key: string,
  content: string,
): string {
  const safe = escapeAttr(content)
  const existing = new RegExp(
    `(<meta\\s+[^>]*${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*content=["'])[^"']*(["'])`,
    'i',
  )
  if (existing.test(html)) return html.replace(existing, `$1${safe}$2`)

  return html.replace(
    '</head>',
    `    <meta ${attr}="${key}" content="${safe}" />\n  </head>`,
  )
}

function upsertLink(html: string, rel: string, href: string): string {
  const safe = escapeAttr(href)
  const existing = new RegExp(
    `(<link\\s+[^>]*rel=["']${rel}["'][^>]*href=["'])[^"']*(["'])`,
    'i',
  )
  if (existing.test(html)) return html.replace(existing, `$1${safe}$2`)

  return html.replace(
    '</head>',
    `    <link rel="${rel}" href="${safe}" />\n  </head>`,
  )
}

function buildSitemap(siteUrl: string, slugs: string[]): string {
  const today = new Date().toISOString().slice(0, 10)
  const entry = (path: string, priority: string) =>
    `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entry('/', '1.0'),
    ...slugs.map((slug) => entry(`/work/${slug}`, '0.8')),
    '</urlset>',
    '',
  ].join('\n')
}

function buildRobots(siteUrl: string): string {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /admin']
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
  return lines.join('\n') + '\n'
}

export function seoPlugin(env: Record<string, string>): Plugin {
  let data: SeoData | null = null

  return {
    name: 'portfolio-seo',
    apply: 'build',

    async buildStart() {
      const supabaseUrl = normalizeSiteUrl(env.VITE_SUPABASE_URL)
      const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()

      // Netlify sets URL automatically on production builds; SITE_URL is the
      // manual override for other hosts or local testing.
      const siteUrl = normalizeSiteUrl(
        process.env.SITE_URL || env.VITE_SITE_URL || process.env.URL,
      )

      if (!supabaseUrl || !anonKey) {
        this.warn(
          'Supabase env vars missing — social preview tags will use the static defaults in index.html.',
        )
        data = { title: '', description: '', image: null, favicon: null, siteUrl, projectSlugs: [] }
        return
      }

      data = await loadSeo(supabaseUrl, anonKey, siteUrl)

      if (!data) {
        this.warn(
          'Could not reach Supabase — social preview tags will use the static defaults in index.html.',
        )
        data = { title: '', description: '', image: null, favicon: null, siteUrl, projectSlugs: [] }
        return
      }

      if (!siteUrl) {
        this.warn(
          'No site URL (Netlify sets URL automatically; set SITE_URL locally). Canonical, og:url and sitemap.xml are skipped.',
        )
      }
      if (!data.image) {
        this.warn(
          'No share image — upload one under /admin → Profile → SEO, or set a hero photo. Links will unfurl without a preview card.',
        )
      }
    },

    transformIndexHtml(html) {
      if (!data) return html
      let out = html

      if (data.title) {
        out = out.replace(
          /<title>[\s\S]*?<\/title>/i,
          `<title>${escapeAttr(data.title)}</title>`,
        )
        out = upsertMeta(out, 'property', 'og:title', data.title)
        out = upsertMeta(out, 'name', 'twitter:title', data.title)
      }

      if (data.description) {
        out = upsertMeta(out, 'name', 'description', data.description)
        out = upsertMeta(out, 'property', 'og:description', data.description)
        out = upsertMeta(out, 'name', 'twitter:description', data.description)
      }

      if (data.image) {
        out = upsertMeta(out, 'property', 'og:image', data.image)
        out = upsertMeta(out, 'name', 'twitter:image', data.image)
        out = upsertMeta(out, 'name', 'twitter:card', 'summary_large_image')
      } else {
        // A large-image card with no image renders as an empty grey box.
        out = upsertMeta(out, 'name', 'twitter:card', 'summary')
      }

      if (data.siteUrl) {
        out = upsertMeta(out, 'property', 'og:url', data.siteUrl)
        out = upsertLink(out, 'canonical', data.siteUrl)
      }

      if (data.favicon) out = upsertLink(out, 'icon', data.favicon)

      return out
    },

    generateBundle() {
      if (!data) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: buildRobots(data.siteUrl),
      })

      if (data.siteUrl) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: buildSitemap(data.siteUrl, data.projectSlugs),
        })
      }
    },
  }
}
