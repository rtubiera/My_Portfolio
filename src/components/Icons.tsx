type IconProps = { size?: number; className?: string }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
})

export const Sun = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const Moon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

export const Menu = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
)

export const Close = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const ArrowUpRight = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
)

export const ArrowLeft = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
)

export const Github = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 19.9 5a4.9 4.9 0 0 0-.1-3.6s-1.1-.3-3.7 1.4a12.7 12.7 0 0 0-6.6 0C6.9 1.1 5.8 1.4 5.8 1.4A4.9 4.9 0 0 0 5.7 5 5.2 5.2 0 0 0 4.3 8.8c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 0 0-.9 2.6V22" />
  </svg>
)

export const Linkedin = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-13h4v1.5A6 6 0 0 1 16 8Z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export const Mail = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
)

export const Document = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6M9 15h6M9 11h2" />
  </svg>
)

export const Plus = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Trash = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
)

export const ChevronUp = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m6 15 6-6 6 6" />
  </svg>
)

export const ChevronDown = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const ChevronLeft = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const ChevronRight = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const Check = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const Logout = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)

export const Eye = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

/** Picks an icon from a social link's label, falling back to a generic arrow. */
export const SocialIcon = ({
  label,
  size = 15,
}: {
  label: string
  size?: number
}) => {
  const key = label.toLowerCase()
  if (key.includes('git')) return <Github size={size} />
  if (key.includes('linked')) return <Linkedin size={size} />
  if (key.includes('mail') || key.includes('email')) return <Mail size={size} />
  return <ArrowUpRight size={size} />
}
