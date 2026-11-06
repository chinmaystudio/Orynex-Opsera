import {
  FileClock,
  KeyRound,
  ScrollText,
  ShieldCheck,
  UserCheck,
  Building2,
} from 'lucide-react'

const POINTS = [
  {
    icon: KeyRound,
    title: 'Permission-controlled agents',
    body: 'Every AI employee has explicit scopes: which tools it may use, which data it may read, and a risk ceiling it can never exceed.',
  },
  {
    icon: UserCheck,
    title: 'Human approvals',
    body: 'Sending external messages, publishing campaigns and moving money are HIGH or CRITICAL actions. They wait for a person — always.',
  },
  {
    icon: ScrollText,
    title: 'Execution history',
    body: 'Every agent run is recorded step by step: the plan, the tools used, the outputs produced and the approvals received.',
  },
  {
    icon: FileClock,
    title: 'Audit logs',
    body: 'Mutations across the workspace write to an audit trail, so “who changed this, and when” always has an answer.',
  },
  {
    icon: Building2,
    title: 'Organization-level access',
    body: 'Data is isolated per organization with row-level security. One company’s workspace is never visible to another.',
  },
  {
    icon: ShieldCheck,
    title: 'Integration security',
    body: 'OAuth tokens and API keys are encrypted and never exposed to the frontend. Connections can be tested, revoked and reconnected at any time.',
  },
]

export default function SecuritySection() {
  return (
    <section id="security" className="scroll-mt-16">
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Security & governance
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
              Autonomy with accountability.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted">
              An AI workforce is only useful if you can trust it with real
              work. Opsera’s answer is not to slow the agents down — it is to
              make every action permissioned, every sensitive step approved,
              and every outcome traceable.
            </p>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Risk is classified, not vibes: LOW reads, MEDIUM internal
              creation, HIGH external communication, CRITICAL payments and
              deletion. Policy decides what runs freely and what waits for
              you.
            </p>
          </div>
        </div>
        <div className="lg:col-span-7">
          <ol className="divide-y divide-line border-y border-line">
            {POINTS.map((point, i) => (
              <li key={point.title} className="flex gap-5 py-6">
                <span className="text-sm font-semibold tabular-nums text-brand-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <point.icon className="mt-0.5 h-5 w-5 shrink-0 text-deep" />
                <div>
                  <p className="font-semibold text-ink">{point.title}</p>
                  <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
