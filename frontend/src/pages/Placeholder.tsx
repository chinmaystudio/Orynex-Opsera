import { Construction } from 'lucide-react'
import { PageHeader } from '../components/ui'

/**
 * Honest placeholder for modules scheduled in later phases.
 * States plainly what the module will contain and when it lands —
 * no fake data, no mock functionality.
 */
export default function PlaceholderPage({
  title,
  phase,
  description,
  features,
}: {
  title: string
  phase: string
  description: string
  features: string[]
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 ring-1 ring-amber-100">
            <Construction className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Scheduled for {phase}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              This module is part of the OrynexOpsera roadmap but is not built
              yet. Phase 1 delivers the foundation: app shell, Command Center,
              AI Workforce registry, departments, tasks, approvals and the
              integration inventory. Rather than showing mock data, this page
              lists what will land here.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
