import { useMemo, useState, type ReactNode } from 'react'
import { WifiOff } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { AGENT_PRESETS } from '../lib/presets'
import type { Agent, AgentCategory } from '../lib/types'
import {
  DetailInspector,
  EmptyState,
  FilterBar,
  PageHeader,
  StatusBadge,
} from '../components/ui'

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  core: 'Core Workforce',
  creative: 'Creative Studio',
  engineering: 'Engineering Studio',
}

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

function agentInitials(name: string): string {
  return name
    .replace(/^AI\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/* ------------------------------------------------------------------ */
/* Inspector                                                           */
/* ------------------------------------------------------------------ */

function InspectorSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-line py-4 first:pt-0 last:border-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      {children}
    </section>
  )
}

function MarketplaceInspector({
  agent,
  installed,
  onClose,
}: {
  agent: Agent | null
  installed?: Agent
  onClose: () => void
}) {
  return (
    <DetailInspector
      open={!!agent}
      title={agent?.name ?? ''}
      subtitle={agent ? `${agent.role} · ${agent.department}` : undefined}
      onClose={onClose}
    >
      {agent && (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {installed ? (
              <StatusBadge status={installed.status ?? 'installed'} />
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                Preset — available in registry
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-100">
              {CATEGORY_LABELS[agent.category]}
            </span>
          </div>

          <InspectorSection title="Overview">
            <p className="text-sm leading-relaxed text-ink">
              {agent.description}
            </p>
          </InspectorSection>

          <InspectorSection title="Role & department">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Role</dt>
                <dd className="text-right font-medium text-ink">{agent.role}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Department</dt>
                <dd className="text-right font-medium text-ink">
                  {agent.department}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Division</dt>
                <dd className="text-right font-medium text-ink">
                  {CATEGORY_LABELS[agent.category]}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Risk ceiling</dt>
                <dd className="text-right font-medium text-ink">
                  Defined at install
                </dd>
              </div>
            </dl>
          </InspectorSection>

          <InspectorSection title="Capabilities — tools">
            {agent.tools && agent.tools.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md bg-appbg px-2 py-1 font-mono text-[11px] text-ink ring-1 ring-line"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                No tools are attached to this preset — it works through
                instructions and delegated tasks only. Tools connect when the
                relevant integrations are configured.
              </p>
            )}
          </InspectorSection>

          <InspectorSection title="Deployment eligibility">
            {installed ? (
              <p className="text-sm leading-relaxed text-muted">
                This preset is already deployed in your organization
                {installed.status ? ` (status: ${installed.status})` : ''}.
                Manage the live agent from the AI Workforce workspace.
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-muted">
                Available as a preset in the registry. Deployment arrives
                with the Phase 2 registry runtime — installing will create an
                organization-scoped agent with its own permissions, risk
                ceiling and approval rules. Being listed here does not mean
                the agent is deployed or running.
              </p>
            )}
          </InspectorSection>

          <InspectorSection title="Execution history">
            <p className="text-sm text-muted">
              No executions recorded. Run history is written by the agent
              runtime for installed agents — presets have none.
            </p>
          </InspectorSection>
        </div>
      )}
    </DetailInspector>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Marketplace() {
  const installedFetch = useFetch<Agent[]>(() => api.getAgents())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<AgentCategory | 'all'>('all')
  const [department, setDepartment] = useState('all')
  const [selected, setSelected] = useState<Agent | null>(null)

  const installedKnown =
    !installedFetch.loading && !installedFetch.offline && !installedFetch.error
  const installed = useMemo(
    () => (installedKnown ? (installedFetch.data ?? []) : []),
    [installedFetch.data, installedKnown],
  )
  const installedByName = useMemo(() => {
    const map = new Map<string, Agent>()
    for (const rec of installed) map.set(normalize(rec.name), rec)
    return map
  }, [installed])
  const deployedPresets = AGENT_PRESETS.filter((p) =>
    installedByName.has(normalize(p.name)),
  ).length

  const departments = useMemo(
    () =>
      Array.from(new Set(AGENT_PRESETS.map((a) => a.department))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return AGENT_PRESETS.filter((a) => {
      if (category !== 'all' && a.category !== category) return false
      if (department !== 'all' && a.department !== department) return false
      if (
        q &&
        !`${a.name} ${a.role} ${a.department} ${a.description} ${(a.tools ?? []).join(' ')}`
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
  }, [search, category, department])

  const overviewCells = [
    {
      label: 'Agents in registry',
      value: String(AGENT_PRESETS.length),
      sub: 'Preset definitions published by OrynexAegis',
    },
    {
      label: 'Deployed in your organization',
      value: installedKnown ? String(installed.length) : '—',
      sub: installedKnown
        ? `${deployedPresets} of them match registry presets`
        : 'Unavailable while the backend is offline',
    },
    {
      label: 'Available to deploy',
      value: installedKnown
        ? String(AGENT_PRESETS.length - deployedPresets)
        : '—',
      sub: 'Presets not yet installed — deployment arrives in Phase 2',
    },
    {
      label: 'Divisions',
      value: '3',
      sub: 'Core Workforce · Creative Studio · Engineering Studio',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Agent Marketplace"
        subtitle="Discover specialized agents from the OrynexAegis registry. Inspect before you deploy — availability in the registry is not deployment."
      />

      {installedFetch.offline && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-ink">
            <span className="font-medium">Backend offline</span> — the
            registry below is the local preset catalogue; deployment status
            for your organization is unavailable.
          </p>
        </div>
      )}

      <section
        className="card mb-6 grid grid-cols-2 divide-line overflow-hidden max-lg:gap-px xl:grid-cols-4 xl:divide-x"
        aria-label="Marketplace overview"
      >
        {overviewCells.map((cell) => (
          <div key={cell.label} className="bg-surface px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {cell.label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
              {cell.value}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted">{cell.sub}</p>
          </div>
        ))}
      </section>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search the registry…"
      >
        {(['all', 'core', 'creative', 'engineering'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={category === key ? 'btn-primary' : 'btn-secondary'}
            aria-pressed={category === key}
          >
            {key === 'all' ? 'All divisions' : CATEGORY_LABELS[key]}
          </button>
        ))}
        <select
          className="input w-auto"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          aria-label="Filter by department"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </FilterBar>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No agents match your filters"
              description="Try a different search term, division or department — the registry itself is unchanged."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((agent) => {
              const rec = installedByName.get(normalize(agent.name))
              return (
                <li
                  key={agent.slug ?? agent.name}
                  className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-appbg/70"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-[13px] font-semibold text-primary-700 ring-1 ring-primary-100">
                    {agentInitials(agent.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {agent.name}
                      <span className="ml-2 text-xs font-normal text-muted">
                        {agent.role} · {agent.department}
                      </span>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">
                      {agent.description}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-muted lg:block">
                    {(agent.tools?.length ?? 0) > 0
                      ? `${agent.tools?.length} capabilities`
                      : 'Instruction-led'}
                  </span>
                  <span className="hidden shrink-0 text-xs text-muted xl:block">
                    Ceiling set at install
                  </span>
                  <span className="shrink-0">
                    {rec ? (
                      <StatusBadge status={rec.status ?? 'installed'} />
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                        Preset — in registry
                      </span>
                    )}
                  </span>
                  <button
                    className="btn-secondary shrink-0"
                    onClick={() => setSelected(agent)}
                  >
                    Inspect
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="border-t border-line bg-appbg/60 px-5 py-3 text-xs text-muted">
          Registry listing means an agent definition is available to your
          organization. A deployed agent is a separate, organization-scoped
          record with its own permissions and approval rules — managed in AI
          Workforce once the Phase 2 registry runtime lands.
        </p>
      </div>

      <MarketplaceInspector
        agent={selected}
        installed={
          selected ? installedByName.get(normalize(selected.name)) : undefined
        }
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
