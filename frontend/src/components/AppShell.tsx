import { useEffect, useState, type FormEvent } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Code2,
  Gauge,
  HandCoins,
  Headset,
  KanbanSquare,
  LayoutGrid,
  LifeBuoy,
  Megaphone,
  Menu,
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
import GlobalSearch from './GlobalSearch'
import MobileBottomNav from './MobileBottomNav'

export interface ModuleDef {
  path: string
  label: string
  icon: typeof Gauge
}

export interface NavGroup {
  label: string
  items: ModuleDef[]
}

const LOGO_SRC = '/9f4ebccd-ad18-4fe6-ac83-73f22f9953f4.png'

/**
 * Grouped sidebar navigation — exactly three groups (Main / Work /
 * System). Same modules and same paths as before.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { path: '/app', label: 'Command Center', icon: Gauge },
      { path: '/app/ai-workforce', label: 'AI Workforce', icon: Bot },
      { path: '/app/departments', label: 'Departments', icon: Building2 },
    ],
  },
  {
    label: 'Work',
    items: [
      { path: '/app/crm-sales', label: 'CRM & Sales', icon: Users },
      { path: '/app/marketing', label: 'Marketing', icon: Megaphone },
      { path: '/app/finance', label: 'Finance', icon: HandCoins },
      { path: '/app/hr', label: 'Human Resources', icon: Briefcase },
      { path: '/app/support', label: 'Customer Support', icon: Headset },
      {
        path: '/app/projects',
        label: 'Projects & Operations',
        icon: KanbanSquare,
      },
      { path: '/app/tasks', label: 'Tasks', icon: CheckSquare },
      { path: '/app/approvals', label: 'Approvals', icon: ShieldCheck },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/app/automations', label: 'Automations', icon: Workflow },
      { path: '/app/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/app/marketplace', label: 'Agent Marketplace', icon: Sparkles },
      { path: '/app/creative-studio', label: 'Creative Studio', icon: Clapperboard },
      { path: '/app/engineering-studio', label: 'Engineering Studio', icon: Code2 },
      { path: '/app/integrations', label: 'Integrations', icon: LayoutGrid },
      { path: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
]

/** All 16 modules, in the order defined by the spec (§12 + §23). */
export const MODULES: ModuleDef[] = [
  { path: '/app', label: 'Command Center', icon: Gauge },
  { path: '/app/ai-workforce', label: 'AI Workforce', icon: Bot },
  { path: '/app/departments', label: 'Departments', icon: Building2 },
  { path: '/app/crm-sales', label: 'CRM & Sales', icon: Users },
  { path: '/app/marketing', label: 'Marketing', icon: Megaphone },
  { path: '/app/finance', label: 'Finance', icon: HandCoins },
  { path: '/app/hr', label: 'Human Resources', icon: Briefcase },
  { path: '/app/projects', label: 'Projects & Operations', icon: KanbanSquare },
  { path: '/app/support', label: 'Customer Support', icon: Headset },
  { path: '/app/automations', label: 'Automations', icon: Workflow },
  { path: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/app/integrations', label: 'Integrations', icon: LayoutGrid },
  { path: '/app/marketplace', label: 'Agent Marketplace', icon: Sparkles },
  { path: '/app/settings', label: 'Settings', icon: Settings },
  { path: '/app/creative-studio', label: 'Creative Studio', icon: Clapperboard },
  { path: '/app/engineering-studio', label: 'Engineering Studio', icon: Code2 },
]

const ALL_NAV_ITEMS: ModuleDef[] = NAV_GROUPS.flatMap((g) => g.items)

function currentModuleLabel(pathname: string): string {
  const match = [...ALL_NAV_ITEMS]
    .sort((a, b) => b.path.length - a.path.length)
    .find(
      (m) =>
        pathname === m.path ||
        (m.path !== '/app' && pathname.startsWith(`${m.path}/`)),
    )
  return match?.label ?? 'Command Center'
}

/* ------------------------------------------------------------------ */
/* AI Command bar — behaviour unchanged from the previous shell: it    */
/* POSTs to /api/v1/command, renders the returned plan, and states     */
/* honestly when the backend is offline (nothing was executed).        */
/* ------------------------------------------------------------------ */

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
        <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-600" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask OPRAQ to do something..."
          className="input pl-9 pr-24"
          aria-label="AI command bar"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {busy ? 'Planning…' : 'Run'}
        </button>
      </form>

      {open && (result || offline || error) && (
        <div className="card absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto p-4 shadow-popover">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Execution plan
            </p>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-muted hover:bg-appbg hover:text-ink"
              aria-label="Close plan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {offline && (
            <p className="text-sm text-muted">
              <span className="font-medium text-warning">Backend offline.</span>{' '}
              The command service at the configured API base URL is unreachable,
              so no plan was generated. Start the backend and try again — nothing
              was executed.
            </p>
          )}
          {error && (
            <p className="text-sm text-error">
              The backend returned an error: {error}. Nothing was executed.
            </p>
          )}
          {result && (
            <div>
              {result.summary && (
                <p className="mb-3 text-sm text-ink">{result.summary}</p>
              )}
              {result.plan && result.plan.length > 0 ? (
                <ol className="space-y-2">
                  {result.plan.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-[10px] bg-appbg px-3 py-2"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
                        {step.step ?? i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">
                          {step.description ?? step.action ?? step.tool ?? 'Step'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {step.tool && (
                            <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted ring-1 ring-line">
                              {step.tool}
                            </span>
                          )}
                          {step.risk_level && (
                            <RiskBadge level={step.risk_level} />
                          )}
                          {step.requires_approval && (
                            <span className="text-[11px] font-medium text-warning">
                              Requires approval
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">
                  The backend returned no plan steps for this command.
                </p>
              )}
              <p className="mt-3 border-t border-line pt-2 text-xs text-muted">
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

/* ------------------------------------------------------------------ */
/* Sidebar content (shared by the desktop rail and the mobile drawer)  */
/* ------------------------------------------------------------------ */

function SidebarNav({
  collapsed,
  pendingApprovals,
  onNavigate,
}: {
  collapsed: boolean
  pendingApprovals: number | null
  onNavigate?: () => void
}) {
  return (
    <nav
      className="sidebar-scroll flex-1 space-y-6 overflow-y-auto px-3 py-4"
      aria-label="Primary"
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {collapsed ? (
            <div className="mx-2 mb-2 border-t border-line" aria-hidden />
          ) : (
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((mod) => {
              const Icon = mod.icon
              const showBadge =
                mod.path === '/app/approvals' &&
                pendingApprovals !== null &&
                pendingApprovals > 0
              return (
                <NavLink
                  key={mod.path}
                  to={mod.path}
                  end={mod.path === '/app'}
                  onClick={onNavigate}
                  title={collapsed ? mod.label : undefined}
                  aria-label={mod.label}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition ${
                      isActive
                        ? 'bg-primary-50 font-medium text-primary-600 [&_svg]:text-primary-600'
                        : 'text-muted hover:bg-appbg hover:text-ink'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 text-muted" />
                  {!collapsed && <span className="truncate">{mod.label}</span>}
                  {!collapsed && showBadge && (
                    <span className="ml-auto rounded-full bg-warning px-2 py-0.5 text-xs font-semibold text-white">
                      {pendingApprovals}
                    </span>
                  )}
                  {collapsed && showBadge && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning" />
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function SidebarBottom({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean
  onToggleCollapse?: () => void
}) {
  return (
    <div className="space-y-1 border-t border-line p-3">
      <NavLink
        to="/app/settings"
        title={collapsed ? 'Help & Documentation' : undefined}
        aria-label="Help and documentation"
        className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-muted transition hover:bg-appbg hover:text-ink"
      >
        <LifeBuoy className="h-[18px] w-[18px] shrink-0 text-muted" />
        {!collapsed && (
          <>
            <span className="truncate">Help & Documentation</span>
            <span className="ml-auto rounded-full bg-appbg px-1.5 py-0.5 text-[10px] font-medium text-muted ring-1 ring-inset ring-line">
              Soon
            </span>
          </>
        )}
      </NavLink>

      {!collapsed && (
        <div className="rounded-[10px] bg-appbg px-3 py-2.5">
          <p className="truncate text-xs font-medium text-ink">
            Default Workspace
          </p>
          <p className="text-[11px] text-muted">1 workspace · Owner access</p>
        </div>
      )}

      <div
        className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 ${
          collapsed ? 'justify-center px-0' : ''
        }`}
        title="Chinmay — Owner"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
          C
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight text-ink">
              Chinmay
            </p>
            <p className="text-[11px] leading-tight text-muted">Owner</p>
          </div>
        )}
      </div>

      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : undefined}
          className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-muted transition hover:bg-appbg hover:text-ink ${
            collapsed ? 'justify-center px-0' : ''
          }`}
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
      )}
    </div>
  )
}

function LogoLink({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center"
      title="OrynexOpraq — back to the public site"
      aria-label="OrynexOpraq — back to the public site"
    >
      {collapsed ? (
        <span className="block h-9 w-9 shrink-0 overflow-hidden">
          <img
            src={LOGO_SRC}
            alt="OrynexOpraq"
            className="h-9 w-[108px] max-w-none object-cover object-left"
          />
        </span>
      ) : (
        <img
          src={LOGO_SRC}
          alt="OrynexOpraq"
          className="h-10 w-auto max-w-[160px] object-contain"
        />
      )}
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null)
  // Icon rail on md viewports; full sidebar on lg+ (unless user collapsed it).
  const [isRailViewport, setIsRailViewport] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023.98px)')
    const update = () => setIsRailViewport(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const effectiveCollapsed = collapsed || isRailViewport

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

  /* Close the mobile drawer on navigation, and lock body scroll while open. */
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [mobileOpen])

  const moduleLabel = currentModuleLabel(location.pathname)

  return (
    <div className="flex min-h-screen bg-appbg">
      {/* Sidebar: hidden on mobile, icon rail on md, full on lg+ */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 md:flex ${
          effectiveCollapsed ? 'w-[72px]' : 'w-[248px]'
        }`}
      >
        <div className="flex h-16 items-center border-b border-line px-4">
          <LogoLink collapsed={effectiveCollapsed} />
        </div>
        <SidebarNav collapsed={effectiveCollapsed} pendingApprovals={pendingApprovals} />
        <SidebarBottom
          collapsed={effectiveCollapsed}
          onToggleCollapse={
            isRailViewport ? undefined : () => setCollapsed((c) => !c)
          }
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/40"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-surface shadow-popover">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <LogoLink collapsed={false} />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="focus-ring rounded-lg p-1.5 text-muted transition hover:bg-appbg hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav
              collapsed={false}
              pendingApprovals={pendingApprovals}
              onNavigate={() => setMobileOpen(false)}
            />
            <SidebarBottom collapsed={false} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="focus-ring shrink-0 rounded-lg p-2 text-muted transition hover:bg-appbg hover:text-ink md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav
            aria-label="Breadcrumb"
            className="hidden shrink-0 items-center gap-1.5 text-sm md:flex"
          >
            <span className="font-semibold tracking-wide text-muted">OPRAQ</span>
            <ChevronRight className="h-4 w-4 text-line" />
            <span className="truncate font-medium text-ink">{moduleLabel}</span>
          </nav>

          <CommandBar />

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search (Ctrl K)"
              className="focus-ring hidden items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-muted transition hover:bg-appbg hover:text-ink md:flex"
            >
              <Search className="h-4 w-4" />
              <span className="hidden xl:inline">Search</span>
              <kbd className="rounded border border-line bg-appbg px-1.5 py-0.5 text-[10px] font-medium text-muted">
                Ctrl K
              </kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="focus-ring rounded-lg p-2 text-muted transition hover:bg-appbg hover:text-ink md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="focus-ring relative rounded-lg p-2 text-muted transition hover:bg-appbg hover:text-ink"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
              {notifOpen && (
                <>
                  <button
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setNotifOpen(false)}
                    className="fixed inset-0 z-40 h-full w-full cursor-default"
                  />
                  <div className="card absolute right-0 top-full z-50 mt-2 w-80 p-4 shadow-popover">
                    <p className="text-sm font-semibold text-ink">
                      Notifications
                    </p>
                    <p className="mt-1.5 text-sm text-muted">
                      No notification feed is connected yet. Activity
                      notifications will appear here once the backend emits
                      them — nothing is being hidden from you.
                    </p>
                    <button
                      onClick={() => {
                        setNotifOpen(false)
                        navigate('/app/approvals')
                      }}
                      className="btn-secondary mt-3 w-full justify-center"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Review approvals
                      {pendingApprovals !== null && pendingApprovals > 0
                        ? ` (${pendingApprovals} pending)`
                        : ''}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => navigate('/app/approvals')}
              className="focus-ring relative rounded-lg p-2 text-muted transition hover:bg-appbg hover:text-ink"
              aria-label="Pending approvals"
              title="Pending approvals"
            >
              <ShieldCheck className="h-5 w-5" />
              {pendingApprovals !== null && pendingApprovals > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-white">
                  {pendingApprovals}
                </span>
              )}
            </button>

            <button className="focus-ring hidden items-center gap-1.5 rounded-[10px] border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-appbg sm:flex">
              Default Workspace
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>

            <div
              className="flex items-center gap-2 pl-1"
              title="Chinmay — Owner"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                C
              </div>
              <div className="hidden xl:block">
                <p className="text-sm font-medium leading-tight text-ink">
                  Chinmay
                </p>
                <p className="text-[11px] leading-tight text-muted">Owner</p>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-line bg-surface px-6 pb-24 pt-3 text-center text-xs text-muted lg:pb-3">
          OrynexOpraq — part of the ORYNEX ecosystem. OrynexAegis provides the
          Agent OS; ORYNEX CORE connects everything.
        </footer>
      </div>

      <MobileBottomNav
        pendingApprovals={pendingApprovals}
        onMore={() => setMobileOpen(true)}
      />

      <GlobalSearch
        open={searchOpen}
        onOpen={() => setSearchOpen(true)}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  )
}
