import {
  Database,
  Mail,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'

const NODES = [
  { icon: UserPlus, label: 'New customer', sub: 'Trigger' },
  { icon: Search, label: 'Research Agent', sub: 'Company research' },
  { icon: Users, label: 'Sales Agent', sub: 'Drafts outreach' },
  { icon: ShieldCheck, label: 'Approval', sub: 'You review first' },
  { icon: Mail, label: 'Email', sub: 'Sent after approval' },
  { icon: Database, label: 'CRM update', sub: 'Logged & scheduled' },
]

export default function AutomationSection() {
  return (
    <section id="automation" className="scroll-mt-16 bg-deep text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lavender">
            Automation
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            Describe the work. Let Opsera coordinate it.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            “When a new customer registers, research their company, assign a
            sales rep, send a welcome email and create a follow-up.” Say it
            once — Opsera turns it into an editable workflow you inspect,
            test and approve before it ever runs.
          </p>
        </div>

        {/* Workflow composition */}
        <div className="mt-16">
          <ol className="flex flex-col lg:flex-row lg:items-start">
            {NODES.map((node, i) => (
              <li
                key={node.label}
                className={`flex flex-col lg:flex-row ${
                  i < NODES.length - 1 ? 'lg:flex-1' : 'lg:shrink-0'
                }`}
              >
                <div className="flex shrink-0 items-center gap-4 lg:w-40 lg:flex-col lg:gap-0 lg:text-center">
                  <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/25">
                    <node.icon className="h-5 w-5 text-white" />
                  </span>
                  <div className="lg:mt-4">
                    <p className="text-sm font-semibold">{node.label}</p>
                    <p className="text-xs text-white/60">{node.sub}</p>
                  </div>
                </div>
                {i < NODES.length - 1 && (
                  <>
                    {/* Desktop connector, aligned to icon centre height */}
                    <span
                      aria-hidden="true"
                      className="relative mt-6 hidden h-px min-w-6 flex-1 bg-white/25 lg:block"
                    >
                      <span className="animate-flow-dot absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-lavender" />
                    </span>
                    {/* Mobile connector */}
                    <span
                      aria-hidden="true"
                      className="ml-[23px] block h-8 w-px bg-white/25 lg:hidden"
                    />
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 grid gap-10 border-t border-white/15 pt-10 text-sm leading-relaxed text-white/70 md:grid-cols-3">
          <p>
            <span className="mb-1 block font-semibold text-white">
              Multi-agent by design
            </span>
            Agents delegate to other agents — research hands to sales, sales
            hands to support — with shared task context at every step.
          </p>
          <p>
            <span className="mb-1 block font-semibold text-white">
              Approvals inside the flow
            </span>
            Approval is a node, not an afterthought. High-risk steps pause
            the workflow until a person decides.
          </p>
          <p>
            <span className="mb-1 block font-semibold text-white">
              Observable, always
            </span>
            Every run writes execution logs with retries and error handling,
            so a failed step is visible — never silent.
          </p>
        </div>
      </div>
    </section>
  )
}
