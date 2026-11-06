import {
  BarChart3,
  Bot,
  Clapperboard,
  Code2,
  Gauge,
  HandCoins,
  Headset,
  KanbanSquare,
  Megaphone,
  Users,
  Workflow,
} from 'lucide-react'

/**
 * The twelve platform capabilities in three deliberately different
 * compositions: a featured split, a horizontal showcase strip, and a
 * compact editorial list. No repeated card grid.
 */
export default function CapabilitiesSection() {
  return (
    <section id="product" className="scroll-mt-16 border-t border-line bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            The platform
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
            Every department. One operating system.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Opsera is not another dashboard bolted onto your tools. It is the
            workspace where your departments, your people and your AI
            employees share the same data and the same tasks.
          </p>
        </div>

        {/* Featured split: AI Workforce + Command Center */}
        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender text-deep">
              <Bot className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
              AI Workforce Management
            </h3>
            <p className="mt-3 max-w-lg leading-relaxed text-muted">
              Deploy AI employees the way you hire people: a role, a
              department, a manager, a defined set of tools and permissions.
              Forty specialists ship with the platform — from a Chief of
              Staff to a full engineering team — and every one of them works
              under execution limits and approval rules you set.
            </p>
            <ul className="mt-6 grid max-w-lg gap-x-8 gap-y-2.5 text-sm text-ink sm:grid-cols-2">
              {[
                'Named roles with real responsibilities',
                'Per-agent tools, memory and knowledge',
                'Execution history for every run',
                'Pause, revoke or reassign in one click',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand-600"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-lavender lg:col-span-5 lg:border-l lg:pl-12">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender text-deep">
              <Gauge className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
              Business Command Center
            </h3>
            <p className="mt-3 leading-relaxed text-muted">
              Revenue, pipeline, projects, pending approvals and AI activity
              in one executive view — plus an assistant that answers “what
              needs my attention today?” from your actual company data, with
              sources.
            </p>
          </div>
        </div>

        {/* Horizontal showcase strip */}
        <div className="mt-20 border-y border-line py-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: 'Sales & CRM',
                body: 'Leads, pipeline, proposals and follow-ups that never go stale.',
              },
              {
                icon: HandCoins,
                title: 'Finance',
                body: 'Invoices, expenses, budgets and cash flow — payments stay approval-gated.',
              },
              {
                icon: Megaphone,
                title: 'Marketing',
                body: 'Campaigns, content and audience work coordinated with Sales.',
              },
              {
                icon: Users,
                title: 'Human Resources',
                body: 'Hiring, onboarding, leave and performance in one people system.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3.5">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <p className="text-[15px] font-semibold text-ink">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Split: studios + compact list */}
        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-ink">
              Two studios, built in — not bolted on
            </h3>
            <div className="mt-8 space-y-8">
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-deep text-white">
                  <Clapperboard className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Creative Studio</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Design, brand and video production with stage-tracked
                    pipelines — a script is a stage, never passed off as a
                    finished film.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-deep text-white">
                  <Code2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Engineering Studio</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    An AI engineering team working on your real repositories,
                    in isolated branches, with review and deployment gates.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <dl className="divide-y divide-line border-t border-line lg:border-t-0">
            {[
              {
                icon: Headset,
                title: 'Customer Support',
                body: 'Tickets and AI support across email, chat and voice, with human escalation.',
              },
              {
                icon: KanbanSquare,
                title: 'Projects & Operations',
                body: 'One task system for humans and agents — dependencies, deadlines, deliverables.',
              },
              {
                icon: Workflow,
                title: 'Workflow Automation',
                body: 'Describe an outcome; Opsera drafts the workflow. You inspect and approve it.',
              },
              {
                icon: BarChart3,
                title: 'Business Intelligence',
                body: 'Forecasting, department comparisons and a health score you can drill into.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 py-5 first:pt-0 lg:first:pt-0">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <dt className="text-[15px] font-semibold text-ink">
                    {item.title}
                  </dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-muted">
                    {item.body}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
