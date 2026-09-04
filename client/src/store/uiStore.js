import { create } from 'zustand'

const THEME_KEY = 'partner-portal-theme'

function readStoredTheme() {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage unavailable */
  }
  // First visit always starts light; the user can switch and it's remembered.
  return 'light'
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage unavailable (private mode) — in-memory only */
  }
}

export const useUiStore = create((set, get) => ({
  isSidebarOpen: true,
  isMobileNavOpen: false,
  activeModal: null,
  isCommandPaletteOpen: false,
  theme: readStoredTheme(),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),

  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
}))

// Keep the <html> class in sync with the store's initial value (the inline
// script in index.html already did this for first paint; this covers the
// case where the stored value and the pre-paint class ever diverge).
applyTheme(useUiStore.getState().theme)
