import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShieldAlert } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { ApprovalRequest, OverviewDetail } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  RiskBadge,
  formatMoney,
} from '../components/ui'

interface FinanceData {
  overview: OverviewDetail
  approvals: ApprovalRequest[]
}

const TABS = ['Transactions', 'Invoices', 'Budgets'] as const

const TAB_EMPTY: Record<(typeof TABS)[number], { title: string; description: string }> = {
  Transactions: {
    title: 'No transactions recorded',
    description:
      'There is no transactions backend yet. When the Finance module (Phase 3) ships, income and expenses recorded through it — or imported from a connected accounting integration — will appear here.',
  },
  Invoices: {
    title: 'No invoices yet',
    description:
      'Invoice creation and tracking arrive with the Finance module (Phase 3). Opraq will never mark an invoice paid without a real payment record behind it.',
  },
  Budgets: {
    title: 'No budgets defined',
    description:
      'Department budgets and cash-flow tracking arrive with the Finance module (Phase 3). Budget-versus-actual views will use the same recorded transactions shown here.',
  },
}

export default function Finance() {
  const { data, loading, offline, error, reload } = useFetch<FinanceData>(
    async () => {
      const [overview, approvals] = await Promise.all([
        api.getOverviewDetail(),
        api.getApprovals(),
      ])
      return { overview, approvals }
    },
  )
  const [tab, setTab] = useState<(typeof TABS)[number]>('Transactions')

  const pending = useMemo(
    () => (data?.approvals ?? []).filter((a) => String(a.status) === 'pending'),
    [data],
  )
  const financePending = useMemo(
    () =>
      pending.filter((a) =>
        `${a.action_type ?? ''} ${a.title ?? ''}`
          .toLowerCase()
          .match(/financ|payment|invoice|expense|budget|payout/),
      ),
    [pending],
  )
  const shownApprovals = financePending.length > 0 ? financePending : pending

  const fin = data?.overview.finance

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Money in, money out — with strict approval governance."
      />

      {loading && <LoadingSkeleton variant="table" count={4} />}

      {!loading && offline && (
        <ErrorState
          title="Backend offline"
          description="Financial figures come from the backend. While it is unreachable, no figures are shown — Opraq does not keep a local copy of your money data."
          onRetry={reload}
        />
      )}

      {!loading && !offline && error && (
        <ErrorState title="Could not load finance data" description={error} onRetry={reload} />
      )}

      {!loading && !offline && !error && data && (
        <div className="space-y-6">
          <section>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Revenue</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {formatMoney(fin?.revenue)}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Expenses</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {formatMoney(fin?.expenses)}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Profit</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {formatMoney(fin?.profit)}
                </p>
              </div>
            </div>
            {fin?.source && (
              <p className="mt-2 text-xs text-muted">Source: {fin.source}</p>
            )}
          </section>

          <section className="card overflow-hidden">
            <div
              className="flex gap-1 border-b border-line bg-surface px-3 pt-3"
              role="tablist"
              aria-label="Finance records"
            >
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                    tab === t
                      ? 'bg-appbg text-primary-700'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <EmptyState
              title={TAB_EMPTY[tab].title}
              description={TAB_EMPTY[tab].description}
            />
          </section>

          <section className="card p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-base font-semibold text-ink">
                <ShieldAlert className="h-5 w-5 text-warning" /> Payment approvals
              </h2>
              <Link
                to="/app/approvals"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Open approval inbox <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mb-4 text-sm text-muted">
              Payments and bank transfers are CRITICAL risk: AI employees can
              prepare them, but they are never executed without human approval.
              {financePending.length === 0 && pending.length > 0
                ? ' No finance-specific requests are pending, so all pending approvals are shown below.'
                : ''}
            </p>
            {shownApprovals.length === 0 ? (
              <p className="rounded-[10px] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                Nothing is waiting for approval right now.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {shownApprovals.map((a, i) => (
                  <li
                    key={a.id ?? `${a.title}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{a.title}</p>
                      <p className="text-xs text-muted">
                        {a.action_type ?? 'approval'}
                        {a.requested_by ? ` · Requested by ${a.requested_by}` : ''}
                      </p>
                    </div>
                    <RiskBadge level={String(a.risk_level ?? 'medium')} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
