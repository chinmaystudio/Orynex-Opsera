import { Link } from 'react-router-dom'
import { ArrowRight, Bot } from 'lucide-react'
import { AGENT_PRESETS } from '../lib/presets'

/**
 * Shows the preset AI employees for one department.
 *
 * Presets are templates from the local registry — they are NOT deployed
 * employees. The strip labels them as such and links to AI Workforce,
 * where installation into the organization actually happens.
 */
export default function AgentPresetStrip({
  department,
  title,
}: {
  department: string
  title: string
}) {
  const agents = AGENT_PRESETS.filter((a) => a.department === department)
  if (agents.length === 0) return null
  return (
    <section className="card p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <Link
          to="/app/ai-workforce"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Open AI Workforce <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <p className="mb-4 text-sm text-muted">
        Preset agents available for this department. Presets are templates —
        they become working employees only when installed from AI Workforce.
      </p>
      <ul className="divide-y divide-line">
        {agents.map((agent) => (
          <li key={agent.slug ?? agent.name} className="flex items-start gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary-600">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                {agent.name}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  Preset
                </span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                {agent.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
