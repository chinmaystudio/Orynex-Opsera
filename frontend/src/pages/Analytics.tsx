import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Download, FileText } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { AGENT_PRESETS } from '../lib/presets'
import type {
  ApprovalRequest,
  BusinessTask,
  OverviewDetail,
} from '../lib/types'
import {
  ErrorState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
  RiskBadge,
  formatMoney,
  formatNumber,
} from '../components/ui'

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  source,
  children,
}: {
  title: string
  source: string
  children: ReactNode
}) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mb-4 mt-0.5 text-xs text-muted">{source}</p>
      {children}
    </section>
  )
}

function SourceUnavailable({ offline }: { offline: boolean }) {
  return (
    <p className="rounded-xl border border-line bg-appbg px-4 py-3 text-sm text-muted">
      {offline
        ? 'Backend offline — this panel reads live API data and cannot be computed right now.'
        : 'This data could not be loaded from the API.'}
    </p>
  )
}

function BarRow({
  label,
  value,
  max,
  barClass,
  right,
  highlighted = false,
}: {
  label: ReactNode
  value: number
  max: number
  barClass: string
  right: string
  highlighted?: boolean
}) {
  const pct = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${
        highlighted ? 'bg-primary-50/70' : ''
      }`}
    >
      <div className="w-36 shrink-0 truncate text-sm text-ink">{label}</div>
      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-28 shrink-0 text-right text-sm tabular-nums text-muted">
        {right}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Chart computations (all from real records)                          */
/* ------------------------------------------------------------------ */

const STATUS_ORDER: Array<{ key: string; label: string; bar: string }> = [
  { key: 'pending', label: 'Pending', bar: 'bg-slate-400' },
  { key: 'assigned', label: 'Assigned', bar: 'bg-sky-400' },
  { key: 'in_progress', label: 'In progress', bar: 'bg-primary-500' },
  { key: 'waiting_approval', label: 'Waiting approval', bar: 'bg-amber-400' },
  { key: 'blocked', label: 'Blocked', bar: 'bg-red-400' },
  { key: 'completed', label: 'Completed', bar: 'bg-emerald-500' },
  { key: 'failed', label: 'Failed', bar: 'bg-red-500' },
]

const PIPELINE_ORDER = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']
const RISK_ORDER = ['low', 'medium', 'high', 'critical'] as const
const NO_DEPARTMENT = 'No department'

function departmentOf(task: BusinessTask): string {
  return task.department?.trim() ? task.department.trim() : NO_DEPARTMENT
}

function last14Days(tasks: BusinessTask[]): Array<{ label: string; count: number }> {
  const days: Array<{ label: string; count: number }> = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const count = tasks.filter((t) => {
      if (!t.created_at) return false
      const c = new Date(t.created_at)
      return (
        c.getFullYear() === d.getFullYear() &&
        c.getMonth() === d.getMonth() &&
        c.getDate() === d.getDate()
      )
    }).length
    days.push({
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      count,
    })
  }
  return days
}

/**
 * Department filter state that resets to "all" if the selected department
 * disappears from the loaded task data (e.g. after a refetch).
 */
function useDepartmentFilter(departments: string[]) {
  const [department, setDepartment] = useState('all')
  useEffect(() => {
    if (department !== 'all' && !departments.includes(department)) {
      setDepartment('all')
    }
  }, [departments, department])
  return [department, setDepartment] as const
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Analytics() {
  const overviewState = useFetch<OverviewDetail>(() => api.getOverviewDetail())
  const tasksState = useFetch<BusinessTask[]>(() => api.getTasks())
  const approvalsState = useFetch<ApprovalRequest[]>(() => api.getApprovals())

  const tasks = useMemo(() => tasksState.data ?? [], [tasksState.data])
  const approvals = useMemo(
    () => approvalsState.data ?? [],
    [approvalsState.data],
  )
  const overview = overviewState.data

  const departments = useMemo(() => {
    const set = new Set<string>()
    for (const t of tasks) set.add(departmentOf(t))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [tasks])

  const [department, setDepartment] = useDepartmentFilter(departments)

  const filteredTasks = useMemo(
    () =>
      department === 'all'
        ? tasks
        : tasks.filter((t) => departmentOf(t) === department),
    [tasks, department],
  )

  /* ---- task status (filtered) ---- */
  const statusRows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of filteredTasks) {
      const key = (t.status ?? 'pending').toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const known = STATUS_ORDER.map((s) => ({
      ...s,
      count: counts.get(s.key) ?? 0,
    }))
    const extras = Array.from(counts.entries())
      .filter(([k]) => !STATUS_ORDER.some((s) => s.key === k))
      .map(([k, count]) => ({
        key: k,
        label: k.replace(/_/g, ' '),
        bar: 'bg-slate-400',
        count,
      }))
    return [...known, ...extras]
  }, [filteredTasks])
  const statusMax = Math.max(1, ...statusRows.map((r) => r.count))
  const completedCount =
    statusRows.find((r) => r.key === 'completed')?.count ?? 0

  /* ---- last 14 days (filtered) ---- */
  const days = useMemo(() => last14Days(filteredTasks), [filteredTasks])
  const daysTotal = days.reduce((sum, d) => sum + d.count, 0)
  const daysMax = Math.max(1, ...days.map((d) => d.count))

  /* ---- department distribution (all tasks) ---- */
  const deptRows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of tasks) {
      const d = departmentOf(t)
      counts.set(d, (counts.get(d) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [tasks])
  const deptMax = Math.max(1, ...deptRows.map((r) => r.count))

  /* ---- approvals by risk ---- */
  const riskRows = useMemo(
    () =>
      RISK_ORDER.map((risk) => {
        const all = approvals.filter(
          (a) => (a.risk_level ?? '').toLowerCase() === risk,
        )
        return {
          risk,
          total: all.length,
          pending: all.filter((a) => a.status === 'pending').length,
        }
      }),
    [approvals],
  )
  const riskMax = Math.max(1, ...riskRows.map((r) => r.total))

  /* ---- sales pipeline (overview) ---- */
  const pipelineRows = useMemo(() => {
    const pipeline = overview?.sales_pipeline ?? {}
    const keys = [
      ...PIPELINE_ORDER.filter((k) => k in pipeline),
      ...Object.keys(pipeline).filter((k) => !PIPELINE_ORDER.includes(k)),
    ]
    return keys.map((stage) => ({
      stage,
      count: pipeline[stage]?.count ?? 0,
      value: pipeline[stage]?.value ?? 0,
    }))
  }, [overview])
  const pipelineMaxValue = Math.max(1, ...pipelineRows.map((r) => r.value))
  const pipelineMaxCount = Math.max(1, ...pipelineRows.map((r) => r.count))

  /* ---- workforce composition (preset registry + overview) ---- */
  const divisionRows = useMemo(
    () =>
      (
        [
          { key: 'core', label: 'Core Workforce' },
          { key: 'creative', label: 'Creative Studio' },
          { key: 'engineering', label: 'Engineering Studio' },
        ] as const
      ).map((d) => ({
        ...d,
        count: AGENT_PRESETS.filter((a) => a.category === d.key).length,
      })),
    [],
  )

  const tasksReady = !tasksState.loading && !tasksState.offline && !tasksState.error
  const approvalsReady =
    !approvalsState.loading && !approvalsState.offline && !approvalsState.error
  const overviewReady =
    !overviewState.loading && !overviewState.offline && !overviewState.error

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Business intelligence computed from your live operational data — nothing here is sampled or estimated."
        actions={
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                disabled
                title="Report generation arrives with the BI engine in Phase 5"
              >
                <FileText className="h-4 w-4" />
                Generate report
              </button>
              <button
                className="btn-secondary"
                disabled
                title="Export arrives with the BI engine in Phase 5"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <span className="text-xs text-muted">
              Reports and export arrive with the BI engine (Phase 5)
            </span>
          </div>
        }
      />

      <FilterBar>
        <label className="flex items-center gap-2 text-sm text-muted">
          Department
          <select
            className="input w-auto"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filter task charts by department"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-muted">
          The filter applies to the task charts. It is derived from the
          department recorded on each task.
        </span>
      </FilterBar>

      {overviewState.error && !overviewState.offline && (
        <div className="mb-6">
          <ErrorState
            title="Overview data failed to load"
            description={overviewState.error}
            onRetry={overviewState.reload}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ---- Sales pipeline ---- */}
        <Panel
          title="Sales pipeline"
          source="Source: GET /api/v1/overview — lead counts and values by stage, as recorded in the CRM."
        >
          {overviewState.loading ? (
            <LoadingSkeleton variant="rows" count={3} />
          ) : !overviewReady ? (
            <SourceUnavailable offline={overviewState.offline} />
          ) : pipelineRows.length === 0 ? (
            <p className="text-sm text-muted">
              No pipeline data reported yet. Stages appear here as leads are
              recorded in CRM &amp; Sales.
            </p>
          ) : (
            <div>
              {pipelineRows.map((row) => (
                <BarRow
                  key={row.stage}
                  label={row.stage}
                  value={row.value > 0 ? row.value : row.count}
                  max={row.value > 0 ? pipelineMaxValue : pipelineMaxCount}
                  barClass="bg-primary-500"
                  right={`${formatNumber(row.count)} leads · ${formatMoney(row.value)}`}
                />
              ))}
              <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
                Open pipeline value:{' '}
                <span className="font-medium text-ink">
                  {formatMoney(overview?.sales_pipeline_total_value)}
                </span>
              </p>
            </div>
          )}
        </Panel>

        {/* ---- Task status ---- */}
        <Panel
          title="Tasks by status"
          source={`Source: task records from the API${department === 'all' ? '' : ` in ${department}`}. ${formatNumber(completedCount)} of ${formatNumber(filteredTasks.length)} tasks completed.`}
        >
          {tasksState.loading ? (
            <LoadingSkeleton variant="rows" count={4} />
          ) : !tasksReady ? (
            <SourceUnavailable offline={tasksState.offline} />
          ) : filteredTasks.length === 0 ? (
            <p className="text-sm text-muted">
              No tasks recorded
              {department === 'all' ? ' yet' : ' for this department'} — the
              chart fills in as work is created.
            </p>
          ) : (
            statusRows.map((row) => (
              <BarRow
                key={row.key}
                label={row.label}
                value={row.count}
                max={statusMax}
                barClass={row.bar}
                right={formatNumber(row.count)}
              />
            ))
          )}
        </Panel>

        {/* ---- Tasks created, last 14 days ---- */}
        <Panel
          title="Tasks created — last 14 days"
          source="Source: created_at timestamps on task records from the API. This is a count of real records per day, not a trend estimate."
        >
          {tasksState.loading ? (
            <LoadingSkeleton variant="rows" count={3} />
          ) : !tasksReady ? (
            <SourceUnavailable offline={tasksState.offline} />
          ) : daysTotal === 0 ? (
            <p className="text-sm text-muted">
              No tasks were created in the last 14 days
              {department === 'all' ? '' : ' in this department'}.
            </p>
          ) : (
            <div>
              <div className="flex h-32 items-end gap-1.5" aria-hidden>
                {days.map((d) => (
                  <div
                    key={d.label}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                  >
                    <span className="text-[11px] tabular-nums text-muted">
                      {d.count > 0 ? d.count : ''}
                    </span>
                    <div
                      className={`w-full rounded-t ${
                        d.count > 0 ? 'bg-primary-500' : 'bg-slate-200'
                      }`}
                      style={{
                        height: `${Math.max(4, (d.count / daysMax) * 72)}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5" aria-hidden>
                {days.map((d, i) => (
                  <div
                    key={d.label}
                    className="min-w-0 flex-1 text-center text-[10px] leading-tight text-muted"
                  >
                    {i % 2 === 0 ? d.label : ''}
                  </div>
                ))}
              </div>
              <p className="sr-only">
                {days.map((d) => `${d.label}: ${d.count} tasks`).join('. ')}
              </p>
            </div>
          )}
        </Panel>

        {/* ---- Department distribution ---- */}
        <Panel
          title="Tasks by department"
          source="Source: the department recorded on each task. Select a department above to highlight it here and filter the other task charts."
        >
          {tasksState.loading ? (
            <LoadingSkeleton variant="rows" count={4} />
          ) : !tasksReady ? (
            <SourceUnavailable offline={tasksState.offline} />
          ) : deptRows.length === 0 ? (
            <p className="text-sm text-muted">
              No tasks recorded yet, so there is no department distribution to
              show.
            </p>
          ) : (
            deptRows.map((row) => (
              <BarRow
                key={row.name}
                label={row.name}
                value={row.count}
                max={deptMax}
                barClass={
                  department === row.name ? 'bg-primary-600' : 'bg-primary-300'
                }
                right={formatNumber(row.count)}
                highlighted={department === row.name}
              />
            ))
          )}
        </Panel>

        {/* ---- Approvals by risk ---- */}
        <Panel
          title="Approvals by risk level"
          source="Source: approval requests from the API — every gated action, grouped by the risk level it was classified at."
        >
          {approvalsState.loading ? (
            <LoadingSkeleton variant="rows" count={4} />
          ) : !approvalsReady ? (
            <SourceUnavailable offline={approvalsState.offline} />
          ) : approvals.length === 0 ? (
            <p className="text-sm text-muted">
              No approval requests recorded yet. HIGH and CRITICAL actions
              will appear here when they are requested.
            </p>
          ) : (
            riskRows.map((row) => (
              <BarRow
                key={row.risk}
                label={<RiskBadge level={row.risk} />}
                value={row.total}
                max={riskMax}
                barClass={
                  row.risk === 'critical'
                    ? 'bg-red-500'
                    : row.risk === 'high'
                      ? 'bg-amber-400'
                      : row.risk === 'medium'
                        ? 'bg-sky-400'
                        : 'bg-emerald-500'
                }
                right={`${formatNumber(row.total)} total · ${formatNumber(row.pending)} pending`}
              />
            ))
          )}
        </Panel>

        {/* ---- Workforce composition ---- */}
        <Panel
          title="AI workforce composition"
          source="Source: the preset agent registry (local definitions) and installed-agent totals from the overview. Presets are templates — not deployed employees."
        >
          {divisionRows.map((row) => (
            <BarRow
              key={row.key}
              label={row.label}
              value={row.count}
              max={Math.max(1, ...divisionRows.map((r) => r.count))}
              barClass="bg-accent-500"
              right={`${formatNumber(row.count)} presets`}
            />
          ))}
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Installed in this organization</dt>
              <dd className="font-medium text-ink">
                {overviewReady
                  ? formatNumber(overview?.totals?.agents_installed)
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Active agents</dt>
              <dd className="font-medium text-ink">
                {overviewReady
                  ? formatNumber(overview?.totals?.agents_active)
                  : '—'}
              </dd>
            </div>
            {!overviewReady && (
              <p className="text-xs text-muted">
                Installed totals come from the API overview and are
                unavailable while it cannot be reached.
              </p>
            )}
          </dl>
        </Panel>
      </div>
    </div>
  )
}
