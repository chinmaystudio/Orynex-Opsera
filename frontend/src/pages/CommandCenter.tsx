import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  Building2,
  CheckSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { AGENT_PRESETS } from '../lib/presets'
import type {
  ApprovalRequest,
  BusinessTask,
  Department,
  Overview,
} from '../lib/types'
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  RiskBadge,
  StatusBadge,
  formatNumber,
} from '../components/ui'

/* ------------------------------------------------------------------ */
/* Overview shape helpers                                              */
/*                                                                     */
/* The backend returns nested aggregates:                              */
/*   { totals: {...}, finance: { revenue, expenses, profit }, ... }    */
/* Flat fields (older shape) are honoured as a fallback. Anything      */
/* not reported renders as "—" — never an invented number.             */
/* ------------------------------------------------------------------ */

interface OverviewShape {
  totals?: Record<string, unknown>
  finance?: { revenue?: unknown; expenses?: unknown; profit?: unknown; source?: unknown }
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (typeof v === 'number' && !Number.isNaN(v)) return v
  }
  return undefined
}

function formatWhen(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

interface StatCell {
  label: string
  value: string
  sub: string
  icon: LucideIcon
}

export default function CommandCenter() {
  const navigate = useNavigate()
  const overview = useFetch<Overview>(() => api.getOverview())
  const tasksFetch = useFetch<BusinessTask[]>(() => api.getTasks())
  const approvalsFetch = useFetch<ApprovalRequest[]>(() => api.getApprovals())
  const departmentsFetch = useFetch<Department[]>(() => api.getDepartments())

  const data = overview.data
  const shape = (data ?? {}) as Overview & OverviewShape
  const totals = shape.totals ?? {}

  const activeTasks = pickNumber(totals.tasks_open, shape.open_tasks)
  const pendingApprovals = pickNumber(
    totals.pending_approvals,
    shape.pending_approvals,
  )
  const agentsInstalled = pickNumber(totals.agents_installed, shape.ai_agents)
  const agentsActive = pickNumber(totals.agents_active)
  const departmentsCount =
    pickNumber(totals.departments) ??
    (!departmentsFetch.loading && departmentsFetch.data
      ? departmentsFetch.data.length
      : undefined)

  const stats: StatCell[] = [
    {
      label: 'Active agents',
      value: formatNumber(agentsActive),
      sub:
        agentsInstalled !== undefined
          ? `${formatNumber(agentsInstalled)} installed · ${AGENT_PRESETS.length} presets available`
          : `${AGENT_PRESETS.length} presets available in the registry`,
      icon: Bot,
    },
    {
      label: 'Open tasks',
      value: formatNumber(activeTasks),
      sub: 'Open across all departments',
      icon: CheckSquare,
    },
    {
      label: 'Pending approvals',
      value: formatNumber(pendingApprovals),
      sub: 'Awaiting a human decision',
      icon: ShieldCheck,
    },
    {
      label: 'Departments',
      value: formatNumber(departmentsCount),
      sub: 'Department records in your organization',
      icon: Building2,
    },
  ]

  /* Needs attention: the pending approvals, exactly as recorded. */
  const pendingList = useMemo(
    () =>
      (approvalsFetch.data ?? []).filter((a) => a.status === 'pending'),
    [approvalsFetch.data],
  )

  /* Activity: real tasks + pending approvals, newest first. */
  const activity = useMemo(() => {
    type Item = {
      id: string
      kind: 'task' | 'approval'
      title: string
      detail: string
      status: string
      at?: string
      sort: number
      to: string
    }
    const items: Item[] = []
    for (const t of tasksFetch.data ?? []) {
      const at = t.created_at
      items.push({
        id: `task-${t.id ?? t.title}`,
        kind: 'task',
        title: t.title,
        detail: [t.department, t.assignee_name].filter(Boolean).join(' · '),
        status: String(t.status),
        at,
        sort: at ? new Date(at).getTime() || 0 : 0,
        to: '/app/tasks',
      })
    }
    for (const a of approvalsFetch.data ?? []) {
      if (a.status !== 'pending') continue
      const at = a.created_at
      items.push({
        id: `approval-${a.id ?? a.title}`,
        kind: 'approval',
        title: a.title,
        detail: `Risk ${String(a.risk_level).toUpperCase()} · awaiting decision`,
        status: 'pending approval',
        at,
        sort: at ? new Date(at).getTime() || 0 : 0,
        to: '/app/approvals',
      })
    }
    return items.sort((x, y) => y.sort - x.sort).slice(0, 10)
  }, [tasksFetch.data, approvalsFetch.data])

  const activityLoading = tasksFetch.loading || approvalsFetch.loading
  const activityUnavailable =
    !activityLoading && (tasksFetch.offline || approvalsFetch.offline)

  function refresh() {
    overview.reload()
    tasksFetch.reload()
    approvalsFetch.reload()
    departmentsFetch.reload()
  }

  const quickActions: Array<{
    label: string
    hint: string
    to: string
    icon: LucideIcon
    primary?: boolean
  }> = [
    {
      label: 'New task',
      hint: 'Create a task in Tasks',
      to: '/app/tasks',
      icon: Plus,
      primary: true,
    },
    {
      label: 'View approvals',
      hint: 'Decide pending approvals',
      to: '/app/approvals',
      icon: ShieldCheck,
    },
    {
      label: 'Browse AI Workforce',
      hint: 'Explore the agent registry',
      to: '/app/ai-workforce',
      icon: Bot,
    },
    {
      label: 'Manage departments',
      hint: 'View your departments',
      to: '/app/departments',
      icon: Building2,
    },
  ]

  return (
    <div>
      <PageHeader
        title={greeting()}
        subtitle="Here's what's happening across your workspace."
        actions={
          <button
            className="btn-secondary min-h-11"
            onClick={refresh}
            disabled={overview.loading}
          >
            <RefreshCw
              className={`h-4 w-4 ${overview.loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        }
      />

      {overview.offline && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-ink">
            <span className="font-medium">Backend offline.</span> Live business
            aggregates are unavailable right now — figures below show “—”
            rather than invented numbers.
          </p>
        </div>
      )}
      {!overview.offline && overview.error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <p className="text-sm text-ink">
            <span className="font-medium">Could not load the overview.</span>{' '}
            {overview.error}
          </p>
        </div>
      )}

      {/* ---- Stats ---- */}
      {overview.loading ? (
        <LoadingSkeleton variant="cards" count={4} />
      ) : (
        <section
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          aria-label="Business overview"
        >
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  {stat.label}
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted">
                  {stat.sub}
                </p>
              </div>
            )
          })}
        </section>
      )}

      {/* ---- Needs your attention ---- */}
      <section
        className="card mt-6 p-5 sm:p-6"
        aria-label="Needs your attention"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">
            Needs your attention
          </h2>
          <button
            onClick={() => navigate('/app/approvals')}
            className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            View approvals
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          Pending approvals waiting for a human decision.
        </p>

        {approvalsFetch.loading && (
          <div className="mt-4">
            <LoadingSkeleton variant="rows" count={3} />
          </div>
        )}

        {!approvalsFetch.loading && approvalsFetch.offline && (
          <p className="mt-4 rounded-xl border border-line bg-appbg px-4 py-3 text-sm text-muted">
            Approvals are unavailable while the backend is offline — nothing
            is shown rather than placeholder approvals.
          </p>
        )}

        {!approvalsFetch.loading &&
          !approvalsFetch.offline &&
          approvalsFetch.error && (
            <p className="mt-4 rounded-xl border border-line bg-appbg px-4 py-3 text-sm text-muted">
              Could not load approvals. {approvalsFetch.error}
            </p>
          )}

        {!approvalsFetch.loading &&
          !approvalsFetch.offline &&
          !approvalsFetch.error &&
          pendingList.length === 0 && (
            <div className="mt-4">
              <EmptyState
                title="Nothing needs your attention"
                description="There are no pending approvals right now. New approval requests will appear here."
              />
            </div>
          )}

        {!approvalsFetch.loading && pendingList.length > 0 && (
          <ul className="mt-2 divide-y divide-line">
            {pendingList.map((approval) => (
              <li key={approval.id ?? approval.title}>
                <button
                  onClick={() => navigate('/app/approvals')}
                  className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-appbg"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {approval.title}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {approval.requested_by
                        ? `Requested by ${approval.requested_by}`
                        : 'Awaiting decision'}
                      {approval.created_at
                        ? ` · ${formatWhen(approval.created_at)}`
                        : ''}
                    </span>
                  </span>
                  <RiskBadge level={String(approval.risk_level)} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Recent activity ---- */}
      <section className="card mt-6 p-5 sm:p-6" aria-label="Recent activity">
        <h2 className="text-base font-semibold text-ink">Recent activity</h2>
        <p className="mt-0.5 text-sm text-muted">
          The latest tasks and pending approvals recorded in your workspace.
        </p>

        {activityLoading && (
          <div className="mt-4">
            <LoadingSkeleton variant="rows" count={4} />
          </div>
        )}

        {!activityLoading && activityUnavailable && (
          <p className="mt-4 rounded-xl border border-line bg-appbg px-4 py-3 text-sm text-muted">
            Activity is unavailable while the backend is offline — tasks and
            approvals cannot be loaded. Nothing is shown rather than
            placeholder activity.
          </p>
        )}

        {!activityLoading && !activityUnavailable && activity.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No business activity yet"
              description="Create a task or install an agent to get started — activity from your workspace will appear here."
              action={
                <button
                  className="btn-primary min-h-11"
                  onClick={() => navigate('/app/tasks')}
                >
                  Go to Tasks
                </button>
              }
            />
          </div>
        )}

        {!activityLoading && activity.length > 0 && (
          <ul className="mt-2 divide-y divide-line">
            {activity.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.to)}
                  className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-appbg"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                    {item.kind === 'approval' ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <CheckSquare className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {item.detail || 'Workspace'}
                      {item.at ? ` · ${formatWhen(item.at)}` : ''}
                    </span>
                  </span>
                  <StatusBadge status={item.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Quick actions ---- */}
      <section className="mt-6" aria-label="Quick actions">
        <h2 className="text-base font-semibold text-ink">Quick actions</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className={`focus-ring flex min-h-11 items-center gap-3 rounded-2xl border px-5 py-4 text-left transition ${
                  action.primary
                    ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700'
                    : 'border-line bg-surface text-ink hover:bg-appbg'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    action.primary ? 'text-white' : 'text-primary-600'
                  }`}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {action.label}
                  </span>
                  <span
                    className={`block truncate text-xs ${
                      action.primary ? 'text-primary-100' : 'text-muted'
                    }`}
                  >
                    {action.hint}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
