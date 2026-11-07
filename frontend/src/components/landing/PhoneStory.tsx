import { useRef } from 'react'
import {
  Check,
  ClipboardList,
  MessagesSquare,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import PhoneFrame from './PhoneFrame'
import PhoneScreen, { SCENE_RANGES } from './PhoneScreen'
import {
  usePrefersReducedMotion,
  useScrollProgress,
} from '../../hooks/useScrollProgress'

interface SceneNarrative {
  icon: typeof MessagesSquare
  title: string
  body: string
}

export const STORY_SCENES: SceneNarrative[] = [
  {
    icon: MessagesSquare,
    title: 'You give one command',
    body: 'Ask for the work in plain language — a report, a follow-up round, a campaign. No tickets, no forms, no hunting through five different tools.',
  },
  {
    icon: ClipboardList,
    title: 'Opraq plans the work',
    body: 'The assistant breaks your request into concrete steps against your real workspace: which records, which clients, which calendars.',
  },
  {
    icon: Zap,
    title: 'Connected tools do the heavy lifting',
    body: 'Your CRM, calendar and inbox are worked in sequence, with progress you can watch — not a black box that reports back hours later.',
  },
  {
    icon: Users,
    title: 'AI employees collaborate',
    body: 'The Sales Agent, Research Agent and Executive Assistant split the work between them, each inside its own permissions.',
  },
  {
    icon: ShieldCheck,
    title: 'You stay in control',
    body: 'Anything that leaves the company — an email, a meeting invite, a payment — waits for a human. Review it, edit it, or approve it as-is.',
  },
  {
    icon: Trophy,
    title: 'Done, and on the record',
    body: 'Results land in your Command Center and the full run is written to the audit log: who did what, with which tool, and when.',
  },
]

function activeSceneIndex(progress: number): number {
  for (let i = 0; i < SCENE_RANGES.length; i++) {
    if (progress < SCENE_RANGES[i][1]) return i
  }
  return SCENE_RANGES.length - 1
}

function NarrativeList({ progress }: { progress: number }) {
  const active = activeSceneIndex(progress)
  return (
    <div className="space-y-9">
      {STORY_SCENES.map((scene, i) => {
        const Icon = scene.icon
        const isActive = i === active
        return (
          <div
            key={scene.title}
            className="flex gap-4 transition-all duration-500"
            style={{ opacity: isActive ? 1 : 0.32 }}
          >
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-500 ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'bg-lavender text-deep'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-base font-semibold text-ink">{scene.title}</p>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
                {scene.body}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Desktop-only scroll storytelling: the phone is pinned in a sticky stage
 * (transparent surroundings — the page background shows through) while six
 * narrative beats advance the on-screen demonstration.
 * Hidden entirely below the lg breakpoint, including its height.
 */
export default function PhoneStory() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const progress = useScrollProgress(sectionRef)

  if (reducedMotion) {
    // Static variant: final scene, ordinary section height, no pinning.
    return (
      <section id="story" className="hidden scroll-mt-16 lg:block">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 items-center gap-16 px-8 py-24">
          <NarrativeList progress={1} />
          <div className="flex justify-center">
            <PhoneFrame>
              <PhoneScreen progress={1} />
            </PhoneFrame>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative hidden scroll-mt-16 lg:block"
      style={{ height: '600vh' }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 items-center gap-16 px-8">
          <div>
            <p className="mb-10 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              See how it works
            </p>
            <NarrativeList progress={progress} />
          </div>
          <div className="flex justify-center">
            <PhoneFrame>
              <PhoneScreen progress={progress} />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Mobile / small-tablet fallback: the same six beats as a simple vertical
 * list. No sticky positioning, no reserved phone space.
 */
export function PhoneStoryMobileFallback() {
  return (
    <section className="lg:hidden" aria-label="How Opraq works">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          See how it works
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
          One command, carried through to done.
        </h2>
        <ol className="mt-10 space-y-0">
          {STORY_SCENES.map((scene, i) => {
            const Icon = scene.icon
            return (
              <li key={scene.title} className="relative flex gap-4 pb-8 last:pb-0">
                {i < STORY_SCENES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[17px] top-10 h-[calc(100%-2.5rem)] w-px bg-line"
                  />
                )}
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lavender text-deep">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                    {scene.title}
                    {i === STORY_SCENES.length - 1 && (
                      <Check className="h-4 w-4 text-success" />
                    )}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {scene.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
        <p className="mt-8 text-xs text-muted">
          On a desktop, this story plays out on a phone as you scroll —
          commands, agent work, your approval, and the finished result.
        </p>
      </div>
    </section>
  )
}
