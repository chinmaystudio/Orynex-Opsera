import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { INTEGRATIONS } from '../../lib/integrations'

/**
 * Integration categories for the landing page, grounded in the real
 * integration registry (src/lib/integrations.ts). Every provider is shown
 * with its honest status: nothing is connected until a user configures
 * their own credentials — so everything here is labelled Planned with the
 * phase it ships in.
 */
const CATEGORIES: Array<{ category: string; providers: string[] }> = [
  { category: 'Email', providers: ['Gmail', 'Microsoft Outlook'] },
  { category: 'Calendar', providers: ['Google Calendar', 'Microsoft Calendar'] },
  {
    category: 'Messaging',
    providers: [
      'Slack',
      'Microsoft Teams',
      'Telegram',
      'WhatsApp Business Cloud API',
      'Twilio (Voice + SMS)',
    ],
  },
  { category: 'CRM', providers: ['HubSpot', 'Salesforce', 'Zoho CRM'] },
  { category: 'Finance', providers: ['Stripe', 'Razorpay', 'Zoho Books'] },
  { category: 'Development', providers: ['GitHub', 'GitLab', 'Bitbucket'] },
  {
    category: 'Creative tools',
    providers: ['Canva', 'Adobe Creative Cloud & Firefly', 'Figma', 'Gamma'],
  },
  {
    category: 'AI providers',
    providers: ['OpenAI', 'Anthropic', 'Google Gemini', 'Perplexity'],
  },
]

const REGISTRY = new Map(INTEGRATIONS.map((i) => [i.name, i]))

export default function IntegrationsSection() {
  return (
    <section
      id="integrations"
      className="scroll-mt-16 border-t border-line bg-white"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Integrations
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
              Your tools, finally working together.
            </h2>
          </div>
          <p className="max-w-md leading-relaxed text-muted lg:col-span-5 lg:pt-10">
            Opsera is integration-first: official APIs and MCP servers, not
            screen-scraping. We would rather label a connection honestly
            than pretend it is live — every integration below ships
            per-connection, with your own credentials, and reports its real
            health in the product.
          </p>
        </div>

        <div className="mt-14 divide-y divide-line border-y border-line">
          {CATEGORIES.map((row) => (
            <div
              key={row.category}
              className="grid items-baseline gap-3 py-5 sm:grid-cols-12 sm:gap-6"
            >
              <p className="text-sm font-semibold text-ink sm:col-span-3">
                {row.category}
              </p>
              <div className="flex flex-wrap gap-x-7 gap-y-2.5 sm:col-span-9">
                {row.providers.map((name) => {
                  const entry = REGISTRY.get(name)
                  return (
                    <span
                      key={name}
                      className="inline-flex items-baseline gap-2 text-[15px] text-ink"
                    >
                      {name}
                      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        Planned{entry ? ` · ${entry.phase}` : ''}
                      </span>
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            Plus Google Drive, Docs and Sheets, Notion, HR platforms, coding
            agents (Codex, Claude Code, Copilot, Cursor), n8n, webhooks,
            custom REST APIs and external MCP servers — and ORYNEX CORE,
            which connects Opsera to Neuroclass, Launchpad and Aegis.
          </p>
          <Link
            to="/app/integrations"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-brand-600 transition hover:gap-3 hover:text-brand-700"
          >
            Browse the integration registry
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
