import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, CornerDownLeft } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useUiStore } from '../../store/uiStore'

/**
 * ⌘K / Ctrl+K command palette. Always jumps to a route.
 *  - `navItems`: the layout's nav array ({ to, label, icon } + { section } markers)
 *  - `searchFn`: optional async (query) => [{ id, label, sublabel, to, icon }]
 *    for live entity search (admin passes freelancer + lead lookup).
 */
export default function CommandPalette({ navItems = [], searchFn }) {
  const isOpen = useUiStore((s) => s.isCommandPaletteOpen)
  const open = useUiStore((s) => s.openCommandPalette)
  const close = useUiStore((s) => s.closeCommandPalette)
  const toggle = useUiStore((s) => s.toggleCommandPalette)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [remoteResults, setRemoteResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const pages = useMemo(
    () => navItems.filter((item) => item.to && item.label).map((item) => ({ ...item, kind: 'page' })),
    [navItems]
  )

  // Global ⌘K / Ctrl+K shortcut.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  // Reset transient state whenever it opens; focus the input.
  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setActiveIndex(0)
    setRemoteResults([])
    const t = setTimeout(() => inputRef.current?.focus(), 20)
    return () => clearTimeout(t)
  }, [isOpen])

  // Debounced remote entity search.
  useEffect(() => {
    if (!isOpen || !searchFn || query.trim().length < 2) {
      setRemoteResults([])
      setIsSearching(false)
      return
    }
    let cancelled = false
    setIsSearching(true)
    const t = setTimeout(async () => {
      try {
        const results = await searchFn(query.trim())
        if (!cancelled) setRemoteResults(results ?? [])
      } catch {
        if (!cancelled) setRemoteResults([])
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query, isOpen, searchFn])

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pages
    return pages.filter((p) => p.label.toLowerCase().includes(q))
  }, [pages, query])

  // Flat list used for keyboard navigation + rendering.
  const flat = useMemo(() => {
    const rows = []
    if (filteredPages.length) {
      rows.push({ type: 'heading', label: 'Pages' })
      filteredPages.forEach((p) => rows.push({ type: 'item', to: p.to, label: p.label, icon: p.icon }))
    }
    if (remoteResults.length) {
      rows.push({ type: 'heading', label: 'Records' })
      remoteResults.forEach((r) =>
        rows.push({ type: 'item', to: r.to, label: r.label, sublabel: r.sublabel, icon: r.icon })
      )
    }
    return rows
  }, [filteredPages, remoteResults])

  const itemRows = useMemo(() => flat.filter((r) => r.type === 'item'), [flat])

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, itemRows.length - 1)))
  }, [itemRows.length])

  const go = useCallback(
    (to) => {
      if (!to) return
      close()
      navigate(to)
    },
    [close, navigate]
  )

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, itemRows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(itemRows[activeIndex]?.to)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  // Keep the active row scrolled into view.
  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-item-index="${activeIndex}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  let runningItemIndex = -1

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]" onKeyDown={onKeyDown}>
          <motion.div
            className="absolute inset-0 bg-secondary/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated ring-1 ring-black/5"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-text-muted" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIndex(0)
                }}
                placeholder={searchFn ? 'Search pages, freelancers, leads…' : 'Search pages…'}
                className="h-14 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              {isSearching && (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
              )}
            </div>

            <div ref={listRef} className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2">
              {itemRows.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-text-muted">No matches for “{query}”.</p>
              ) : (
                flat.map((row, i) => {
                  if (row.type === 'heading') {
                    return (
                      <p key={`h-${i}`} className="px-3 pb-1 pt-3 text-caption first:pt-1">
                        {row.label}
                      </p>
                    )
                  }
                  runningItemIndex += 1
                  const idx = runningItemIndex
                  const isActive = idx === activeIndex
                  const Icon = row.icon
                  return (
                    <button
                      key={`i-${i}`}
                      data-item-index={idx}
                      onClick={() => go(row.to)}
                      onMouseMove={() => setActiveIndex(idx)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                        isActive ? 'bg-primary-50 text-primary' : 'text-text-primary hover:bg-surface-muted'
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />}
                      <span className="min-w-0 flex-1 truncate">
                        {row.label}
                        {row.sublabel && (
                          <span className="ml-2 text-xs text-text-muted">{row.sublabel}</span>
                        )}
                      </span>
                      {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2} />}
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-border bg-surface-muted/40 px-4 py-2.5 text-[0.6875rem] text-text-muted">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border-strong bg-surface px-1 py-0.5 font-sans">↑</kbd>
                <kbd className="rounded border border-border-strong bg-surface px-1 py-0.5 font-sans">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border-strong bg-surface px-1 py-0.5 font-sans">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border-strong bg-surface px-1 py-0.5 font-sans">esc</kbd>
                close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
