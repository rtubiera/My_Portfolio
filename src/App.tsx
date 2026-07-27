import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useMatch,
} from 'react-router-dom'
import Footer from './components/Footer'
import Nav from './components/Nav'
import { fetchPortfolio } from './lib/content'
import { useTheme } from './lib/hooks'
import { seedContent } from './lib/seed'
import { applyTheme } from './lib/theme'
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

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <HashScroll />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Nav theme={theme} onToggleTheme={toggle} />
              <Home content={content} />
              <Footer settings={content.settings} />
            </>
          }
        />
        <Route
          path="/work/:slug"
          element={
            <>
              <Nav theme={theme} onToggleTheme={toggle} anchorsAreLinks />
              <ProjectPage content={content} />
              <Footer settings={content.settings} />
            </>
          }
        />
        <Route
          path="*"
          element={
            <>
              <Nav theme={theme} onToggleTheme={toggle} anchorsAreLinks />
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
