import { LifeBuoy, MessageSquare, UserRound } from 'lucide-react'
import { PageHeader } from '../components/ui'
import AgentPresetStrip from '../components/AgentPresetStrip'

const FILTERS = ['All', 'Open', 'Pending', 'Escalated'] as const

/**
 * Customer Support workspace.
 *
 * There is NO tickets backend yet, so this page is an honest three-pane
 * layout with empty states — no tickets, conversations or customers are
 * invented. Panes fill in when ticket ingestion ships with the Support
 * module (email first; WhatsApp is a Planned integration).
 */
export default function Support() {
  return (
    <div>
      <PageHeader
        title="Customer Support"
        subtitle="Every customer conversation in one place — with AI assistance and human escalation."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* LEFT — ticket inbox */}
        <section className="card flex flex-col overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Ticket inbox</h2>
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Ticket filters">
              {FILTERS.map((f, i) => (
                <button
                  key={f}
                  disabled
                  title="Filters activate when tickets exist"
                  className={`min-h-11 cursor-not-allowed rounded-full px-3 py-2 text-xs font-medium ring-1 ring-inset ${
                    i === 0
                      ? 'bg-primary-50 text-primary-700 ring-primary-200 opacity-70'
                      : 'bg-surface text-muted ring-line opacity-60'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
            <LifeBuoy className="mb-3 h-8 w-8 text-line" />
            <p className="text-sm font-medium text-ink">No tickets</p>
            <p className="mt-1 text-sm text-muted">
              Ticket ingestion arrives with the Support module. Email support
              comes first; WhatsApp and voice are Planned integrations and are
              not connected yet.
            </p>
          </div>
        </section>

        {/* CENTER — conversation */}
        <section className="card flex flex-col items-center justify-center px-6 py-14 text-center">
          <MessageSquare className="mb-3 h-8 w-8 text-line" />
          <p className="text-sm font-medium text-ink">No conversation selected</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            When tickets arrive, selecting one opens the full conversation
            here — history, AI-drafted replies for approval, resolution and
            escalation controls.
          </p>
        </section>

        {/* RIGHT — customer context */}
        <section className="card flex flex-col">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Customer context</h2>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
            <UserRound className="mb-3 h-8 w-8 text-line" />
            <p className="text-sm font-medium text-ink">No customer in view</p>
            <p className="mt-1 text-sm text-muted">
              The selected customer’s profile, orders and past tickets will
              appear here for context while you respond.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <AgentPresetStrip
          department="Customer Support"
          title="AI support agents"
        />
      </div>
    </div>
  )
}
