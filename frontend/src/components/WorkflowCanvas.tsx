import { useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Database,
  Mail,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

export type WorkflowNodeType = 'trigger' | 'agent' | 'approval' | 'action'

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  title: string
  subtitle: string
  description: string
  icon: LucideIcon
}

const TYPE_LABELS: Record<WorkflowNodeType, string> = {
  trigger: 'Trigger',
  agent: 'AI agent step',
  approval: 'Approval gate',
  action: 'Action',
}

/**
 * The platform's canonical customer-acquisition workflow, rendered as a
 * STATIC template diagram. This is a design-time illustration of the shape
 * a workflow will take — it is not an active workflow, it has never run,
 * and clicking nodes only explains them. The workflow engine that creates,
 * saves and executes real workflows arrives in Phase 4.
 */
export const CANONICAL_WORKFLOW: WorkflowNode[] = [
  {
    id: 'trigger',
    type: 'trigger',
    title: 'New customer',
    subtitle: 'Trigger · CRM',
    description:
      'The workflow starts when a new customer record is created in the CRM. No step runs before this event exists.',
    icon: UserPlus,
  },
  {
    id: 'research',
    type: 'agent',
    title: 'Research Agent',
    subtitle: 'AI agent step',
    description:
      'Researches the customer’s company, industry and public signals, then attaches a short sourced brief to the customer record.',
    icon: Bot,
  },
  {
    id: 'sales',
    type: 'agent',
    title: 'Sales Agent',
    subtitle: 'AI agent step',
    description:
      'Drafts a personalised outreach email from the research brief. Drafting is a MEDIUM-risk internal action — the draft exists, nothing has been sent.',
    icon: Bot,
  },
  {
    id: 'approval',
    type: 'approval',
    title: 'Human approval',
    subtitle: 'Approval gate · HIGH risk',
    description:
      'The workflow stops here. Sending external email is a HIGH-risk action, so a person must review the draft and approve it before anything leaves the company. Rejection ends the run with the draft preserved.',
    icon: ShieldCheck,
  },
  {
    id: 'email',
    type: 'action',
    title: 'Send email',
    subtitle: 'Action · Email',
    description:
      'Only after approval: the email is sent through the connected email integration and the send is written to the audit log.',
    icon: Mail,
  },
  {
    id: 'crm',
    type: 'action',
    title: 'CRM update',
    subtitle: 'Action · CRM',
    description:
      'The outreach is logged on the customer record and a follow-up task is scheduled for the assigned sales representative.',
    icon: Database,
  },
]

function nodeClasses(node: WorkflowNode, selected: boolean): string {
  const base =
    'focus-ring w-full rounded-card border p-3.5 text-left transition sm:p-4 '
  const ring = selected
    ? 'ring-2 ring-primary-500 ring-offset-1 '
    : 'hover:border-slate-300 '
  if (node.type === 'approval') {
    return (
      base +
      ring +
      'border-amber-300 bg-amber-50 shadow-card'
    )
  }
  return base + ring + 'border-line bg-surface shadow-card'
}

function iconClasses(node: WorkflowNode): string {
  switch (node.type) {
    case 'trigger':
      return 'bg-primary-600 text-white'
    case 'approval':
      return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
    case 'agent':
      return 'bg-primary-50 text-primary-600 ring-1 ring-primary-100'
    default:
      return 'bg-appbg text-ink ring-1 ring-line'
  }
}

export default function WorkflowCanvas() {
  const [selectedId, setSelectedId] = useState<string>('approval')
  const selected =
    CANONICAL_WORKFLOW.find((n) => n.id === selectedId) ??
    CANONICAL_WORKFLOW[0]

  return (
    <div>
      <div className="flex flex-col gap-0 lg:flex-row lg:items-stretch">
        {CANONICAL_WORKFLOW.map((node, i) => {
          const Icon = node.icon
          const isSelected = node.id === selectedId
          return (
            <div
              key={node.id}
              className="flex flex-col lg:flex-1 lg:flex-row lg:items-center"
            >
              <button
                type="button"
                onClick={() => setSelectedId(node.id)}
                aria-pressed={isSelected}
                className={nodeClasses(node, isSelected) + ' lg:flex-1'}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] ${iconClasses(node)}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-2.5 block text-sm font-semibold leading-tight text-ink">
                  {node.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {node.subtitle}
                </span>
              </button>
              {i < CANONICAL_WORKFLOW.length - 1 && (
                <span
                  className="flex shrink-0 items-center justify-center py-1 text-slate-300 lg:px-1.5 lg:py-0"
                  aria-hidden
                >
                  <ArrowDown className="h-5 w-5 lg:hidden" />
                  <ArrowRight className="hidden h-5 w-5 lg:block" />
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div
        className="mt-4 rounded-xl border border-line bg-appbg/70 px-4 py-3"
        aria-live="polite"
      >
        <p className="text-sm text-ink">
          <span className="mr-2 inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-inset ring-line">
            {TYPE_LABELS[selected.type]}
          </span>
          <span className="font-medium">{selected.title}.</span>{' '}
          <span className="text-muted">{selected.description}</span>
        </p>
      </div>
    </div>
  )
}
