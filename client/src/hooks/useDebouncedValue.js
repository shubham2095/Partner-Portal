import { useEffect, useState } from 'react'

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 * Handy for search inputs: bind the input to raw state, feed the debounced
 * result into the query so you don't fire a request on every keystroke.
 *
 *   const [term, setTerm] = useState('')
 *   const search = useDebouncedValue(term, 300)
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}
