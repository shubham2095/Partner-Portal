import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

/**
 * Horizontal quick-filter chip strip for list pages.
 *
 *  options    [{ value, label }]  — value '' is the "All" chip
 *  value      currently selected value (controlled)
 *  onChange   (value) => void
 *  fetchCount optional (value) => Promise<number>  — badge count per chip,
 *             called once per chip on mount; failures render no badge.
 */
export default function StatusChips({ options, value, onChange, fetchCount }) {
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    if (!fetchCount) return undefined
    let cancelled = false
    Promise.all(
      options.map((o) => Promise.resolve(fetchCount(o.value)).catch(() => null))
    ).then((results) => {
      if (cancelled) return
      const map = {}
      options.forEach((o, i) => {
        map[o.value] = results[i]
      })
      setCounts(map)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="scrollbar-thin -mb-1 flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => {
        const active = value === o.value
        const count = counts?.[o.value]
        return (
          <button
            key={o.value || 'all'}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary'
            )}
          >
            {o.label}
            {count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums',
                  active ? 'bg-primary/15 text-primary' : 'bg-surface-muted text-text-muted'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
