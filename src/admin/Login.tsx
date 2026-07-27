import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return

    setBusy(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setBusy(false)
    // On success the auth listener in Admin swaps this screen out.
    if (signInError) setError(signInError.message)
  }

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Portfolio CMS</h1>
        <p className="login__sub">
          Sign in to edit your site. Changes go live immediately.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="input"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p className="notice notice--error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p
          className="field__hint"
          style={{ marginTop: 'var(--space-m)', textAlign: 'center' }}
        >
          <Link to="/">← Back to the site</Link>
        </p>
      </div>
    </div>
  )
}
