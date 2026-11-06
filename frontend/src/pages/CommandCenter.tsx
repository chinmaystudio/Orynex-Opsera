import {
  Bot,
  Briefcase,
  CheckSquare,
  CircleDollarSign,
  HandCoins,
  Headset,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { Overview } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  formatMoney,
  formatNumber,
} from '../components/ui'

interface MetricDef {
  key: keyof Overview
  label: string
  icon: typeof Users
  format: 'money' | 'number'
  hint: string
}

const METRICS: MetricDef[] = [
  { key: 'total_revenue', label: 'Total Revenue', icon: CircleDollarSign, format: 'money', hint: 'From recorded transactions' },
  { key: 'total_expenses', label: 'Expenses', icon: HandCoins, format: 'money', hint: 'From recorded expenses' },
  { key: 'profit', label: 'Profit / Loss', icon: PiggyBank, format: 'money', hint: 'Revenue minus expenses' },
  { key: 'active_projects', label: 'Active Projects', icon: Briefcase, format: 'number', hint: 'Projects not yet completed' },
  { key: 'employees', label: 'Employees', icon: Users, format: 'number', hint: 'Human employees on record' },
  { key: 'ai_agents', label: 'AI Employees', icon: Bot, format: 'number', hint: 'Agents in the registry' },
  { key: 'customers', label: 'Customers', icon: TrendingUp, format: 'number', hint: 'Customer records' },
  { key: 'open_tasks', label: 'Open Tasks', icon: CheckSquare, format: 'number', hint: 'Tasks not completed' },
  { key: 'pending_approvals', label: 'Pending Approvals', icon: ShieldCheck, format: 'number', hint: 'Awaiting your decision' },
  { key: 'active_automations', label: 'Active Automations', icon: Workflow, format: 'number', hint: 'Workflows currently enabled' },
  { key: 'open_tickets', label: 'Open Support Tickets', icon: Headset, format: 'number', hint: 'Unresolved customer tickets' },
]

export default function CommandCenter() {
  const { data, loading, offline, error, reload } = useFetch<Overview>(() =>
    api.getOverview(),
  )

  return (
    <div>
      <PageHeader
        title="Command Center"
        description="Executive overview of your business, computed live from the OrynexOpraq backend. Figures reflect only data actually recorded in the system."
      />

      {loading && <LoadingState label="Loading business overview…" />}

      {!loading && offline && (
        <ErrorState
          title="Backend offline"
          description="The overview endpoint could not be reached, so no metrics are shown. Start the OrynexOpraq backend (default http://localhost:8000) and retry. No values are fabricated while offline."
          onRetry={reload}
        />
      )}

      {!loading && !offline && error && (
        <ErrorState
          title="Could not load the business overview"
          description={error}
          onRetry={reload}
        />
      )}

      {!loading && !offline && !error && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {METRICS.map((metric) => {
              const Icon = metric.icon
              const raw = data[metric.key]
              const value = typeof raw === 'number' ? raw : undefined
              return (
                <div key={String(metric.key)} className="card p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      {metric.label}
                    </p>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {metric.format === 'money'
                      ? formatMoney(value)
                      : formatNumber(value)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {value === undefined
                      ? 'Not reported by the backend yet'
                      : metric.hint}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="card mt-6 p-5">
            <h2 className="text-base font-semibold text-slate-900">
              AI Executive Assistant
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ask questions such as “What is happening in my business?”,
              “Which projects are delayed?” or “What should I prioritize
              today?” using the AI command bar at the top of the screen. The
              assistant plans from authorized company data and shows its plan —
              with approval gates for sensitive steps — before anything runs.
            </p>
            {Object.keys(data).length === 0 && (
              <div className="mt-4">
                <EmptyState
                  title="No business data yet"
                  description="The backend returned an empty overview. Add departments, customers, tasks and transactions as you set up your organization and this dashboard will reflect them."
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
