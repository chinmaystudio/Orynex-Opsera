import { useMemo, useState } from 'react'
import { Plug, SearchX } from 'lucide-react'
import { INTEGRATIONS } from '../lib/integrations'
import { EmptyState, FilterBar, PageHeader, StatusBadge } from '../components/ui'

export default function Integrations() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(INTEGRATIONS.map((i) => i.category)))],
    [],
  )

  const visible = INTEGRATIONS.filter((integration) => {
    const matchesCategory =
      category === 'All' || integration.category === category
    const matchesQuery = integration.name
      .toLowerCase()
      .includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  })

  /** Visible integrations grouped by category, in registry order. */
  const groups = useMemo(() => {
    const order: string[] = []
    const byCategory = new Map<string, typeof visible>()
    for (const integration of visible) {
      if (!byCategory.has(integration.category)) {
        byCategory.set(integration.category, [])
        order.push(integration.category)
      }
      byCategory.get(integration.category)?.push(integration)
    }
    return order.map((name) => ({
      name,
      items: byCategory.get(name) ?? [],
    }))
  }, [visible])

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connect the tools your business already uses."
      />

      <p className="-mt-3 mb-6 max-w-3xl text-sm leading-relaxed text-muted">
        Every integration starts as Not configured — a connection is only
        ever shown once real credentials are connected and tested. Nothing
        here is pre-connected.
      </p>

      <FilterBar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search integrations…"
      >
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={
              category === c
                ? 'btn-primary !px-3 !py-1.5 text-xs'
                : 'btn-secondary !px-3 !py-1.5 text-xs'
            }
          >
            {c}
          </button>
        ))}
      </FilterBar>

      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No integrations match your search"
          description="Try a different term or category — the registry itself is unchanged."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.name} aria-label={group.name}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">
                  {group.name}
                </h2>
                <span className="text-xs text-muted">
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'integration' : 'integrations'} ·
                  all Not configured
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((integration) => (
                  <div key={integration.name} className="card flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-appbg text-muted ring-1 ring-line">
                        <Plug className="h-5 w-5" />
                      </span>
                      <StatusBadge status="Not configured" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-ink">
                      {integration.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {integration.route}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-xs text-muted">
                        Adapter lands in {integration.phase}
                      </span>
                      <button
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                        disabled
                        title="Connection flow ships with the adapter phase for this provider"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs leading-relaxed text-muted">
        Custom MCP servers can be registered by administrators once the MCP
        client ships in Phase 4. OrynexOpraq's own MCP server (20 tools,
        OAuth-scoped, org-isolated, audited) also ships in Phase 4. Source:
        docs/INTEGRATION_INVENTORY.md.
      </p>
    </div>
  )
}
