import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    body: '',
  })

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // Without Supabase there's no inbox to write to — hand off to the user's
    // mail client instead of silently dropping the message.
    if (!supabase) {
      const subject = encodeURIComponent(form.subject || 'Portfolio enquiry')
      const body = encodeURIComponent(`${form.body}\n\n— ${form.name}`)
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
      return
    }

    setStatus('sending')
    setError('')

    const { error: insertError } = await supabase.from('messages').insert({
      name: form.name,
      email: form.email,
      subject: form.subject,
      body: form.body,
    })

    if (insertError) {
      setStatus('error')
      setError(insertError.message)
      return
    }

    setStatus('sent')
    setForm({ name: '', email: '', subject: '', body: '' })
  }

  if (status === 'sent') {
    return (
      <div className="notice notice--ok" role="status">
        Message sent. I'll get back to you at {form.email || 'your email'} soon.
      </div>
    )
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__row">
        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => set('name')(e.target.value)}
            placeholder="Jane Cruz"
            autoComplete="name"
          />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            placeholder="jane@company.com"
            autoComplete="email"
          />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Subject</span>
        <input
          className="input"
          value={form.subject}
          onChange={(e) => set('subject')(e.target.value)}
          placeholder="Senior .NET role at …"
        />
      </label>

      <label className="field">
        <span className="field__label">Message</span>
        <textarea
          className="textarea"
          required
          rows={6}
          value={form.body}
          onChange={(e) => set('body')(e.target.value)}
          placeholder="A little about the role or project…"
        />
      </label>

      {status === 'error' && (
        <p className="notice notice--error" role="alert">
          Couldn't send that — {error}. You can email me directly at {email}.
        </p>
      )}

      <div>
        <button
          className="btn btn--primary"
          type="submit"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
