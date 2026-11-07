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
  LoadingSkeleton,
  PageHeader,
  RiskBadge,
  StatusBadge,
} from '../components/ui'
const DIVISION_LABELS = [
  'Core Workforce',
  'Creative Studio',
  'Engineering Studio',
] as const

function agentInitials(name: string): string {
  const words = name.replace(/^AI\s+/i, '').split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? 'A'
  const second = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + second).toUpperCase()
}

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
              <span className="inline-flex items-center rounded-full bg-appbg px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-inset ring-line">
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
  const [category, setCategory] = useState<AgentCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Agent | null>(null)

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

  const headerSubtitle = installedKnown
    ? `${AGENT_PRESETS.length} presets in the registry · ${installedCount} installed · ${activeCount} active · ${awaitingDeployment} awaiting deployment`
    : `${AGENT_PRESETS.length} presets in the registry — installed status unavailable`

  return (
    <div>
      <PageHeader
        title="AI Workforce"
        subtitle={headerSubtitle}
      />

      {offline && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-ink">
            <span className="font-medium">Backend offline</span> — showing the
            local preset registry; installed status unavailable. Presets are
            agent definitions, not deployed employees.
          </p>
        </div>
      )}
      {!offline && installedFetch.error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <p className="text-sm text-ink">
            <span className="font-medium">Could not load installed agents.</span>{' '}
            {installedFetch.error} The preset registry below is unaffected.
          </p>
        </div>
      )}

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
              category === key ? 'btn-primary min-h-11' : 'btn-secondary min-h-11'
            }
            aria-pressed={category === key}
          >
            {key === 'all' ? 'All agents' : CATEGORY_LABELS[key]} (
            {counts[key] ?? 0})
          </button>
        ))}
      </FilterBar>

      {installedFetch.loading ? (
        <LoadingSkeleton variant="cards" count={6} />
      ) : filtered.length === 0 && unmatchedInstalled.length === 0 ? (
        <EmptyState
          title="No agents match your filters"
          description="Try a different search term or category — the registry itself is unchanged."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((agent) => {
              const rec = installedByName.get(normalize(agent.name))
              return (
                <button
                  key={agent.slug ?? agent.name}
                  onClick={() => setSelected(agent)}
                  className="card focus-ring flex min-h-11 flex-col p-5 text-left transition hover:bg-appbg sm:p-6"
                >
                  <span className="flex w-full items-start justify-between gap-3">
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-sm font-semibold text-primary-700 ring-1 ring-primary-100">
                      {agentInitials(agent.name)}
                      {rec && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
                      )}
                    </span>
                    {rec ? (
                      <StatusBadge status={rec.status ?? 'installed'} />
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-appbg px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-inset ring-line">
                        Preset
                      </span>
                    )}
                  </span>
                  <span className="mt-4 block w-full">
                    <span className="block truncate text-sm font-medium text-ink">
                      {agent.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {agent.role} · {agent.department}
                    </span>
                    <span className="mt-2 block line-clamp-2 text-[13px] leading-relaxed text-muted">
                      {agent.description}
                    </span>
                  </span>
                  <span className="mt-4 flex w-full flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-100">
                      {CATEGORY_LABELS[agent.category]}
                    </span>
                    <span className="text-xs text-muted">
                      {agent.tools?.length ?? 0} capabilities
                    </span>
                  </span>
                </button>
              )
            })}
            {unmatchedInstalled.map((rec) => (
              <button
                key={rec.id ?? rec.name}
                onClick={() => setSelected(rec)}
                className="card focus-ring flex min-h-11 flex-col p-5 text-left transition hover:bg-appbg sm:p-6"
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primary-600 text-sm font-semibold text-white">
                    {agentInitials(rec.name)}
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
                  </span>
                  <StatusBadge status={rec.status ?? 'installed'} />
                </span>
                <span className="mt-4 block w-full">
                  <span className="block truncate text-sm font-medium text-ink">
                    {rec.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {rec.role} · {rec.department}
                  </span>
                  <span className="mt-2 block line-clamp-2 text-[13px] leading-relaxed text-muted">
                    Installed agent record — not part of the standard preset
                    registry.
                  </span>
                </span>
                <span className="mt-4 flex w-full flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-100">
                    {CATEGORY_LABELS[rec.category]}
                  </span>
                  <span className="text-xs text-muted">
                    {rec.tools?.length ?? 0} capabilities
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-line bg-surface px-5 py-3 text-xs text-muted">
            {DIVISION_LABELS.join(' · ')} — “Preset” means the agent
            definition is available in the registry; it is not a deployed
            employee until it is installed into the organization.
          </p>
        </>
      )}

      <AgentInspector
        agent={selected}
        installed={selectedInstalled}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
