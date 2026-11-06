import { useEffect, useState, type FormEvent } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  CheckSquare,
  ChevronDown,
  Clapperboard,
  Code2,
  Gauge,
  HandCoins,
  Headset,
  KanbanSquare,
  LayoutGrid,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
} from 'lucide-react'
import { api, BackendOfflineError } from '../lib/api'
import type { CommandResponse } from '../lib/types'
import { RiskBadge } from './ui'

export interface ModuleDef {
  path: string
  label: string
  icon: typeof Gauge
}

/** All 16 modules, in the order defined by the spec (§12 + §23). */
export const MODULES: ModuleDef[] = [
  { path: '/', label: 'Command Center', icon: Gauge },
  { path: '/ai-workforce', label: 'AI Workforce', icon: Bot },
  { path: '/departments', label: 'Departments', icon: Building2 },
  { path: '/crm-sales', label: 'CRM & Sales', icon: Users },
  { path: '/marketing', label: 'Marketing', icon: Megaphone },
  { path: '/finance', label: 'Finance', icon: HandCoins },
  { path: '/hr', label: 'Human Resources', icon: Users },
  { path: '/projects', label: 'Projects & Operations', icon: KanbanSquare },
  { path: '/support', label: 'Customer Support', icon: Headset },
  { path: '/automations', label: 'Automations', icon: Workflow },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/integrations', label: 'Integrations', icon: LayoutGrid },
  { path: '/marketplace', label: 'Agent Marketplace', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/creative-studio', label: 'Creative Studio', icon: Clapperboard },
  { path: '/engineering-studio', label: 'Engineering Studio', icon: Code2 },
]

function CommandBar() {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CommandResponse | null>(null)
  const [open, setOpen] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const command = value.trim()
    if (!command || busy) return
    setBusy(true)
    setOffline(false)
    setError(null)
    setResult(null)
    setOpen(true)
    try {
      const res = await api.postCommand(command)
      setResult(res)
    } catch (err) {
      if (err instanceof BackendOfflineError) {
        setOffline(true)
      } else {
        setError(err instanceof Error ? err.message : 'Command failed')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-w-0 flex-1 max-w-xl">
      <form onSubmit={submit} className="relative">
        <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-500" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='AI command — e.g. "Generate a sales performance report"'
          className="input pl-9 pr-24"
          aria-label="AI command bar"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? 'Planning…' : 'Run'}
        </button>
      </form>

      {open && (result || offline || error) && (
        <div className="card absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Execution plan
            </p>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close plan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {offline && (
            <p className="text-sm text-slate-600">
              <span className="font-medium text-amber-600">Backend offline.</span>{' '}
              The command service at the configured API base URL is unreachable,
              so no plan was generated. Start the backend and try again — nothing
              was executed.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600">
              The backend returned an error: {error}. Nothing was executed.
            </p>
          )}
          {result && (
            <div>
              {result.summary && (
                <p className="mb-3 text-sm text-slate-700">{result.summary}</p>
              )}
              {result.plan && result.plan.length > 0 ? (
                <ol className="space-y-2">
                  {result.plan.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                        {step.step ?? i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800">
                          {step.description ?? step.action ?? step.tool ?? 'Step'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {step.tool && (
                            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-500 ring-1 ring-slate-200">
                              {step.tool}
                            </span>
                          )}
                          {step.risk_level && (
                            <RiskBadge level={step.risk_level} />
                          )}
                          {step.requires_approval && (
                            <span className="text-[11px] font-medium text-amber-600">
                              Requires approval
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">
                  The backend returned no plan steps for this command.
                </p>
              )}
              <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">
                {result.executed
                  ? 'This command was executed by the backend. See execution history for details.'
                  : 'Plan only — nothing has been executed yet. Sensitive steps require approval before they run.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    api
      .getApprovals()
      .then((list) => {
        if (!cancelled) {
          setPendingApprovals(
            list.filter((a) => String(a.status).toLowerCase() === 'pending')
              .length,
          )
        }
      })
      .catch(() => {
        if (!cancelled) setPendingApprovals(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 text-sm font-bold text-white">
            O
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-slate-900">
                OrynexOpsera
              </p>
              <p className="text-[11px] leading-tight text-slate-400">
                Business Operating System
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon
            return (
              <NavLink
                key={mod.path}
                to={mod.path}
                end={mod.path === '/'}
                title={collapsed ? mod.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-brand-50 font-medium text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{mod.label}</span>}
              </NavLink>
            )
          })}
          <NavLink
            to="/tasks"
            title={collapsed ? 'Tasks' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <CheckSquare className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="truncate">Tasks</span>}
          </NavLink>
          <NavLink
            to="/approvals"
            title={collapsed ? 'Approvals' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="truncate">Approvals</span>}
            {!collapsed &&
              pendingApprovals !== null &&
              pendingApprovals > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {pendingApprovals}
                </span>
              )}
          </NavLink>
        </nav>

        <div className="border-t border-slate-100 p-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px]" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="relative hidden w-56 shrink-0 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Global search…"
              aria-label="Global search"
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/tasks')
              }}
            />
          </div>

          <CommandBar />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Notifications"
              title="Notifications — no notification feed is wired up in Phase 1"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/approvals')}
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Pending approvals"
              title="Pending approvals"
            >
              <ShieldCheck className="h-5 w-5" />
              {pendingApprovals !== null && pendingApprovals > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {pendingApprovals}
                </span>
              )}
            </button>
            <button className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex">
              Default Workspace
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            <div className="flex items-center gap-2 pl-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                C
              </div>
              <div className="hidden xl:block">
                <p className="text-sm font-medium leading-tight text-slate-800">
                  Chinmay
                </p>
                <p className="text-[11px] leading-tight text-slate-400">
                  Owner
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-xs text-slate-400">
          OrynexOpsera — part of the ORYNEX ecosystem. OrynexAegis provides the
          Agent OS; ORYNEX CORE connects everything.
        </footer>
      </div>
    </div>
  )
}
