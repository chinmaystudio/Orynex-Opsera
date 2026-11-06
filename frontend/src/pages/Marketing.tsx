import { useMemo } from 'react'
import { CalendarDays, Megaphone } from 'lucide-react'
import { PageHeader, EmptyState } from '../components/ui'
import AgentPresetStrip from '../components/AgentPresetStrip'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Real calendar grid for the current month — dates only, no entries. */
function currentMonthGrid() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1)
  // Monday-first offset
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: ({ day: number; today: boolean } | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, today: d === now.getDate() })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const label = first.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
  return { cells, label }
}

export default function Marketing() {
  const { cells, label } = useMemo(currentMonthGrid, [])

  return (
    <div>
      <PageHeader
        title="Marketing"
        subtitle="Campaigns, content and growth — planned and measured in one workspace."
      />

      <div className="space-y-6">
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Campaign data arrives with the Marketing module (Phase 3 backend). When it ships, campaigns created here — or drafted by the AI Marketing Manager for your approval — will appear on this timeline with status, channels and results. Nothing is shown until real campaigns exist."
        />

        <section className="card p-5">
          <div className="mb-1 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary-600" />
            <h2 className="text-base font-semibold text-ink">
              Content calendar — {label}
            </h2>
          </div>
          <p className="mb-4 text-sm text-muted">
            Scheduled posts and campaign milestones will land on this calendar
            once campaign data exists. It is intentionally empty today.
          </p>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-appbg px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wide text-muted"
              >
                {d}
              </div>
            ))}
            {cells.map((cell, i) => (
              <div key={i} className="min-h-16 bg-surface px-2 py-1.5 sm:min-h-20">
                {cell && (
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      cell.today
                        ? 'bg-primary-600 font-semibold text-white'
                        : 'text-muted'
                    }`}
                  >
                    {cell.day}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <AgentPresetStrip department="Marketing" title="AI marketing team" />
      </div>
    </div>
  )
}
