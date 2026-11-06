import { History, Plus, Workflow } from 'lucide-react'
import { EmptyState, PageHeader } from '../components/ui'
import WorkflowCanvas from '../components/WorkflowCanvas'

export default function Automations() {
  return (
    <div>
      <PageHeader
        title="Automations"
        subtitle="Visual workflows that coordinate agents, tools and human approvals."
        actions={
          <div className="flex flex-col items-end gap-1">
            <button
              className="btn-primary"
              disabled
              title="Available with the Phase 4 workflow engine"
            >
              <Plus className="h-4 w-4" />
              New workflow
            </button>
            <span className="text-xs text-muted">
              Available with the Phase 4 workflow engine
            </span>
          </div>
        }
      />

      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted">
        The automation center is where natural-language requests become
        editable, approval-gated workflows. The workflow engine arrives in
        Phase 4 — until then this page shows the environment and the
        canonical template. Nothing here executes today.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---- Workflow library ---- */}
        <EmptyState
          icon={Workflow}
          title="No workflows yet"
          description="The workflow engine arrives in Phase 4; nothing here executes today. When it ships, workflows you describe in the command bar — inspected, tested and approved by you first — will be listed here with their triggers, status and owners."
        />

        {/* ---- Canvas ---- */}
        <section className="card p-5 lg:col-span-2">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-ink">
              Customer acquisition workflow
            </h2>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              Template — not an active workflow
            </span>
          </div>
          <p className="mb-5 text-sm text-muted">
            The canonical multi-agent pattern from the platform spec: a
            trigger, two agent steps, a human approval gate in front of the
            external send, then the follow-through. Select any node to see
            what it does.
          </p>
          <WorkflowCanvas />
        </section>
      </div>

      {/* ---- Execution history ---- */}
      <div className="mt-6">
        <EmptyState
          icon={History}
          title="No executions recorded"
          description="Execution history — every run, step, retry and error — will appear here once the Phase 4 workflow engine is live. Opraq never reports a workflow as executed before the engine has actually run it."
        />
      </div>
    </div>
  )
}
