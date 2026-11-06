import { Link } from 'react-router-dom'
import { Wordmark } from './Navbar'

const COLUMNS: Array<{
  heading: string
  links: Array<{ label: string; to?: string }>
}> = [
  {
    heading: 'Product',
    links: [
      { label: 'AI Workforce', to: '/app/ai-workforce' },
      { label: 'Automation', to: '/app/automations' },
      { label: 'Integrations', to: '/app/integrations' },
      { label: 'Analytics', to: '/app/analytics' },
    ],
  },
  {
    heading: 'Ecosystem',
    links: [
      { label: 'OrynexNeuroclass' },
      { label: 'OrynexLaunchpad' },
      { label: 'OrynexOpraq', to: '/' },
      { label: 'OrynexAegis' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About' },
      { label: 'Contact' },
      { label: 'Documentation' },
      { label: 'Privacy' },
      { label: 'Terms' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The Business OS of the ORYNEX ecosystem. ORYNEX CORE connects
              everything; OrynexAegis provides the Agent OS.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav
              key={col.heading}
              className="md:col-span-2"
              aria-label={col.heading}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-muted transition hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-sm text-muted transition hover:text-ink"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="md:col-span-1" />
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>OrynexOpraq — part of the ORYNEX ecosystem.</p>
          <p>Human approval for high-risk actions, by design.</p>
        </div>
      </div>
    </footer>
  )
}
