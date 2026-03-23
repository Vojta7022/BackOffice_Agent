'use client'

import { translations } from '@/lib/i18n'
import { useAppStore } from '@/lib/store'

export function useTranslation() {
  const language = useAppStore((state) => state.language)

  return {
    language,
    t: translations[language],
  }
}
