import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiError } from '@/api/client'

/**
 * useApi — Generic data-fetching hook
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(getEmployees)
 *   const { data, loading, error, refetch } = useApi(() => getEmployees({ search }), [search])
 *
 * @param {Function} fetcher  - async function that returns data
 * @param {Array}    deps     - dependency array (re-fetches when deps change)
 */
export function useApi(fetcher, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Keep a stable ref to the latest fetcher so the callback never goes stale
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher }, [fetcher])

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      setData(result)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Token expired — AuthContext will handle redirect via its own checks
        setError('Session expired. Please log in again.')
      } else {
        setError(err?.message ?? 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-run whenever deps change (or on mount)
  useEffect(() => {
    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch: execute }
}

export default useApi
