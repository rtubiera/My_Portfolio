import { Link } from 'react-router-dom'

/** Shown at /admin when the Supabase env vars are missing. */
export default function Setup() {
  return (
    <div className="setup">
      <p className="mono">Setup required</p>
      <h1>Connect Supabase to enable the CMS</h1>
      <p>
        The site is running on its bundled fallback content. Point it at a
        Supabase project and this screen becomes your editor.
      </p>

      <ol>
        <li>
          Create a free project at <code>supabase.com</code>.
        </li>
        <li>
          Open <strong>SQL Editor → New query</strong>, paste the contents of{' '}
          <code>supabase/schema.sql</code> from this repo, and run it. That
          creates the tables, row-level security policies, the{' '}
          <code>media</code> storage bucket, and seeds your résumé content.
        </li>
        <li>
          Go to <strong>Authentication → Users → Add user</strong> and create
          your login with an email and password. Tick “Auto Confirm User”.
        </li>
        <li>
          Copy <strong>Project URL</strong> and the <strong>anon public</strong>{' '}
          key from <strong>Project Settings → API</strong>.
        </li>
        <li>
          Create a <code>.env</code> file next to <code>package.json</code>:
        </li>
      </ol>

      <pre>
        {`VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
      </pre>

      <ol start={6}>
        <li>
          Restart the dev server (<code>npm run dev</code>), then reload{' '}
          <code>/admin</code> and sign in.
        </li>
        <li>
          For the deployed site, add the same two variables in{' '}
          <strong>Netlify → Site configuration → Environment variables</strong>{' '}
          and redeploy.
        </li>
      </ol>

      <p className="field__hint">
        The anon key is safe to expose — row-level security is what protects
        your data, and it only permits writes for a signed-in user.
      </p>

      <p style={{ marginTop: 'var(--space-l)' }}>
        <Link className="btn" to="/">
          ← Back to the site
        </Link>
      </p>
    </div>
  )
}
