import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Building2,
  CheckSquare,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { api } from '../lib/api'
import { AGENT_PRESETS } from '../lib/presets'
import type { BusinessTask } from '../lib/types'
import { MODULES } from './AppShell'

/**
 * Global search (Ctrl/Cmd+K). Sources are all real, local data:
 * - Pages: the application's actual module routes.
 * - Agents: the 40 registry presets from lib/presets (labelled "Preset" —
 *   they are not claimed to be deployed).
 * - Departments: the departments seeded for OrynexOpraq.
 * - Tasks: live from GET /api/v1/tasks when the backend is reachable;
 *   the category is silently omitted when it is not.
 * No results are ever fabricated.
 */

const DEPARTMENTS: { name: string; description: string }[] = [
  { name: 'Executive', description: 'Executive office and company leadership.' },
  { name: 'Sales', description: 'Leads, CRM, pipeline, deals and follow-ups.' },
  { name: 'Marketing', description: 'Campaigns, content and analytics.' },
  { name: 'Finance', description: 'Income, expenses, invoices and budgets.' },
  { name: 'Human Resources', description: 'Employees, recruitment and onboarding.' },
  { name: 'Operations', description: 'Processes, tasks, resources and vendors.' },
  { name: 'Customer Support', description: 'Tickets, escalations and satisfaction.' },
  { name: 'Research & Intelligence', description: 'Market and competitor research.' },
  { name: 'Creative Studio', description: 'Design, brand, video and media production.' },
  { name: 'Engineering Studio', description: 'Repositories, code review and CI/CD.' },
]

const EXTRA_PAGES = [
  { path: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/app/approvals', label: 'Approvals', icon: ShieldCheck },
]

interface SearchResult {
  key: string
  category: string
  label: string
  hint?: string
  badge?: string
  path: string
  Icon: ComponentType<{ className?: string }>
}

const CATEGORY_ORDER = ['Pages', 'Agents', 'Departments', 'Tasks']
const CATEGORY_LIMIT = 8

export default function GlobalSearch({
  open,
  onOpen,
  onClose,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tasks, setTasks] = useState<BusinessTask[]>([])
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  /* Ctrl/Cmd+K toggles the palette from anywhere in the app. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) onClose()
        else onOpen()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpen, onClose])

  /* On open: reset, focus, and try to load live tasks (silent if offline). */
  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 30)
    let cancelled = false
    api
      .getTasks()
      .then((list) => {
        if (!cancelled) setTasks(list)
      })
      .catch(() => {
        if (!cancelled) setTasks([])
      })
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [open ])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (text: string) => !q || text.toLowerCase().includes(q)

    const pages: SearchResult[] = [
      ...MODULES.map((m) => ({
        key: `page-${m.path}`,
        category: 'Pages',
        label: m.label,
        path: m.path,
        Icon: m.icon,
      })),
      ...EXTRA_PAGES.filter(
        (p) => !MODULES.some((m) => m.path === p.path),
      ).map((p) => ({
        key: `page-${p.path}`,
        category: 'Pages',
        label: p.label,
        path: p.path,
        Icon: p.icon as ComponentType<{ className?: string }>,
      })),
    ].filter((r) => matches(r.label))

    const agents: SearchResult[] = AGENT_PRESETS.filter(
      (a) =>
        matches(a.name) || matches(a.role) || matches(a.department),
    ).map((a) => ({
      key: `agent-${a.slug}`,
      category: 'Agents',
      label: a.name,
      hint: `${a.role} · ${a.department}`,
      badge: 'Preset',
      path: '/app/ai-workforce',
      Icon: Bot,
    }))

    const departments: SearchResult[] = DEPARTMENTS.filter(
      (d) => matches(d.name) || matches(d.description),
    ).map((d) => ({
      key: `dept-${d.name}`,
      category: 'Departments',
      label: d.name,
      hint: d.description,
      path: '/app/departments',
      Icon: Building2,
    }))

    const taskResults: SearchResult[] =
      tasks.length === 0
        ? []
        : tasks
            .filter(
              (t) =>
                matches(t.title) ||
                (t.department ? matches(t.department) : false),
            )
            .map((t, i) => ({
              key: `task-${t.id ?? i}`,
              category: 'Tasks',
              label: t.title,
              hint: [t.department, t.status?.replace(/_/g, ' ')]
                .filter(Boolean)
                .join(' · '),
              path: '/app/tasks',
              Icon: CheckSquare,
            }))

    const all = [
      { category: 'Pages', items: pages },
      { category: 'Agents', items: agents },
      { category: 'Departments', items: departments },
      { category: 'Tasks', items: taskResults },
    ]
    return all
      .map((g) => ({ ...g, items: g.items.slice(0, CATEGORY_LIMIT) }))
      .filter((g) => g.items.length > 0)
      .sort(
        (a, b) =>
          CATEGORY_ORDER.indexOf(a.category) -
          CATEGORY_ORDER.indexOf(b.category),
      )
  }, [query, tasks])

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  function select(result: SearchResult) {
    onClose()
    navigate(result.path)
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = flat[active] ?? flat[0]
      if (target) select(target)
    }
  }

  let runningIndex = -1

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <button
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/40"
      />
      <div className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-panel bg-surface shadow-popover">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search pages, agents, departments, tasks…"
            aria-label="Search"
            className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="focus-ring rounded-lg p-1.5 text-muted transition hover:bg-appbg hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-ink">
                No results for “{query}”
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Try a page name (Finance), an agent (Sales Manager), a
                department, or a task title.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.category} className="py-1">
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {group.category}
                </p>
                {group.items.map((r) => {
                  runningIndex += 1
                  const idx = runningIndex
                  const isActive = idx === active
                  const Icon = r.Icon
                  return (
                    <button
                      key={r.key}
                      data-idx={idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => select(r)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition ${
                        isActive
                          ? 'bg-primary-50 text-ink'
                          : 'text-slate-600'
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          isActive ? 'text-primary-600' : 'text-muted'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {r.label}
                        </span>
                        {r.hint && (
                          <span className="block truncate text-xs text-muted">
                            {r.hint}
                          </span>
                        )}
                      </span>
                      {r.badge && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-line">
                          {r.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line bg-appbg px-4 py-2 text-[11px] text-muted">
          <span>
            <kbd className="rounded border border-line bg-surface px-1">↑↓</kbd>{' '}
            navigate
          </span>
          <span>
            <kbd className="rounded border border-line bg-surface px-1">
              Enter
            </kbd>{' '}
            open
          </span>
          <span>
            <kbd className="rounded border border-line bg-surface px-1">
              Esc
            </kbd>{' '}
            close
          </span>
        </div>
      </div>
    </div>
  )
}
