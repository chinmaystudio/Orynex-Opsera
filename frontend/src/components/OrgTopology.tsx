import { Crown } from 'lucide-react'

/**
 * Organizational Topology — departments as connected organizational units,
 * grouped the way the business is organized (spec §7). The grouping is the
 * standard OrynexOpraq structure; no reporting hierarchy beyond
 * "Executive coordinates the whole organization" is implied or invented.
 */

export interface TopologyDepartment {
  name: string
  description?: string
  group: string
}

export const DEPARTMENT_GROUPS: Array<{ key: string; label: string }> = [
  { key: 'business', label: 'Business' },
  { key: 'operations', label: 'Operations' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'studios', label: 'Studios' },
]

/** Which topology group each known department belongs to. */
export const DEPARTMENT_GROUP_OF: Record<string, string> = {
  Sales: 'business',
  Marketing: 'business',
  Finance: 'business',
  'Human Resources': 'business',
  'Customer Support': 'business',
  Operations: 'operations',
  'Projects & Operations': 'operations',
  'Research & Intelligence': 'intelligence',
  'Creative Studio': 'studios',
  'Engineering Studio': 'studios',
}

export default function OrgTopology({
  departments,
  presetAgentCounts,
  selectedName,
  onSelect,
}: {
  departments: TopologyDepartment[]
  /** Preset-agent count per department name (real local registry data). */
  presetAgentCounts: Map<string, number>
  selectedName?: string
  onSelect: (name: string) => void
}) {
  const executive = departments.find((d) => d.name === 'Executive')
  const rest = departments.filter((d) => d.name !== 'Executive')

  return (
    <div className="card overflow-x-auto p-5 sm:p-6">
      <div className="min-w-[640px]">
        {/* ---- Executive ---- */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => executive && onSelect('Executive')}
            disabled={!executive}
            aria-pressed={selectedName === 'Executive'}
            className={`focus-ring flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedName === 'Executive'
                ? 'border-primary-400 bg-primary-600 text-white'
                : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
            } ${!executive ? 'cursor-default opacity-60' : ''}`}
          >
            <Crown className="h-4 w-4" />
            Executive
            {executive && (
              <span
                className={`text-xs font-normal ${
                  selectedName === 'Executive'
                    ? 'text-primary-100'
                    : 'text-muted'
                }`}
              >
                {presetAgentCounts.get('Executive') ?? 0} preset agents
              </span>
            )}
          </button>
          <div className="h-6 w-px bg-line" aria-hidden />
        </div>

        {/* ---- Group bands ---- */}
        <div className="grid gap-4 border-t border-line pt-5 md:grid-cols-2">
          {DEPARTMENT_GROUPS.map((group) => {
            const members = rest.filter((d) => d.group === group.key)
            if (members.length === 0) return null
            return (
              <section
                key={group.key}
                className="rounded-xl border border-line bg-appbg/60 p-4"
                aria-label={`${group.label} departments`}
              >
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  {group.label}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {members.map((dept) => {
                    const selected = selectedName === dept.name
                    return (
                      <button
                        key={dept.name}
                        onClick={() => onSelect(dept.name)}
                        aria-pressed={selected}
                        className={`focus-ring rounded-xl border bg-surface px-3.5 py-2.5 text-left transition ${
                          selected
                            ? 'border-primary-400 ring-2 ring-primary-100'
                            : 'border-line hover:border-primary-300 hover:bg-primary-50/40'
                        }`}
                      >
                        <span className="block text-[13px] font-medium leading-tight text-ink">
                          {dept.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-tight text-muted">
                          {presetAgentCounts.get(dept.name) ?? 0} preset agents
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
