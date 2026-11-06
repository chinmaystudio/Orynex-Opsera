import { useState } from 'react'
import { AlertOctagon, Check, ShieldAlert, X } from 'lucide-react'
import { api, BackendOfflineError } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { ApprovalRequest } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  RiskBadge,
  StatusBadge,
} from '../components/ui'

function isCritical(approval: ApprovalRequest): boolean {
  return String(approval.risk_level).toLowerCase() === 'critical'
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function requesterLabel(approval: ApprovalRequest): string {
  return (
    approval.requested_by ??
    (approval['requested_by_name'] as string | undefined) ??
    (approval['actor'] as string | undefined) ??
    'System / AI agent'
  )
}

export default function Approvals() {
  const { data, loading, offline, error, reload } =
    useFetch<ApprovalRequest[]>(() => api.getApprovals())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  /** CRITICAL approvals use a two-step inline confirmation before deciding. */
  const [confirm, setConfirm] = useState<{
    id: string
    decision: 'approved' | 'rejected'
  } | null>(null)

  async function decide(
    approval: ApprovalRequest,
    decision: 'approved' | 'rejected',
  ) {
    if (!approval.id) return
    // CRITICAL risk: require an explicit second confirmation click first.
    if (isCritical(approval)) {
      if (!confirm || confirm.id !== approval.id || confirm.decision !== decision) {
        setConfirm({ id: approval.id, decision })
        return
      }
    }
    setConfirm(null)
    setBusyId(approval.id)
    setActionError(null)
    try {
      await api.decideApproval(approval.id, decision)
      reload()
    } catch (err) {
      setActionError(
        err instanceof BackendOfflineError
          ? 'Backend offline — your decision was not recorded.'
          : err instanceof Error
            ? err.message
            : 'Could not record the decision.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const pending = (data ?? []).filter(
    (a) => String(a.status).toLowerCase() === 'pending',
  )
  const decided = (data ?? []).filter(
    (a) => String(a.status).toLowerCase() !== 'pending',
  )
  const criticalPending = pending.filter(isCritical).length

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle="High-risk actions wait here for a human decision."
      />

      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {actionError}
        </p>
      )}

      {loading && <LoadingSkeleton variant="rows" count={3} />}

      {!loading && offline && (
        <ErrorState
          title="Backend offline"
          description="Approval requests are managed by the backend and cannot be loaded while it is unreachable."
          onRetry={reload}
        />
      )}

      {!loading && !offline && error && (
        <ErrorState
          title="Could not load approvals"
          description={error}
          onRetry={reload}
        />
      )}

      {!loading && !offline && !error && data && data.length === 0 && (
        <EmptyState
          title="No pending approvals"
          description="High-risk actions will appear here before they execute."
        />
      )}

      {!loading && !offline && !error && data && data.length > 0 && (
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-label="Pending approval requests">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
              Pending ({pending.length})
              {criticalPending > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold normal-case tracking-normal text-red-700 ring-1 ring-inset ring-red-200">
                  <AlertOctagon className="h-3.5 w-3.5" aria-hidden />
                  {criticalPending} critical
                </span>
              )}
            </h2>
            {pending.length === 0 ? (
              <EmptyState
                title="No pending approvals"
                description="High-risk actions will appear here before they execute."
              />
            ) : (
              <div className="space-y-3">
                {pending.map((approval, i) => (
                  <ApprovalCard
                    key={approval.id ?? `pending-${i}`}
                    approval={approval}
                    busy={busyId === approval.id}
                    confirming={
                      confirm && approval.id && confirm.id === approval.id
                        ? confirm.decision
                        : null
                    }
                    onDecide={decide}
                    onCancelConfirm={() => setConfirm(null)}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-label="Decided approval requests">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Decided ({decided.length})
            </h2>
            {decided.length === 0 ? (
              <p className="rounded-card border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                No decisions recorded yet. Approved and rejected requests will
                be listed here.
              </p>
            ) : (
              <div className="space-y-3">
                {decided.map((approval, i) => (
                  <ApprovalCard
                    key={approval.id ?? `decided-${i}`}
                    approval={approval}
                    busy={false}
                    confirming={null}
                    compact
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function ApprovalCard({
  approval,
  busy,
  confirming,
  onDecide,
  onCancelConfirm,
  compact = false,
}: {
  approval: ApprovalRequest
  busy: boolean
  confirming: 'approved' | 'rejected' | null
  onDecide?: (
    approval: ApprovalRequest,
    decision: 'approved' | 'rejected',
  ) => void
  onCancelConfirm?: () => void
  compact?: boolean
}) {
  const isPending = String(approval.status).toLowerCase() === 'pending'
  const critical = isCritical(approval)
  const high = String(approval.risk_level).toLowerCase() === 'high'

  const accent = critical
    ? 'border-red-300 shadow-[inset_4px_0_0_0_#dc2626]'
    : high
      ? 'border-amber-300 shadow-[inset_4px_0_0_0_#d97706]'
      : ''

  return (
    <article className={`card p-5 ${accent}`}>
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {critical ? (
              <AlertOctagon className="h-4 w-4 shrink-0 text-red-600" aria-label="Critical risk" />
            ) : high ? (
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" aria-label="High risk" />
            ) : null}
            <h3 className="text-sm font-semibold text-ink">{approval.title}</h3>
            <RiskBadge level={String(approval.risk_level)} />
            <StatusBadge status={String(approval.status)} />
          </div>
          {approval.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {approval.description}
            </p>
          )}
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            {approval.action_type && (
              <span>
                <dt className="sr-only">Request type</dt>
                <dd>
                  Type:{' '}
                  <span className="font-medium text-ink">
                    {String(approval.action_type).replace(/_/g, ' ')}
                  </span>
                </dd>
              </span>
            )}
            <span>
              <dt className="sr-only">Requested by</dt>
              <dd>
                Requested by{' '}
                <span className="font-medium text-ink">
                  {requesterLabel(approval)}
                </span>
              </dd>
            </span>
            <span>
              <dt className="sr-only">Submitted</dt>
              <dd>Submitted {formatDate(approval.created_at)}</dd>
            </span>
            {!isPending && approval['decided_by'] != null && (
              <span>
                <dd>
                  Decided by{' '}
                  <span className="font-medium text-ink">
                    {String(approval['decided_by'])}
                  </span>
                </dd>
              </span>
            )}
          </dl>
          {confirming && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              This is a CRITICAL action. Confirm that you want to{' '}
              {confirming === 'approved' ? 'approve' : 'reject'} it — the
              decision is recorded in the audit log.
            </p>
          )}
        </div>

        {isPending && onDecide && !compact && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {confirming ? (
              <>
                <button
                  className={
                    confirming === 'approved' ? 'btn-primary' : 'btn-secondary'
                  }
                  disabled={busy || !approval.id}
                  onClick={() => onDecide(approval, confirming)}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {busy
                    ? 'Recording…'
                    : confirming === 'approved'
                      ? 'Confirm approval'
                      : 'Confirm rejection'}
                </button>
                <button
                  className="btn-secondary"
                  disabled={busy}
                  onClick={onCancelConfirm}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-primary"
                  disabled={busy || !approval.id}
                  aria-label={`Approve: ${approval.title}`}
                  onClick={() => onDecide(approval, 'approved')}
                >
                  <Check className="h-4 w-4" aria-hidden />{' '}
                  {busy ? 'Recording…' : 'Approve'}
                </button>
                <button
                  className="btn-secondary"
                  disabled={busy || !approval.id}
                  aria-label={`Reject: ${approval.title}`}
                  onClick={() => onDecide(approval, 'rejected')}
                >
                  <X className="h-4 w-4" aria-hidden /> Reject
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
