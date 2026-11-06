import { useMemo, useState } from 'react'
import { Bot, WifiOff } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { AGENT_PRESETS } from '../lib/presets'
import type { Agent, AgentCategory } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '../components/ui'

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  core: 'Core Workforce',
  creative: 'Creative Studio',
  engineering: 'Engineering Studio',
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-violet-50 text-brand-600 ring-1 ring-brand-100">
          <Bot className="h-5 w-5" />
        </span>
        <StatusBadge status={agent.status ?? 'registry preset'} />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">
        {agent.name}
      </h3>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {agent.role} · {agent.department}
      </p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        {agent.description}
      </p>
      {agent.tools && agent.tools.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.tools.map((tool) => (
            <span
              key={tool}
              className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 ring-1 ring-slate-200"
            >
              {tool}
            </span>
          ))}
        </div>
      )}
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Deployment, permissions and execution history arrive with the agent
        runtime in Phase 2.
      </p>
    </div>
  )
}

export default function AIWorkforce() {
  const { data, loading, offline, error, reload } = useFetch<Agent[]>(() =>
    api.getAgents(),
  )
  const [category, setCategory] = useState<AgentCategory | 'all'>('all')

  // Backend data wins. Local presets are a clearly-labelled offline fallback.
  const usingFallback = !loading && (offline || !!error)
  const agents: Agent[] = usingFallback ? AGENT_PRESETS : (data ?? [])

  const visible = useMemo(
    () =>
      category === 'all'
        ? agents
        : agents.filter((a) => a.category === category),
    [agents, category],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: agents.length }
    for (const a of agents) c[a.category] = (c[a.category] ?? 0) + 1
    return c
  }, [agents])

  return (
    <div>
      <PageHeader
        title="AI Workforce"
        description="Your AI employees: predefined agents from the OrynexAegis registry, organized by department. Assign, configure and monitor them as the runtime phases land."
      />

      {usingFallback && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-slate-700">
            <span className="font-medium">Backend offline.</span> Showing the{' '}
            {AGENT_PRESETS.length} built-in agent presets stored locally in
            this app (12 core, 13 creative, 15 engineering). Live registry data
            from <span className="font-mono text-xs">GET /api/v1/agents</span>{' '}
            will replace this list automatically when the backend is running.
          </p>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', 'core', 'creative', 'engineering'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              category === key
                ? 'bg-brand-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {key === 'all' ? 'All agents' : CATEGORY_LABELS[key]} (
            {counts[key] ?? 0})
          </button>
        ))}
      </div>

      {loading && <LoadingState label="Loading agent registry…" />}

      {!loading && !usingFallback && error && (
        <ErrorState
          title="Could not load agents"
          description={error}
          onRetry={reload}
        />
      )}

      {!loading && visible.length === 0 && !error && (
        <EmptyState
          title="No agents found"
          description="The registry returned no agents for this category yet."
        />
      )}

      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((agent) => (
            <AgentCard
              key={agent.id ?? agent.slug ?? agent.name}
              agent={agent}
            />
          ))}
        </div>
      )}
    </div>
  )
}
