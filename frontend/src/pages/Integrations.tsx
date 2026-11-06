import { useMemo, useState } from 'react'
import { Plug } from 'lucide-react'
import { INTEGRATIONS } from '../lib/integrations'
import { PageHeader, StatusBadge } from '../components/ui'

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

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Marketplace of application, API and MCP integrations. Every integration starts as Not configured — a connection is only shown once real credentials are connected and tested. Nothing here is pre-connected."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search integrations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search integrations"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                category === c
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card px-6 py-14 text-center text-sm text-slate-500">
          No integrations match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((integration) => (
            <div key={integration.name} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                  <Plug className="h-5 w-5" />
                </span>
                <StatusBadge status="Not configured" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {integration.name}
              </h3>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {integration.category}
              </p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {integration.route}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">
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
      )}

      <p className="mt-6 text-xs leading-relaxed text-slate-400">
        Custom MCP servers can be registered by administrators once the MCP
        client ships in Phase 4. OrynexOpsera's own MCP server (20 tools,
        OAuth-scoped, org-isolated, audited) also ships in Phase 4. Source:
        docs/INTEGRATION_INVENTORY.md.
      </p>
    </div>
  )
}
