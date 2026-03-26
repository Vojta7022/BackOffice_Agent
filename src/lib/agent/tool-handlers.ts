import { db } from '@/lib/database'
import { MonitoringRule, Task, Lead, Client, Property, PropertyType, Transaction } from '@/types'
import { ToolName } from './tools'
import { getAvailableSlots } from '@/lib/google/calendar'
import { createDraft } from '@/lib/google/gmail'
import { hasGoogleRefreshToken } from '@/lib/google/auth'
import { searchWeb } from './web-search'
import { fetchAllListings } from '@/lib/monitoring/fetcher'
import { monitoringStore } from '@/lib/monitoring/store'

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ToolResult {
  data: unknown
  summary: string
  display_hint: 'text' | 'table' | 'chart' | 'email_draft' | 'file_download' | 'task_created' | 'monitoring_set' | 'comparison' | 'timeline' | 'report'
}

export interface ToolCallContext {
  userMessage?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function czk(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount)
}

const NOW = '2026-03-22'
const DEFAULT_MONITORING_TYPES: PropertyType[] = ['apartment', 'house', 'commercial', 'office', 'land']
const PROPERTY_TYPE_LABELS_CS: Record<PropertyType, string> = {
  apartment: 'Byt',
  house: 'Dům',
  land: 'Pozemek',
  commercial: 'Komerce',
  office: 'Kancelář',
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000))
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function subtractMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() - months)
  return date.toISOString().split('T')[0]
}

function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function lastNMonthKeys(months: number): string[] {
  return Array.from({ length: months }, (_, index) => monthKey(subtractMonths(NOW, months - index - 1)))
}

function pricePerSqm(property: Pick<Property, 'price' | 'area_sqm'>): number {
  return property.area_sqm > 0 ? Math.round(property.price / property.area_sqm) : 0
}

function getPriceRangeLabel(price: number): string {
  if (price < 5_000_000) return '<5M'
  if (price < 10_000_000) return '5-10M'
  if (price < 20_000_000) return '10-20M'
  return '20M+'
}

function matchesCity(propertyId: string | null | undefined, city?: string): boolean {
  if (!city) return true
  if (!propertyId) return false
  const property = db.getPropertyById(propertyId)
  return property?.address.city.toLowerCase() === city.toLowerCase()
}

function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function parseQuarter(q: string): { year: number; quarter: number } | null {
  const normalized = normalizeQuery(q)
  const year = Number(normalized.match(/\b(20\d{2})\b/)?.[1] ?? '2026')
  const numberMatch =
    normalized.match(/\bq\s*([1-4])\b/) ??
    normalized.match(/\b([1-4])\s*q\b/) ??
    normalized.match(/\b([1-4])\.?\s*(kvartal|ctvrtleti)\b/)

  const quarterWordMap: Record<string, number> = {
    prvni: 1,
    druhy: 2,
    treti: 3,
    ctvrty: 4,
  }

  let quarter = numberMatch?.[1] ? Number(numberMatch[1]) : 0
  if (!quarter) {
    for (const [word, value] of Object.entries(quarterWordMap)) {
      if (normalized.includes(`${word} kvartal`) || normalized.includes(`${word} ctvrtleti`)) {
        quarter = value
        break
      }
    }
  }

  if (quarter < 1 || quarter > 4) return null
  return { year, quarter }
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    ;(acc[k] ??= []).push(item)
    return acc
  }, {})
}

function propertyTypeLabel(type: PropertyType): string {
  return PROPERTY_TYPE_LABELS_CS[type]
}

function formatChartMonthLabel(month: string): string {
  const [year, rawMonth] = month.split('-').map(Number)
  const monthLabels = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
  const label = monthLabels[(rawMonth ?? 1) - 1] ?? month
  return Number.isFinite(year) ? `${label} ${year}` : month
}

function inferQuarterFromDateRange(dateFrom?: string, dateTo?: string): { year: number; quarter: number } | null {
  if (!dateFrom || !dateTo) return null

  const quarterRanges = [
    { quarter: 1, from: '01-01', to: '03-31' },
    { quarter: 2, from: '04-01', to: '06-30' },
    { quarter: 3, from: '07-01', to: '09-30' },
    { quarter: 4, from: '10-01', to: '12-31' },
  ]

  const fromMatch = dateFrom.match(/^(\d{4})-(\d{2}-\d{2})$/)
  const toMatch = dateTo.match(/^(\d{4})-(\d{2}-\d{2})$/)
  if (!fromMatch || !toMatch || fromMatch[1] !== toMatch[1]) return null

  const match = quarterRanges.find((range) => range.from === fromMatch[2] && range.to === toMatch[2])
  if (!match) return null

  return { year: Number(fromMatch[1]), quarter: match.quarter }
}

function inferQuarterFromMessage(message?: string): { year: number; quarter: number } | null {
  if (!message) return null

  const normalized = normalizeQuery(message)
  const explicit = parseQuarter(normalized)
  if (explicit) return explicit

  const mentionsQuarter = /kvartal|ctvrtleti|za prvni|q1/.test(normalized)
  if (!mentionsQuarter) return null

  if (/druhy|2\.?\s*(kvartal|ctvrtleti)|q2/.test(normalized)) return { year: 2026, quarter: 2 }
  if (/treti|3\.?\s*(kvartal|ctvrtleti)|q3/.test(normalized)) return { year: 2026, quarter: 3 }
  if (/ctvrty|4\.?\s*(kvartal|ctvrtleti)|q4/.test(normalized)) return { year: 2026, quarter: 4 }

  return { year: 2026, quarter: 1 }
}

function resolveQuarter(
  quarter: string | undefined,
  dateFrom: string | undefined,
  dateTo: string | undefined,
  userMessage?: string
): { year: number; quarter: number } | null {
  if (quarter) {
    const parsedQuarter = parseQuarter(quarter)
    if (parsedQuarter) return parsedQuarter
  }

  const fromDates = inferQuarterFromDateRange(dateFrom, dateTo)
  if (fromDates) return fromDates

  return inferQuarterFromMessage(userMessage)
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleQueryClients(input: Record<string, unknown>, context?: ToolCallContext): ToolResult {
  const { date_from, date_to, source, type, status, quarter, group_by } = input as Record<string, string>

  // Quarter mode
  const resolvedQuarter = resolveQuarter(quarter, date_from, date_to, context?.userMessage)
  if (resolvedQuarter) {
    const parsed = resolvedQuarter
    if (!parsed) return { data: [], summary: 'Nepodařilo se rozpoznat čtvrtletí.', display_hint: 'text' }
    const grouped = db.getNewClientsByQuarter(parsed.year, parsed.quarter)
    const total = grouped.reduce((s, g) => s + g.count, 0)
    const breakdown = grouped.map((item) => `${item.source}: ${item.count}`).join(', ')
    const quarterLabel = `Q${parsed.quarter} ${parsed.year}`
    return {
      data: grouped.map(g => ({ source: g.source, count: g.count })),
      summary: total > 0
        ? `Nalezeno ${total} nových klientů za ${quarterLabel}. Rozložení podle zdroje: ${breakdown}.`
        : `Za ${quarterLabel} nebyli evidováni žádní noví klienti.`,
      display_hint: 'table',
    }
  }

  // Month trend mode
  if (group_by === 'month') {
    const data = db.getClientsByMonth(12)
    const total = data.reduce((s, m) => s + m.count, 0)
    return {
      data,
      summary: `Vývoj nových klientů za posledních 12 měsíců — celkem ${total}.`,
      display_hint: 'table',
    }
  }

  // Filtered list mode
  const clients = db.getAllClients({
    type: type as Client['type'],
    source: source as Client['source'],
    status: status as Client['status'],
    date_from,
    date_to,
  })

  // Optional grouping on the result set
  if (group_by === 'source' || group_by === 'type') {
    const grouped = groupBy(clients, c => c[group_by as 'source' | 'type'])
    const data = Object.entries(grouped)
      .map(([key, items]) => ({ [group_by]: key, count: items.length }))
      .sort((a, b) => (b.count as number) - (a.count as number))
    return {
      data,
      summary: `${clients.length} klientů rozděleno podle ${group_by === 'source' ? 'zdroje' : 'typu'}.`,
      display_hint: 'table',
    }
  }

  const filters: string[] = []
  if (type) filters.push(type)
  if (source) filters.push(source)
  if (status) filters.push(status)
  const filterStr = filters.length ? ` (filtry: ${filters.join(', ')})` : ''

  return {
    data: clients,
    summary: `Nalezeno ${clients.length} klientů${filterStr}.`,
    display_hint: 'table',
  }
}

function handleQueryLeads(input: Record<string, unknown>): ToolResult {
  const { date_from, date_to, status, type, months_back, group_by } = input as Record<string, string>

  if (months_back) {
    const n = Number(months_back)
    const data = db.getLeadsByMonth(n).map((item) => ({
      month: item.month,
      label: formatChartMonthLabel(item.month),
      count: item.count,
    }))
    const total = data.reduce((s, m) => s + m.count, 0)
    return {
      data,
      summary: `Celkem ${total} leadů za posledních ${n} měsíců.`,
      display_hint: 'table',
    }
  }

  const leads = db.getAllLeads({
    status: status as Lead['status'],
    type: type as Lead['type'],
    date_from,
    date_to,
  })

  if (group_by === 'status') {
    const grouped = groupBy(leads, l => l.status)
    const data = Object.entries(grouped)
      .map(([s, items]) => ({ status: s, count: items.length }))
      .sort((a, b) => b.count - a.count)
    return {
      data,
      summary: `${leads.length} leadů rozděleno podle stavu.`,
      display_hint: 'table',
    }
  }

  if (group_by === 'type') {
    const grouped = groupBy(leads, l => l.type)
    const data = Object.entries(grouped)
      .map(([t, items]) => ({ type: t, count: items.length }))
      .sort((a, b) => b.count - a.count)
    return {
      data,
      summary: `${leads.length} leadů rozděleno podle typu.`,
      display_hint: 'table',
    }
  }

  const closedWon = leads.filter(l => l.status === 'closed_won').length
  return {
    data: leads,
    summary: `Nalezeno ${leads.length} leadů${closedWon ? `, z toho ${closedWon} uzavřených úspěšně` : ''}.`,
    display_hint: 'table',
  }
}

function handleQueryProperties(input: Record<string, unknown>): ToolResult {
  const { city, district, type, status, price_min, price_max, search_query } = input as Record<string, string>

  const props = search_query
    ? db.searchProperties(search_query)
    : db.getAllProperties({
        city,
        district,
        type: type as never,
        status: status as never,
        price_min: price_min ? Number(price_min) : undefined,
        price_max: price_max ? Number(price_max) : undefined,
      })

  const available = props.filter(p => p.status === 'available').length
  const parts: string[] = [`Nalezeno ${props.length} nemovitostí`]
  if (available && available < props.length) parts.push(`${available} dostupných k prodeji`)
  if (city || district) parts.push(`v ${district ?? city}`)

  return {
    data: props,
    summary: parts.join(', ') + '.',
    display_hint: 'table',
  }
}

function handleEstimatePropertyValue(input: Record<string, unknown>): ToolResult {
  const city = typeof input.city === 'string' && input.city.trim() ? input.city.trim() : 'Praha'
  const district = typeof input.district === 'string' ? input.district.trim() : ''
  const type = (typeof input.type === 'string' && input.type.trim() ? input.type.trim() : 'apartment') as PropertyType
  const area_sqm = Number(input.area_sqm)
  const rooms = input.rooms === undefined || input.rooms === null ? undefined : Number(input.rooms)

  if (!district || !Number.isFinite(area_sqm) || area_sqm <= 0) {
    return {
      data: [],
      summary: 'Pro odhad potřebuji alespoň město, lokalitu a plochu nemovitosti v m².',
      display_hint: 'text',
    }
  }

  const normalizedCity = normalizeQuery(city)
  const normalizedDistrict = normalizeQuery(district)
  const allProps = db.getAllProperties()
  const propertyById = new Map(allProps.map((property) => [property.id, property]))
  const isComparableProperty = (property: Property) => {
    const cityMatch = normalizeQuery(property.address.city) === normalizedCity
    const distMatch = normalizeQuery(property.address.district).includes(normalizedDistrict)
    const typeMatch = !type || property.type === type
    const areaClose = Math.abs(property.area_sqm - area_sqm) < area_sqm * 0.3
    const roomsClose = rooms === undefined || property.rooms === null || Math.abs(property.rooms - rooms) <= 1

    return cityMatch && distMatch && typeMatch && areaClose && roomsClose && property.price > 200_000
  }

  const comparables = allProps.filter(isComparableProperty)
  const transactions = db.getTransactions({ type: 'sale', status: 'completed' })
  const relevantTx = transactions.filter((transaction) => {
    const property = propertyById.get(transaction.property_id)
    if (!property) return false
    return isComparableProperty(property)
  })

  const prices = comparables.map((property) => property.price).filter((price) => price > 200_000)
  const listingPricesPerSqm = comparables
    .filter((property) => property.price > 200_000)
    .map((property) => property.price / property.area_sqm)
  const soldPricesPerSqm = relevantTx
    .map((transaction) => {
      const property = propertyById.get(transaction.property_id)
      if (!property || property.area_sqm <= 0) return null
      return transaction.amount / property.area_sqm
    })
    .filter((value): value is number => value !== null)

  const valuationSamples = soldPricesPerSqm.length > 0 ? soldPricesPerSqm : listingPricesPerSqm
  const avgPrice = prices.length > 0 ? Math.round(average(prices)) : 0
  const avgPricePerSqm = valuationSamples.length > 0 ? Math.round(average(valuationSamples)) : 0
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

  const estimatedValue = avgPricePerSqm * area_sqm
  const estimatedMin = Math.round(estimatedValue * 0.85)
  const estimatedMax = Math.round(estimatedValue * 1.15)
  const comparableRows = comparables.slice(0, 5).map((property) => ({
    Název: property.name,
    Adresa: `${property.address.street}, ${property.address.district}`,
    Cena: czk(property.price),
    'Plocha (m²)': String(property.area_sqm),
    'Cena za m²': czk(Math.round(property.price / property.area_sqm)),
  }))

  if (!avgPricePerSqm) {
    return {
      data: {
        estimated_value: 0,
        estimated_range: { min: 0, max: 0 },
        price_per_sqm: 0,
        comparables_count: comparables.length,
        comparables: comparables.slice(0, 5).map((property) => ({
          name: property.name,
          address: `${property.address.street}, ${property.address.district}`,
          price: property.price,
          area: property.area_sqm,
          price_per_sqm: Math.round(property.price / property.area_sqm),
        })),
        transactions_in_area: relevantTx.length,
        market_stats: {
          avg_price: avgPrice,
          min_price: minPrice,
          max_price: maxPrice,
          avg_price_per_sqm: 0,
        },
        rows: comparableRows,
      },
      summary: `Pro ${district} zatím nemám dost srovnatelných prodejů nebo nabídek pro spolehlivý odhad. Našel jsem ${comparables.length} podobných nemovitostí a ${relevantTx.length} dokončených prodejů v oblasti.`,
      display_hint: 'table',
    }
  }

  const valuationBasis = soldPricesPerSqm.length > 0 ? 'dokončených prodejů' : 'srovnatelných nabídek'
  const valuationCount = soldPricesPerSqm.length > 0 ? soldPricesPerSqm.length : comparables.length

  return {
    data: {
      estimated_value: estimatedValue,
      estimated_range: { min: estimatedMin, max: estimatedMax },
      price_per_sqm: avgPricePerSqm,
      comparables_count: comparables.length,
      comparables: comparables.slice(0, 5).map((property) => ({
        name: property.name,
        address: `${property.address.street}, ${property.address.district}`,
        price: property.price,
        area: property.area_sqm,
        price_per_sqm: Math.round(property.price / property.area_sqm),
      })),
      transactions_in_area: relevantTx.length,
      market_stats: {
        avg_price: avgPrice,
        min_price: minPrice,
        max_price: maxPrice,
        avg_price_per_sqm: avgPricePerSqm,
      },
      rows: comparableRows,
    },
    summary: `Odhadovaná tržní hodnota: ${estimatedValue.toLocaleString('cs-CZ')} CZK (rozmezí ${estimatedMin.toLocaleString('cs-CZ')} – ${estimatedMax.toLocaleString('cs-CZ')} CZK). Odhad na základě ${valuationCount} ${valuationBasis} v ${district}. Průměrná cena za m²: ${avgPricePerSqm.toLocaleString('cs-CZ')} CZK.`,
    display_hint: 'table',
  }
}

function handleFindMissingData(input: Record<string, unknown>): ToolResult {
  const { field } = input as { field: 'renovation_status' | 'construction_notes' | 'all' }

  let props = db.getPropertiesWithMissingData()
  if (field === 'renovation_status') {
    props = props.filter(p => p.renovation_status === null)
  } else if (field === 'construction_notes') {
    props = props.filter(p => p.construction_notes === null)
  }

  const rows = props
    .map((property) => {
      const missing: string[] = []

      if ((field === 'all' || field === 'renovation_status') && property.renovation_status === null) {
        missing.push('stav rekonstrukce')
      }
      if ((field === 'all' || field === 'construction_notes') && property.construction_notes === null) {
        missing.push('stavební poznámky')
      }

      if (missing.length === 0) return null

      return {
        Název: property.name,
        Adresa: `${property.address.street}, ${property.address.district}`,
        Typ: propertyTypeLabel(property.type),
        Chybí: missing.join(', ')
      }
    })
    .filter((row): row is { Název: string; Adresa: string; Typ: string; Chybí: string } => row !== null)

  return {
    data: rows,
    summary: `Nalezeno ${rows.length} nemovitostí s chybějícími údaji. Doporučuji kontaktovat vlastníky a doplnit chybějící údaje.`,
    display_hint: 'table',
  }
}

function handleQueryTransactions(input: Record<string, unknown>): ToolResult {
  const { date_from, date_to, type, status, months_back } = input as Record<string, string>

  if (months_back) {
    const n = Number(months_back)
    const cutoff = subtractMonths(NOW, Math.max(n - 1, 0))
    const effectiveType = (type as Transaction['type']) ?? 'sale'
    const effectiveStatus = (status as Transaction['status']) ?? 'completed'
    const filteredTransactions = db.getTransactions({
      type: effectiveType,
      status: effectiveStatus,
      date_from: cutoff,
      date_to: NOW,
    })
    const data = lastNMonthKeys(n).map((month) => {
      const monthTransactions = filteredTransactions.filter((transaction) => monthKey(transaction.date) === month)
      return {
        month,
        label: formatChartMonthLabel(month),
        count: monthTransactions.length,
        total_value: monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      }
    })
    const totalValue = data.reduce((s, m) => s + m.total_value, 0)
    const totalCount = data.reduce((s, m) => s + m.count, 0)
    return {
      data,
      summary: `${totalCount} ${effectiveType === 'sale' ? 'prodejů' : 'transakcí'} za posledních ${n} měsíců v celkové hodnotě ${czk(totalValue)}.`,
      display_hint: 'table',
    }
  }

  const txs = db.getTransactions({
    type: type as never,
    status: status as never,
    date_from,
    date_to,
  })

  const completed = txs.filter(t => t.status === 'completed')
  const totalValue = completed.reduce((s, t) => s + t.amount, 0)
  const totalCommission = completed.reduce((s, t) => s + t.commission, 0)

  return {
    data: txs,
    summary: `Nalezeno ${txs.length} transakcí — ${completed.length} dokončených v hodnotě ${czk(totalValue)}, provize ${czk(totalCommission)}.`,
    display_hint: 'table',
  }
}

function handleGetDashboardMetrics(): ToolResult {
  const stats = db.getDashboardStats()
  const ch = stats.monthly_changes

  return {
    data: stats,
    summary: [
      `Aktivní nemovitosti: ${stats.active_properties}/${stats.total_properties}.`,
      `Klienti: ${stats.total_clients} celkem, ${stats.new_clients_this_month} nových tento měsíc (${ch.clients > 0 ? '+' : ''}${ch.clients} %).`,
      `Leady: ${stats.total_leads_this_month} tento měsíc (${ch.leads > 0 ? '+' : ''}${ch.leads} %).`,
      `Tržby: ${czk(stats.revenue_this_month)} (${ch.revenue > 0 ? '+' : ''}${ch.revenue} %).`,
    ].join(' '),
    display_hint: 'table',
  }
}

function handleGetWeeklySummary(): ToolResult {
  const s = db.getWeeklySummary()
  return {
    data: s,
    summary: `Posledních 7 dní: ${s.new_leads} nových leadů, ${s.new_clients} nových klientů, ${s.viewings_scheduled} prohlídek, ${s.deals_closed} uzavřených obchodů, tržby ${czk(s.revenue)}.`,
    display_hint: 'table',
  }
}

function handleGenerateChart(input: Record<string, unknown>): ToolResult {
  const allowedTypes = new Set(['bar', 'line', 'pie', 'area'])
  const rawData = Array.isArray(input.data) ? input.data : []
  const chart = {
    chart_type: allowedTypes.has(String(input.chart_type)) ? String(input.chart_type) as 'bar' | 'line' | 'pie' | 'area' : 'bar',
    title: typeof input.title === 'string' && input.title.trim() ? input.title : 'Graf',
    x_label: typeof input.x_label === 'string' ? input.x_label : undefined,
    y_label: typeof input.y_label === 'string' ? input.y_label : undefined,
    primary_label: typeof input.primary_label === 'string' ? input.primary_label : undefined,
    secondary_label: typeof input.secondary_label === 'string' ? input.secondary_label : undefined,
    data: rawData
      .map((item) => {
        if (typeof item !== 'object' || item === null) return null
        const record = item as Record<string, unknown>
        const monthLabel = typeof record.month === 'string' ? formatChartMonthLabel(record.month) : ''
        const rawLabel = typeof record.label === 'string' ? record.label : ''
        const fallbackLabel =
          typeof record.source === 'string' ? record.source :
          typeof record.type === 'string' ? record.type :
          typeof record.status === 'string' ? record.status :
          typeof record.name === 'string' ? record.name :
          typeof record.category === 'string' ? record.category :
          typeof record.group === 'string' ? record.group :
          typeof record.x === 'string' ? record.x :
          ''
        const label = monthLabel || rawLabel || fallbackLabel
        if (!label) return null
        const value = Number(record.value ?? record.count ?? record.primary_value ?? 0)
        const secondarySource =
          record.secondary_value ??
          record.secondary ??
          record.secondaryCount ??
          record.sales_count ??
          record.transaction_count
        const secondaryValue = secondarySource === undefined ? undefined : Number(secondarySource)
        return {
          label,
          value: Number.isFinite(value) ? value : 0,
          ...(secondaryValue !== undefined && Number.isFinite(secondaryValue) ? { secondary_value: secondaryValue } : {}),
        }
      })
      .filter((item): item is { label: string; value: number; secondary_value?: number } => item !== null),
  }

  return {
    data: chart,
    summary: `Graf „${chart.title}“ je připraven k zobrazení.`,
    display_hint: 'chart',
  }
}

async function handleDraftEmail(input: Record<string, unknown>): Promise<ToolResult> {
  const { to, subject, body, context } = input as Record<string, string>
  const resolvedTo = to?.trim() || 'zajemce@email.cz'
  const resolvedSubject = subject?.trim() || 'Navrh terminu prohlidky'
  const resolvedBody = body?.trim() || ''
  const normalizedContext = `${subject ?? ''} ${body ?? ''} ${context ?? ''}`
  const isViewingEmail = /zájemce|zajemce|prohl[ií]dk|viewing/i.test(normalizedContext)
  const draftResult = await createDraft(resolvedTo, resolvedSubject, resolvedBody)

  return {
    data: {
      to: resolvedTo,
      subject: resolvedSubject,
      body: resolvedBody,
      context: context ?? '',
      email_type: isViewingEmail ? 'property_viewing' : 'general',
      gmail_draft: draftResult.created ? 'Koncept ulozen do Gmail' : null,
      google_connected: hasGoogleRefreshToken(),
    },
    summary: isViewingEmail
      ? `Email zájemci s návrhem termínů prohlídky je připraven k odeslání.`
      : `Email pro „${resolvedTo}“ s předmětem „${resolvedSubject}“ je připraven k odeslání.`,
    display_hint: 'email_draft',
  }
}

async function handleCheckCalendar(input: Record<string, unknown>): Promise<ToolResult> {
  const { date_from, date_to, duration_minutes } = input as Record<string, string>
  const duration = Number(duration_minutes ?? 60)
  let resolvedFrom = date_from ?? '2026-03-24'
  let resolvedTo = date_to ?? '2026-03-28'

  const inputYear = Number.parseInt(resolvedFrom.split('-')[0] ?? '2026', 10)
  if (inputYear < 2026) {
    resolvedFrom = '2026-03-24'
    resolvedTo = '2026-03-28'
  }

  const availability = await getAvailableSlots(resolvedFrom, resolvedTo, duration)
  const groupedSlots = availability.slots.reduce<Array<{ date: string; day: string; slots: string[] }>>((acc, slot) => {
    const existing = acc.find((item) => item.date === slot.date && item.day === slot.day)
    if (existing) {
      existing.slots.push(slot.time)
      return acc
    }

    acc.push({
      date: slot.date,
      day: slot.day,
      slots: [slot.time],
    })
    return acc
  }, [])

  return {
    data: {
      requested_range: {
        date_from: resolvedFrom,
        date_to: resolvedTo,
      },
      duration_minutes: duration,
      slots: groupedSlots,
      raw_slots: availability.slots,
      source: availability.source,
    },
    summary: `Volné termíny od ${resolvedFrom} do ${resolvedTo} jsou připravené (${availability.source === 'google_calendar' ? 'Google Calendar' : 'simulace'}).`,
    display_hint: 'table',
  }
}

function handleCreateTask(input: Record<string, unknown>): ToolResult {
  const { title, description, assigned_to, priority, due_date, related_property_id, related_client_id } =
    input as Record<string, string>

  const task = db.addTask({
    title,
    description,
    assigned_to: assigned_to ?? 'agent-001',
    related_property_id: related_property_id ?? null,
    related_client_id: related_client_id ?? null,
    status: 'todo',
    priority: (priority as Task['priority']) ?? 'medium',
    due_date: due_date ?? '2026-03-31',
  })

  return {
    data: task,
    summary: `Úkol „${title}" byl vytvořen s prioritou ${task.priority} a termínem ${task.due_date}.`,
    display_hint: 'task_created',
  }
}

function handleCompareProperties(input: Record<string, unknown>): ToolResult {
  const property_ids = Array.isArray(input.property_ids)
    ? input.property_ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []

  const properties = property_ids
    .map((id) => db.getPropertyById(id))
    .filter((property): property is Property => Boolean(property))
    .map((property) => ({
      ...property,
      price_per_sqm: pricePerSqm(property),
    }))

  const missing = property_ids.length - properties.length

  return {
    data: {
      properties,
      comparison_fields: ['price', 'area_sqm', 'rooms', 'renovation_status', 'year_built', 'price_per_sqm'],
    },
    summary:
      properties.length >= 2
        ? `Porovnání ${properties.length} nemovitostí je připravené${missing > 0 ? `, ${missing} ID nebylo nalezeno` : ''}.`
        : 'Pro porovnání jsou potřeba alespoň 2 existující nemovitosti.',
    display_hint: 'comparison',
  }
}

function handleGeneratePropertyDescription(input: Record<string, unknown>): ToolResult {
  const property_id = typeof input.property_id === 'string' ? input.property_id : ''
  const tone = typeof input.tone === 'string' ? input.tone : 'professional'
  const language = input.language === 'en' ? 'en' : 'cs'
  const property = db.getPropertyById(property_id)

  if (!property) {
    return {
      data: null,
      summary: `Nemovitost s ID ${property_id} nebyla nalezena.`,
      display_hint: 'text',
    }
  }

  return {
    data: { property, tone, language },
    summary: `Podklady pro marketingový popis nemovitosti „${property.name}" jsou připravené.`,
    display_hint: 'text',
  }
}

function handleAnalyzePortfolio(input: Record<string, unknown>): ToolResult {
  const group_by = (input.group_by as 'city' | 'type' | 'status' | 'price_range') ?? 'type'
  const properties = db.getAllProperties()
  const stale = db.getStaleListings(180)
  const missing = db.getPropertiesWithMissingData()

  const groups = new Map<string, Property[]>()

  for (const property of properties) {
    const key =
      group_by === 'city'
        ? property.address.city
        : group_by === 'type'
        ? property.type
        : group_by === 'status'
        ? property.status
        : getPriceRangeLabel(property.price)

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(property)
  }

  const rows = Array.from(groups.entries())
    .map(([group, items]) => ({
      Skupina: group,
      Počet: items.length,
      'Celková hodnota': czk(items.reduce((sum, property) => sum + property.price, 0)),
      'Průměrná cena': czk(Math.round(average(items.map((property) => property.price)))),
      'Průměrná plocha': `${Math.round(average(items.map((property) => property.area_sqm)))} m²`,
    }))
    .sort((a, b) => Number(b.Počet) - Number(a.Počet))

  const onMarket = properties.filter((property) => property.status === 'available' || property.status === 'reserved')
  const recommendations = [
    missing.length > 0 ? `${missing.length} nemovitostí s chybějícími daty vyžaduje doplnění.` : null,
    stale.length > 0 ? `${stale.length} nemovitostí je na trhu déle než 6 měsíců a zaslouží revizi ceny.` : null,
    onMarket.filter((property) => property.status === 'available').length > properties.length / 2
      ? 'Vysoký podíl volných jednotek naznačuje prostor pro aktivnější propagaci.'
      : null,
  ].filter(Boolean)

  const priceRanges = ['<5M', '5-10M', '10-20M', '20M+'].map((range) => ({
    range,
    count: properties.filter((property) => getPriceRangeLabel(property.price) === range).length,
  }))

  const avgDaysOnMarket = Math.round(average(onMarket.map((property) => daysBetween(property.created_at, NOW))))
  const vacancyRate = properties.length > 0
    ? Math.round((properties.filter((property) => property.status === 'available').length / properties.length) * 1000) / 10
    : 0

  return {
    data: {
      rows,
      overall: {
        total_portfolio_value_czk: properties.reduce((sum, property) => sum + property.price, 0),
        avg_days_on_market: avgDaysOnMarket,
        vacancy_rate_pct: vacancyRate,
      },
      price_ranges: priceRanges,
      recommendations,
      group_by,
    },
    summary: `Portfolio obsahuje ${properties.length} nemovitostí v celkové hodnotě ${czk(properties.reduce((sum, property) => sum + property.price, 0))}. Průměrná doba na trhu je ${avgDaysOnMarket} dní a vacancy rate ${vacancyRate} %. ${recommendations.join(' ')}`.trim(),
    display_hint: 'table',
  }
}

function handleClientActivityTimeline(input: Record<string, unknown>): ToolResult {
  const client_id = typeof input.client_id === 'string' ? input.client_id.trim() : ''
  const client_name = typeof input.client_name === 'string' ? input.client_name.trim() : ''

  let client = client_id ? db.getClientById(client_id) : undefined

  if (!client && client_name) {
    const matches = db.searchClients(client_name)
    const exact = matches.find((item) => item.name.toLowerCase() === client_name.toLowerCase())
    client = exact ?? matches[0]
  }

  if (!client) {
    return {
      data: { client: null, timeline: [] },
      summary: 'Klient nebyl nalezen.',
      display_hint: 'timeline',
    }
  }

  const leads = db.getAllLeads().filter((lead) => lead.client_id === client!.id)
  const transactions = db.getTransactions().filter((transaction) => transaction.client_id === client!.id)
  const tasks = db.getAllTasks().filter((task) => task.related_client_id === client!.id)

  const timeline = [
    ...leads.map((lead) => {
      const property = lead.property_id ? db.getPropertyById(lead.property_id) : undefined
      return {
        date: lead.created_at,
        event_type: 'lead',
        description: `Lead ${lead.type} (${lead.status})${property ? ` - ${property.name}` : ''}`,
        description_cs: `Lead ${lead.type} (${lead.status})${property ? ` - ${property.name}` : ''}`,
        description_en: `Lead ${lead.type} (${lead.status})${property ? ` - ${property.name}` : ''}`,
      }
    }),
    ...transactions.map((transaction) => {
      const property = db.getPropertyById(transaction.property_id)
      return {
        date: transaction.date,
        event_type: 'transaction',
        description: `Transakce ${transaction.type} (${transaction.status})${property ? ` - ${property.name}` : ''}, ${czk(transaction.amount)}`,
        description_cs: `Transakce ${transaction.type} (${transaction.status})${property ? ` - ${property.name}` : ''}, ${czk(transaction.amount)}`,
        description_en: `Transaction ${transaction.type} (${transaction.status})${property ? ` - ${property.name}` : ''}, ${czk(transaction.amount)}`,
      }
    }),
    ...tasks.map((task) => ({
      date: task.created_at,
      event_type: 'task',
      description: `Úkol ${task.title} (${task.status})`,
      description_cs: `Úkol ${task.title} (${task.status})`,
      description_en: `Task ${task.title} (${task.status})`,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return {
    data: {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      timeline,
    },
    summary: `Časová osa klienta ${client.name} obsahuje ${timeline.length} událostí.`,
    display_hint: 'timeline',
  }
}

function handleMarketOverview(input: Record<string, unknown>): ToolResult {
  const city = typeof input.city === 'string' && input.city.trim() ? input.city.trim() : undefined
  const period_months = Number(input.period_months ?? 6)
  const cutoff = subtractMonths(NOW, period_months)
  const currentMonth = monthKey(NOW)
  const previousMonth = monthKey(subtractMonths(NOW, 1))

  const properties = db.getAllProperties().filter((property) => !city || property.address.city.toLowerCase() === city.toLowerCase())
  const leads = db.getAllLeads().filter((lead) => lead.created_at >= cutoff && matchesCity(lead.property_id, city))
  const transactions = db.getTransactions().filter((transaction) => transaction.date >= cutoff && matchesCity(transaction.property_id, city))

  const saleTransactions = transactions.filter((transaction) => transaction.type === 'sale' && transaction.status === 'completed')
  const avgPricePerSqmValues = saleTransactions
    .map((transaction) => db.getPropertyById(transaction.property_id))
    .filter((property): property is Property => Boolean(property))
    .map((property) => pricePerSqm(property))

  const closingDurations = saleTransactions
    .map((transaction) => {
      const relatedLead = db.getAllLeads()
        .filter((lead) => lead.client_id === transaction.client_id && lead.property_id === transaction.property_id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
      return relatedLead ? daysBetween(relatedLead.created_at, transaction.date) : null
    })
    .filter((value): value is number => value !== null)

  function metricsForMonth(month: string) {
    const monthTransactions = saleTransactions.filter((transaction) => monthKey(transaction.date) === month)
    const monthLeads = leads.filter((lead) => monthKey(lead.created_at) === month)
    const monthPricePerSqm = monthTransactions
      .map((transaction) => db.getPropertyById(transaction.property_id))
      .filter((property): property is Property => Boolean(property))
      .map((property) => pricePerSqm(property))
    const monthClosingDurations = monthTransactions
      .map((transaction) => {
        const relatedLead = db.getAllLeads()
          .filter((lead) => lead.client_id === transaction.client_id && lead.property_id === transaction.property_id)
          .sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
        return relatedLead ? daysBetween(relatedLead.created_at, transaction.date) : null
      })
      .filter((value): value is number => value !== null)

    return {
      avg_sale_price: Math.round(average(monthTransactions.map((transaction) => transaction.amount))),
      avg_price_per_sqm: Math.round(average(monthPricePerSqm)),
      total_volume: monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      conversion_rate: monthLeads.length > 0
        ? Math.round((monthLeads.filter((lead) => lead.status === 'closed_won').length / monthLeads.length) * 1000) / 10
        : 0,
      avg_days_to_close: Math.round(average(monthClosingDurations)),
    }
  }

  const currentMetrics = metricsForMonth(currentMonth)
  const previousMetrics = metricsForMonth(previousMonth)

  const rows = [
    {
      Metrika: 'Průměrná prodejní cena',
      Hodnota: czk(Math.round(average(saleTransactions.map((transaction) => transaction.amount)))),
      'Tento měsíc': czk(currentMetrics.avg_sale_price),
      'Minulý měsíc': czk(previousMetrics.avg_sale_price),
      'Změna m/m': `${pctChange(currentMetrics.avg_sale_price, previousMetrics.avg_sale_price)} %`,
    },
    {
      Metrika: 'Průměrná cena za m²',
      Hodnota: `${new Intl.NumberFormat('cs-CZ').format(Math.round(average(avgPricePerSqmValues)))} CZK`,
      'Tento měsíc': `${new Intl.NumberFormat('cs-CZ').format(currentMetrics.avg_price_per_sqm)} CZK`,
      'Minulý měsíc': `${new Intl.NumberFormat('cs-CZ').format(previousMetrics.avg_price_per_sqm)} CZK`,
      'Změna m/m': `${pctChange(currentMetrics.avg_price_per_sqm, previousMetrics.avg_price_per_sqm)} %`,
    },
    {
      Metrika: 'Celkový objem',
      Hodnota: czk(transactions.filter((transaction) => transaction.status === 'completed').reduce((sum, transaction) => sum + transaction.amount, 0)),
      'Tento měsíc': czk(currentMetrics.total_volume),
      'Minulý měsíc': czk(previousMetrics.total_volume),
      'Změna m/m': `${pctChange(currentMetrics.total_volume, previousMetrics.total_volume)} %`,
    },
    {
      Metrika: 'Konverzní poměr',
      Hodnota: `${leads.length > 0 ? Math.round((leads.filter((lead) => lead.status === 'closed_won').length / leads.length) * 1000) / 10 : 0} %`,
      'Tento měsíc': `${currentMetrics.conversion_rate} %`,
      'Minulý měsíc': `${previousMetrics.conversion_rate} %`,
      'Změna m/m': `${pctChange(currentMetrics.conversion_rate, previousMetrics.conversion_rate)} %`,
    },
    {
      Metrika: 'Průměrná délka uzavření',
      Hodnota: `${Math.round(average(closingDurations))} dní`,
      'Tento měsíc': `${currentMetrics.avg_days_to_close} dní`,
      'Minulý měsíc': `${previousMetrics.avg_days_to_close} dní`,
      'Změna m/m': `${pctChange(currentMetrics.avg_days_to_close, previousMetrics.avg_days_to_close)} %`,
    },
  ]

  return {
    data: {
      rows,
      city: city ?? 'all',
      period_months,
      properties_in_scope: properties.length,
      leads_in_scope: leads.length,
      transactions_in_scope: transactions.length,
    },
    summary: `Přehled trhu${city ? ` pro ${city}` : ''} za posledních ${period_months} měsíců: průměrná prodejní cena ${rows[0].Hodnota}, objem ${rows[2].Hodnota}, konverze ${rows[3].Hodnota}.`,
    display_hint: 'table',
  }
}

async function handleWebSearch(input: Record<string, unknown>): Promise<ToolResult> {
  const query = typeof input.query === 'string' ? input.query.trim() : ''
  const results = query ? await searchWeb(query) : []

  return {
    data: results,
    summary: results.length > 0
      ? `Nalezeno ${results.length} výsledků pro "${query}".`
      : `Žádné výsledky pro "${query}".`,
    display_hint: 'text',
  }
}

async function handleSearchListings(input: Record<string, unknown>): Promise<ToolResult> {
  const location = typeof input.location === 'string' ? input.location.trim() : ''
  const listingData = location
    ? await fetchAllListings(location)
    : { listings: [], sources: [], fetchedAt: new Date().toISOString() }
  const liveSourceCount = listingData.sources.filter((source) => source.status === 'live').length

  return {
    data: { ...listingData, location },
    summary: `Nalezeno ${listingData.listings.length} nabídek v lokalitě ${location} z ${liveSourceCount} portálů.`,
    display_hint: 'table',
  }
}

function handleGenerateReport(input: Record<string, unknown>): ToolResult {
  const { period, format } = input as { period: 'week' | 'month' | 'quarter'; format?: string }

  const metrics = db.getSalesMetrics()
  const dash = db.getDashboardStats()
  const weekly = db.getWeeklySummary()
  const leadsMonthly = db.getLeadsByMonth(period === 'week' ? 1 : period === 'month' ? 1 : 3)
  const txMonthly = db.getTransactionsByMonth(period === 'week' ? 1 : period === 'month' ? 1 : 3)
  const stale = db.getStaleListings(60)
  const missing = db.getPropertiesWithMissingData()

  const periodLabel = { week: 'týden', month: 'měsíc', quarter: 'kvartál' }[period]

  const report = {
    period,
    generated_at: '2026-03-22',
    summary_text: `Za ${periodLabel} jsme uzavřeli ${period === 'week' ? weekly.deals_closed : metrics.deals_closed} obchodů, získali ${period === 'week' ? weekly.new_leads : leadsMonthly.reduce((s, m) => s + m.count, 0)} leadů a dosáhli tržeb ${czk(period === 'week' ? weekly.revenue : metrics.total_revenue)}.`,
    summary: {
      title: `Report za ${periodLabel} — ${period === 'week' ? 'týden do 22. 3. 2026' : period === 'month' ? 'březen 2026' : 'Q1 2026'}`,
      overview: `Kancelář spravuje ${dash.total_properties} nemovitostí (${dash.active_properties} aktivních). Celkem ${dash.total_clients} klientů v databázi.`,
    },
    metrics: {
      revenue: period === 'week' ? weekly.revenue : metrics.total_revenue,
      commission: metrics.total_commission,
      deals_closed: period === 'week' ? weekly.deals_closed : metrics.deals_closed,
      avg_deal_size: metrics.avg_deal_size,
      pending_deals: metrics.pending_deals,
      pending_value: metrics.pending_value,
      new_leads: period === 'week' ? weekly.new_leads : leadsMonthly.reduce((s, m) => s + m.count, 0),
      new_clients: period === 'week' ? weekly.new_clients : dash.new_clients_this_month,
    },
    highlights: [
      metrics.pending_deals > 0
        ? `${metrics.pending_deals} obchodů v hodnotě ${czk(metrics.pending_value)} čeká na dokončení.`
        : null,
      stale.length > 0
        ? `${stale.length} nemovitostí je na trhu déle než 60 dní — zvážit přecenění.`
        : null,
      missing.length > 0
        ? `${missing.length} nemovitostí má neúplné údaje o rekonstrukci.`
        : null,
      dash.monthly_changes.leads > 0
        ? `Počet leadů vzrostl o ${dash.monthly_changes.leads} % oproti minulému měsíci.`
        : null,
    ].filter(Boolean),
    action_items: [
      stale.length > 0 ? 'Přeceňte nebo aktualizujte stagnující inzeráty' : null,
      missing.length > 0 ? 'Doplňte chybějící data o rekonstrukcích' : null,
      metrics.pending_deals > 0 ? 'Sledujte průběh probíhajících transakcí' : null,
      'Kontaktujte nové leady do 24 hodin od přijetí',
    ].filter(Boolean),
    monthly_breakdown: {
      leads: leadsMonthly,
      transactions: txMonthly,
    },
  }

  const isFmt = format !== 'text'
  return {
    data: report,
    summary: isFmt
      ? `Strukturovaný report za ${periodLabel} vygenerován. Tržby: ${czk(report.metrics.revenue)}, obchody: ${report.metrics.deals_closed}, leady: ${report.metrics.new_leads}.`
      : `Report za ${periodLabel}: tržby ${czk(report.metrics.revenue)}, ${report.metrics.deals_closed} uzavřených obchodů, ${report.metrics.new_leads} nových leadů.`,
    display_hint: 'report',
  }
}

function handleGeneratePresentation(input: Record<string, unknown>): ToolResult {
  const { topic, num_slides, key_points, existing_content, existing_slides } = input as {
    topic: string
    num_slides: number
    key_points?: string[]
    existing_content?: string
    existing_slides?: Array<{ title?: string; content?: string | string[] }>
  }

  const resolvedTopic = topic?.trim() || 'Týdenní report pro vedení'
  const dash = db.getDashboardStats()
  const metrics = db.getSalesMetrics()
  const allLeads = db.getAllLeads()
  const newLeadCount = allLeads.filter((lead) => lead.status === 'new').length
  const missingData = db.getPropertiesWithMissingData()
  const stale = db.getStaleListings(90)
  const completedSales = db.getTransactions({ type: 'sale', status: 'completed' })
  const topDeals = [...completedSales]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((transaction) => {
      const propertyName = db.getPropertyById(transaction.property_id)?.name ?? transaction.property_id
      return `${propertyName}: ${czk(transaction.amount)}`
    })
  const conversionRate = allLeads.length > 0
    ? Math.round((allLeads.filter((lead) => lead.status === 'closed_won').length / allLeads.length) * 1000) / 10
    : 0
  const requestedSlides = Math.max(1, Math.min(Number(num_slides) || 3, 10))
  const leadTrend = `${dash.monthly_changes.leads > 0 ? '+' : ''}${dash.monthly_changes.leads} % vs. minulý měsíc`
  const actionItems = [
    `Kontaktovat ${newLeadCount} nových leadů`,
    `Doplnit data u ${missingData.length} nemovitostí`,
    `Přecenit ${stale.length} stagnujících inzerátů`,
    `Dokončit ${metrics.pending_deals} rozpracovaných obchodů`,
    ...(key_points?.length ? key_points : []),
  ]
  const normalizedExistingSlides = Array.isArray(existing_slides)
    ? existing_slides
        .filter((slide): slide is { title?: string; content?: string | string[] } => Boolean(slide))
        .map((slide, index) => ({
          title: slide.title?.trim() || `Slide ${index + 1}`,
          content: Array.isArray(slide.content)
            ? slide.content.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            : typeof slide.content === 'string' && slide.content.trim().length > 0
            ? [slide.content.trim()]
            : [],
        }))
        .filter((slide) => slide.content.length > 0)
    : []

  const baseSlides = [
    {
      title: 'Přehled výsledků',
      content: [
        `Tržby za sledované období: ${czk(metrics.total_revenue)}`,
        `Provize: ${czk(metrics.total_commission)}`,
        `Nové leady: ${dash.total_leads_this_month} (${leadTrend})`,
        `Uzavřené obchody: ${metrics.deals_closed}`,
        `Aktivní portfolio: ${dash.active_properties} nemovitostí`,
      ],
    },
    {
      title: 'Hlavní úspěchy a výzvy',
      content: [
        `Konverzní poměr leadů: ${conversionRate} %`,
        ...topDeals,
        `${stale.length} stagnujících inzerátů nad 90 dní`,
        `${missingData.length} nemovitostí s chybějícími daty`,
      ],
    },
    {
      title: 'Doporučené kroky',
      content: actionItems.slice(0, 4),
    },
  ]

  const additionalSlides = [
    {
      title: 'Rozšířený kontext',
      content: [
        existing_content?.trim() ? `Zachovat z předchozí verze: ${existing_content.trim()}` : null,
        key_points?.[0] ? `Nový důraz: ${key_points[0]}` : null,
        key_points?.[1] ? `Další bod: ${key_points[1]}` : null,
        `Top obchod: ${topDeals[0] ?? 'Bez výrazného obchodu v datech.'}`,
      ].filter((item): item is string => Boolean(item)),
    },
    {
      title: 'Další příležitosti',
      content: [
        `Nové leady čekající na kontakt: ${newLeadCount}`,
        `Aktivní portfolio: ${dash.active_properties} nemovitostí`,
        `Stagnující inzeráty: ${stale.length}`,
        `Nemovitosti s neúplnými daty: ${missingData.length}`,
      ],
    },
    {
      title: 'Rozšířené doporučení',
      content: actionItems.slice(0, 4),
    },
  ]

  const slidePool = normalizedExistingSlides.length > 0
    ? [...normalizedExistingSlides]
    : [...baseSlides]

  if (requestedSlides > slidePool.length) {
    const missingCount = requestedSlides - slidePool.length
    const candidates = normalizedExistingSlides.length > 0
      ? additionalSlides
      : [...baseSlides.slice(slidePool.length), ...additionalSlides]
    slidePool.push(...candidates.slice(0, missingCount))
  }

  const slides = slidePool.slice(0, requestedSlides)

  return {
    data: { topic: resolvedTopic, slides },
    summary: `Prezentace se ${slides.length} slidy připravena ke stažení.`,
    display_hint: 'file_download',
  }
}

async function handleSetupMonitoring(input: Record<string, unknown>): Promise<ToolResult> {
  const { location, property_type, price_min, price_max, frequency } =
    input as Record<string, string>
  const normalizedLocation = location && /holešovice|holesovice/i.test(location)
    ? 'Praha - Holešovice'
    : location?.trim() || 'Praha - Holešovice'
  const monitoredTypes = property_type
    ? [property_type as PropertyType]
    : DEFAULT_MONITORING_TYPES
  const resolvedFrequency = (frequency as MonitoringRule['frequency']) ?? 'daily'

  const rule: MonitoringRule = {
    id: `monitoring-${Date.now()}`,
    location: normalizedLocation,
    filters: {
      property_types: monitoredTypes,
      price_min: price_min ? Number(price_min) : undefined,
      price_max: price_max ? Number(price_max) : undefined,
    },
    frequency: resolvedFrequency,
    active: true,
    created_at: new Date().toISOString(),
  }

  monitoringStore.addRule(rule)

  const filterDesc: string[] = [`lokalita: ${normalizedLocation}`]
  if (property_type) filterDesc.push(`typ: ${property_type}`)
  if (price_min) filterDesc.push(`od ${czk(Number(price_min))}`)
  if (price_max) filterDesc.push(`do ${czk(Number(price_max))}`)
  const listingData = await fetchAllListings(normalizedLocation)
  const liveSources = listingData.sources.filter((source) => source.status === 'live').map((source) => source.name)
  const activeSourceText = liveSources.length > 0 ? liveSources.join(' a ') : 'žádné aktivní portály'

  return {
    data: {
      ...rule,
      initialResults: listingData.listings,
      sources: listingData.sources,
      fetchedAt: listingData.fetchedAt,
      status: 'aktivní',
      next_check: '27.03.2026 v 07:00',
      next_check_relative_cs: 'zítra v 7:00',
      next_check_relative_en: 'tomorrow at 7:00',
      message: `Monitoring nastaven. Prohledal jsem ${activeSourceText} a nalezl ${listingData.listings.length} aktuálních nabídek v ${normalizedLocation}. Další automatická kontrola proběhne ${rule.frequency === 'daily' ? 'zítra v 7:00' : 'příští týden'}.`,
    },
    summary: `Monitoring pro ${normalizedLocation} nastaven. Nalezeno ${listingData.listings.length} nabídek z ${liveSources.length} portálů.`,
    display_hint: 'monitoring_set',
  }
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function handleToolCall(
  toolName: ToolName,
  toolInput: Record<string, unknown>,
  context?: ToolCallContext
): Promise<ToolResult> {
  switch (toolName) {
    case 'query_clients':          return handleQueryClients(toolInput, context)
    case 'query_leads':            return handleQueryLeads(toolInput)
    case 'query_properties':       return handleQueryProperties(toolInput)
    case 'estimate_property_value': return handleEstimatePropertyValue(toolInput)
    case 'find_missing_data':      return handleFindMissingData(toolInput)
    case 'query_transactions':     return handleQueryTransactions(toolInput)
    case 'get_dashboard_metrics':  return handleGetDashboardMetrics()
    case 'get_weekly_summary':     return handleGetWeeklySummary()
    case 'generate_chart':         return handleGenerateChart(toolInput)
    case 'draft_email':            return handleDraftEmail(toolInput)
    case 'check_calendar':         return handleCheckCalendar(toolInput)
    case 'create_task':            return handleCreateTask(toolInput)
    case 'generate_report':        return handleGenerateReport(toolInput)
    case 'generate_presentation':  return handleGeneratePresentation(toolInput)
    case 'setup_monitoring':       return handleSetupMonitoring(toolInput)
    case 'compare_properties':     return handleCompareProperties(toolInput)
    case 'generate_property_description': return handleGeneratePropertyDescription(toolInput)
    case 'analyze_portfolio':      return handleAnalyzePortfolio(toolInput)
    case 'client_activity_timeline': return handleClientActivityTimeline(toolInput)
    case 'market_overview':        return handleMarketOverview(toolInput)
    case 'web_search':            return handleWebSearch(toolInput)
    case 'search_listings':       return handleSearchListings(toolInput)
  }
}
