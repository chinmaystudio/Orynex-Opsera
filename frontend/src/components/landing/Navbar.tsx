import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        O
      </span>
      <span
        className={`text-[15px] font-semibold tracking-tight ${
          dark ? 'text-white' : 'text-ink'
        }`}
      >
        Orynex<span className="text-brand-600">Opsera</span>
      </span>
    </span>
  )
}

const CENTER_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#automation' },
  { label: 'AI Workforce', href: '#workforce' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Resources', href: '#security' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5 sm:px-8">
        <Link to="/" aria-label="OrynexOpsera home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav
          className="mx-auto hidden items-center gap-8 lg:flex"
          aria-label="Landing"
        >
          {CENTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted transition hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:ml-0">
          <Link
            to="/app"
            className="hidden px-2 py-2 text-sm font-medium text-ink transition hover:text-brand-600 sm:block"
          >
            Sign in
          </Link>
          <Link to="/app" className="l-btn-primary px-4 py-2 sm:px-5 sm:py-2.5">
            Launch Opsera
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
