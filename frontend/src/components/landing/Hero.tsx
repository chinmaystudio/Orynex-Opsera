import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, Check, PlayCircle } from 'lucide-react'

/**
 * Editorial hero: oversized type set off-axis against a single restrained
 * product detail (a live approval request, the way it appears in the app).
 * No cards row, no gradient decoration.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pb-28">
        <div className="grid items-start gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              The Business OS of the ORYNEX ecosystem
            </p>
            <h1 className="mt-6 max-w-[12ch] text-5xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Your business. One intelligent workforce.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
              Bring your people, AI employees and business tools together.
              OrynexOpraq helps your company plan, execute and automate work
              from one connected platform.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/app" className="l-btn-primary">
                Start with Opraq
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#story" className="l-btn-secondary">
                <PlayCircle className="h-4 w-4 text-brand-600" />
                See how it works
              </a>
            </div>
            <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="font-medium text-ink">One workspace.</span>
              <span aria-hidden="true" className="text-line">
                |
              </span>
              <span className="font-medium text-ink">Connected tools.</span>
              <span aria-hidden="true" className="text-line">
                |
              </span>
              <span className="font-medium text-ink">An AI workforce.</span>
            </p>
          </div>

          {/* Product detail: one approval, exactly as a manager sees it. */}
          <div className="relative lg:col-span-5 lg:pt-24">
            <div className="relative border-l-2 border-lavender pl-6 sm:pl-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Happening now, in the Command Center
              </p>
              <div className="mt-5 max-w-sm rounded-xl border border-line bg-white p-5 shadow-[0_16px_40px_-24px_rgba(23,23,23,0.25)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Approval requested
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Sales Agent · HIGH risk action
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                    Pending
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  Send follow-up emails to 12 priority clients and schedule
                  their meetings this week?
                </p>
                <div className="mt-4 space-y-2 border-t border-line pt-4 text-[13px] text-muted">
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    Customer records reviewed in your CRM
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarCheck2 className="h-3.5 w-3.5 text-brand-600" />
                    Calendar availability checked first
                  </p>
                </div>
                <div className="mt-5 flex gap-2">
                  <span className="inline-flex items-center rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white">
                    Approve and schedule
                  </span>
                  <span className="inline-flex items-center rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-ink">
                    Review messages
                  </span>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-muted">
                Nothing sensitive runs on its own. AI employees prepare the
                work; a person approves it. Every step is recorded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
