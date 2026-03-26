'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MonitoringRule } from '@/types'

interface MonitoringState {
  rules: MonitoringRule[]
  hasHydrated: boolean
  addRule: (rule: MonitoringRule) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void
  getRules: () => MonitoringRule[]
  setHasHydrated: (value: boolean) => void
}

function sortRules(rules: MonitoringRule[]) {
  return [...rules].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export const useMonitoringStore = create<MonitoringState>()(
  persist(
    (set, get) => ({
      rules: [],
      hasHydrated: false,
      addRule: (rule) =>
        set((state) => ({
          rules: sortRules([...state.rules.filter((currentRule) => currentRule.id !== rule.id), rule]),
        })),
      removeRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
        })),
      toggleRule: (id) =>
        set((state) => ({
          rules: state.rules.map((rule) => (rule.id === id ? { ...rule, active: !rule.active } : rule)),
        })),
      getRules: () => get().rules,
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'reagent-monitoring-rules',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Monitoring store hydration failed:', error)
        }
        state?.setHasHydrated(true)
      },
    }
  )
)
