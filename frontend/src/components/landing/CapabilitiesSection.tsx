import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Code2,
  FileText,
  HandCoins,
  Headset,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

const LENSES = [
  {
    title: 'Attribution',
    question: 'Where is AI work going?',
  },
  {
    title: 'Throughput',
    question: 'What is AI changing?',
  },
  {
    title: 'Governance',
    question: 'Is AI creating value responsibly?',
  },
]

const INPUTS = [
  { label: 'CRM', icon: Users },
  { label: 'Finance', icon: HandCoins },
  { label: 'Support', icon: Headset },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Code', icon: Code2 },
  { label: 'Docs', icon: FileText },
]

const VALUE_LENSES = [
  { label: 'Attribution', icon: BarChart3 },
  { label: 'Throughput', icon: Zap },
  { label: 'Governance', icon: ShieldCheck },
]

function InsightsCube() {
  return (
    <svg
      viewBox="0 0 240 220"
      role="img"
      aria-label="Layered cube representing Opraq Insights"
      className="h-auto w-full max-w-[230px]"
    >
      {/* Offset layers behind the cube suggest the sources converging into one model. */}
      <g fill="none" stroke="#D2E3FC" strokeWidth="2">
        <path d="M120 24 198 68v84l-78 44-78-44V68l78-44Z" opacity="0.45" transform="translate(10 8)" />
        <path d="M120 24 198 68v84l-78 44-78-44V68l78-44Z" opacity="0.7" transform="translate(5 4)" />
      </g>
      <path d="M120 22 199 67 120 112 41 67 120 22Z" fill="#E8F0FE" />
      <path d="M41 67 120 112v88L41 155V67Z" fill="#D2E3FC" />
      <path d="M199 67 120 112v88l79-45V67Z" fill="#AECBFA" />
      <path
        d="M120 22 199 67v88l-79 45-79-45V67l79-45Z"
        fill="none"
        stroke="#8AB4F8"
        strokeWidth="2"
      />
      <path d="M41 67 120 112 199 67M120 112v88" fill="none" stroke="#8AB4F8" strokeWidth="2" />
    </svg>
  )
}

function IntakeSlab() {
  return (
    <svg viewBox="0 0 132 72" className="h-auto w-full" aria-hidden="true">
      <path d="M66 6 124 28 66 50 8 28 66 6Z" fill="#E8F0FE" />
      <path d="M8 28 66 50v16L8 44V28Z" fill="#D2E3FC" />
      <path d="M124 28 66 50v16l58-22V28Z" fill="#AECBFA" />
      <path
        d="M66 6 124 28v16L66 66 8 44V28L66 6Z"
        fill="none"
        stroke="#8AB4F8"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/**
 * Business-value view of the platform: work from every department flows
 * into Opraq Insights, then is read through three explicit lenses.
 */
export default function CapabilitiesSection() {
  return (
    <section
      id="product"
      className="scroll-mt-16 border-t border-line bg-paper"
      aria-labelledby="business-value-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <h2 id="business-value-heading" className="sr-only">
          How Opraq creates business value
        </h2>

        {/* Three questions frame the diagram, as separate bordered cells. */}
        <div className="grid border border-line md:grid-cols-3">
          {LENSES.map((lens, index) => (
            <div
              key={lens.title}
              className={`px-6 py-5 ${index > 0 ? 'border-t border-line md:border-l md:border-t-0' : ''}`}
            >
              <h3 className="text-base font-semibold uppercase tracking-[0.08em] text-ink">
                {lens.title}
              </h3>
              <p className="mt-1.5 text-[15px] text-muted">{lens.question}</p>
            </div>
          ))}
        </div>

        {/* Flow diagram. The panels are white on the paper background;
            connector lines are drawn inside/behind the visual elements. */}
        <div className="relative mt-6">
          <div className="grid gap-5 lg:h-[470px] lg:grid-cols-3">
            {/* Inputs */}
            <article className="relative overflow-hidden bg-white px-7 py-8 lg:h-full">
              <svg
                className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
                viewBox="0 0 360 470"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <g fill="none" stroke="#AECBFA" strokeWidth="1.5">
                  <path d="M92 82 C175 130 215 245 292 326" />
                  <path d="M218 82 C245 165 255 250 292 326" />
                  <path d="M92 202 C170 225 220 275 292 326" />
                  <path d="M218 202 C245 245 260 285 292 326" />
                  <path d="M92 322 C175 318 225 322 292 326" />
                  <path d="M218 322 C245 324 265 325 292 326" />
                </g>
                <g fill="#4285F4">
                  <circle cx="92" cy="82" r="3" />
                  <circle cx="218" cy="82" r="3" />
                  <circle cx="92" cy="202" r="3" />
                  <circle cx="218" cy="202" r="3" />
                  <circle cx="92" cy="322" r="3" />
                  <circle cx="218" cy="322" r="3" />
                </g>
              </svg>

              <div className="relative z-10 grid max-w-[245px] grid-cols-2 gap-x-8 gap-y-9">
                {INPUTS.map((input) => (
                  <div key={input.label} className="flex flex-col items-start gap-2">
                    <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-50 text-muted">
                      <input.icon className="h-7 w-7" strokeWidth={1.6} />
                    </span>
                    <span className="text-xs font-medium text-muted">{input.label}</span>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-[104px] right-4 z-10 hidden w-[105px] lg:block">
                <IntakeSlab />
              </div>

              <p className="relative z-10 mt-12 max-w-[300px] text-[15px] leading-relaxed text-ink lg:absolute lg:bottom-8 lg:left-7 lg:right-7 lg:mt-0">
                Work, spend and activity across departments, tools and AI
                employees flow in
              </p>
            </article>

            {/* Opraq Insights */}
            <article className="relative flex flex-col items-center overflow-hidden bg-white px-8 py-8 lg:h-full">
              <p className="relative z-10 rounded-md border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink">
                Opraq Insights
              </p>
              <div className="relative z-10 mt-10 flex flex-1 items-start justify-center lg:mt-12">
                <InsightsCube />
              </div>
              <p className="relative z-10 max-w-[310px] text-[15px] leading-relaxed text-ink lg:absolute lg:bottom-8 lg:left-8 lg:right-8">
                Everything converges in Opraq Insights — one source of truth
                for your business
              </p>
            </article>

            {/* Business Value */}
            <article className="relative overflow-hidden bg-white px-7 py-8 lg:h-full">
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5">
                {VALUE_LENSES.map((lens) => (
                  <span
                    key={lens.label}
                    className="inline-flex items-center gap-2 rounded-md border border-line bg-lavender/60 px-3.5 py-2 text-sm font-medium text-deep"
                  >
                    <lens.icon className="h-4 w-4 text-accent-600" />
                    {lens.label}
                  </span>
                ))}
              </div>

              <div className="relative z-10 mx-auto mt-12 flex justify-center lg:mt-16">
                <div className="relative flex h-44 w-44 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 translate-y-2 rounded-full bg-primary-100"
                  />
                  <span className="relative flex h-44 w-44 flex-col items-center justify-center rounded-full bg-lavender px-6 text-center">
                    <TrendingUp className="mb-2 h-6 w-6 text-accent-600" />
                    <span className="text-xl font-semibold leading-tight text-deep">
                      Business Value
                    </span>
                  </span>
                </div>
              </div>

              <p className="relative z-10 mx-auto mt-12 max-w-[300px] text-[15px] leading-relaxed text-ink lg:absolute lg:bottom-8 lg:left-7 lg:right-7 lg:mt-0">
                Data is read through three lenses: Attribution, Throughput
                and Governance
              </p>
            </article>
          </div>

          {/* Short curved connectors across the two panel gaps on desktop. */}
          <svg
            className="pointer-events-none absolute left-[31.5%] top-[238px] z-20 hidden h-16 w-[5.5%] lg:block"
            viewBox="0 0 70 64"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g fill="none" stroke="#AECBFA" strokeWidth="1.5">
              <path d="M2 12 C25 4 45 18 68 28" />
              <path d="M2 34 C25 34 45 30 68 34" />
              <path d="M2 56 C25 60 45 44 68 40" />
            </g>
            <g fill="#4285F4">
              <circle cx="3" cy="12" r="3" />
              <circle cx="3" cy="34" r="3" />
              <circle cx="3" cy="56" r="3" />
            </g>
          </svg>
          <svg
            className="pointer-events-none absolute left-[64.5%] top-[238px] z-20 hidden h-16 w-[5.5%] lg:block"
            viewBox="0 0 70 64"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g fill="none" stroke="#AECBFA" strokeWidth="1.5">
              <path d="M2 12 C25 4 45 18 68 28" />
              <path d="M2 34 C25 34 45 30 68 34" />
              <path d="M2 56 C25 60 45 44 68 40" />
            </g>
            <g fill="#4285F4">
              <circle cx="67" cy="28" r="3" />
              <circle cx="67" cy="34" r="3" />
              <circle cx="67" cy="40" r="3" />
            </g>
          </svg>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/app/analytics"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Explore business value
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#story" className="l-btn-secondary px-5 py-3">
            See how it works
          </a>
        </div>
      </div>
    </section>
  )
}
