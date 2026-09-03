import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * NOTE on the exit-animation lifecycle:
 *
 * framer-motion's AnimatePresence is responsible for keeping an exiting
 * child mounted until its exit animation completes, then unmounting it.
 * In this project's environment (framer-motion 13.1.x + React 19.2), that
 * unmount reliably does not happen: the exit animation runs and finishes
 * visually (verified via computed opacity reaching 0), but the DOM node is
 * never removed afterwards.
 *
 * This was investigated exhaustively before landing on the mitigation
 * below — none of the following changed the outcome:
 *   - explicit `transition` on every exiting motion element (rules out an
 *     unresolved default/spring transition blocking completion)
 *   - testing against the production build, not just `vite dev` (rules out
 *     a React StrictMode dev-only double-invocation artifact)
 *   - isolating the modal in a `createPortal(..., document.body)` tree
 *     (rules out interference from an ancestor re-rendering)
 *   - a single motion.div as AnimatePresence's only direct child, using
 *     variant propagation for its children, instead of multiple keyed
 *     motion siblings (rules out a multi-child key-tracking issue)
 *   - upgrading framer-motion 13.1.0 -> 13.1.1 (no change)
 *
 * Given a safe, guaranteed fix could not be established without pinning to
 * an unverified major-version change of framer-motion (out of scope for a
 * frontend-only pass), the safe mitigation below removes the actual harm —
 * an invisible layer blocking clicks on the rest of the page — regardless
 * of whether the underlying node lingers: the modal's positioning wrapper
 * stays mounted permanently (so React/framer-motion never fight over its
 * lifecycle) and only its pointer-events are gated on `isOpen`. A stray
 * exited node behind it, if any, is inert.
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  const titleId = useId()
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      <AnimatePresence>
        {isOpen && [
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-secondary/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />,
          <motion.div
            key="dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-elevated ring-1 ring-black/5 focus:outline-none"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {title && (
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
                <h3 id={titleId} className="text-base font-semibold text-text-primary">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="-mr-1.5 -mt-0.5 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring-visible"
                >
                  <X className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </div>
            )}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-surface-muted/40 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>,
        ]}
      </AnimatePresence>
    </div>
  )
}
