import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Trash } from '../components/Icons'

type Props = {
  title: string
  badges?: ReactNode
  index: number
  total: number
  /** Omit to hide the reorder arrows — for lists ordered by their own data. */
  onMove?: (direction: -1 | 1) => void
  onDelete: () => void
  deleteLabel: string
  children: ReactNode
  defaultOpen?: boolean
}

/** One expandable row in a collection editor, with reorder and delete. */
export default function CollectionCard({
  title,
  badges,
  index,
  total,
  onMove,
  onDelete,
  deleteLabel,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="card">
      <div className="card__head">
        <button
          type="button"
          className="card__title"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            background: 'none',
            border: 0,
            cursor: 'pointer',
            padding: 0,
            textAlign: 'left',
          }}
        >
          {open ? <ChevronUp /> : <ChevronDown />}
          <span className="card__title-text">
            {title || <em style={{ color: 'var(--ink-faint)' }}>Untitled</em>}
          </span>
          {badges}
        </button>

        <div className="card__tools">
          {onMove && (
            <>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => onMove(-1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                <ChevronUp />
              </button>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => onMove(1)}
                disabled={index === total - 1}
                aria-label="Move down"
              >
                <ChevronDown />
              </button>
            </>
          )}
          {confirming ? (
            <>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={onDelete}
              >
                Delete {deleteLabel}?
              </button>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn--sm btn--ghost btn--danger"
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${deleteLabel}`}
            >
              <Trash />
            </button>
          )}
        </div>
      </div>

      {open && <div className="form">{children}</div>}
    </div>
  )
}
