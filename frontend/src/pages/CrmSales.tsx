import { useMemo, useState, type FormEvent } from 'react'
import { Columns3, Plus, Table2 } from 'lucide-react'
import { api, BackendOfflineError } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import type { Customer, Lead, Organization } from '../lib/types'
import {
  DetailInspector,
  EmptyState,
  ErrorState,
  FilterBar,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
  formatMoney,
} from '../components/ui'

const STAGES: { key: string; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

interface CrmData {
  leads: Lead[]
  customers: Customer[]
  organizations: Organization[]
}

type Selection =
  | { kind: 'lead'; record: Lead }
  | { kind: 'customer'; record: Customer }
  | null

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ink">{value ?? '—'}</dd>
    </div>
  )
}

export default function CrmSales() {
  const { data, loading, offline, error, reload } = useFetch<CrmData>(
    async () => {
      const [leads, customers, organizations] = await Promise.all([
        api.getLeads(),
        api.getCustomers(),
        api.getOrganizations(),
      ])
      return { leads, customers, organizations }
    },
  )
  const [view, setView] = useState<'pipeline' | 'table'>('pipeline')
  const [search, setSearch] = useState('')
  const [selection, setSelection] = useState<Selection>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [stage, setStage] = useState('new')
  const [value, setValue] = useState('')

  const leads = useMemo(() => {
    const all = data?.leads ?? []
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((l) =>
      [l.name, l.company, l.email, l.source]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q)),
    )
  }, [data, search])

  const openValue = useMemo(
    () =>
      (data?.leads ?? [])
        .filter((l) => !['won', 'lost'].includes(String(l.stage)))
        .reduce((sum, l) => sum + (Number(l.value) || 0), 0),
    [data],
  )

  const orgId = data?.organizations[0]?.id

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || saving) return
    if (!orgId) {
      setSaveError(
        'No organization found — lead creation requires a workspace. Create an organization first, then add leads.',
      )
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await api.createLead({
        organization_id: orgId,
        name: name.trim(),
        company: company.trim() || undefined,
        email: email.trim() || undefined,
        source: source.trim() || undefined,
        stage,
        value: value ? Number(value) : 0,
      })
      setName('')
      setCompany('')
      setEmail('')
      setSource('')
      setValue('')
      setStage('new')
      setShowForm(false)
      reload()
    } catch (err) {
      setSaveError(
        err instanceof BackendOfflineError
          ? 'Backend offline — the lead was not saved.'
          : err instanceof Error
            ? err.message
            : 'Could not create the lead.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="CRM & Sales"
        subtitle="Pipeline, customers and follow-ups in one workspace."
      >
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-[10px] border border-line bg-surface p-0.5"
            role="tablist"
            aria-label="Lead view"
          >
            <button
              role="tab"
              aria-selected={view === 'pipeline'}
              onClick={() => setView('pipeline')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === 'pipeline'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Columns3 className="h-4 w-4" /> Pipeline
            </button>
            <button
              role="tab"
              aria-selected={view === 'table'}
              onClick={() => setView('table')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === 'table'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Table2 className="h-4 w-4" /> Table
            </button>
          </div>
          <button className="btn-primary min-h-11" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> New lead
          </button>
        </div>
      </PageHeader>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 p-4 sm:p-5">
          <h2 className="mb-1 text-base font-semibold text-ink">Create lead</h2>
          <p className="mb-4 text-sm text-muted">
            {orgId
              ? 'The lead is added to your organization’s pipeline.'
              : 'No organization was found for this workspace — an organization is required before leads can be created.'}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="lead-name">Name</label>
              <input
                id="lead-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contact name"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="lead-company">Company</label>
              <input
                id="lead-company"
                className="input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company"
              />
            </div>
            <div>
              <label className="label" htmlFor="lead-email">Email</label>
              <input
                id="lead-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="lead-source">Source</label>
              <input
                id="lead-source"
                className="input"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Website, Referral, Outreach"
              />
            </div>
            <div>
              <label className="label" htmlFor="lead-stage">Stage</label>
              <select
                id="lead-stage"
                className="input"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="lead-value">Estimated value (₹)</label>
              <input
                id="lead-value"
                type="number"
                min="0"
                className="input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          {saveError && (
            <p className="mt-3 text-sm font-medium text-error">{saveError}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving || !orgId}>
              {saving ? 'Saving…' : 'Create lead'}
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

      {loading && <LoadingSkeleton variant="table" count={5} />}

      {!loading && offline && (
        <ErrorState
          title="Backend offline"
          description="Leads and customers are stored by the backend and cannot be listed while it is unreachable. No local copy is kept, so nothing is shown rather than showing stale data."
          onRetry={reload}
        />
      )}

      {!loading && !offline && error && (
        <ErrorState title="Could not load sales data" description={error} onRetry={reload} />
      )}

      {!loading && !offline && !error && data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="card p-4 sm:p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Leads</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{data.leads.length}</p>
            </div>
            <div className="card p-4 sm:p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Open pipeline value</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(openValue)}</p>
            </div>
            <div className="card p-4 sm:p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Customers</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{data.customers.length}</p>
            </div>
          </div>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search leads by name, company, email or source…"
          />

          {leads.length === 0 ? (
            <EmptyState
              title={data.leads.length === 0 ? 'No leads yet' : 'No leads match your search'}
              description={
                data.leads.length === 0
                  ? 'Add the first lead with the New lead button, or let the AI Sales Manager and Business Development presets create leads from the AI Command Bar once they are installed. Leads move through New → Contacted → Qualified → Proposal → Won / Lost.'
                  : 'Try a different search term — your pipeline itself is unchanged.'
              }
            />
          ) : view === 'pipeline' ? (
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {STAGES.map((stageDef) => {
                const column = leads.filter(
                  (l) => String(l.stage ?? 'new') === stageDef.key,
                )
                return (
                  <div key={stageDef.key} className="w-[78vw] max-w-72 shrink-0 snap-start sm:w-64">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {stageDef.label}
                      </h3>
                      <span className="text-xs text-muted">{column.length}</span>
                    </div>
                    <div className="space-y-2">
                      {column.length === 0 && (
                        <p className="rounded-[10px] border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
                          No leads in this stage
                        </p>
                      )}
                      {column.map((lead, i) => (
                        <button
                          key={lead.id ?? `${lead.name}-${i}`}
                          onClick={() => setSelection({ kind: 'lead', record: lead })}
                          className="card focus-ring block w-full p-3 text-left transition hover:border-primary-200"
                        >
                          <p className="text-sm font-medium text-ink">{lead.name}</p>
                          {lead.company && (
                            <p className="mt-0.5 text-xs text-muted">{lead.company}</p>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-muted">
                              {lead.source ?? 'No source'}
                            </span>
                            <span className="text-xs font-medium text-ink">
                              {lead.value ? formatMoney(lead.value) : '—'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-appbg text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Lead</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Assigned to</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr
                      key={lead.id ?? `${lead.name}-${i}`}
                      onClick={() => setSelection({ kind: 'lead', record: lead })}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-appbg"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{lead.name}</p>
                        {lead.email && <p className="text-xs text-muted">{lead.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted">{lead.company ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{lead.source ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={String(lead.stage ?? 'new')} />
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {lead.value ? formatMoney(lead.value) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted">{lead.assigned_to ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mb-3 mt-8 text-base font-semibold text-ink">Customers</h2>
          {data.customers.length === 0 ? (
            <EmptyState
              title="No customers yet"
              description="Customer records appear here when they are created through the API or when leads convert. Contact history will build up on each customer profile."
            />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-appbg text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Industry</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((customer, i) => (
                    <tr
                      key={customer.id ?? `${customer.name}-${i}`}
                      onClick={() => setSelection({ kind: 'customer', record: customer })}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-appbg"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{customer.name}</p>
                        {customer.email && (
                          <p className="text-xs text-muted">{customer.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">{customer.company ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{customer.industry ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={String(customer.status ?? 'active')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <DetailInspector
        open={selection !== null}
        title={
          selection?.kind === 'lead'
            ? selection.record.name
            : selection?.kind === 'customer'
              ? selection.record.name
              : ''
        }
        subtitle={selection?.kind === 'lead' ? 'Lead' : selection ? 'Customer' : undefined}
        onClose={() => setSelection(null)}
      >
        {selection?.kind === 'lead' && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Company" value={selection.record.company} />
              <Field label="Stage" value={String(selection.record.stage ?? 'new')} />
              <Field label="Email" value={selection.record.email} />
              <Field label="Source" value={selection.record.source} />
              <Field
                label="Estimated value"
                value={selection.record.value ? formatMoney(selection.record.value) : undefined}
              />
              <Field label="Assigned to" value={selection.record.assigned_to} />
            </dl>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-ink">Follow-ups & history</h3>
              <p className="text-sm text-muted">
                No activity recorded for this lead yet. Calls, emails and
                follow-up tasks will appear here as they are logged.
              </p>
            </div>
          </div>
        )}
        {selection?.kind === 'customer' && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Company" value={selection.record.company} />
              <Field label="Industry" value={selection.record.industry} />
              <Field label="Email" value={selection.record.email} />
              <Field label="Phone" value={selection.record.phone} />
              <Field label="Status" value={selection.record.status} />
            </dl>
            {selection.record.notes && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-ink">Notes</h3>
                <p className="text-sm text-muted">{selection.record.notes}</p>
              </div>
            )}
            <div>
              <h3 className="mb-1 text-sm font-semibold text-ink">History</h3>
              <p className="text-sm text-muted">
                No activity recorded for this customer yet. Orders, tickets and
                communications will appear here as they happen.
              </p>
            </div>
          </div>
        )}
      </DetailInspector>
    </div>
  )
}
