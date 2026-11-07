import { NavLink } from 'react-router-dom'
import { Bot, CheckSquare, Home, Menu, ShieldCheck } from 'lucide-react'

/**
 * Mobile bottom navigation — visible only below lg (`lg:hidden`).
 * Fixed white bar with a top border; the shell adds bottom padding to
 * the main content area so nothing is hidden behind it. "More" opens
 * the existing mobile drawer / full menu.
 */
export default function MobileBottomNav({
  pendingApprovals,
  onMore,
}: {
  pendingApprovals: number | null
  onMore: () => void
}) {
  const items = [
    { path: '/app', label: 'Home', icon: Home, end: true, badge: null as number | null },
    { path: '/app/ai-workforce', label: 'Workforce', icon: Bot, end: false, badge: null },
    { path: '/app/tasks', label: 'Tasks', icon: CheckSquare, end: false, badge: null },
    {
      path: '/app/approvals',
      label: 'Approvals',
      icon: ShieldCheck,
      end: false,
      badge: pendingApprovals !== null && pendingApprovals > 0 ? pendingApprovals : null,
    },
  ]

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface lg:hidden"
    >
      <div className="flex items-stretch">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition ${
                  isActive ? 'text-primary-600' : 'text-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`relative flex items-center justify-center rounded-full px-3 py-0.5 ${
                      isActive ? 'bg-primary-50' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.badge !== null && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={onMore}
          aria-label="More — open full menu"
          className="flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium text-muted transition hover:text-ink"
        >
          <span className="flex items-center justify-center rounded-full px-3 py-0.5">
            <Menu className="h-5 w-5" />
          </span>
          <span className="truncate">More</span>
        </button>
      </div>
    </nav>
  )
}
