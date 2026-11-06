import { Building2, Crown } from 'lucide-react'
import type { Agent, AgentCategory } from '../lib/types'

/**
 * Workforce Network — an organizational view of the AI workforce.
 *
 * Structure (spec §6): Executive Office at the top, then three division
 * bands (Core Workforce, Creative Studio, Engineering Studio). Agents are
 * compact identity nodes. A node only ever claims what is true: installed
 * agents (matched from the backend) get a status dot + "Installed" label;
 * registry presets stay visually neutral and are never shown as active.
 */

export const DIVISIONS: Array<{
  key: AgentCategory
  label: string
  hint: string
}> = [
  { key: 'core', label: 'Core Workforce', hint: 'Executive, sales, marketing, finance, HR, support, research & operations' },
  { key: 'creative', label: 'Creative Studio', hint: 'Design, brand, video, animation & content production' },
  { key: 'engineering', label: 'Engineering Studio', hint: 'Software, data, DevOps, QA & security engineering' },
]

export function agentInitials(name: string): string {
  const words = name.replace(/^AI\s+/i, '').split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? 'A'
  const second = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + second).toUpperCase()
}

function AgentNode({
  agent,
  installed,
  selected,
  dimmed,
  onSelect,
}: {
  agent: Agent
  installed: boolean
  selected: boolean
  dimmed: boolean
  onSelect: (agent: Agent) => void
}) {
  return (
    <button
      onClick={() => onSelect(agent)}
      aria-pressed={selected}
      title={`${agent.name} — ${agent.role}`}
      className={`focus-ring group flex w-44 items-center gap-2.5 rounded-xl border bg-surface px-3 py-2.5 text-left transition ${
        selected
          ? 'border-primary-400 ring-2 ring-primary-100'
          : 'border-line hover:border-primary-300 hover:bg-primary-50/40'
      } ${dimmed ? 'opacity-45' : ''}`}
    >
      <span
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-semibold ${
          selected
            ? 'bg-primary-600 text-white'
            : 'bg-primary-50 text-primary-700 ring-1 ring-primary-100'
        }`}
      >
        {agentInitials(agent.name)}
        {installed && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
            aria-label="Installed"
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium leading-tight text-ink">
          {agent.name}
        </span>
        <span className="block truncate text-[11px] leading-tight text-muted">
          {agent.role}
          {installed ? ' · Installed' : ''}
        </span>
      </span>
    </button>
  )
}

export default function WorkforceNetwork({
  agents,
  installedNames,
  selectedSlug,
  highlightedDivision,
  onSelectAgent,
  onSelectDivision,
}: {
  /** Preset agents to render (already category/search filtered by parent). */
  agents: Agent[]
  /** Lower-cased names of agents installed per the backend. */
  installedNames: Set<string>
  selectedSlug?: string
  highlightedDivision: AgentCategory | null
  onSelectAgent: (agent: Agent) => void
  onSelectDivision: (division: AgentCategory | null) => void
}) {
  const executive = agents.filter(
    (a) => a.category === 'core' && a.department === 'Executive',
  )
  const inDivision = (key: AgentCategory) =>
    agents.filter(
      (a) =>
        a.category === key &&
        !(key === 'core' && a.department === 'Executive'),
    )

  return (
    <div className="card overflow-x-auto p-5 sm:p-6">
      <div className="min-w-[640px]">
        {/* ---- Executive Office ---- */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700">
            <Crown className="h-3.5 w-3.5" />
            Executive Office
          </div>
          {executive.length > 0 && (
            <>
              <div className="h-5 w-px bg-line" aria-hidden />
              <div className="flex flex-wrap justify-center gap-2.5">
                {executive.map((agent) => (
                  <AgentNode
                    key={agent.slug ?? agent.name}
                    agent={agent}
                    installed={installedNames.has(agent.name.toLowerCase())}
                    selected={selectedSlug === (agent.slug ?? agent.name)}
                    dimmed={
                      highlightedDivision !== null &&
                      highlightedDivision !== 'core'
                    }
                    onSelect={onSelectAgent}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* connector from Executive Office to the divisions */}
        <div className="mx-auto mt-1 h-6 w-px bg-line" aria-hidden />

        {/* ---- Division bands ---- */}
        <div className="space-y-4 border-t border-line pt-5">
          {DIVISIONS.map((division) => {
            const members = inDivision(division.key)
            const isHighlighted = highlightedDivision === division.key
            return (
              <section
                key={division.key}
                className={`rounded-xl border p-4 transition ${
                  isHighlighted
                    ? 'border-primary-300 bg-primary-50/40'
                    : 'border-line bg-appbg/60'
                }`}
                aria-label={division.label}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      onSelectDivision(isHighlighted ? null : division.key)
                    }
                    aria-pressed={isHighlighted}
                    className="focus-ring flex items-center gap-2 rounded-lg text-left"
                    title={
                      isHighlighted
                        ? 'Clear division highlight'
                        : `Highlight ${division.label}`
                    }
                  >
                    <Building2 className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-semibold text-ink">
                      {division.label}
                    </span>
                    <span className="text-xs text-muted">
                      {members.length} agents
                    </span>
                  </button>
                  <span className="hidden text-xs text-muted md:block">
                    {division.hint}
                  </span>
                </div>
                {members.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-muted">
                    No agents match the current filter in this division.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {members.map((agent) => (
                      <AgentNode
                        key={agent.slug ?? agent.name}
                        agent={agent}
                        installed={installedNames.has(
                          agent.name.toLowerCase(),
                        )}
                        selected={
                          selectedSlug === (agent.slug ?? agent.name)
                        }
                        dimmed={
                          highlightedDivision !== null && !isHighlighted
                        }
                        onSelect={onSelectAgent}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {highlightedDivision && (
          <div className="mt-4 text-center">
            <button
              onClick={() => onSelectDivision(null)}
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Show the complete network
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
