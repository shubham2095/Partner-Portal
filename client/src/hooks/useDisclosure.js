import { useCallback, useState } from 'react'

/**
 * Open/close state for modals, drawers, popovers, etc.
 *
 *   const modal = useDisclosure()
 *   <Button onClick={modal.open}>Create</Button>
 *   <Modal isOpen={modal.isOpen} onClose={modal.close}>…</Modal>
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  return { isOpen, open, close, toggle, setIsOpen }
}
