import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useMatch,
} from 'react-router-dom'
import BackgroundEffect from './components/BackgroundEffect'
import Footer from './components/Footer'
import Nav from './components/Nav'
import { fetchPortfolio } from './lib/content'
import { useTheme } from './lib/hooks'
import { seedContent } from './lib/seed'
import { resolveScheduledEffect, rotationTickMs } from './lib/schedule'
import { mediaUrl } from './lib/supabase'
import { applyFavicon, applyTheme } from './lib/theme'
import type { PortfolioContent } from './lib/types'
import Home from './site/Home'
import ProjectPage from './site/ProjectPage'

// The admin bundle (auth, editors, storage upload) never loads for visitors.
const Admin = lazy(() => import('./admin/Admin'))

function PageLoading() {
  return (
    <div className="page-loading">
      <div className="spinner" aria-hidden="true" />
      <p className="mono">Loading</p>
    </div>
  )
}

/** Honours `/#work` style links arriving from another route. */
function HashScroll() {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    if (!hash) return
    // Wait a frame so the target section exists after the route swap.
    const id = requestAnimationFrame(() => {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [hash, pathname])

  return null
}

function Shell() {
  const { theme, toggle } = useTheme()
  const [content, setContent] = useState<PortfolioContent>(seedContent)
  const [loading, setLoading] = useState(true)
  // Re-evaluated periodically so a tab left open overnight picks up a
  // schedule that starts at midnight.
  const [now, setNow] = useState(() => new Date())
  // Both hooks must run unconditionally — never short-circuit these.
  const adminSplat = useMatch('/admin/*')
  const adminExact = useMatch('/admin')
  const isAdmin = adminSplat !== null || adminExact !== null

  const load = useCallback(async () => {
    const { content: next, error } = await fetchPortfolio()
    setContent(next)
    setLoading(false)
    if (error) console.warn('[portfolio] content load:', error)
  }, [])

  // Fetch-on-mount: this is a Vite SPA with no framework data loader, so an
  // effect is the correct place to kick off the initial content request.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Repaint the design tokens whenever the appearance settings arrive or the
  // light/dark toggle flips — applyTheme writes a palette for both modes plus
  // the matching browser chrome colour.
  useEffect(() => {
    applyTheme(content.settings, content.palettes)
  }, [content.settings, content.palettes, theme])

  // Poll rate follows the rotation mode: 15 minutes is plenty for calendar-day
  // rules, but the per-minute test mode needs a far tighter check to be
  // visible at all.
  const tickMs = rotationTickMs(content.settings.effect_rotation)
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), tickMs)
    return () => window.clearInterval(id)
  }, [tickMs])

  useEffect(() => {
    applyFavicon({
      faviconUrl: content.settings.favicon_url
        ? mediaUrl(content.settings.favicon_url)
        : null,
      logoUrl: content.settings.logo_url
        ? mediaUrl(content.settings.logo_url)
        : null,
      logoText: content.settings.logo_text,
      logoMark: content.settings.logo_mark,
      faviconBgColor: content.settings.favicon_bg_color,
      faviconTextColor: content.settings.favicon_text_color,
      accentColor: content.settings.accent_color,
      matchNavColors: content.settings.favicon_match_nav,
    })
  }, [
    content.settings.favicon_url,
    content.settings.logo_url,
    content.settings.logo_text,
    content.settings.logo_mark,
    content.settings.favicon_bg_color,
    content.settings.favicon_text_color,
    content.settings.favicon_match_nav,
    content.settings.accent_color,
    content.settings.theme_preset,
    theme,
  ])

  if (isAdmin) {
    return (
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route
            path="/admin/*"
            element={<Admin theme={theme} onToggleTheme={toggle} />}
          />
        </Routes>
      </Suspense>
    )
  }

  if (loading) return <PageLoading />

  const activeEffect = resolveScheduledEffect({
    defaultEffect: content.settings.background_effect,
    defaultIntensity: content.settings.effect_intensity,
    schedules: content.schedules,
    rotation: content.settings.effect_rotation,
    rotationPool: content.settings.rotation_pool,
    now,
  })

  const navProps = {
    theme,
    onToggleTheme: toggle,
    logoUrl: content.settings.logo_url
      ? mediaUrl(content.settings.logo_url)
      : null,
    logoText: content.settings.logo_text,
    logoMark: content.settings.logo_mark,
    siteName: content.settings.name || 'Portfolio',
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {/* Outside <Routes> so the animation isn't torn down and reseeded
          every time the visitor opens a project page. */}
      <BackgroundEffect
        effect={activeEffect.effect}
        intensity={activeEffect.intensity}
        theme={theme}
      />
      <HashScroll />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Nav {...navProps} />
              <Home content={content} />
              <Footer settings={content.settings} />
            </>
          }
        />
        <Route
          path="/work/:slug"
          element={
            <>
              <Nav {...navProps} anchorsAreLinks />
              <ProjectPage content={content} />
              <Footer settings={content.settings} />
            </>
          }
        />
        <Route
          path="*"
          element={
            <>
              <Nav {...navProps} anchorsAreLinks />
              <Home content={content} />
              <Footer settings={content.settings} />
            </>
          }
        />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
