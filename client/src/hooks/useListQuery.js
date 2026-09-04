import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Boilerplate for a paginated, filterable list.
 *
 *   const q = useListQuery(
 *     (params) => listLeads(params).then((r) => ({ rows: r.data.leads, total: r.meta.total })),
 *     { status: statusFilter || undefined, search },      // filters
 *     { limit: 20 }
 *   )
 *   // q.rows, q.total, q.page, q.setPage, q.totalPages, q.isLoading, q.hasError, q.reload
 *
 * `fetcher` receives `{ ...filters, page, limit }` and must resolve to
 * `{ rows, total }`. Page resets to 1 automatically whenever a filter changes.
 */
export function useListQuery(fetcher, filters = {}, { limit = 20 } = {}) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Stable key from the filter values so effects fire on real changes only,
  // not on every render's fresh object identity.
  const filtersKey = JSON.stringify(filters)

  const load = useCallback(
    async (targetPage) => {
      setIsLoading(true)
      setHasError(false)
      try {
        const parsed = JSON.parse(filtersKey)
        const result = await fetcherRef.current({ ...parsed, page: targetPage, limit })
        setRows(result?.rows ?? [])
        setTotal(result?.total ?? 0)
      } catch {
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    },
    [filtersKey, limit]
  )

  // Filters changed → back to page 1.
  useEffect(() => {
    setPage(1)
  }, [filtersKey])

  // Fetch on page or filter change.
  useEffect(() => {
    load(page)
  }, [page, load])

  return {
    rows,
    total,
    page,
    setPage,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    isLoading,
    hasError,
    reload: () => load(page),
  }
}
