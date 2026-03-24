'use client'

import { useHydrated } from '@/hooks/useHydrated'
import { translations } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'

export function useTranslation() {
  const hydrated = useHydrated()
  const persistedLanguage = useAppStore((state) => state.language)
  const language = hydrated ? persistedLanguage : 'cs'

  return {
    hydrated,
    language,
    t: translations[language],
  }
}
