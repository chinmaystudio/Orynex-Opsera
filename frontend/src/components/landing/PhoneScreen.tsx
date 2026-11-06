import type { ReactNode } from 'react'
import {
  Battery,
  CalendarCheck2,
  Check,
  CheckCheck,
  CircleDashed,
  Database,
  FileText,
  Loader2,
  MailCheck,
  Search,
  Signal,
  UserRoundSearch,
  Wifi,
} from 'lucide-react'

/** Scene boundaries as fractions of total story progress (spec §6). */
export const SCENE_RANGES: Array<[number, number]> = [
  [0, 0.15],
  [0.15, 0.32],
  [0.32, 0.5],
  [0.5, 0.68],
  [0.68, 0.84],
  [0.84, 1],
]

export const USER_COMMAND =
  'Prepare a report of our pending customer follow-ups and schedule meetings with the priority clients.'

function sceneState(
  progress: number,
  index: number,
): { sub: number; active: boolean; visible: boolean } {
  const [start, end] = SCENE_RANGES[index]
  const sub = Math.min(1, Math.max(0, (progress - start) / (end - start)))
  const sceneFloat = (() => {
    for (let i = 0; i < SCENE_RANGES.length; i++) {
      if (progress < SCENE_RANGES[i][1]) return i + subOf(progress, i)
    }
    return SCENE_RANGES.length - 1 + 1
  })()
  return {
    sub,
    active: progress >= start && progress < end,
    visible: Math.abs(sceneFloat - index) < 1.6,
  }
}

function subOf(progress: number, index: number): number {
  const [start, end] = SCENE_RANGES[index]
  return Math.min(1, Math.max(0, (progress - start) / (end - start)))
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-ink">
      <span className="pl-1 tracking-wide">9:41</span>
      <span className="flex items-center gap-1.5 text-ink">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <Battery className="h-3.5 w-3.5" />
      </span>
    </div>
  )
}

function AssistantHeader() {
  return (
    <div className="flex items-center gap-2.5 border-b border-line px-5 pb-3 pt-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
        O
      </span>
      <div>
        <p className="text-[12.5px] font-semibold leading-tight text-ink">
          Opraq Assistant
        </p>
        <p className="text-[10px] leading-tight text-emerald-600">
          Connected to your workspace
        </p>
      </div>
    </div>
  )
}

function SceneShell({
  state,
  children,
}: {
  state: { sub: number; active: boolean; visible: boolean }
  children: ReactNode
}) {
  if (!state.visible) return null
  return (
    <div
      className="absolute inset-0 flex flex-col px-5 pb-5 pt-3 transition-all duration-500 ease-out"
      style={{
        opacity: state.active ? 1 : 0,
        transform: state.active
          ? 'translateY(0)'
          : state.sub >= 1
            ? 'translateY(-14px)'
            : 'translateY(14px)',
        pointerEvents: state.active ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------- Scene 1 ------------------------------- */

function Scene1({ sub }: { sub: number }) {
  const typed = USER_COMMAND.slice(
    0,
    Math.floor(USER_COMMAND.length * Math.min(1, sub / 0.55)),
  )
  const sent = sub >= 0.55
  const received = sub >= 0.8
  return (
    <>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        New command
      </p>
      <div className="mt-3 flex-1">
        {sent ? (
          <div className="ml-6 rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-3 text-[12px] leading-relaxed text-white shadow-sm">
            {USER_COMMAND}
            <span className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-white/75">
              9:41
              <CheckCheck className="h-3 w-3" />
            </span>
          </div>
        ) : (
          <div className="ml-6 min-h-[74px] rounded-2xl rounded-br-md bg-lavender px-3.5 py-3 text-[12px] leading-relaxed text-ink">
            {typed}
            <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-brand-600 align-[-2px]" />
          </div>
        )}
        {received && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lavender text-[9px] font-bold text-brand-700">
              O
            </span>
            Opraq Assistant received your command
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-2.5">
        <span className="flex-1 truncate text-[11px] text-muted">
          {sent ? 'Message' : 'Typing a command…'}
        </span>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-white transition ${
            sent ? 'bg-slate-300' : 'bg-brand-600'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>
    </>
  )
}

/* ------------------------------- Scene 2 ------------------------------- */

const PLAN_STEPS = [
  'Retrieve customer records',
  'Identify priority clients',
  'Review previous communication',
  'Check calendar availability',
  'Prepare follow-up messages',
]

function Scene2({ sub }: { sub: number }) {
  const thinking = sub < 0.22
  return (
    <>
      <p className="text-[13px] font-semibold text-ink">
        {thinking ? 'Understanding your request…' : 'Here is my plan'}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Follow-ups · Sales department · Your CRM and calendar
      </p>
      {thinking ? (
        <div className="mt-6 flex items-center gap-2 text-[12px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          Reading the command and your workspace…
        </div>
      ) : (
        <ol className="mt-5 space-y-2.5">
          {PLAN_STEPS.map((step, i) => {
            const at = 0.22 + i * 0.15
            const shown = sub >= at
            const done = sub >= at + 0.15
            return (
              <li
                key={step}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3 py-2.5 transition-all duration-300"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : 'translateY(6px)',
                }}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                    done
                      ? 'bg-brand-600 text-white'
                      : 'bg-lavender text-brand-700'
                  }`}
                >
                  {done ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="text-[9px] font-bold">{i + 1}</span>
                  )}
                </span>
                <span className="text-[12px] font-medium text-ink">
                  {step}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <div className="mt-auto rounded-xl bg-lavender/60 px-3.5 py-3 text-[11px] leading-relaxed text-deep">
        Five steps, two connected tools. Nothing is sent without your
        approval.
      </div>
    </>
  )
}

/* ------------------------------- Scene 3 ------------------------------- */

const TOOL_ACTIVITY = [
  { icon: Database, label: 'CRM connected', detail: 'Workspace data source' },
  {
    icon: FileText,
    label: 'Customer records retrieved',
    detail: '148 accounts scanned',
  },
  {
    icon: UserRoundSearch,
    label: 'Priority clients identified',
    detail: '12 need follow-up now',
  },
  {
    icon: CalendarCheck2,
    label: 'Calendar availability checked',
    detail: '4 open slots this week',
  },
  {
    icon: MailCheck,
    label: 'Follow-up drafts prepared',
    detail: 'Personalised per client',
  },
]

function Scene3({ sub }: { sub: number }) {
  return (
    <>
      <p className="text-[13px] font-semibold text-ink">Working on it</p>
      <p className="mt-1 text-[11px] text-muted">
        Executing the plan across your connected tools
      </p>
      <div className="mt-5 space-y-3">
        {TOOL_ACTIVITY.map((item, i) => {
          const at = i / TOOL_ACTIVITY.length
          const done = sub >= at + 1 / TOOL_ACTIVITY.length - 0.02
          const active = !done && sub >= at
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  done
                    ? 'bg-brand-600 text-white'
                    : active
                      ? 'bg-lavender text-brand-700'
                      : 'bg-paper text-muted ring-1 ring-line'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[12px] font-medium leading-tight ${
                    done || active ? 'text-ink' : 'text-muted'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-[10px] leading-tight text-muted">
                  {item.detail}
                </p>
              </div>
              {done ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
              ) : (
                <CircleDashed className="h-4 w-4 shrink-0 text-slate-300" />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-auto">
        <div className="h-1.5 overflow-hidden rounded-full bg-lavender">
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
            style={{ width: `${Math.round(sub * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-right text-[10px] font-medium text-muted">
          {Math.round(sub * 100)}% complete
        </p>
      </div>
    </>
  )
}

/* ------------------------------- Scene 4 ------------------------------- */

const AGENTS = [
  {
    initials: 'SA',
    name: 'Sales Agent',
    task: 'Drafting 12 follow-up messages',
    base: 0.15,
    span: 0.75,
  },
  {
    initials: 'RA',
    name: 'Research Agent',
    task: 'Summarising client history',
    base: 0.05,
    span: 0.85,
  },
  {
    initials: 'EA',
    name: 'Executive Assistant',
    task: 'Preparing your follow-up report',
    base: 0.3,
    span: 0.65,
  },
]

function Scene4({ sub }: { sub: number }) {
  return (
    <>
      <p className="text-[13px] font-semibold text-ink">
        Your AI team is collaborating
      </p>
      <p className="mt-1 text-[11px] text-muted">
        Work is split across specialised AI employees
      </p>
      <div className="mt-5 space-y-3">
        {AGENTS.map((agent) => {
          const pct = Math.min(
            100,
            Math.round((agent.base + sub * agent.span) * 100),
          )
          const done = pct >= 100
          return (
            <div
              key={agent.name}
              className="rounded-xl border border-line bg-paper px-3.5 py-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender text-[10px] font-bold text-deep">
                  {agent.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold leading-tight text-ink">
                    {agent.name}
                  </p>
                  <p className="truncate text-[10.5px] leading-tight text-muted">
                    {agent.task}
                  </p>
                </div>
                {done ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-semibold text-brand-600">
                    {pct}%
                  </span>
                )}
              </div>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    done ? 'bg-emerald-500' : 'bg-brand-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-auto flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
        Each agent works only within the permissions and tools you assigned
        to it.
      </p>
    </>
  )
}

/* ------------------------------- Scene 5 ------------------------------- */

function Scene5({ sub }: { sub: number }) {
  const approved = sub >= 0.62
  return (
    <>
      <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
        Approval needed
      </span>
      <p className="mt-3 text-[15px] font-semibold leading-snug text-ink">
        12 customer follow-ups are ready.
      </p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
        Messages are drafted and meetings are matched to your calendar. Review
        them, or approve and let Opraq schedule everything.
      </p>
      <div className="mt-4 space-y-2 rounded-xl border border-line bg-paper px-3.5 py-3 text-[11.5px] text-ink">
        <p className="flex justify-between">
          <span className="text-muted">Draft messages</span>
          <span className="font-semibold">12</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted">Meetings proposed</span>
          <span className="font-semibold">4</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted">Risk level</span>
          <span className="font-semibold text-amber-700">
            HIGH — external send
          </span>
        </p>
      </div>
      <div className="mt-auto space-y-2">
        <div
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium text-white transition-all duration-500 ${
            approved ? 'bg-emerald-600' : 'bg-brand-600'
          }`}
        >
          {approved ? (
            <>
              <Check className="h-4 w-4" /> Approved — scheduling…
            </>
          ) : (
            'Approve and schedule'
          )}
        </div>
        <div className="flex items-center justify-center rounded-xl border border-line bg-white px-4 py-3 text-[13px] font-medium text-ink">
          Review messages
        </div>
        <p className="pt-1 text-center text-[10px] text-muted">
          {approved
            ? 'Approved by you · recorded in the audit log'
            : 'Nothing is sent until you approve'}
        </p>
      </div>
    </>
  )
}

/* ------------------------------- Scene 6 ------------------------------- */

const RESULTS = [
  { label: 'Customer records reviewed', value: '12' },
  { label: 'Priority follow-ups prepared', value: '8' },
  { label: 'Meetings scheduled', value: '4' },
  { label: 'CRM updated', value: 'Done' },
]

function Scene6({ sub }: { sub: number }) {
  return (
    <>
      <div className="flex flex-col items-center pt-4 text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200 transition-all duration-500"
          style={{
            transform: sub >= 0.08 ? 'scale(1)' : 'scale(0.7)',
            opacity: sub >= 0.08 ? 1 : 0,
          }}
        >
          <Check className="h-7 w-7 text-emerald-600" />
        </span>
        <p className="mt-3.5 text-[15px] font-semibold text-ink">
          Workflow completed.
        </p>
        <p className="mt-1 text-[11.5px] text-muted">
          Report saved to your Command Center
        </p>
      </div>
      <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-paper px-3.5">
        {RESULTS.map((row, i) => (
          <p
            key={row.label}
            className="flex items-center justify-between py-2.5 text-[12px] transition-all duration-300"
            style={{
              opacity: sub >= 0.2 + i * 0.16 ? 1 : 0,
              transform:
                sub >= 0.2 + i * 0.16 ? 'translateY(0)' : 'translateY(5px)',
            }}
          >
            <span className="text-muted">{row.label}</span>
            <span className="font-semibold text-ink">{row.value}</span>
          </p>
        ))}
      </div>
      <p className="mt-auto text-center text-[9.5px] leading-relaxed text-muted">
        Illustrative demonstration — sample data, not live customer activity.
      </p>
    </>
  )
}

/* ------------------------------ Screen root ----------------------------- */

export default function PhoneScreen({ progress }: { progress: number }) {
  const states = SCENE_RANGES.map((_, i) => sceneState(progress, i))
  return (
    <div className="flex h-full flex-col bg-white">
      <StatusBar />
      <AssistantHeader />
      <div className="relative flex-1">
        <SceneShell state={states[0]}>
          <Scene1 sub={states[0].sub} />
        </SceneShell>
        <SceneShell state={states[1]}>
          <Scene2 sub={states[1].sub} />
        </SceneShell>
        <SceneShell state={states[2]}>
          <Scene3 sub={states[2].sub} />
        </SceneShell>
        <SceneShell state={states[3]}>
          <Scene4 sub={states[3].sub} />
        </SceneShell>
        <SceneShell state={states[4]}>
          <Scene5 sub={states[4].sub} />
        </SceneShell>
        <SceneShell state={states[5]}>
          <Scene6 sub={states[5].sub} />
        </SceneShell>
      </div>
      {/* Home indicator */}
      <div className="flex justify-center pb-2 pt-1">
        <span className="h-1 w-24 rounded-full bg-ink/80" />
      </div>
    </div>
  )
}
