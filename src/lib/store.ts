'use client'

import { create } from 'zustand'

export type AppTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'backoffice-theme'
const DEFAULT_THEME: AppTheme = 'dark'

function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function persistTheme(theme: AppTheme) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

const initialTheme = getStoredTheme()

if (typeof document !== 'undefined') {
  applyTheme(initialTheme)
}

interface AppStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  theme: AppTheme
  toggleTheme: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: initialTheme,
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      persistTheme(next)
      return { theme: next }
    }),
}))
