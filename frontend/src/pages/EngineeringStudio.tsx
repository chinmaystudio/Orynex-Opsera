import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Code2,
  GitBranch,
  GitPullRequest,
  Rocket,
  WifiOff,
} from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { BusinessTask } from '../lib/types'
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from '../components/ui'
import AgentPresetStrip from '../components/AgentPresetStrip'

/**
 * Code tasks are real business tasks whose recorded department names the
 * engineering function. The task system stores department as free text
 * chosen at creation, so this matches on the word "engineer" — and says so.
 */
function isEngineeringTask(task: BusinessTask): boolean {
  return (task.department ?? '').toLowerCase().includes('engineer')
}

export default function EngineeringStudio() {
  const tasksState = useFetch<BusinessTask[]>(() => api.getTasks())

  const engineeringTasks = useMemo(
    () => (tasksState.data ?? []).filter(isEngineeringTask),
    [tasksState.data],
  )
  const tasksReady =
    !tasksState.loading && !tasksState.offline && !tasksState.error

  return (
    <div>
      <PageHeader
        title="Engineering Studio"
        subtitle="AI software engineering — repositories, code tasks and delivery, with production changes behind approval."
      />

      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <EmptyState
            icon={GitBranch}
            title="No repositories connected"
            description="Repository browsing, branches and commit history arrive when a development integration is connected. GitHub, GitLab and Bitbucket adapters are Planned (Phase 3) and currently Not configured — no repositories are connected today."
            action={
              <Link
                to="/app/integrations"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View integrations <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <EmptyState
            icon={Rocket}
            title="Deployments & CI/CD are not available yet"
            description="Pipeline status, build results and deployment management will appear here once a repository and CI provider are connected. Production deployments will always require approval — nothing deploys from this studio automatically."
          />
        </div>

        {/* ---- Code tasks (real task data) ---- */}
        <section className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Code2 className="h-5 w-5 text-primary-600" />
              Code tasks
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Real tasks from the shared task system whose department names
              the engineering function. Managed in full in{' '}
              <Link
                to="/app/tasks"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Tasks
              </Link>
              .
            </p>
          </div>
          {tasksState.loading ? (
            <div className="p-5">
              <LoadingSkeleton variant="rows" count={3} />
            </div>
          ) : tasksState.offline ? (
            <div className="flex items-start gap-3 px-5 py-4">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-muted">
                <span className="font-medium text-ink">Backend offline</span>{' '}
                — code tasks are live task data and cannot be loaded right
                now.
              </p>
            </div>
          ) : tasksState.error ? (
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <p className="text-sm text-muted">
                Code tasks could not be loaded: {tasksState.error}
              </p>
              <button className="btn-secondary shrink-0" onClick={tasksState.reload}>
                Retry
              </button>
            </div>
          ) : engineeringTasks.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              No engineering tasks yet. Tasks assigned to an engineering
              department in the task system will appear here; feature work
              split across frontend, backend, database and QA agents will be
              coordinated from this list once coding agents are connected.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {engineeringTasks.map((task) => (
                <li
                  key={task.id ?? task.title}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {task.title}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-muted">
                      {task.department}
                      {task.assignee_type
                        ? ` · ${task.assignee_type === 'agent' ? 'AI agent' : 'Human'} assignee`
                        : ''}
                      {task.due_date ? ` · Due ${task.due_date}` : ''}
                    </p>
                  </div>
                  {task.priority && (
                    <span className="hidden shrink-0 text-xs capitalize text-muted sm:block">
                      {task.priority} priority
                    </span>
                  )}
                  <span className="shrink-0">
                    <StatusBadge status={task.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {tasksReady && engineeringTasks.length > 0 && (
            <p className="border-t border-line bg-appbg/60 px-5 py-3 text-xs text-muted">
              Showing {engineeringTasks.length} of{' '}
              {(tasksState.data ?? []).length} tasks in the workspace — only
              engineering-department work is listed here.
            </p>
          )}
        </section>

        <EmptyState
          icon={GitPullRequest}
          title="No code reviews yet"
          description="Pull requests opened by coding agents — with AI review, security checks and test results — will be listed here once a repository is connected. Reviews are recorded against real pull requests only; none exist today."
        />

        <AgentPresetStrip
          department="Engineering Studio"
          title="AI engineering team"
        />
      </div>
    </div>
  )
}
