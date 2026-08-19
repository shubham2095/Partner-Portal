import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

export default function Dropdown({ trigger, items = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button type="button" onClick={() => setIsOpen((prev) => !prev)}>
        {trigger}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-border bg-surface py-1 shadow-card">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick?.()
                setIsOpen(false)
              }}
              className={cn(
                'block w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-muted',
                item.danger && 'text-danger'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
