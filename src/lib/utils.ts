import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCZK(amount: number): string {
  if (amount >= 1_000_000) {
    const mil = amount / 1_000_000
    const formatted = Number.isInteger(mil) ? String(mil) : mil.toFixed(1).replace('.', ',')
    return `${formatted} mil. CZK`
  }
  return `${new Intl.NumberFormat('cs-CZ').format(amount)} CZK`
}

const MONTHS_CS = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro']

export function formatMonthLabel(ym: string): string {
  const [, m] = ym.split('-').map(Number)
  return MONTHS_CS[(m ?? 1) - 1] ?? ym
}

export function relativeTime(dateStr: string): string {
  const now = new Date('2026-03-22')
  const date = new Date(dateStr)
  const days = Math.round((now.getTime() - date.getTime()) / 86_400_000)
  if (days <= 0) return 'dnes'
  if (days === 1) return 'včera'
  if (days < 7) return `před ${days} dny`
  if (days < 14) return 'před týdnem'
  if (days < 30) return `před ${Math.round(days / 7)} týdny`
  return `před ${Math.round(days / 30)} měsíci`
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
