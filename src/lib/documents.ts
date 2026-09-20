/**
 * Vocabulary and formatting for the document bank.
 *
 * The bank is private storage for the paperwork a career leaves behind:
 * certificates of employment, training certificates, clearances, contracts.
 * None of it is rendered on the public site.
 *
 * Note that these files do NOT live in the `media` bucket. That one is public
 * — anyone with the URL can read it, which is exactly right for a project
 * cover and exactly wrong for a Certificate of Employment with your name and
 * salary on it. See `documentUrl` in lib/supabase.ts.
 */

import type { StoredDocument } from './types'
// Dates mean the same thing here as in the tracker, so the helpers are shared
// rather than copied.
import { daysUntil, formatDate } from './applications'

export { formatDate }

/** The private bucket. Kept here so nothing has to spell it twice. */
export const DOCUMENTS_BUCKET = 'documents'

/** Refused before upload — Supabase's own limit is higher, but a scanned PDF
 *  past this is nearly always a phone photo nobody meant to keep. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024

export type DocumentKind =
  | 'coe'
  | 'certificate'
  | 'diploma'
  | 'clearance'
  | 'government'
  | 'contract'
  | 'payslip'
  | 'resume'
  | 'other'

export const DOCUMENT_KINDS: {
  id: DocumentKind
  label: string
  hint: string
}[] = [
  {
    id: 'coe',
    label: 'Certificate of Employment',
    hint: 'COE from a past or current employer.',
  },
  {
    id: 'certificate',
    label: 'Certificate / training',
    hint: 'Course, seminar, or vendor certification.',
  },
  {
    id: 'diploma',
    label: 'Diploma / transcript',
    hint: 'Diploma, TOR, or other school record.',
  },
  {
    id: 'clearance',
    label: 'Clearance',
    hint: 'NBI, police, barangay, or medical.',
  },
  {
    id: 'government',
    label: 'Government ID / record',
    hint: 'SSS, PhilHealth, Pag-IBIG, TIN, passport.',
  },
  {
    id: 'contract',
    label: 'Contract / offer',
    hint: 'Signed contract or job offer letter.',
  },
  {
    id: 'payslip',
    label: 'Payslip / tax',
    hint: 'Payslips, BIR 2316, and the like.',
  },
  { id: 'resume', label: 'Resume / CV', hint: 'A version you sent somewhere.' },
  { id: 'other', label: 'Other', hint: 'Anything that fits nowhere else.' },
]

export function kindMeta(id: string) {
  return DOCUMENT_KINDS.find((k) => k.id === id) ?? DOCUMENT_KINDS[8]
}

export function kindLabel(id: string): string {
  return kindMeta(id).label
}

/**
 * First guess at what an uploaded file is, from its name. Only a starting
 * point — the picker on the card is the real answer, and this just saves
 * setting it by hand on a folder full of files named the obvious thing.
 */
export function guessKind(fileName: string): DocumentKind {
  const name = fileName.toLowerCase()
  if (/\bcoe\b|certificate.*employ|employment.*cert/.test(name)) return 'coe'
  if (/diploma|transcript|\btor\b|record of grades/.test(name)) return 'diploma'
  if (/clearance|\bnbi\b|police|barangay|medical/.test(name)) return 'clearance'
  if (/\bsss\b|philhealth|pag-?ibig|\btin\b|passport|\bumid\b|\bid\b/.test(name))
    return 'government'
  if (/contract|offer|appointment/.test(name)) return 'contract'
  if (/payslip|payroll|\b2316\b|\bbir\b/.test(name)) return 'payslip'
  if (/resume|\bcv\b|curriculum/.test(name)) return 'resume'
  if (/cert|training|seminar|course|completion/.test(name)) return 'certificate'
  return 'other'
}

/** "Acme COE 2024.pdf" → "Acme COE 2024". */
export function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

/** Extension, uppercased, for the badge. "scan.PDF" → "PDF". */
export function fileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()
  return ext && ext.length <= 5 ? ext.toUpperCase() : 'FILE'
}

/* -- Expiry ---------------------------------------------------------------- */

export type ExpiryTone = 'bad' | 'live' | 'idle'

/** Inside this many days an expiry is worth flagging rather than just noting. */
export const EXPIRY_WARNING_DAYS = 60

/**
 * How an expiry date should read on the card. Clearances and IDs are the ones
 * that lapse, and finding that out the week you need the document is the whole
 * problem this is meant to prevent.
 */
export function expiryState(
  value: string | null,
): { tone: ExpiryTone; label: string } | null {
  if (!value) return null
  const days = daysUntil(value)
  if (days === null) return null
  if (days < 0) {
    const ago = Math.abs(days)
    return { tone: 'bad', label: `Expired ${ago} day${ago === 1 ? '' : 's'} ago` }
  }
  if (days === 0) return { tone: 'bad', label: 'Expires today' }
  if (days <= EXPIRY_WARNING_DAYS) {
    return { tone: 'live', label: `Expires in ${days} days` }
  }
  return { tone: 'idle', label: `Valid to ${formatDate(value)}` }
}

/* -- Roll-up --------------------------------------------------------------- */

export type BankStats = {
  total: number
  expiring: number
  expired: number
  bytes: number
}

export function summarise(rows: StoredDocument[]): BankStats {
  let expiring = 0
  let expired = 0
  let bytes = 0

  for (const row of rows) {
    bytes += row.file_size
    const days = row.expires_on ? daysUntil(row.expires_on) : null
    if (days === null) continue
    if (days < 0) expired++
    else if (days <= EXPIRY_WARNING_DAYS) expiring++
  }

  return { total: rows.length, expiring, expired, bytes }
}
