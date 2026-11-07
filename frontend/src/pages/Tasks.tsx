import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Bot, Columns3, List, Plus, User } from 'lucide-react'
import { api, BackendOfflineError } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { BusinessTask } from '../lib/types'
import {
  DetailInspector,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  RiskBadge,
  StatusBadge,
} from '../components/ui'

/* Priority uses the same ring-badge language as StatusBadge / RiskBadge. */
const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-appbg text-muted ring-line',
  medium: 'bg-primary-50 text-primary-700 ring-primary-200',
  high: 'bg-[#FEF7E0] text-warning ring-[#FDE293]',
  urgent: 'bg-[#FCE8E6] text-error ring-[#F2B8B5]',
}

function PriorityBadge({ priority }: { priority?: string }) {
  const key = (priority ?? 'medium').toLowerCase()
  const style = PRIORITY_STYLES[key] ?? PRIORITY_STYLES.medium
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style}`}
    >
      {key}
    </span>
  )
}

function isAgentTask(task: BusinessTask): boolean {
  const t = String(task.assignee_type ?? '')
  return t === 'agent' || t === 'ai_agent'
}

function assigneeLabel(task: BusinessTask): string {
  if (task.assignee_name) return task.assignee_name
  if (isAgentTask(task)) return 'AI agent'
  if (String(task.assignee_type ?? '') === 'human') return 'Human'
  return 'Unassigned'
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type FilterKey =
  | 'all'
  | 'open'
  | 'people'
  | 'ai'
  | 'waiting_approval'
  | 'blocked'
  | 'completed'

const OPEN_STATUSES = ['pending', 'assigned', 'in_progress', 'waiting_approval', 'blocked']

const COLUMNS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'todo', label: 'To do', statuses: ['pending', 'assigned'] },
  { key: 'doing', label: 'In progress', statuses: ['in_progress'] },
  { key: 'waiting', label: 'Waiting approval', statuses: ['waiting_approval'] },
  { key: 'blocked', label: 'Blocked', statuses: ['blocked', 'failed'] },
  { key: 'done', label: 'Done', statuses: ['completed'] },
]

type View = 'list' | 'kanban'

export default function Tasks() {
  const { data, loading, offline, error, reload } = useFetch<BusinessTask[]>(
    () => api.getTasks(),
  )
  const [view, setView] = useState<View>('list')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selected, setSelected] = useState<BusinessTask | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState('')
  const [priority, setPriority] = useState('medium')
  const [assigneeType, setAssigneeType] = useState('human')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        department: department.trim() || undefined,
        priority,
        assignee_type: assigneeType,
      })
      setTitle('')
      setDescription('')
      setDepartment('')
      setShowForm(false)
      reload()
    } catch (err) {
      setSaveError(
        err instanceof BackendOfflineError
          ? 'Backend offline — the task was not saved.'
          : err instanceof Error
            ? err.message
            : 'Could not create the task.',
      )
    } finally {
      setSaving(false)
    }
  }

  const tasks = useMemo(() => data ?? [], [data])

  const counts = useMemo(
    () => ({
      all: tasks.length,
      open: tasks.filter((t) => OPEN_STATUSES.includes(String(t.status))).length,
      people: tasks.filter(
        (t) => !isAgentTask(t) && String(t.assignee_type ?? '') === 'human',
      ).length,
      ai: tasks.filter((t) => isAgentTask(t)).length,
      waiting_approval: tasks.filter(
        (t) => String(t.status) === 'waiting_approval',
      ).length,
      blocked: tasks.filter((t) =>
        ['blocked', 'failed'].includes(String(t.status)),
      ).length,
      completed: tasks.filter((t) => String(t.status) === 'completed').length,
    }),
    [tasks],
  )

  const filtered = useMemo(() => {
    switch (filter) {
      case 'open':
        return tasks.filter((t) => OPEN_STATUSES.includes(String(t.status)))
      case 'people':
        return tasks.filter(
          (t) => !isAgentTask(t) && String(t.assignee_type ?? '') === 'human',
        )
      case 'ai':
        return tasks.filter((t) => isAgentTask(t))
      case 'waiting_approval':
        return tasks.filter((t) => String(t.status) === 'waiting_approval')
      case 'blocked':
        return tasks.filter((t) =>
          ['blocked', 'failed'].includes(String(t.status)),
        )
      case 'completed':
        return tasks.filter((t) => String(t.status) === 'completed')
      default:
        return tasks
    }
  }, [tasks, filter])

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'open', label: 'Open', count: counts.open },
    { key: 'people', label: 'Assigned to people', count: counts.people },
    { key: 'ai', label: 'Assigned to AI', count: counts.ai },
    { key: 'waiting_approval', label: 'Waiting approval', count: counts.waiting_approval },
    { key: 'blocked', label: 'Blocked', count: counts.blocked },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ]

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Work assigned to people and AI employees, in one place."
      >
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-[10px] border border-line bg-surface p-0.5"
            role="tablist"
            aria-label="Tasks view"
          >
            {(
              [
                { key: 'list', label: 'List', icon: List },
                { key: 'kanban', label: 'Kanban', icon: Columns3 },
              ] as const
            ).map((v) => (
              <button
                key={v.key}
                role="tab"
                aria-selected={view === v.key}
                onClick={() => setView(v.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition focus-ring ${
                  view === v.key
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <v.icon className="h-4 w-4" aria-hidden /> {v.label}
              </button>
            ))}
          </div>
          <button className="btn-primary min-h-11" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New task
          </button>
        </div>
      </PageHeader>

      {loading && <LoadingSkeleton variant="table" count={5} />}

      {!loading && offline && (
        <ErrorState
          title="Backend offline"
          description="Tasks are stored by the backend and cannot be listed or created while it is unreachable."
          onRetry={reload}
        />
      )}

      {!loading && !offline && error && (
        <ErrorState title="Could not load tasks" description={error} onRetry={reload} />
      )}

      {!loading && !offline && !error && data && data.length === 0 && (
        <EmptyState
          title="No tasks yet"
          description="Create the first task with the New task button. Tasks assigned to AI agents will appear here alongside human tasks."
        />
      )}

      {!loading && !offline && !error && data && data.length > 0 && (
        <>
          <div
            className="mb-4 flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter tasks"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition focus-ring ${
                  filter === f.key
                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                    : 'border-line bg-surface text-muted hover:text-ink'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    filter === f.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-appbg text-muted'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No tasks in this view"
              description="No tasks match the selected filter. Try a different filter or create a new task."
            />
          ) : view === 'list' ? (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-appbg text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Assignee</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task, i) => (
                    <tr
                      key={task.id ?? `${task.title}-${i}`}
                      onClick={() => setSelected(task)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View task: ${task.title}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelected(task)
                        }
                      }}
                      className="focus-ring cursor-pointer border-b border-line last:border-0 transition hover:bg-appbg"
                      title="View task details"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{task.title}</p>
                        {task.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {task.department ??
                          (task['department_id'] as string | undefined) ??
                          '—'}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          {isAgentTask(task) ? (
                            <Bot className="h-4 w-4 text-primary-500" aria-label="AI agent" />
                          ) : (
                            <User className="h-4 w-4 text-muted" aria-label="Human" />
                          )}
                          {assigneeLabel(task)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={String(task.status)} />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(task.created_at)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {task.due_date ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {COLUMNS.map((col) => {
                const colTasks = filtered.filter((t) =>
                  col.statuses.includes(String(t.status)),
                )
                return (
                  <section
                    key={col.key}
                    aria-label={col.label}
                    className="w-[82vw] max-w-80 shrink-0 snap-start sm:w-72"
                  >
                    <h2 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold text-ink">
                      {col.label}
                      <span className="rounded-full bg-appbg px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-inset ring-line">
                        {colTasks.length}
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {colTasks.map((task, i) => (
                        <button
                          key={task.id ?? `${task.title}-${i}`}
                          onClick={() => setSelected(task)}
                          className="card focus-ring block w-full p-3 text-left transition hover:border-primary-200"
                        >
                          <p className="text-sm font-medium leading-snug text-ink">
                            {task.title}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <PriorityBadge priority={task.priority} />
                            {isAgentTask(task) ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted">
                                <Bot className="h-3.5 w-3.5 text-primary-500" aria-hidden />
                                AI agent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted">
                                <User className="h-3.5 w-3.5" aria-hidden />
                                {assigneeLabel(task)}
                              </span>
                            )}
                          </div>
                          {(task.department ??
                            (task['department_id'] as string | undefined)) && (
                            <p className="mt-1.5 text-xs text-muted">
                              {task.department ??
                                (task['department_id'] as string | undefined)}
                            </p>
                          )}
                        </button>
                      ))}
                      {colTasks.length === 0 && (
                        <p className="rounded-[10px] border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
                          No tasks
                        </p>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Task detail inspector */}
      <DetailInspector
        open={selected !== null}
        title={selected?.title ?? 'Task'}
        subtitle={selected ? assigneeLabel(selected) : undefined}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <TaskDetails task={selected} />
        )}
      </DetailInspector>

      {/* Create task — same fields and submit flow as before, in a panel. */}
      <DetailInspector
        open={showForm}
        title="Create task"
        subtitle="Assign work to a person or an AI employee."
        onClose={() => setShowForm(false)}
      >
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="task-title">Title</label>
              <input
                id="task-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                className="input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Context, inputs and expected output…"
              />
            </div>
            <div>
              <label className="label" htmlFor="task-dept">Department</label>
              <input
                id="task-dept"
                className="input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Sales"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="task-assignee">Assignee type</label>
                <select
                  id="task-assignee"
                  className="input"
                  value={assigneeType}
                  onChange={(e) => setAssigneeType(e.target.value)}
                >
                  <option value="human">Human</option>
                  <option value="agent">AI agent</option>
                </select>
              </div>
            </div>
          </div>
          {saveError && (
            <p className="mt-3 text-sm font-medium text-error">{saveError}</p>
          )}
          <div className="mt-5 flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create task'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </DetailInspector>
    </div>
  )
}

function TaskDetails({ task }: { task: BusinessTask }) {
  const executionLog =
    (task['execution_log'] as unknown[] | undefined) ??
    (task['executionLog'] as unknown[] | undefined)
  const dependencies = task['dependencies'] as string[] | undefined
  const integrations = task['required_integrations'] as string[] | undefined
  const riskLevel = task['risk_level'] as string | undefined

  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Status', value: <StatusBadge status={String(task.status)} /> },
    { label: 'Priority', value: <PriorityBadge priority={task.priority} /> },
    {
      label: 'Assignee',
      value: `${assigneeLabel(task)}${task['assignee_id'] ? ` (${String(task['assignee_id'])})` : ''}`,
    },
    {
      label: 'Department',
      value:
        task.department ??
        (task['department_id'] as string | undefined) ??
        '—',
    },
    { label: 'Created', value: formatDate(task.created_at) },
    { label: 'Due', value: task.due_date ?? '—' },
    ...(riskLevel
      ? [{ label: 'Risk level', value: <RiskBadge level={riskLevel} /> }]
      : []),
    ...(dependencies && dependencies.length > 0
      ? [{ label: 'Dependencies', value: dependencies.join(', ') }]
      : []),
    ...(integrations && integrations.length > 0
      ? [{ label: 'Required integrations', value: integrations.join(', ') }]
      : []),
  ]

  return (
    <div className="space-y-5">
      {task.description && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Description
          </h3>
          <p className="text-sm leading-relaxed text-ink">{task.description}</p>
        </div>
      )}
      <dl className="divide-y divide-line rounded-card border border-line">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
          >
            <dt className="text-muted">{row.label}</dt>
            <dd className="text-right font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Execution log
        </h3>
        {executionLog && executionLog.length > 0 ? (
          <ul className="space-y-2">
            {executionLog.map((entry, i) => (
              <li
                key={i}
                className="rounded-[10px] border border-line bg-appbg px-3 py-2 text-xs leading-relaxed text-ink"
              >
                {typeof entry === 'string' ? entry : JSON.stringify(entry)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            No execution log recorded for this task.
          </p>
        )}
      </div>
    </div>
  )
}
