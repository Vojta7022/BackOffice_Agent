import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AppLanguage } from '@/lib/i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCZK(amount: number, language: AppLanguage = 'cs'): string {
  if (amount >= 1_000_000) {
    const mil = amount / 1_000_000
    const formattedNumber = Number.isInteger(mil)
      ? String(mil)
      : mil.toFixed(1).replace(language === 'cs' ? '.' : ',', language === 'cs' ? ',' : '.')
    const unit = language === 'cs' ? 'mil. CZK' : 'M CZK'
    return `${formattedNumber} ${unit}`
  }

  return `${new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-US').format(amount)} CZK`
}

const MONTHS: Record<AppLanguage, string[]> = {
  cs: ['led', 'uno', 'bre', 'dub', 'kve', 'cvn', 'cvc', 'srp', 'zar', 'rij', 'lis', 'pro'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

export function formatMonthLabel(ym: string, language: AppLanguage = 'cs'): string {
  const [, m] = ym.split('-').map(Number)
  return MONTHS[language][(m ?? 1) - 1] ?? ym
}

export function relativeTime(dateStr: string, language: AppLanguage = 'cs'): string {
  const now = new Date('2026-03-22')
  const date = new Date(dateStr)
  const days = Math.round((now.getTime() - date.getTime()) / 86_400_000)

  if (language === 'en') {
    if (days <= 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 14) return 'a week ago'
    if (days < 30) return `${Math.round(days / 7)} weeks ago`
    return `${Math.round(days / 30)} months ago`
  }

  if (days <= 0) return 'dnes'
  if (days === 1) return 'vcera'
  if (days < 7) return `pred ${days} dny`
  if (days < 14) return 'pred tydnem'
  if (days < 30) return `pred ${Math.round(days / 7)} tydny`
  return `pred ${Math.round(days / 30)} mesici`
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  return payload as T
}
