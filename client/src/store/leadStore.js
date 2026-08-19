import { create } from 'zustand'

export const useLeadStore = create((set) => ({
  leads: [],
  filters: {},
  setLeads: (leads) => set({ leads }),
  setFilters: (filters) => set({ filters }),
}))
