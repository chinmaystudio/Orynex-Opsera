import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { api, BackendOfflineError } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { ApprovalRequest } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  RiskBadge,
  StatusBadge,
} from '../components/ui'

export default function Approvals() {
  const { data, loading, offline, error, reload } =
    useFetch<ApprovalRequest[]>(() => api.getApprovals())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function decide(
    approval: ApprovalRequest,
    decision: 'approved' | 'rejected',
  ) {
    if (!approval.id) return
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

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Human approval gates for agent and automation actions (§11). HIGH-risk actions need approval; CRITICAL actions such as payments are never auto-executed."
      />

      {actionError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </p>
      )}

      {loading && <LoadingState label="Loading approval requests…" />}

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
          title="No approval requests"
          description="When an AI employee or automation wants to perform a HIGH or CRITICAL risk action, the request will appear here for your decision."
        />
      )}

      {!loading && !offline && !error && data && data.length > 0 && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Pending ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <EmptyState title="Nothing waiting for approval" />
            ) : (
              <div className="space-y-3">
                {pending.map((approval, i) => (
                  <ApprovalCard
                    key={approval.id ?? `pending-${i}`}
                    approval={approval}
                    busy={busyId === approval.id}
                    onDecide={decide}
                  />
                ))}
              </div>
            )}
          </section>

          {decided.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Decided ({decided.length})
              </h2>
              <div className="space-y-3">
                {decided.map((approval, i) => (
                  <ApprovalCard
                    key={approval.id ?? `decided-${i}`}
                    approval={approval}
                    busy={false}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ApprovalCard({
  approval,
  busy,
  onDecide,
}: {
  approval: ApprovalRequest
  busy: boolean
  onDecide?: (
    approval: ApprovalRequest,
    decision: 'approved' | 'rejected',
  ) => void
}) {
  const isPending = String(approval.status).toLowerCase() === 'pending'
  return (
    <div className="card flex flex-wrap items-start gap-4 p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {approval.title}
          </h3>
          <RiskBadge level={String(approval.risk_level)} />
          <StatusBadge status={String(approval.status)} />
        </div>
        {approval.description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {approval.description}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          {approval.action_type && <>Action: {approval.action_type} · </>}
          {approval.requested_by && <>Requested by {approval.requested_by} · </>}
          {approval.created_at ?? ''}
        </p>
      </div>
      {isPending && onDecide && (
        <div className="flex shrink-0 gap-2">
          <button
            className="btn-primary"
            disabled={busy || !approval.id}
            onClick={() => onDecide(approval, 'approved')}
          >
            <Check className="h-4 w-4" /> Approve
          </button>
          <button
            className="btn-secondary"
            disabled={busy || !approval.id}
            onClick={() => onDecide(approval, 'rejected')}
          >
            <X className="h-4 w-4" /> Reject
          </button>
        </div>
      )}
    </div>
  )
}
