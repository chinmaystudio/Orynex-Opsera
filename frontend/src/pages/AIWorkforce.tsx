import { useMemo, useState, type ReactNode } from 'react'
import { LayoutGrid, List, WifiOff } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { AGENT_PRESETS } from '../lib/presets'
import type { Agent, AgentCategory } from '../lib/types'
import {
  DetailInspector,
  EmptyState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
  RiskBadge,
  StatusBadge,
} from '../components/ui'
import WorkforceNetwork, {
  DIVISIONS,
  agentInitials,
} from '../components/WorkforceNetwork'

/** Extra fields an installed (backend) agent record may carry. */
interface InstalledExtras {
  preset_id?: string
  risk_ceiling?: string
  permissions?: string[]
  llm_model?: string
  system_instructions?: string
  organization_id?: string
}

type InstalledAgent = Agent & InstalledExtras

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  core: 'Core Workforce',
  creative: 'Creative Studio',
  engineering: 'Engineering Studio',
}

function normalize(name: string): string {
  return name.trim().toLowerCase()
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

function AgentInspector({
  agent,
  installed,
  onClose,
}: {
  agent: Agent | null
  installed?: InstalledAgent
  onClose: () => void
}) {
  const isInstalled = !!installed
  const riskCeiling = installed?.risk_ceiling
  const permissions = installed?.permissions
  const instructions =
    installed?.system_instructions || (agent as InstalledExtras | null)?.system_instructions

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
            {isInstalled ? (
              <StatusBadge status={installed?.status ?? 'installed'} />
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                Registry preset — not installed
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-100">
              {CATEGORY_LABELS[agent.category]}
            </span>
            {riskCeiling && <RiskBadge level={riskCeiling} />}
          </div>

          <InspectorSection title="Overview">
            <p className="text-sm leading-relaxed text-ink">
              {agent.description}
            </p>
          </InspectorSection>

          <InspectorSection title="Role & responsibilities">
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
                instructions and delegated tasks only.
              </p>
            )}
          </InspectorSection>

          <InspectorSection title="Permissions">
            {permissions && permissions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((perm) => (
                  <span
                    key={perm}
                    className="rounded-md bg-appbg px-2 py-1 font-mono text-[11px] text-ink ring-1 ring-line"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Permissions are defined when the agent is installed into an
                organization — this preset carries no granted permissions.
              </p>
            )}
          </InspectorSection>

          <InspectorSection title="Instructions">
            {instructions ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {instructions}
              </p>
            ) : (
              <p className="text-sm text-muted">
                Not configured. System instructions are set per deployment
                when the agent is installed.
              </p>
            )}
          </InspectorSection>

          <InspectorSection title="Deployment configuration">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Status</dt>
                <dd className="text-right font-medium text-ink">
                  {isInstalled
                    ? (installed?.status ?? 'installed')
                    : 'Preset — awaiting deployment'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Model</dt>
                <dd className="text-right font-medium text-ink">
                  {installed?.llm_model || agent.llm || 'Configured at install'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Risk ceiling</dt>
                <dd className="text-right">
                  {riskCeiling ? (
                    <RiskBadge level={riskCeiling} />
                  ) : (
                    <span className="text-sm text-muted">
                      Set at install — can never exceed the preset ceiling
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            {!isInstalled && (
              <p className="mt-3 rounded-xl border border-line bg-appbg px-3 py-2.5 text-[13px] leading-relaxed text-muted">
                Installing creates an organization-scoped agent from this
                preset, with its own permissions and approval rules. Agent
                installation arrives with the registry runtime in Phase 2 —
                presets cannot be deployed from this workspace yet.
              </p>
            )}
          </InspectorSection>

          <InspectorSection title="Execution history">
            <p className="text-sm text-muted">
              No executions recorded. Execution history is written by the
              agent runtime when an installed agent runs — presets have no
              run history.
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

export default function AIWorkforce() {
  const installedFetch = useFetch<Agent[]>(() => api.getAgents())
  const [view, setView] = useState<'network' | 'directory'>('network')
  const [category, setCategory] = useState<AgentCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Agent | null>(null)
  const [highlightedDivision, setHighlightedDivision] =
    useState<AgentCategory | null>(null)

  const offline = installedFetch.offline
  const installedKnown = !installedFetch.loading && !offline && !installedFetch.error
  const installed: InstalledAgent[] = useMemo(
    () => (installedKnown ? ((installedFetch.data ?? []) as InstalledAgent[]) : []),
    [installedFetch.data, installedKnown],
  )

  const installedByName = useMemo(() => {
    const map = new Map<string, InstalledAgent>()
    for (const rec of installed) map.set(normalize(rec.name), rec)
    return map
  }, [installed])
  const installedNames = useMemo(
    () => new Set(installedByName.keys()),
    [installedByName],
  )

  const installedCount = installed.length
  const activeCount = installed.filter(
    (a) => (a.status ?? '').toLowerCase() === 'active',
  ).length
  const matchedPresets = AGENT_PRESETS.filter((p) =>
    installedNames.has(normalize(p.name)),
  ).length
  const awaitingDeployment = AGENT_PRESETS.length - matchedPresets
  const unmatchedInstalled = installed.filter(
    (rec) =>
      !AGENT_PRESETS.some((p) => normalize(p.name) === normalize(rec.name)),
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return AGENT_PRESETS.filter((a) => {
      if (category !== 'all' && a.category !== category) return false
      if (
        q &&
        !`${a.name} ${a.role} ${a.department} ${a.description}`
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
  }, [category, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: AGENT_PRESETS.length }
    for (const a of AGENT_PRESETS) c[a.category] = (c[a.category] ?? 0) + 1
    return c
  }, [])

  const selectedInstalled: InstalledAgent | undefined = selected
    ? (installedByName.get(normalize(selected.name)) ??
      installed.find((r) => r.id && selected.id && r.id === selected.id) ??
      ((selected as InstalledExtras).preset_id
        ? (selected as InstalledAgent)
        : undefined))
    : undefined

  const overviewCells = [
    {
      label: 'Available presets',
      value: String(AGENT_PRESETS.length),
      sub: 'In the local registry — not deployed',
    },
    {
      label: 'Installed agents',
      value: installedKnown ? String(installedCount) : '—',
      sub: installedKnown
        ? 'Organization-scoped agent records'
        : 'Unavailable while the backend is offline',
    },
    {
      label: 'Active',
      value: installedKnown ? String(activeCount) : '—',
      sub: 'Installed agents with active status',
    },
    {
      label: 'Awaiting deployment',
      value: installedKnown ? String(awaitingDeployment) : '—',
      sub: 'Presets not yet installed',
    },
  ]

  return (
    <div>
      <PageHeader
        title="AI Workforce"
        subtitle="Your digital workforce, organized by role and responsibility."
      />

      {offline && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-ink">
            <span className="font-medium">Backend offline</span> — showing the
            local preset registry; installed status unavailable. Presets are
            agent definitions, not deployed employees.
          </p>
        </div>
      )}
      {!offline && installedFetch.error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-ink">
            <span className="font-medium">Could not load installed agents.</span>{' '}
            {installedFetch.error} The preset registry below is unaffected.
          </p>
        </div>
      )}

      {/* ---- Overview strip ---- */}
      <section
        className="card mb-6 grid grid-cols-2 divide-line overflow-hidden max-lg:gap-px xl:grid-cols-4 xl:divide-x"
        aria-label="Workforce overview"
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

      {/* ---- Controls ---- */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search agents, roles, departments…"
      >
        {(['all', 'core', 'creative', 'engineering'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={
              category === key ? 'btn-primary' : 'btn-secondary'
            }
            aria-pressed={category === key}
          >
            {key === 'all' ? 'All agents' : CATEGORY_LABELS[key]} (
            {counts[key] ?? 0})
          </button>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
        <div
          className="inline-flex rounded-xl border border-line bg-surface p-0.5"
          role="group"
          aria-label="View"
        >
          <button
            onClick={() => setView('network')}
            aria-pressed={view === 'network'}
            className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-medium transition ${
              view === 'network'
                ? 'bg-primary-600 text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Workforce Network
          </button>
          <button
            onClick={() => setView('directory')}
            aria-pressed={view === 'directory'}
            className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-medium transition ${
              view === 'directory'
                ? 'bg-primary-600 text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            <List className="h-4 w-4" />
            Agent Directory
          </button>
        </div>
      </FilterBar>

      {installedFetch.loading && view === 'directory' && (
        <LoadingSkeleton variant="rows" count={5} />
      )}

      {/* ---- Network view ---- */}
      {view === 'network' &&
        (filtered.length === 0 ? (
          <EmptyState
            title="No agents match your filters"
            description="Try a different search term or category — the registry itself is unchanged."
          />
        ) : (
          <WorkforceNetwork
            agents={filtered}
            installedNames={installedNames}
            selectedSlug={selected?.slug ?? selected?.name}
            highlightedDivision={highlightedDivision}
            onSelectAgent={setSelected}
            onSelectDivision={setHighlightedDivision}
          />
        ))}

      {/* ---- Directory view ---- */}
      {view === 'directory' && (
        <div className="card overflow-hidden">
          {filtered.length === 0 && unmatchedInstalled.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No agents match your filters"
                description="Try a different search term or category."
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
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-[13px] font-semibold text-primary-700 ring-1 ring-primary-100">
                      {agentInitials(agent.name)}
                      {rec && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
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
                      {agent.tools?.length ?? 0} capabilities
                    </span>
                    <span className="shrink-0">
                      {rec ? (
                        <StatusBadge status={rec.status ?? 'installed'} />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                          Preset
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
              {unmatchedInstalled.map((rec) => (
                <li
                  key={rec.id ?? rec.name}
                  className="flex items-center gap-4 bg-primary-50/30 px-5 py-3.5"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-600 text-[13px] font-semibold text-white">
                    {agentInitials(rec.name)}
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {rec.name}
                      <span className="ml-2 text-xs font-normal text-muted">
                        {rec.role} · {rec.department}
                      </span>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">
                      Installed agent record — not part of the standard preset
                      registry.
                    </p>
                  </div>
                  <StatusBadge status={rec.status ?? 'installed'} />
                  <button
                    className="btn-secondary shrink-0"
                    onClick={() => setSelected(rec)}
                  >
                    Inspect
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line bg-appbg/60 px-5 py-3 text-xs text-muted">
            {DIVISIONS.map((d) => d.label).join(' · ')} — “Preset” means the
            agent definition is available in the registry; it is not a
            deployed employee until it is installed into the organization.
          </p>
        </div>
      )}

      <AgentInspector
        agent={selected}
        installed={selectedInstalled}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
