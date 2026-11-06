import { useMemo, useState } from 'react'
import { Columns3, GanttChart, Table2 } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { BusinessTask } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from '../components/ui'

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-slate-500',
  medium: 'text-sky-600',
  high: 'text-amber-600',
  urgent: 'text-red-600',
}

const COLUMNS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'todo', label: 'To do', statuses: ['pending', 'assigned'] },
  { key: 'doing', label: 'In progress', statuses: ['in_progress'] },
  { key: 'waiting', label: 'Waiting approval', statuses: ['waiting_approval'] },
  { key: 'blocked', label: 'Blocked', statuses: ['blocked', 'failed'] },
  { key: 'done', label: 'Done', statuses: ['completed'] },
]

type View = 'kanban' | 'table' | 'timeline'

function assigneeLabel(task: BusinessTask): string {
  if (task.assignee_name) return task.assignee_name
  const t = String(task.assignee_type ?? '')
  if (t === 'agent' || t === 'ai_agent') return 'AI agent'
  if (t === 'human') return 'Human'
  return 'Unassigned'
}

function departmentLabel(task: BusinessTask): string {
  const dept = task.department ?? (task['department_id'] as string | undefined)
  return dept ?? '—'
}

export default function ProjectsOps() {
  const { data, loading, offline, error, reload } = useFetch<BusinessTask[]>(
    () => api.getTasks(),
  )
  const [view, setView] = useState<View>('kanban')

  const tasks = useMemo(() => data ?? [], [data])
  const stats = useMemo(
    () => ({
      total: tasks.length,
      open: tasks.filter(
        (t) => !['completed', 'failed'].includes(String(t.status)),
      ).length,
      inProgress: tasks.filter((t) => String(t.status) === 'in_progress').length,
      blocked: tasks.filter((t) =>
        ['blocked', 'failed'].includes(String(t.status)),
      ).length,
      done: tasks.filter((t) => String(t.status) === 'completed').length,
    }),
    [tasks],
  )
  const timeline = useMemo(
    () =>
      [...tasks].sort((a, b) =>
        String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')),
      ),
    [tasks],
  )

  return (
    <div>
      <PageHeader
        title="Projects & Operations"
        subtitle="Work across every department — one board, one source of truth."
      >
        <div
          className="inline-flex rounded-[10px] border border-line bg-surface p-0.5"
          role="tablist"
          aria-label="Operations view"
        >
          {(
            [
              { key: 'kanban', label: 'Kanban', icon: Columns3 },
              { key: 'table', label: 'Table', icon: Table2 },
              { key: 'timeline', label: 'Timeline', icon: GanttChart },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === v.key
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <v.icon className="h-4 w-4" /> {v.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {loading && <LoadingSkeleton variant="cards" count={3} />}

      {!loading && offline && (
        <ErrorState
          title="Backend offline"
          description="Operational views are built from live task data and cannot be shown while the backend is unreachable."
          onRetry={reload}
        />
      )}

      {!loading && !offline && error && (
        <ErrorState title="Could not load tasks" description={error} onRetry={reload} />
      )}

      {!loading && !offline && !error && data && tasks.length === 0 && (
        <EmptyState
          title="No operational work yet"
          description="Tasks created in the Tasks module — for people or AI agents — appear here as a board, table and timeline. Create the first task to start coordinating work."
        />
      )}

      {!loading && !offline && !error && data && tasks.length > 0 && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {(
              [
                ['Total tasks', stats.total],
                ['Open', stats.open],
                ['In progress', stats.inProgress],
                ['Blocked / failed', stats.blocked],
                ['Completed', stats.done],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">{val}</p>
              </div>
            ))}
          </div>

          {view === 'kanban' && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {COLUMNS.map((col) => {
                const items = tasks.filter((t) =>
                  col.statuses.includes(String(t.status)),
                )
                return (
                  <div key={col.key} className="w-64 shrink-0">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {col.label}
                      </h3>
                      <span className="text-xs text-muted">{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 && (
                        <p className="rounded-[10px] border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
                          Nothing here
                        </p>
                      )}
                      {items.map((task, i) => (
                        <article
                          key={task.id ?? `${task.title}-${i}`}
                          className="card p-3"
                        >
                          <p className="text-sm font-medium text-ink">{task.title}</p>
                          {task.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                              {task.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span
                              className={`font-medium capitalize ${
                                PRIORITY_STYLES[task.priority ?? 'medium'] ?? ''
                              }`}
                            >
                              {task.priority ?? 'medium'}
                            </span>
                            <span className="text-muted">{assigneeLabel(task)}</span>
                            <span className="text-muted">{departmentLabel(task)}</span>
                          </div>
                          <div className="mt-2">
                            <StatusBadge status={String(task.status)} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'table' && (
            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-appbg text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => (
                    <tr
                      key={task.id ?? `${task.title}-${i}`}
                      className="border-b border-line last:border-0 hover:bg-appbg"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{task.title}</p>
                        {task.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={String(task.status)} />
                      </td>
                      <td
                        className={`px-4 py-3 font-medium capitalize ${
                          PRIORITY_STYLES[task.priority ?? 'medium'] ?? ''
                        }`}
                      >
                        {task.priority ?? 'medium'}
                      </td>
                      <td className="px-4 py-3 text-muted">{assigneeLabel(task)}</td>
                      <td className="px-4 py-3 text-muted">{departmentLabel(task)}</td>
                      <td className="px-4 py-3 text-muted">{task.due_date ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'timeline' && (
            <div className="card p-5">
              <ol className="relative space-y-5 border-l border-line pl-6">
                {timeline.map((task, i) => (
                  <li
                    key={task.id ?? `${task.title}-${i}`}
                    className="relative"
                  >
                    <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-primary-500 ring-4 ring-primary-50" />
                    <p className="text-xs text-muted">
                      {task.created_at
                        ? new Date(task.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Date not recorded'}
                      {' · '}
                      {departmentLabel(task)}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-ink">
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <StatusBadge status={String(task.status)} />
                      <span className="text-xs text-muted">
                        {assigneeLabel(task)}
                        {task.due_date ? ` · Due ${task.due_date}` : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  )
}
