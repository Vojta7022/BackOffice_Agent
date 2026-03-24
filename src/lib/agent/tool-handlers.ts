import { db } from '@/lib/database'
import { MonitoringRule, Task, Lead, Client, Property, PropertyType, Transaction } from '@/types'
import { ToolName } from './tools'

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ToolResult {
  data: unknown
  summary: string
  display_hint: 'text' | 'table' | 'chart' | 'email_draft' | 'file_download' | 'task_created' | 'monitoring_set' | 'comparison' | 'timeline' | 'report'
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
const WEEKDAY_NAMES_CS = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'] as const
const WEEKDAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const CALENDAR_SLOT_TEMPLATES = [
  ['09:00-10:00', '14:00-15:00', '16:30-17:15'],
  ['10:00-11:00', '13:30-14:30'],
  ['14:00-15:00', '16:00-17:00'],
  ['09:30-10:30', '11:30-12:15', '15:00-16:00'],
  ['08:30-09:15', '12:00-13:00'],
]

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

function formatDotDate(date: Date): string {
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('.')
}

function formatChartMonthLabel(month: string): string {
  const [year, rawMonth] = month.split('-').map(Number)
  const monthLabels = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
  const label = monthLabels[(rawMonth ?? 1) - 1] ?? month
  return Number.isFinite(year) ? `${label} ${year}` : month
}

function getNextBusinessDaySlots() {
  const slots: Array<{ date: string; day: string; day_en: string; slots: string[] }> = []
  const cursor = new Date(`${NOW}T00:00:00`)
  cursor.setDate(cursor.getDate() + 1)

  while (slots.length < 5) {
    const dayOfWeek = cursor.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const template = CALENDAR_SLOT_TEMPLATES[slots.length % CALENDAR_SLOT_TEMPLATES.length]
      slots.push({
        date: formatDotDate(cursor),
        day: WEEKDAY_NAMES_CS[dayOfWeek],
        day_en: WEEKDAY_NAMES_EN[dayOfWeek],
        slots: template,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return slots
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleQueryClients(input: Record<string, unknown>): ToolResult {
  const { date_from, date_to, source, type, status, quarter, group_by } = input as Record<string, string>

  // Quarter mode
  if (quarter) {
    const parsed = parseQuarter(quarter)
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

function handleDraftEmail(input: Record<string, unknown>): ToolResult {
  const { to, subject, body, context } = input as Record<string, string>
  const normalizedContext = `${subject ?? ''} ${body ?? ''} ${context ?? ''}`
  const isViewingEmail = /zájemce|zajemce|prohl[ií]dk|viewing/i.test(normalizedContext)
  return {
    data: {
      to,
      subject,
      body,
      context: context ?? '',
      email_type: isViewingEmail ? 'property_viewing' : 'general',
    },
    summary: isViewingEmail
      ? `Email zájemci s návrhem termínů prohlídky je připraven k odeslání.`
      : `Email pro „${to}“ s předmětem „${subject}“ je připraven k odeslání.`,
    display_hint: 'email_draft',
  }
}

function handleCheckCalendar(input: Record<string, unknown>): ToolResult {
  const { date_from, date_to, duration_minutes } = input as Record<string, string>
  const duration = Number(duration_minutes ?? 60)
  const slots = getNextBusinessDaySlots()

  return {
    data: {
      requested_range: {
        date_from: date_from ?? NOW,
        date_to: date_to ?? '2026-03-27',
      },
      duration_minutes: duration,
      slots,
    },
    summary: `Volné termíny pro příštích 5 pracovních dní od 23.03.2026 do 27.03.2026 jsou připravené.`,
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
  const { topic, num_slides, key_points } = input as {
    topic: string
    num_slides: number
    key_points?: string[]
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
  const requestedSlides = Math.max(1, Math.min(Number(num_slides) || 3, 3))
  const leadTrend = `${dash.monthly_changes.leads > 0 ? '+' : ''}${dash.monthly_changes.leads} % vs. minulý měsíc`
  const actionItems = [
    `Kontaktovat ${newLeadCount} nových leadů`,
    `Doplnit data u ${missingData.length} nemovitostí`,
    `Přecenit ${stale.length} stagnujících inzerátů`,
    `Dokončit ${metrics.pending_deals} rozpracovaných obchodů`,
    ...(key_points?.length ? key_points : []),
  ]

  const slides = [
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
  ].slice(0, requestedSlides)

  return {
    data: { topic: resolvedTopic, slides },
    summary: `Prezentace se ${slides.length} slidy připravena ke stažení.`,
    display_hint: 'file_download',
  }
}

function handleSetupMonitoring(input: Record<string, unknown>): ToolResult {
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
    created_at: '2026-03-22',
  }

  const filterDesc: string[] = [`lokalita: ${normalizedLocation}`]
  if (property_type) filterDesc.push(`typ: ${property_type}`)
  if (price_min) filterDesc.push(`od ${czk(Number(price_min))}`)
  if (price_max) filterDesc.push(`do ${czk(Number(price_max))}`)

  return {
    data: {
      ...rule,
      status: 'aktivní',
      next_check: '23.03.2026 v 07:00',
      next_check_relative_cs: 'zítra v 7:00',
      next_check_relative_en: 'tomorrow at 7:00',
      message: 'Monitoring nastaven. Budete informováni o nových nabídkách.',
    },
    summary: `Monitoring nastaven — ${filterDesc.join(', ')}. Frekvence: ${rule.frequency === 'daily' ? 'denně' : 'týdně'}. Další kontrola zítra v 7:00.`,
    display_hint: 'monitoring_set',
  }
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function handleToolCall(
  toolName: ToolName,
  toolInput: Record<string, unknown>
): Promise<ToolResult> {
  switch (toolName) {
    case 'query_clients':          return handleQueryClients(toolInput)
    case 'query_leads':            return handleQueryLeads(toolInput)
    case 'query_properties':       return handleQueryProperties(toolInput)
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
  }
}
