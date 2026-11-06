import {
  CheckCircle2,
  Clapperboard,
  Eye,
  FileText,
  Film,
  FolderOpen,
  Image,
  LayoutGrid,
  Mic,
  Scissors,
  type LucideIcon,
} from 'lucide-react'
import { EmptyState, PageHeader } from '../components/ui'
import AgentPresetStrip from '../components/AgentPresetStrip'

const VIDEO_STAGES: Array<{ name: string; icon: LucideIcon }> = [
  { name: 'Script', icon: FileText },
  { name: 'Storyboard', icon: LayoutGrid },
  { name: 'Assets', icon: Image },
  { name: 'Animation', icon: Film },
  { name: 'Voice', icon: Mic },
  { name: 'Edit', icon: Scissors },
  { name: 'Review', icon: Eye },
  { name: 'Done', icon: CheckCircle2 },
]

export default function CreativeStudio() {
  return (
    <div>
      <PageHeader
        title="Creative Studio"
        subtitle="Design, media and video production — an AI creative department working under your brand."
      />

      <div className="space-y-6">
        <AgentPresetStrip department="Creative Studio" title="AI creative team" />

        <div className="grid gap-6 xl:grid-cols-2">
          <EmptyState
            icon={Clapperboard}
            title="No creative projects yet"
            description="Projects, brand assets and video productions arrive with the Creative Studio backend (Phase 3). When it ships, briefs, design work and campaign deliverables will be managed here and linked to the campaigns they belong to."
          />
          <EmptyState
            icon={FolderOpen}
            title="Brand asset library is empty"
            description="Logos, brand guidelines, templates and finished media will live here with version history and review status, once creative tools (Canva, Adobe, Figma) are connected and the studio backend is live. Assets appear only when real files are produced."
          />
        </div>

        {/* ---- Video production pipeline (stage tracker) ---- */}
        <section className="card p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-ink">
              Video production pipeline
            </h2>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              Not started — no productions
            </span>
          </div>
          <p className="mb-5 max-w-3xl text-sm text-muted">
            Every video moves through these stages in order, and each stage is
            tracked separately: a finished script is recorded as a script —
            never reported as a completed video. Stage tracking activates
            with the Creative Studio backend.
          </p>
          <ol className="flex flex-col gap-3 md:flex-row md:gap-0">
            {VIDEO_STAGES.map((stage, i) => {
              const Icon = stage.icon
              return (
                <li key={stage.name} className="relative md:flex-1">
                  {i < VIDEO_STAGES.length - 1 && (
                    <span
                      className="absolute left-[calc(50%+24px)] top-5 hidden h-px w-[calc(100%-48px)] bg-line md:block"
                      aria-hidden
                    />
                  )}
                  <div className="relative flex items-center gap-3 md:flex-col md:gap-0 md:text-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-appbg text-muted ring-1 ring-line">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 md:mt-2.5">
                      <p className="text-sm font-medium text-ink">
                        {stage.name}
                      </p>
                      <p className="text-xs text-muted">Not started</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
            In a live production, the Video Scriptwriter, design agents,
            Animation Agent, voice step and Video Editor each complete their
            stage and hand off — with a Creative Quality Reviewer check
            before anything is marked Done.
          </p>
        </section>
      </div>
    </div>
  )
}
