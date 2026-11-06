import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const TEAM = [
  {
    initials: 'CS',
    name: 'Chief of Staff',
    role: 'Briefings, priorities, cross-team coordination',
    status: 'Active',
  },
  {
    initials: 'SM',
    name: 'Sales Manager',
    role: 'Pipeline health, follow-ups, proposal drafts',
    status: 'Active',
  },
  {
    initials: 'MM',
    name: 'Marketing Manager',
    role: 'Campaigns, content calendar, audience research',
    status: 'Active',
  },
  {
    initials: 'FA',
    name: 'Finance Analyst',
    role: 'Expense review, forecasts, anomaly flags',
    status: 'Active',
  },
  {
    initials: 'HR',
    name: 'HR Manager',
    role: 'Screening, scheduling, onboarding checklists',
    status: 'Idle',
  },
  {
    initials: 'CS',
    name: 'Customer Support Agent',
    role: 'First response, ticket triage, escalation',
    status: 'Active',
  },
  {
    initials: 'ET',
    name: 'Engineering Team',
    role: 'Development tasks, reviews, CI monitoring',
    status: 'Active',
  },
  {
    initials: 'CT',
    name: 'Creative Team',
    role: 'Design, copy and video production stages',
    status: 'Idle',
  },
]

export default function WorkforceSection() {
  return (
    <section id="workforce" className="scroll-mt-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            AI Workforce
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
            Build your team beyond human limits.
          </h2>
          <p className="mt-5 leading-relaxed text-muted">
            An AI employee in Opsera is not a chatbot window. It has a role, a
            department, a manager, its own tools and memory — and a hard set
            of things it is not allowed to do without you.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Assign several agents to one department, let them hand work to
            each other, and watch every execution from a single history.
            Forty specialists are ready to deploy; build your own in
            OrynexAegis and install them here.
          </p>
          <Link
            to="/app/ai-workforce"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:gap-3 hover:text-brand-700"
          >
            Meet the workforce
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Realistic workforce preview, as it appears in the product */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_50px_-32px_rgba(23,23,23,0.3)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-sm font-semibold text-ink">AI Workforce</p>
              <p className="text-xs text-muted">
                40 AI employees · 10 departments
              </p>
            </div>
            <ul className="divide-y divide-line">
              {TEAM.map((member) => (
                <li
                  key={member.name}
                  className="flex items-center gap-3.5 px-5 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lavender text-[11px] font-bold text-deep">
                    {member.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-muted">{member.role}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${
                        member.status === 'Active'
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    {member.status}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-paper px-5 py-3">
              <p className="text-xs text-muted">
                Statuses shown reflect the live registry in your workspace —
                open the workforce view to deploy, configure or pause an
                agent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
