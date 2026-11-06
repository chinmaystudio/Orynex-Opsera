import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="bg-deep text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Give your business a better way to work.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
          Connect your tools, organize your workforce and put intelligent
          automation to work.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/app" className="l-btn-on-dark w-full sm:w-auto">
            Launch OrynexOpraq
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/app/ai-workforce"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/35 transition duration-200 hover:-translate-y-px hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Explore the platform
          </Link>
        </div>
      </div>
    </section>
  )
}
