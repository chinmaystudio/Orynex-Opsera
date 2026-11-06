import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Returns scroll progress (0..1) for a tall target element: 0 when the
 * element's top reaches the top of the viewport, 1 when its bottom reaches
 * the bottom of the viewport. Designed for sticky storytelling sections
 * whose height exceeds the viewport.
 *
 * Updates are throttled through requestAnimationFrame, listeners are
 * passive, and everything is cleaned up on unmount.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
): number {
  const [progress, setProgress] = useState(0)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      rafId.current = null
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      if (total <= 0) {
        setProgress(rect.top <= 0 ? 1 : 0)
        return
      }
      const scrolled = -rect.top
      const next = Math.min(1, Math.max(0, scrolled / total))
      setProgress((prev) => (Math.abs(prev - next) > 0.0005 ? next : prev))
    }

    const schedule = () => {
      if (rafId.current === null) {
        rafId.current = window.requestAnimationFrame(measure)
      }
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
    }
  }, [ref])

  return progress
}

/** Tracks the user's `prefers-reduced-motion` OS/browser setting. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
