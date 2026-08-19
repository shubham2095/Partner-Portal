import { create } from 'zustand'

export const useAdminStore = create((set) => ({
  dashboardSummary: null,
  setDashboardSummary: (dashboardSummary) => set({ dashboardSummary }),
}))
