import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,

      setSession: ({ user, token }) =>
        set({
          user,
          token,
          role: user?.role ?? null,
          isAuthenticated: Boolean(token),
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'partner-portal-auth' }
  )
)
