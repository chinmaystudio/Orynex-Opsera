import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, WifiOff } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { AGENT_PRESETS } from '../lib/presets'
import type { BusinessTask, Department } from '../lib/types'
import {
  DetailInspector,
  EmptyState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
} from '../components/ui'

/**
 * The standard OrynexOpraq department structure (spec §3C, §18, §19 +
 * the Executive office). Used as the labelled default template when the
 * backend has no department records yet or is unreachable — never
 * presented as live organization data.
 */
export const TEMPLATE_DEPARTMENTS: Array<{ name: string; description: string }> = [
  { name: 'Executive', description: 'Owner office — priorities, approvals, briefings and oversight of the whole business.' },
  { name: 'Sales', description: 'Leads, CRM, pipeline, deals, follow-ups, outreach and forecasting.' },
  { name: 'Marketing', description: 'Campaigns, content, social scheduling, SEO research and analytics.' },
  { name: 'Finance', description: 'Income, expenses, invoices, budgets, cash flow and reports. Payments always require approval.' },
  { name: 'Human Resources', description: 'Employees, recruitment, onboarding, attendance, leave and performance reviews.' },
  { name: 'Operations', description: 'Processes, tasks, resources, vendors, inventory and operational analytics.' },
  { name: 'Customer Support', description: 'Tickets, AI support agents, escalations and satisfaction analytics.' },
  { name: 'Research & Intelligence', description: 'Market research, competitor intelligence and opportunity discovery.' },
  { name: 'Creative Studio', description: 'Design, brand, video, animation and media production with AI creative agents.' },
  { name: 'Engineering Studio', description: 'AI coding team, repositories, code review, CI/CD and deployments.' },
]

const DESCRIPTION_BY_NAME = new Map(
  TEMPLATE_DEPARTMENTS.map((d) => [d.name, d.description]),
)

/** Module route per department, where one exists in the app. */
const WORKSPACE_ROUTE: Record<string, string> = {
  Sales: '/app/crm-sales',
  Marketing: '/app/marketing',
  Finance: '/app/finance',
  'Human Resources': '/app/hr',
  'Customer Support': '/app/support',
  Operations: '/app/projects',
  'Projects & Operations': '/app/projects',
  'Creative Studio': '/app/creative-studio',
  'Engineering Studio': '/app/engineering-studio',
}

const OPEN_STATUSES = new Set([
  'pending',
  'assigned',
  'in_progress',
  'blocked',
  'waiting_approval',
])

interface DeptRow {
  name: string
  description?: string
  live: boolean
  employeeCount?: number
  agentCount?: number
}

export default function Departments() {
  const navigate = useNavigate()
  const departmentsFetch = useFetch<Department[]>(() => api.getDepartments())
  const tasksFetch = useFetch<BusinessTask[]>(() => api.getTasks())
  const [search, setSearch] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const liveDepartments = departmentsFetch.data ?? []
  const usingTemplate =
    !departmentsFetch.loading &&
    (departmentsFetch.offline ||
      !!departmentsFetch.error ||
      liveDepartments.length === 0)

  const rows: DeptRow[] = useMemo(() => {
    if (!usingTemplate) {
      return liveDepartments.map((d) => ({
        name: d.name,
        description: d.description ?? DESCRIPTION_BY_NAME.get(d.name),
        live: true,
        employeeCount:
          typeof d.employee_count === 'number' ? d.employee_count : undefined,
        agentCount:
          typeof d.agent_count === 'number' ? d.agent_count : undefined,
      }))
    }
    return TEMPLATE_DEPARTMENTS.map((d) => ({
      name: d.name,
      description: d.description,
      live: false,
    }))
  }, [liveDepartments, usingTemplate])

  /** Preset-agent counts per department — real data from the local registry. */
  const presetAgentCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of AGENT_PRESETS)
      map.set(a.department, (map.get(a.department) ?? 0) + 1)
    return map
  }, [])

  const presetsByDepartment = useMemo(() => {
    const map = new Map<string, typeof AGENT_PRESETS>()
    for (const a of AGENT_PRESETS) {
      const list = map.get(a.department) ?? []
      list.push(a)
      map.set(a.department, list)
    }
    return map
  }, [])

  /** Open-task counts per department name, when the tasks API is reachable. */
  const tasksKnown =
    !tasksFetch.loading && !tasksFetch.offline && !tasksFetch.error
  const openTasksByDepartment = useMemo(() => {
    const map = new Map<string, number>()
    if (!tasksKnown) return map
    for (const t of tasksFetch.data ?? []) {
      if (!t.department) continue
      if (!OPEN_STATUSES.has(String(t.status))) continue
      const key = t.department.trim()
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [tasksFetch.data, tasksKnown])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      `${r.name} ${r.description ?? ''}`.toLowerCase().includes(q),
    )
  }, [rows, search])

  const selected = rows.find((r) => r.name === selectedName) ?? null
  const selectedPresets = selected
    ? (presetsByDepartment.get(selected.name) ?? [])
    : []
  const selectedRoute = selected ? WORKSPACE_ROUTE[selected.name] : undefined

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Your business functions, connected through one operating environment."
      />

      {departmentsFetch.offline && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-ink">
            <span className="font-medium">Backend offline</span> — showing the
            standard OrynexOpraq department template for reference. Live
            department records, membership and counts appear once the backend
            is running.
          </p>
        </div>
      )}
      {!departmentsFetch.offline && departmentsFetch.error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <p className="text-sm text-ink">
            <span className="font-medium">Could not load departments.</span>{' '}
            {departmentsFetch.error} The standard template is shown below for
            reference.
          </p>
        </div>
      )}
      {!departmentsFetch.loading &&
        !departmentsFetch.offline &&
        !departmentsFetch.error &&
        liveDepartments.length === 0 && (
          <p className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
            Your organization has no department records yet — the standard
            OrynexOpraq department template is shown below. Create departments
            in the backend and they will replace this template automatically.
          </p>
        )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search departments…"
      />

      {departmentsFetch.loading ? (
        <LoadingSkeleton variant="cards" count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No departments match your search"
          description="Try a different search term — the organization structure itself is unchanged."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <button
              key={row.name}
              onClick={() => setSelectedName(row.name)}
              className="card focus-ring flex min-h-11 flex-col p-5 text-left transition hover:bg-appbg sm:p-6"
            >
              <span className="flex w-full flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{row.name}</span>
                {row.live ? (
                  <span className="inline-flex items-center rounded-full bg-[#E6F4EA] px-2 py-0.5 text-[11px] font-medium text-success ring-1 ring-inset ring-[#CEEAD6]">
                    Live record
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-appbg px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-line">
                    Default template
                  </span>
                )}
              </span>
              {row.description && (
                <span className="mt-2 block line-clamp-2 text-[13px] leading-relaxed text-muted">
                  {row.description}
                </span>
              )}
              <span className="mt-4 grid w-full grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {row.live && row.employeeCount !== undefined
                      ? row.employeeCount
                      : '—'}
                  </span>
                  <span className="block text-[11px] text-muted">employees</span>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {presetAgentCounts.get(row.name) ?? 0}
                  </span>
                  <span className="block text-[11px] text-muted">
                    preset agents
                  </span>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {row.live && row.agentCount !== undefined
                      ? row.agentCount
                      : '—'}
                  </span>
                  <span className="block text-[11px] text-muted">
                    installed agents
                  </span>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {tasksKnown
                      ? (openTasksByDepartment.get(row.name) ?? 0)
                      : '—'}
                  </span>
                  <span className="block text-[11px] text-muted">open tasks</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ---- Department inspector ---- */}
      <DetailInspector
        open={!!selected}
        title={selected?.name ?? ''}
        subtitle={selected?.live ? 'Department record' : 'Default template department'}
        onClose={() => setSelectedName(null)}
      >
        {selected && (
          <div>
            <section className="border-b border-line pb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Purpose
              </h3>
              <p className="text-sm leading-relaxed text-ink">
                {selected.description ??
                  'No description recorded for this department yet.'}
              </p>
              {!selected.live && (
                <p className="mt-2 text-[13px] text-muted">
                  This is part of the standard OrynexOpraq template — it
                  becomes a live department once a record exists in your
                  organization.
                </p>
              )}
            </section>

            <section className="border-b border-line py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                At a glance
              </h3>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Preset agents</dt>
                  <dd className="font-medium text-ink">
                    {presetAgentCounts.get(selected.name) ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Employees</dt>
                  <dd className="font-medium text-ink">
                    {selected.live && selected.employeeCount !== undefined
                      ? selected.employeeCount
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Installed agents (record)</dt>
                  <dd className="font-medium text-ink">
                    {selected.live && selected.agentCount !== undefined
                      ? selected.agentCount
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Open tasks</dt>
                  <dd className="font-medium text-ink">
                    {tasksKnown
                      ? (openTasksByDepartment.get(selected.name) ?? 0)
                      : '—'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                AI agents for this department
              </h3>
              {selectedPresets.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPresets.map((a) => (
                    <button
                      key={a.slug ?? a.name}
                      onClick={() => navigate('/app/ai-workforce')}
                      className="focus-ring rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink transition hover:border-primary-300 hover:bg-primary-50/50"
                      title={`${a.name} — open the AI Workforce`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  No preset agents are assigned to this department in the
                  registry.
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                These are registry presets — available to install, not
                deployed employees.
              </p>

              {selectedRoute && (
                <button
                  className="btn-primary mt-5 w-full justify-center"
                  onClick={() => navigate(selectedRoute)}
                >
                  Open {selected.name} workspace
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </section>
          </div>
        )}
      </DetailInspector>
    </div>
  )
}
