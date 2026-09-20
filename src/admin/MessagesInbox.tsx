import { useCallback, useEffect, useState } from 'react'
import { Check, Mail, Trash } from '../components/Icons'
import { supabase } from '../lib/supabase'
import type { Message } from '../lib/types'

export default function MessagesInbox({ onRead }: { onRead: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error: loadError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    setLoading(false)
    if (loadError) {
      setError(loadError.message)
      return
    }
    setMessages((data ?? []) as Message[])
  }, [])

  // Fetch-on-mount — see the note in App.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function setRead(id: string, read: boolean) {
    if (!supabase) return
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, read } : m)))
    await supabase.from('messages').update({ read }).eq('id', id)
    onRead()
  }

  async function remove(id: string) {
    if (!supabase) return
    setMessages((ms) => ms.filter((m) => m.id !== id))
    await supabase.from('messages').delete().eq('id', id)
    onRead()
  }

  const unread = messages.filter((m) => !m.read).length

  return (
    <>
      <header className="admin__head">
        <div>
          <h1 className="admin__title">Inbox</h1>
          <p className="admin__subtitle">
            Messages sent through the contact form on your site.
            {unread > 0 && ` ${unread} unread.`}
          </p>
        </div>
        <div className="admin__actions">
          <button type="button" className="btn btn--sm" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </header>

      {loading && <p className="empty">Loading messages…</p>}
      {error && <p className="notice notice--error">{error}</p>}

      {!loading && !error && messages.length === 0 && (
        <p className="empty">No messages yet.</p>
      )}

      {messages.map((message) => (
        <article className="msg" key={message.id} data-unread={!message.read}>
          <div className="msg__head">
            <span className="msg__from">{message.name}</span>
            <span className="msg__meta">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>

          {message.subject && (
            <p className="msg__subject">{message.subject}</p>
          )}

          <p className="msg__body">{message.body}</p>

          <div className="msg__tools">
            <a
              className="btn btn--sm"
              href={`mailto:${message.email}?subject=${encodeURIComponent(
                `Re: ${message.subject || 'your message'}`,
              )}`}
            >
              <Mail /> Reply to {message.email}
            </a>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => void setRead(message.id, !message.read)}
            >
              <Check /> Mark {message.read ? 'unread' : 'read'}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost btn--danger"
              onClick={() => void remove(message.id)}
            >
              <Trash /> Delete
            </button>
          </div>
        </article>
      ))}
    </>
  )
}
