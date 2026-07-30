import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Link } from 'react-router-dom'
import { Eye, Logout, Moon, Sun } from '../components/Icons'
import { fetchPortfolioForAdmin } from '../lib/content'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { PortfolioContent } from '../lib/types'
import CertificationsEditor from './CertificationsEditor'
import ExperienceEditor from './ExperienceEditor'
import Login from './Login'
import MessagesInbox from './MessagesInbox'
import ProfileEditor from './ProfileEditor'
import ProjectsEditor from './ProjectsEditor'
import Setup from './Setup'
import SkillsEditor from './SkillsEditor'
import ThemeEditor from './ThemeEditor'

type TabId =
  | 'profile'
  | 'theme'
  | 'projects'
  | 'experience'
  | 'skills'
  | 'certifications'
  | 'messages'

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'theme', label: 'Theme' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'certifications', label: 'Awards' },
  { id: 'messages', label: 'Inbox' },
]

type Props = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export default function Admin({ theme, onToggleTheme }: Props) {
  const [session, setSession] = useState<Session | null>(null)
  // Nothing to check when Supabase is absent — start settled rather than
  // flipping this from an effect.
  const [checking, setChecking] = useState(supabase !== null)
  const [content, setContent] = useState<PortfolioContent | null>(null)
  const [tab, setTab] = useState<TabId>('profile')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    document.title = 'Portfolio CMS'
  }, [])

  // Session bootstrap + subscription. Both setState calls land in async
  // callbacks, which is the intended way to sync with an external auth system.
  useEffect(() => {
    if (!supabase) return

    // Supabase refreshes the token whenever the tab regains focus, and hands
    // back a brand new session object for the same signed-in user. Storing it
    // would restart the content fetch below and replace whatever is being
    // edited with the server copy — so only a real sign-in or sign-out counts
    // as a change here.
    const adopt = (next: Session | null) =>
      setSession((prev) => (prev?.user.id === next?.user.id ? prev : next))

    void supabase.auth.getSession().then(({ data }) => {
      adopt(data.session)
      setChecking(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      adopt(next)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const reload = useCallback(async () => {
    setContent(await fetchPortfolioForAdmin())
  }, [])

  const refreshUnread = useCallback(async () => {
    if (!supabase) return
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
    setUnread(count ?? 0)
  }, [])

  // Load CMS content once a session exists. Fetch-on-mount in an effect is the
  // right call here — this is a Vite SPA with no framework-level data loader.
  useEffect(() => {
    if (!session) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
    void refreshUnread()
  }, [session, reload, refreshUnread])

  if (!isSupabaseConfigured) return <Setup />

  if (checking) {
    return (
      <div className="page-loading">
        <div className="spinner" aria-hidden="true" />
        <p className="mono">Checking session</p>
      </div>
    )
  }

  if (!session) return <Login />

  if (!content) {
    return (
      <div className="page-loading">
        <div className="spinner" aria-hidden="true" />
        <p className="mono">Loading content</p>
      </div>
    )
  }

  const counts: Record<TabId, number | null> = {
    profile: null,
    theme: null,
    projects: content.projects.length,
    experience: content.experiences.length,
    skills: content.skills.length,
    certifications: content.certifications.length,
    messages: unread || null,
  }

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand">
          <strong>
            CMS<span>.</span>
          </strong>
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>

        <nav className="admin__nav" aria-label="CMS sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="admin__tab"
              data-active={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {counts[t.id] !== null && (
                <span className="admin__tab-count">{counts[t.id]}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin__side-foot">
          <span className="admin__user">{session.user.email}</span>
          <Link className="btn btn--sm btn--ghost" to="/" target="_blank">
            <Eye /> View site
          </Link>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => supabase?.auth.signOut()}
          >
            <Logout /> Sign out
          </button>
        </div>
      </aside>

      <main className="admin__main">
        {tab === 'profile' && (
          <ProfileEditor settings={content.settings} onSaved={reload} />
        )}
        {tab === 'theme' && (
          <ThemeEditor
            settings={content.settings}
            palettes={content.palettes}
            schedules={content.schedules}
            onSaved={reload}
            onPalettesChanged={reload}
            onSchedulesChanged={reload}
          />
        )}
        {tab === 'projects' && (
          <ProjectsEditor projects={content.projects} onChanged={reload} />
        )}
        {tab === 'experience' && (
          <ExperienceEditor items={content.experiences} onChanged={reload} />
        )}
        {tab === 'skills' && (
          <SkillsEditor groups={content.skills} onChanged={reload} />
        )}
        {tab === 'certifications' && (
          <CertificationsEditor
            items={content.certifications}
            onChanged={reload}
          />
        )}
        {tab === 'messages' && <MessagesInbox onRead={refreshUnread} />}
      </main>
    </div>
  )
}
