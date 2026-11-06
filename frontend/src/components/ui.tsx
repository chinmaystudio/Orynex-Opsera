import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="card flex items-center justify-center gap-3 px-6 py-14 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
      {label}
    </div>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <Inbox className="mb-3 h-8 w-8 text-slate-300" />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      )}
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
    <div className="card flex flex-col items-center justify-center border-amber-200 bg-amber-50 px-6 py-14 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-amber-500" />
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
      )}
      {onRetry && (
        <button className="btn-secondary mt-4" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

const RISK_STYLES: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medium: 'bg-sky-50 text-sky-700 ring-sky-200',
  high: 'bg-amber-50 text-amber-700 ring-amber-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
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
  pending: 'bg-slate-100 text-slate-600 ring-slate-200',
  assigned: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_progress: 'bg-brand-50 text-brand-700 ring-brand-200',
  waiting_approval: 'bg-amber-50 text-amber-700 ring-amber-200',
  blocked: 'bg-red-50 text-red-700 ring-red-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  idle: 'bg-slate-100 text-slate-600 ring-slate-200',
  not_configured: 'bg-slate-100 text-slate-600 ring-slate-200',
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
