import {
  AlertTriangle,
  Inbox,
  Loader2,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  type FormEvent,
  type ReactNode,
} from 'react'

/* ------------------------------------------------------------------ */
/* PageHeader                                                          */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  subtitle,
  actions,
  children,
}: {
  title: string
  /** Legacy prop name used by existing pages. */
  description?: string
  /** Preferred prop name from the enterprise UI spec. */
  subtitle?: string
  actions?: ReactNode
  /** Legacy: pages pass action buttons as children. */
  children?: ReactNode
}) {
  const text = subtitle ?? description
  const right = actions ?? children
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {text && <p className="mt-1 max-w-2xl text-sm text-muted">{text}</p>}
      </div>
      {right}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Loading / empty / error states                                      */
/* ------------------------------------------------------------------ */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="card flex items-center justify-center gap-3 px-6 py-14 text-sm text-muted">
      <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
      {label}
    </div>
  )
}

export function LoadingSkeleton({
  variant = 'rows',
  count = 4,
}: {
  variant?: 'rows' | 'cards' | 'table'
  count?: number
}) {
  if (variant === 'cards') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-10 w-10 rounded-[10px]" />
            <div className="skeleton mt-4 h-4 w-2/3" />
            <div className="skeleton mt-2 h-3 w-full" />
            <div className="skeleton mt-2 h-3 w-5/6" />
          </div>
        ))}
      </div>
    )
  }
  if (variant === 'table') {
    return (
      <div className="card overflow-hidden" aria-hidden>
        <div className="border-b border-line bg-appbg px-4 py-3">
          <div className="skeleton h-3 w-1/3" />
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0"
          >
            <div className="skeleton h-3 flex-1" />
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 px-4 py-3">
          <div className="skeleton h-9 w-9 shrink-0 rounded-[10px]" />
          <div className="min-w-0 flex-1">
            <div className="skeleton h-3.5 w-1/2" />
            <div className="skeleton mt-2 h-3 w-3/4" />
          </div>
          <div className="skeleton h-5 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  children,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <Icon className="mb-3 h-8 w-8 text-line" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      )}
      {(action ?? children) && <div className="mt-4">{action ?? children}</div>}
    </div>
  )
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF7E0] ring-1 ring-[#FDE293]">
        <AlertTriangle className="h-5 w-5 text-warning" />
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      )}
      {onRetry && (
        <button className="btn-secondary mt-4" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

const RISK_STYLES: Record<string, string> = {
  low: 'bg-[#E6F4EA] text-success ring-[#CEEAD6]',
  medium: 'bg-primary-50 text-primary-700 ring-primary-200',
  high: 'bg-[#FEF7E0] text-warning ring-[#FDE293]',
  critical: 'bg-[#FCE8E6] text-error ring-[#F2B8B5]',
}

export function RiskBadge({ level }: { level: string }) {
  const style = RISK_STYLES[level.toLowerCase()] ?? RISK_STYLES.medium
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ring-1 ring-inset ${style}`}
    >
      {level}
    </span>
  )
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-appbg text-muted ring-line',
  assigned: 'bg-primary-50 text-primary-700 ring-primary-200',
  in_progress: 'bg-primary-50 text-primary-700 ring-primary-200',
  waiting_approval: 'bg-[#FEF7E0] text-warning ring-[#FDE293]',
  blocked: 'bg-[#FCE8E6] text-error ring-[#F2B8B5]',
  completed: 'bg-[#E6F4EA] text-success ring-[#CEEAD6]',
  approved: 'bg-[#E6F4EA] text-success ring-[#CEEAD6]',
  rejected: 'bg-[#FCE8E6] text-error ring-[#F2B8B5]',
  failed: 'bg-[#FCE8E6] text-error ring-[#F2B8B5]',
  active: 'bg-[#E6F4EA] text-success ring-[#CEEAD6]',
  idle: 'bg-appbg text-muted ring-line',
  not_configured: 'bg-appbg text-muted ring-line',
  // Risk levels, so StatusBadge can render risk values too.
  low: 'bg-[#E6F4EA] text-success ring-[#CEEAD6]',
  medium: 'bg-primary-50 text-primary-700 ring-primary-200',
  high: 'bg-[#FEF7E0] text-warning ring-[#FDE293]',
  critical: 'bg-[#FCE8E6] text-error ring-[#F2B8B5]',
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, '_')
  const style = STATUS_STYLES[key] ?? STATUS_STYLES.pending
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* FilterBar                                                           */
/* ------------------------------------------------------------------ */

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  onSearchSubmit,
  children,
}: {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onSearchSubmit?: () => void
  children?: ReactNode
}) {
  function submit(e: FormEvent) {
    e.preventDefault()
    onSearchSubmit?.()
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {onSearchChange && (
        <form onSubmit={submit} className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="input pl-9"
          />
        </form>
      )}
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DetailInspector — right slide-over panel                            */
/* ------------------------------------------------------------------ */

export function DetailInspector({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/30"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-popover">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-ink">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="focus-ring rounded-lg p-1.5 text-muted transition hover:bg-appbg hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatMoney(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN').format(value)
}
