import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Check,
  CheckSquare,
  CircleDollarSign,
  Copy,
  HandCoins,
  Landmark,
  Plug,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WifiOff,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { AGENT_PRESETS } from '../lib/presets'
import { INTEGRATIONS } from '../lib/integrations'
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
  StatusBadge,
  formatMoney,
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

/* ------------------------------------------------------------------ */
/* Business Operations Map                                             */
/* ------------------------------------------------------------------ */

const MAP_DEPARTMENTS = [
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'Operations',
  'Customer Support',
  'Research & Intelligence',
  'Creative Studio',
  'Engineering Studio',
]

function OperationsMap({
  departments,
  pendingApprovals,
}: {
  departments: Department[] | null
  pendingApprovals: number | undefined
}) {
  const navigate = useNavigate()
  const liveNames = new Set((departments ?? []).map((d) => d.name))
  const names =
    liveNames.size > 0
      ? MAP_DEPARTMENTS.filter((n) => liveNames.has(n))
      : MAP_DEPARTMENTS
  const shown = names.length > 0 ? names : MAP_DEPARTMENTS

  const platformNodes: Array<{
    label: string
    hint: string
    to: string
    badge?: string
  }> = [
    { label: 'AI Workforce', hint: `${AGENT_PRESETS.length} presets in the registry`, to: '/app/ai-workforce' },
    { label: 'Automations', hint: 'Workflow service — Phase 4', to: '/app/automations' },
    {
      label: 'Approvals',
      hint: 'Human decisions on risky actions',
      to: '/app/approvals',
      badge:
        pendingApprovals !== undefined && pendingApprovals > 0
          ? `${pendingApprovals} pending`
          : undefined,
    },
  ]

  return (
    <div className="card mt-6 p-5 sm:p-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">
          Business Operations Map
        </h2>
        <p className="text-xs text-muted">
          How the organization connects — select a unit to open its workspace.
        </p>
      </div>

      <div className="overflow-x-auto pb-1 pt-4">
        <div className="min-w-[680px]">
          {/* Executive node */}
          <div className="flex flex-col items-center">
            <div className="rounded-xl border border-primary-300 bg-primary-600 px-5 py-3 text-center shadow-card">
              <p className="text-sm font-semibold text-white">
                Executive · Command Center
              </p>
              <p className="text-xs text-primary-100">
                Priorities, approvals and oversight for the whole business
              </p>
            </div>
            <div className="h-5 w-px bg-line" aria-hidden />
          </div>

          {/* Department nodes */}
          <div className="grid grid-cols-3 gap-3 border-t border-line pt-5 lg:grid-cols-5">
            {shown.map((name) => (
              <button
                key={name}
                onClick={() => navigate('/app/departments')}
                className="focus-ring relative rounded-xl border border-line bg-surface px-3 py-3 text-left transition hover:border-primary-300 hover:bg-primary-50/40"
              >
                <span
                  className="absolute -top-5 left-1/2 h-5 w-px bg-line"
                  aria-hidden
                />
                <span className="block text-[13px] font-medium leading-tight text-ink">
                  {name}
                </span>
                <span className="mt-1 block text-[11px] leading-tight text-muted">
                  {AGENT_PRESETS.filter((a) => a.department === name).length}{' '}
                  preset agents · open workspace
                </span>
              </button>
            ))}
            {/* Platform nodes share the same grid row flow */}
            {platformNodes.map((node) => (
              <button
                key={node.label}
                onClick={() => navigate(node.to)}
                className="focus-ring relative rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-3 text-left transition hover:border-primary-300 hover:bg-primary-50"
              >
                <span
                  className="absolute -top-5 left-1/2 h-5 w-px bg-line"
                  aria-hidden
                />
                <span className="flex items-center justify-between gap-2">
                  <span className="block text-[13px] font-medium leading-tight text-ink">
                    {node.label}
                  </span>
                  {node.badge && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      {node.badge}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-[11px] leading-tight text-muted">
                  {node.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Command suggestions                                                 */
/* ------------------------------------------------------------------ */

const SUGGESTED_COMMANDS = [
  'Generate a business performance report for this month',
  'Assign a task to the Sales department',
  'Summarize pending approvals',
  'Analyze customer acquisition',
  'Create a marketing campaign for our new product',
]

function CommandSuggestions() {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 2000)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="card mt-6 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary-600 ring-1 ring-primary-100">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">
            Try the AI command bar
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Use the command bar at the top of the screen — Opraq turns a
            request into a plan and asks for approval before anything
            sensitive runs. Select a suggestion to copy it.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_COMMANDS.map((command) => (
          <button
            key={command}
            onClick={() => copy(command)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink transition hover:border-primary-300 hover:bg-primary-50/50"
            title="Copy this command"
          >
            {copied === command ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted" />
            )}
            {copied === command ? 'Copied — paste it above' : command}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

interface KpiCell {
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

  const revenue = pickNumber(shape.finance?.revenue, shape.total_revenue)
  const expenses = pickNumber(shape.finance?.expenses, shape.total_expenses)
  const activeTasks = pickNumber(totals.tasks_open, shape.open_tasks)
  const pendingApprovals = pickNumber(
    totals.pending_approvals,
    shape.pending_approvals,
  )
  const agentsInstalled = pickNumber(totals.agents_installed, shape.ai_agents)
  const agentsActive = pickNumber(totals.agents_active)
  const customers = pickNumber(totals.customers, shape.customers)
  const leads = pickNumber(totals.leads, shape.open_leads)

  const kpis: KpiCell[] = [
    {
      label: 'Revenue',
      value: formatMoney(revenue),
      sub:
        typeof shape.finance?.source === 'string'
          ? 'Finance module arrives in Phase 3'
          : 'Recorded revenue',
      icon: CircleDollarSign,
    },
    {
      label: 'Expenses',
      value: formatMoney(expenses),
      sub:
        typeof shape.finance?.source === 'string'
          ? 'Finance module arrives in Phase 3'
          : 'Recorded expenses',
      icon: HandCoins,
    },
    {
      label: 'Active tasks',
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
      label: 'AI agents',
      value: formatNumber(agentsInstalled),
      sub: `${
        agentsActive !== undefined ? `${agentsActive} active · ` : ''
      }${AGENT_PRESETS.length} presets available`,
      icon: Bot,
    },
    {
      label: 'Customers',
      value: formatNumber(customers),
      sub: `${formatNumber(leads)} leads in the pipeline`,
      icon: TrendingUp,
    },
  ]

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

  const configuredIntegrations = INTEGRATIONS.filter(
    (i) => i.status !== 'not_configured',
  ).length

  const systemRows: Array<{
    icon: LucideIcon
    label: string
    status: string
    tone: 'ok' | 'warn' | 'muted'
  }> = [
    {
      icon: Landmark,
      label: 'Backend connection',
      status: overview.offline
        ? 'Offline — aggregates unavailable'
        : overview.error
          ? 'Error — see message above'
          : overview.loading
            ? 'Connecting…'
            : 'Connected',
      tone: overview.offline || overview.error ? 'warn' : 'ok',
    },
    {
      icon: Bot,
      label: 'Agent registry',
      status: `${AGENT_PRESETS.length} presets available locally`,
      tone: 'ok',
    },
    {
      icon: Plug,
      label: 'Integrations',
      status:
        configuredIntegrations > 0
          ? `${configuredIntegrations} configured`
          : 'Not configured — credentials required',
      tone: configuredIntegrations > 0 ? 'ok' : 'muted',
    },
    {
      icon: Workflow,
      label: 'Workflow service',
      status: 'Not available yet — Phase 4',
      tone: 'muted',
    },
  ]

  function refresh() {
    overview.reload()
    tasksFetch.reload()
    approvalsFetch.reload()
    departmentsFetch.reload()
  }

  return (
    <div>
      <PageHeader
        title="Command Center"
        subtitle="Your business, connected and under control."
        actions={
          <button
            className="btn-secondary"
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
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-ink">
            <span className="font-medium">Backend offline.</span> Live business
            aggregates are unavailable right now — figures below show “—”
            rather than invented numbers. Locally available information (the
            preset registry and operations map) still works.
          </p>
        </div>
      )}
      {!overview.offline && overview.error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-ink">
            <span className="font-medium">Could not load the overview.</span>{' '}
            {overview.error}
          </p>
        </div>
      )}

      {/* ---- Section A: overview KPI strip ---- */}
      {overview.loading ? (
        <LoadingSkeleton variant="rows" count={1} />
      ) : (
        <section
          className="card grid grid-cols-2 divide-line overflow-hidden max-lg:gap-px sm:grid-cols-3 xl:grid-cols-6 xl:divide-x"
          aria-label="Business overview"
        >
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="bg-surface px-5 py-4">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  <Icon className="h-3.5 w-3.5 text-primary-500" />
                  {kpi.label}
                </div>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted">
                  {kpi.sub}
                </p>
              </div>
            )
          })}
        </section>
      )}

      {/* ---- Sections B + E: activity + system status ---- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 sm:p-6 lg:col-span-2" aria-label="Business activity">
          <h2 className="text-base font-semibold text-ink">Business activity</h2>
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
                    className="btn-primary"
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
                    className="focus-ring flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-appbg"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ring-1 ${
                        item.kind === 'approval'
                          ? 'bg-amber-50 text-amber-600 ring-amber-100'
                          : 'bg-primary-50 text-primary-600 ring-primary-100'
                      }`}
                    >
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

        <section className="card h-fit p-5 sm:p-6" aria-label="System status">
          <h2 className="text-base font-semibold text-ink">System status</h2>
          <ul className="mt-3 divide-y divide-line">
            {systemRows.map((row) => {
              const Icon = row.icon
              return (
                <li key={row.label} className="flex items-center gap-3 py-3">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      row.tone === 'ok'
                        ? 'bg-emerald-500'
                        : row.tone === 'warn'
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                    }`}
                    aria-hidden
                  />
                  <Icon className="h-5 w-5 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{row.label}</p>
                    <p className="truncate text-xs text-muted">{row.status}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 border-t border-line pt-3 text-xs leading-relaxed text-muted">
            Statuses reflect what is actually reachable from this workspace —
            unconfigured services are labelled, never shown as healthy.
          </p>
        </section>
      </div>

      {/* ---- Section C: operations map ---- */}
      <OperationsMap
        departments={departmentsFetch.data}
        pendingApprovals={pendingApprovals}
      />

      {/* ---- Section D: command suggestions ---- */}
      <CommandSuggestions />
    </div>
  )
}
