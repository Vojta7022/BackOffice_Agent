'use client'

import { create } from 'zustand'
import type { AppLanguage } from '@/lib/i18n'

export type AppTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'backoffice-theme'
const LANGUAGE_STORAGE_KEY = 'backoffice-language'
const DEFAULT_THEME: AppTheme = 'dark'
const DEFAULT_LANGUAGE: AppLanguage = 'cs'

function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

function getStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'cs'
}

function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function applyLanguage(language: AppLanguage) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = language
}

function persistTheme(theme: AppTheme) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

function persistLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}

const initialTheme = getStoredTheme()
const initialLanguage = getStoredLanguage()

if (typeof document !== 'undefined') {
  applyTheme(initialTheme)
  applyLanguage(initialLanguage)
}

interface AppStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  theme: AppTheme
  toggleTheme: () => void
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: initialTheme,
  language: initialLanguage,
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      persistTheme(next)
      return { theme: next }
    }),
  setLanguage: (language) => {
    applyLanguage(language)
    persistLanguage(language)
    set({ language })
  },
}))
