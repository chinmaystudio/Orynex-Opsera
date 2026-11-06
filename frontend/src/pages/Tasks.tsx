import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { api, BackendOfflineError } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { BusinessTask } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '../components/ui'

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-slate-500',
  medium: 'text-sky-600',
  high: 'text-amber-600',
  urgent: 'text-red-600',
}

export default function Tasks() {
  const { data, loading, offline, error, reload } = useFetch<BusinessTask[]>(
    () => api.getTasks(),
  )
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

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="One unified task system for human and AI employees (§22): assignment, priority, dependencies, approvals and execution logs in a single list."
      >
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> New task
        </button>
      </PageHeader>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Create task
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
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
            <div className="md:col-span-2">
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
            <p className="mt-3 text-sm font-medium text-red-600">{saveError}</p>
          )}
          <div className="mt-4 flex gap-2">
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
      )}

      {loading && <LoadingState label="Loading tasks…" />}

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
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {data.map((task, i) => (
                <tr
                  key={task.id ?? `${task.title}-${i}`}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {task.department ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {task.assignee_name ??
                      (task.assignee_type === 'agent' ? 'AI agent' : 'Human')}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium capitalize ${
                      PRIORITY_STYLES[task.priority ?? 'medium'] ?? ''
                    }`}
                  >
                    {task.priority ?? 'medium'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={String(task.status)} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {task.due_date ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
