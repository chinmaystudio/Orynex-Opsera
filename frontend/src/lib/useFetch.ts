import { useCallback, useEffect, useState } from 'react'
import { BackendOfflineError } from '../lib/api'

export interface FetchState<T> {
  data: T | null
  loading: boolean
  /** Backend could not be reached at all. */
  offline: boolean
  /** Backend responded with an error, or another failure occurred. */
  error: string | null
  reload: () => void
}

/**
 * Runs an API call with honest loading / offline / error states.
 * Callers decide what to render for each state — never fabricate data.
 */
export function useFetch<T>(fn: () => Promise<T>): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setOffline(false)
    setError(null)
    fn()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoading(false)
        if (err instanceof BackendOfflineError) {
          setOffline(true)
        } else {
          setError(err instanceof Error ? err.message : 'Request failed')
        }
      })
    return () => {
      cancelled = true
    }
    // fn identity is intentionally not a dependency; reload via tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  return { data, loading, offline, error, reload }
}
