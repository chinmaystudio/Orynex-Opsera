import { Building2 } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { Department } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../components/ui'

/** The department workspaces defined by the spec (§3C, §18, §19). */
const KNOWN_DEPARTMENTS = [
  { name: 'Sales', description: 'Leads, CRM, pipeline, deals, follow-ups, outreach and forecasting.' },
  { name: 'Marketing', description: 'Campaigns, content, social scheduling, SEO research and analytics.' },
  { name: 'Finance', description: 'Income, expenses, invoices, budgets, cash flow and reports. Payments always require approval.' },
  { name: 'Human Resources', description: 'Employees, recruitment, onboarding, attendance, leave and performance reviews.' },
  { name: 'Operations', description: 'Processes, tasks, resources, vendors, inventory and operational analytics.' },
  { name: 'Customer Support', description: 'Tickets, AI support agents, escalations and satisfaction analytics.' },
  { name: 'Research & Intelligence', description: 'Market research, competitor intelligence and opportunity discovery.' },
  { name: 'Creative Studio', description: 'Design, brand, video, animation and media production with AI creative agents.' },
  { name: 'Engineering Studio', description: 'AI coding team, repositories, code review, CI/CD and deployments.' },
]

export default function Departments() {
  const { data, loading, offline, error, reload } = useFetch<Department[]>(
    () => api.getDepartments(),
  )

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Dedicated workspaces per department. Department records come from the backend; the workspace descriptions below are the Phase 3 scope."
      />

      {loading && <LoadingState label="Loading departments…" />}

      {!loading && offline && (
        <>
          <ErrorState
            title="Backend offline"
            description="Department records could not be loaded. The department workspaces defined for OrynexOpsera are listed below for reference — counts and membership appear once the backend is running."
            onRetry={reload}
          />
          <DepartmentGrid departments={KNOWN_DEPARTMENTS} referenceOnly />
        </>
      )}

      {!loading && !offline && error && (
        <ErrorState
          title="Could not load departments"
          description={error}
          onRetry={reload}
        />
      )}

      {!loading && !offline && !error && data && data.length === 0 && (
        <>
          <EmptyState
            title="No departments created yet"
            description="Your organization has no department records yet. The standard OrynexOpsera departments are:"
          />
          <DepartmentGrid departments={KNOWN_DEPARTMENTS} referenceOnly />
        </>
      )}

      {!loading && !offline && !error && data && data.length > 0 && (
        <DepartmentGrid departments={data} />
      )}
    </div>
  )
}

function DepartmentGrid({
  departments,
  referenceOnly = false,
}: {
  departments: Array<
    Pick<Department, 'name' | 'description' | 'employee_count' | 'agent_count'>
  >
  referenceOnly?: boolean
}) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {departments.map((dept) => (
        <div key={dept.name} className="card p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            {dept.name}
          </h3>
          {dept.description && (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {dept.description}
            </p>
          )}
          <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
            {referenceOnly ? (
              <span>Workspace lands in Phase 3</span>
            ) : (
              <>
                <span>
                  Employees:{' '}
                  {typeof dept.employee_count === 'number'
                    ? dept.employee_count
                    : '—'}
                </span>
                <span>
                  AI agents:{' '}
                  {typeof dept.agent_count === 'number'
                    ? dept.agent_count
                    : '—'}
                </span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
