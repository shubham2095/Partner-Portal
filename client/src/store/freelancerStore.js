import { create } from 'zustand'

export const useFreelancerStore = create((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}))
