import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { Department, Employee } from '../lib/types'
import {
  DetailInspector,
  EmptyState,
  ErrorState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from '../components/ui'

interface HrData {
  employees: Employee[]
  departments: Department[]
}

const TABS = [
  'Directory',
  'Recruitment',
  'Onboarding',
  'Attendance',
  'Leave',
  'Performance',
] as const

const TAB_EMPTY: Record<string, { title: string; description: string }> = {
  Recruitment: {
    title: 'No recruitment pipeline yet',
    description:
      'Job postings and applicant tracking arrive with the HR module backend. When it ships, the AI HR Manager preset can draft postings and screen applicants — always with HR approval before any candidate is contacted.',
  },
  Onboarding: {
    title: 'No onboarding in progress',
    description:
      'Onboarding checklists and document tracking arrive with the HR module backend. New hires added to the directory will get an onboarding track here.',
  },
  Attendance: {
    title: 'No attendance records',
    description:
      'Attendance tracking is not connected yet. It will appear here once an attendance source (HRMS integration or in-app check-in) is configured.',
  },
  Leave: {
    title: 'No leave requests',
    description:
      'Leave requests and balances arrive with the HR module backend. Approvals for leave will follow the same approval inbox used across Opraq.',
  },
  Performance: {
    title: 'No performance reviews yet',
    description:
      'Performance review cycles arrive with the HR module backend. Reviews will be based on recorded work — tasks, projects and manager input — not invented ratings.',
  },
}

export default function Hr() {
  const { data, loading, offline, error, reload } = useFetch<HrData>(
    async () => {
      const [employees, departments] = await Promise.all([
        api.getEmployees(),
        api.getDepartments(),
      ])
      return { employees, departments }
    },
  )
  const [tab, setTab] = useState<(typeof TABS)[number]>('Directory')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Employee | null>(null)

  const deptName = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of data?.departments ?? []) {
      if (d.id) map.set(d.id, d.name)
    }
    return (id?: string) => (id ? (map.get(id) ?? id) : '—')
  }, [data])

  const employees = useMemo(() => {
    const all = data?.employees ?? []
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((e) =>
      [e.full_name, e.email, e.job_title, e.role, deptName(e.department_id)]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q)),
    )
  }, [data, search, deptName])

  return (
    <div>
      <PageHeader
        title="Human Resources"
        subtitle="People operations from recruitment to performance."
      />

      <div
        className="mb-5 flex flex-wrap gap-1 rounded-[10px] border border-line bg-surface p-1"
        role="tablist"
        aria-label="HR sections"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? 'bg-primary-50 text-primary-700'
                : 'text-muted hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== 'Directory' && (
        <EmptyState
          icon={Users}
          title={TAB_EMPTY[tab].title}
          description={TAB_EMPTY[tab].description}
        />
      )}

      {tab === 'Directory' && (
        <>
          {loading && <LoadingSkeleton variant="table" count={5} />}

          {!loading && offline && (
            <ErrorState
              title="Backend offline"
              description="The employee directory is stored by the backend and cannot be listed while it is unreachable."
              onRetry={reload}
            />
          )}

          {!loading && !offline && error && (
            <ErrorState title="Could not load employees" description={error} onRetry={reload} />
          )}

          {!loading && !offline && !error && data && (
            <>
              <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search employees by name, title, role or department…"
              />
              {employees.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={
                    data.employees.length === 0
                      ? 'No employees yet'
                      : 'No employees match your search'
                  }
                  description={
                    data.employees.length === 0
                      ? 'Add people through the backend API — or once an HRMS integration (Zoho People) is connected — and they will appear in this directory with their department, role and status.'
                      : 'Try a different search term — the directory itself is unchanged.'
                  }
                />
              ) : (
                <div className="card overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-line bg-appbg text-xs uppercase tracking-wide text-muted">
                        <th className="px-4 py-3 font-medium">Employee</th>
                        <th className="px-4 py-3 font-medium">Title</th>
                        <th className="px-4 py-3 font-medium">Department</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, i) => (
                        <tr
                          key={emp.id ?? `${emp.full_name}-${i}`}
                          onClick={() => setSelected(emp)}
                          className="cursor-pointer border-b border-line last:border-0 hover:bg-appbg"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-ink">{emp.full_name}</p>
                            {emp.email && (
                              <p className="text-xs text-muted">{emp.email}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted">{emp.job_title ?? '—'}</td>
                          <td className="px-4 py-3 text-muted">
                            {deptName(emp.department_id)}
                          </td>
                          <td className="px-4 py-3 capitalize text-muted">
                            {emp.role ?? 'member'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={String(emp.status ?? 'active')} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      <DetailInspector
        open={selected !== null}
        title={selected?.full_name ?? ''}
        subtitle={selected?.job_title ?? 'Employee'}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
                <dd className="mt-0.5 text-sm text-ink">{selected.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Department</dt>
                <dd className="mt-0.5 text-sm text-ink">{deptName(selected.department_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Role</dt>
                <dd className="mt-0.5 text-sm capitalize text-ink">{selected.role ?? 'member'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Status</dt>
                <dd className="mt-0.5 text-sm text-ink">{selected.status ?? 'active'}</dd>
              </div>
            </dl>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-ink">Activity</h3>
              <p className="text-sm text-muted">
                Attendance, leave and performance history will appear on this
                profile as those HR modules come online. Nothing is recorded
                for this employee yet.
              </p>
            </div>
          </div>
        )}
      </DetailInspector>
    </div>
  )
}
