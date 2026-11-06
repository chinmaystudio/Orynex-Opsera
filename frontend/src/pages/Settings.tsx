import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Bot,
  Building2,
  KeyRound,
  Link2,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { api, apiBaseUrl } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { INTEGRATIONS } from '../lib/integrations'
import type { Organization } from '../lib/types'
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  RiskBadge,
} from '../components/ui'

type SectionKey =
  | 'workspace'
  | 'organization'
  | 'users-roles'
  | 'permissions'
  | 'security'
  | 'ai'
  | 'integrations'
  | 'notifications'

const SECTIONS: { key: SectionKey; label: string; icon: LucideIcon }[] = [
  { key: 'workspace', label: 'Workspace', icon: Building2 },
  { key: 'organization', label: 'Organization', icon: Building2 },
  { key: 'users-roles', label: 'Users & Roles', icon: Users },
  { key: 'permissions', label: 'Permissions', icon: KeyRound },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'ai', label: 'AI Configuration', icon: Bot },
  { key: 'integrations', label: 'Integrations', icon: Link2 },
  { key: 'notifications', label: 'Notifications', icon: Bell },
]

/**
 * Platform role model, mirroring the API's RBAC contract
 * (backend/app/rbac.py ROLE_PERMISSIONS). Permissions are
 * "<resource>:<action>" strings enforced by the API on every request.
 * These are platform defaults — there is no roles API yet, so this page
 * presents them as documentation, not as editable settings.
 */
const ROLES: {
  role: string
  summary: string
  read: string
  write: string
  decide: string
}[] = [
  {
    role: 'owner',
    summary: 'Full control of the organization, including billing-level and destructive actions.',
    read: 'Everything',
    write: 'Everything (*)',
    decide: 'Yes',
  },
  {
    role: 'admin',
    summary: 'Manages the organization, its members\u2019 resources and integrations.',
    read: 'All resources',
    write: 'Core resources, organization update, integrations',
    decide: 'Yes',
  },
  {
    role: 'manager',
    summary: 'Runs day-to-day operations across departments.',
    read: 'All resources',
    write: 'Core resources (departments, employees, customers, leads, tasks, agents, commands)',
    decide: 'Yes',
  },
  {
    role: 'member',
    summary: 'Contributes work inside assigned areas.',
    read: 'All resources',
    write: 'Customers, leads, tasks and commands (create/update only)',
    decide: 'No',
  },
  {
    role: 'viewer',
    summary: 'Read-only visibility for stakeholders and auditors.',
    read: 'All resources',
    write: 'None',
    decide: 'No',
  },
  {
    role: 'agent',
    summary:
      'Bounded scope for AI employees acting through the API. Read-mostly; may create leads/tasks, may never decide approvals or delete anything.',
    read: 'Organizations, departments, employees, customers, leads, tasks, agents, overview',
    write: 'Customers/leads create, tasks create/update',
    decide: 'Never',
  },
]

const PERMISSION_RESOURCES = [
  'organizations',
  'departments',
  'employees',
  'customers',
  'leads',
  'tasks',
  'agents',
  'approvals',
  'integrations',
  'audit',
  'overview',
  'command',
]

const RISK_POLICY: {
  level: string
  examples: string
  behaviour: string
}[] = [
  {
    level: 'low',
    examples: 'Reading approved business data, search, research, generating reports',
    behaviour: 'Executes immediately. Logged in the audit trail.',
  },
  {
    level: 'medium',
    examples: 'Creating records and tasks, drafting communications, scheduling',
    behaviour: 'Executes immediately. Logged in the audit trail.',
  },
  {
    level: 'high',
    examples:
      'Sending external communications, publishing campaigns, modifying or deleting important records, executing workflows',
    behaviour:
      'Blocked until a human approves the request in the Approvals inbox. Nothing executes before the decision.',
  },
  {
    level: 'critical',
    examples: 'Payments, bank transfers, deleting an organization',
    behaviour:
      'Approval required and never auto-executed. AI agents cannot perform CRITICAL actions even after approval without an explicit organization policy.',
  },
]

function formatDate(value: unknown): string {
  if (typeof value !== 'string' || !value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function Settings() {
  const [section, setSection] = useState<SectionKey>('workspace')
  const { data: orgs, loading, offline, error, reload } = useFetch<
    Organization[]
  >(() => api.getOrganizations())

  const configuredCount = INTEGRATIONS.filter(
    (i) => i.status !== 'not_configured',
  ).length

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Workspace, organization and platform governance."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Settings sections"
          className="card flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-4 lg:flex-col lg:overflow-visible"
        >
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              aria-current={section === s.key ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus-ring ${
                section === s.key
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-muted hover:bg-appbg hover:text-ink'
              }`}
            >
              <s.icon className="h-4 w-4 shrink-0" aria-hidden />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {section === 'workspace' && (
            <section aria-label="Workspace settings" className="space-y-4">
              <div className="card p-5">
                <h2 className="text-base font-semibold text-ink">Workspace</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  The workspace selector in the top bar switches between the
                  organizations your account belongs to. Organizations are
                  loaded live from the API — every record in OPRAQ is scoped
                  to one organization.
                </p>
                <dl className="mt-4 divide-y divide-line rounded-card border border-line">
                  <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-muted">API base URL</dt>
                    <dd className="break-all text-right font-mono text-xs text-ink">
                      {apiBaseUrl}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-muted">Organizations available</dt>
                    <dd className="font-medium text-ink">
                      {loading ? '…' : (orgs?.length ?? '—')}
                    </dd>
                  </div>
                </dl>
              </div>
              <OrganizationList
                orgs={orgs}
                loading={loading}
                offline={offline}
                error={error}
                reload={reload}
              />
            </section>
          )}

          {section === 'organization' && (
            <section aria-label="Organization settings" className="space-y-4">
              <OrganizationList
                orgs={orgs}
                loading={loading}
                offline={offline}
                error={error}
                reload={reload}
              />
              <div className="card p-5">
                <h2 className="text-base font-semibold text-ink">
                  Organization profile
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                  Editing an organization&rsquo;s name, plan and ownership is
                  not yet available in this interface. Organization records
                  are created and managed through the API today; profile
                  editing arrives with the Phase 6 platform work. No settings
                  on this page change organization data.
                </p>
              </div>
            </section>
          )}

          {section === 'users-roles' && (
            <section aria-label="Users and roles" className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-base font-semibold text-ink">
                  Platform roles
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                  OPRAQ enforces role-based access control in the API on every
                  request. The roles below are the platform defaults from the
                  API&rsquo;s RBAC model. Assigning roles to individual users
                  is managed through organization membership and is not yet
                  editable here.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-appbg text-xs uppercase tracking-wide text-muted">
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Scope</th>
                      <th className="px-5 py-3 font-medium">Can decide approvals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROLES.map((r) => (
                      <tr key={r.role} className="border-b border-line last:border-0">
                        <td className="px-5 py-3 align-top">
                          <span className="font-mono text-sm font-semibold capitalize text-ink">
                            {r.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 align-top text-muted">
                          <p className="leading-relaxed text-ink">{r.summary}</p>
                          <p className="mt-1 text-xs leading-relaxed">
                            Read: {r.read} · Write: {r.write}
                          </p>
                        </td>
                        <td className="px-5 py-3 align-top font-medium text-ink">
                          {r.decide}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {section === 'permissions' && (
            <section aria-label="Permissions" className="card p-5">
              <h2 className="text-base font-semibold text-ink">
                How permissions work
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                Every API permission is a{' '}
                <code className="rounded bg-appbg px-1 py-0.5 font-mono text-xs text-ink">
                  &lt;resource&gt;:&lt;action&gt;
                </code>{' '}
                pair (for example{' '}
                <code className="rounded bg-appbg px-1 py-0.5 font-mono text-xs text-ink">
                  tasks:create
                </code>{' '}
                or{' '}
                <code className="rounded bg-appbg px-1 py-0.5 font-mono text-xs text-ink">
                  approvals:decide
                </code>
                ). A role grants a set of permissions; the API checks the
                required permission before any record is read or changed, and
                every decision is written to the audit log. Custom per-user
                permission overrides are not supported yet.
              </p>
              <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
                Protected resources
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {PERMISSION_RESOURCES.map((r) => (
                  <li
                    key={r}
                    className="rounded-full bg-appbg px-2.5 py-1 font-mono text-xs text-ink ring-1 ring-inset ring-line"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {section === 'security' && (
            <section aria-label="Security and approval policy" className="space-y-4">
              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-4">
                  <h2 className="text-base font-semibold text-ink">
                    Approval policy by risk level
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                    Every action an AI employee or automation attempts is
                    classified by risk. This policy is enforced by the API —
                    it is how OPRAQ actually behaves today, not a preference
                    you can switch off here.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-line bg-appbg text-xs uppercase tracking-wide text-muted">
                        <th className="px-5 py-3 font-medium">Risk level</th>
                        <th className="px-5 py-3 font-medium">Covers</th>
                        <th className="px-5 py-3 font-medium">Behaviour</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RISK_POLICY.map((row) => (
                        <tr key={row.level} className="border-b border-line last:border-0">
                          <td className="px-5 py-3 align-top">
                            <RiskBadge level={row.level} />
                          </td>
                          <td className="px-5 py-3 align-top leading-relaxed text-muted">
                            {row.examples}
                          </td>
                          <td className="px-5 py-3 align-top leading-relaxed text-ink">
                            {row.behaviour}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card p-5">
                <h2 className="text-base font-semibold text-ink">Audit log</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                  Mutations, approval decisions and agent actions are written
                  to the organization&rsquo;s audit log by the API. Pending
                  and decided approval requests are visible in the{' '}
                  <Link
                    to="/app/approvals"
                    className="font-medium text-primary-700 hover:underline"
                  >
                    Approvals inbox
                  </Link>
                  .
                </p>
              </div>
            </section>
          )}

          {section === 'ai' && (
            <section aria-label="AI configuration" className="card p-5">
              <h2 className="text-base font-semibold text-ink">
                AI configuration
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                Model providers, per-agent instructions and execution limits
                are configured when an agent is installed from the registry.
                A central AI configuration screen arrives with the Phase 2
                agent runtime — until then there is nothing here that can be
                changed, and no provider is connected by default.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/app/ai-workforce" className="btn-secondary">
                  Open AI Workforce
                </Link>
                <Link to="/app/marketplace" className="btn-secondary">
                  Browse the agent registry
                </Link>
              </div>
            </section>
          )}

          {section === 'integrations' && (
            <section aria-label="Integration settings" className="card p-5">
              <h2 className="text-base font-semibold text-ink">Integrations</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                {configuredCount} of {INTEGRATIONS.length} integrations in the
                registry are configured. An integration is only ever shown as
                connected once its own credentials are in place — everything
                else stays &ldquo;Not configured&rdquo;.
              </p>
              <div className="mt-4">
                <Link to="/app/integrations" className="btn-primary">
                  Open Integrations
                </Link>
              </div>
            </section>
          )}

          {section === 'notifications' && (
            <section aria-label="Notification settings" className="card p-5">
              <h2 className="text-base font-semibold text-ink">
                Notifications
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                No notification service is configured yet, so there are no
                channels or preferences to manage. Approval requests already
                surface where you work: in the{' '}
                <Link
                  to="/app/approvals"
                  className="font-medium text-primary-700 hover:underline"
                >
                  Approvals inbox
                </Link>{' '}
                and as the pending-approvals badge in the sidebar.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function OrganizationList({
  orgs,
  loading,
  offline,
  error,
  reload,
}: {
  orgs: Organization[] | null
  loading: boolean
  offline: boolean
  error: string | null
  reload: () => void
}) {
  if (loading) return <LoadingSkeleton variant="rows" count={2} />
  if (offline) {
    return (
      <ErrorState
        title="Backend offline"
        description="Organization records are loaded from the API and cannot be shown while it is unreachable."
        onRetry={reload}
      />
    )
  }
  if (error) {
    return (
      <ErrorState
        title="Could not load organizations"
        description={error}
        onRetry={reload}
      />
    )
  }
  if (!orgs || orgs.length === 0) {
    return (
      <EmptyState
        title="No organizations yet"
        description="Create your first organization through the API or the command bar, and it will appear here."
      />
    )
  }
  return (
    <div className="card overflow-hidden">
      <h2 className="border-b border-line px-5 py-4 text-base font-semibold text-ink">
        Organizations ({orgs.length})
      </h2>
      <ul className="divide-y divide-line">
        {orgs.map((org) => (
          <li key={org.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-ink">{org.name}</p>
              {org.plan && (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium capitalize text-primary-700 ring-1 ring-inset ring-primary-200">
                  {org.plan}
                </span>
              )}
            </div>
            <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              <span>
                ID: <span className="font-mono">{org.id}</span>
              </span>
              {org.slug && <span>Slug: {org.slug}</span>}
              {org.owner_email && <span>Owner: {org.owner_email}</span>}
              <span>Created {formatDate(org['created_at'])}</span>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}
