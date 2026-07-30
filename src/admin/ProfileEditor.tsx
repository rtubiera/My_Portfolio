import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Metric, SiteSettings, SocialLink } from '../lib/types'
import { useAutosave } from './useAutosave'
import {
  FileUpload,
  Repeater,
  SaveBar,
  TextArea,
  TextField,
  Toggle,
  type SaveState,
} from './ui'

export default function ProfileEditor({
  settings,
  onSaved,
}: {
  settings: SiteSettings
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<SiteSettings>(settings)
  const [state, setState] = useState<SaveState>('clean')
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const version = useRef(0)

  // Re-sync the draft when the parent reloads settings after a save. A reload
  // can also arrive unprompted — Supabase refreshes its token when the tab
  // regains focus — so a draft with unsaved edits in it is left alone.
  const [lastLoaded, setLastLoaded] = useState(settings)
  if (settings !== lastLoaded) {
    setLastLoaded(settings)
    if (state === 'clean' || state === 'saved') setDraft(settings)
  }

  function edit<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    version.current += 1
    setDraft((d) => ({ ...d, [key]: value }))
    setState('dirty')
  }

  async function save() {
    if (!supabase || inFlight.current) return
    inFlight.current = true
    const savedAt = version.current
    setState('saving')
    setError('')

    // `id` is the singleton key — never part of the update payload.
    const payload: Partial<SiteSettings> & { updated_at: string } = {
      ...draft,
      updated_at: new Date().toISOString(),
    }
    delete payload.id

    const { error: saveError } = await supabase
      .from('site_settings')
      .update(payload)
      .eq('id', 1)
    inFlight.current = false

    if (saveError) {
      setState('error')
      setError(saveError.message)
      return
    }

    // Edits made while the request was in flight are not in what we just sent.
    setState(version.current === savedAt ? 'saved' : 'dirty')
    onSaved()
  }

  useAutosave(state === 'dirty', draft, save)

  return (
    <>
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Profile</h1>
          <p className="admin__subtitle">
            Your hero, about section, contact details, and the metrics strip.
          </p>
        </div>
      </header>

      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Hero</h2>
        </div>
        <div className="form">
          <div className="form__row">
            <TextField
              label="Name"
              value={draft.name}
              onChange={(v) => edit('name', v)}
            />
            <TextField
              label="Role"
              value={draft.role}
              onChange={(v) => edit('role', v)}
              placeholder="Software Developer II"
            />
          </div>
          <TextField
            label="Tagline"
            value={draft.tagline}
            onChange={(v) => edit('tagline', v)}
            placeholder="Full Stack · .NET / Blazor"
          />
          <TextArea
            label="Hero intro"
            hint="One or two sentences. This is the first thing a recruiter reads."
            rows={3}
            value={draft.hero_intro}
            onChange={(v) => edit('hero_intro', v)}
          />
          <div className="form__row">
            <div className="field">
              <span className="field__label">Availability</span>
              <div style={{ paddingTop: '0.5rem' }}>
                <Toggle
                  label="Open to opportunities"
                  checked={draft.available}
                  onChange={(v) => edit('available', v)}
                />
              </div>
            </div>
            <TextField
              label="Availability note"
              hint="Shown in the pill at the top. Leave empty to hide it."
              value={draft.available_note}
              onChange={(v) => edit('available_note', v)}
            />
          </div>
          <Repeater
            label="Metrics strip"
            hint="Three works best. Big number first, short label second."
            keys={['value', 'label']}
            placeholders={['110x', 'Faster billing file processing']}
            rows={draft.metrics as unknown as Record<string, string>[]}
            onChange={(rows) => edit('metrics', rows as unknown as Metric[])}
          />
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <h2 className="card__title">About</h2>
        </div>
        <TextArea
          label="About text"
          hint="Blank line between paragraphs."
          rows={10}
          value={draft.about}
          onChange={(v) => edit('about', v)}
        />
      </div>

      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Contact & links</h2>
        </div>
        <div className="form">
          <div className="form__row">
            <TextField
              label="Email"
              type="email"
              value={draft.email}
              onChange={(v) => edit('email', v)}
            />
            <TextField
              label="Phone"
              value={draft.phone}
              onChange={(v) => edit('phone', v)}
            />
          </div>
          <TextField
            label="Location"
            value={draft.location}
            onChange={(v) => edit('location', v)}
          />
          <Repeater
            label="Social links"
            hint="Labels containing GitHub, LinkedIn or Email get a matching icon."
            keys={['label', 'url']}
            placeholders={['GitHub', 'https://github.com/you']}
            rows={draft.socials as unknown as Record<string, string>[]}
            onChange={(rows) =>
              edit('socials', rows as unknown as SocialLink[])
            }
          />
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <h2 className="card__title">Files</h2>
        </div>
        <div className="form">
          <FileUpload
            label="Portrait"
            hint="Square image, shown in the About sidebar. The photo-based hero layouts fall back to this one — set a dedicated hero shot under Theme."
            folder="avatar"
            value={draft.avatar_url}
            onChange={(path) => {
              edit('avatar_url', path)
              setState('dirty')
            }}
          />
          <FileUpload
            label="Résumé (PDF)"
            hint="Adds a Résumé button to the hero."
            folder="resume"
            accept="application/pdf"
            preview={false}
            value={draft.resume_url}
            onChange={(path) => {
              edit('resume_url', path)
              setState('dirty')
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <h2 className="card__title">SEO</h2>
        </div>
        <div className="form">
          <TextField
            label="Page title"
            hint="Shown in the browser tab and search results."
            value={draft.seo_title}
            onChange={(v) => edit('seo_title', v)}
          />
          <TextArea
            label="Meta description"
            hint="Around 150–160 characters."
            rows={3}
            value={draft.seo_description}
            onChange={(v) => edit('seo_description', v)}
          />

          <FileUpload
            label="Share image"
            hint="Shown when your link is pasted into LinkedIn, Slack or a message. 1200×630 JPG or PNG — not SVG, most platforms reject it. Falls back to your hero photo, then your portrait."
            folder="social"
            accept="image/jpeg,image/png,image/webp"
            value={draft.og_image_url}
            onChange={(path) => {
              edit('og_image_url', path)
              setState('dirty')
            }}
          />

          <p className="notice notice--info">
            Everything else in this CMS goes live the instant you save. These
            SEO fields are the one exception: link previews are read by
            crawlers that don't run JavaScript, so they're baked into the page
            at build time. <strong>Redeploy on Netlify</strong> after changing
            anything in this card.
          </p>
        </div>
      </div>

      <SaveBar
        state={state}
        error={error}
        onSave={save}
        onReset={() => {
          setDraft(settings)
          setState('clean')
        }}
      />
    </>
  )
}
