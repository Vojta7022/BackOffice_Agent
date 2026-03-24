'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { CheckCircle2, Bell, FileDown, FileText, Presentation, Wrench, Sparkles } from 'lucide-react'
import InlineChart from './InlineChart'
import InlineTable from './InlineTable'
import EmailDraftCard from './EmailDraftCard'
import ComparisonCard from './ComparisonCard'
import TimelineCard from './TimelineCard'
import type { ChatMessage } from '@/lib/chat-store'
import type { ChartConfig, ToolCallLogEntry } from '@/lib/agent/orchestrator'
import { useTranslation } from '@/lib/useTranslation'
import { formatCZK } from '@/lib/utils'

const TOOL_SUGGESTIONS: Record<string, { cs: string[]; en: string[] }> = {
  query_clients: {
    cs: ['Zobraz jako graf', 'Export do CSV', 'Rozdel podle typu'],
    en: ['Show as chart', 'Export to CSV', 'Break down by type'],
  },
  query_leads: {
    cs: ['Graf za 6 mesicu', 'Konverzni pomer', 'Nezkontaktovane leady'],
    en: ['Chart for 6 months', 'Conversion rate', 'Uncontacted leads'],
  },
  query_properties: {
    cs: ['Porovnej vybrane', 'Najdi chybejici data', 'Serad podle ceny za m²'],
    en: ['Compare selected', 'Find missing data', 'Sort by price per m²'],
  },
  find_missing_data: {
    cs: ['Export seznam', 'Prirad ukoly k doplneni'],
    en: ['Export list', 'Assign tasks to fill in'],
  },
  generate_chart: {
    cs: ['Jiny typ grafu', 'Pridej do reportu'],
    en: ['Different chart type', 'Add to report'],
  },
  draft_email: {
    cs: ['Uprav ton', 'Pridej termin prohlidky'],
    en: ['Adjust tone', 'Add a viewing date'],
  },
  generate_report: {
    cs: ['Vytvor prezentaci', 'Posli emailem'],
    en: ['Create presentation', 'Send by email'],
  },
  generate_presentation: {
    cs: ['Pridej dalsi slide', 'Stahnout PPTX'],
    en: ['Add another slide', 'Download PPTX'],
  },
  setup_monitoring: {
    cs: ['Nastav dalsi lokality', 'Zmen frekvenci'],
    en: ['Set more locations', 'Change frequency'],
  },
}

const TOOL_STEP_LABELS_CS: Record<string, string> = {
  query_clients: 'Vyhledavani klientu',
  query_leads: 'Analyza leadu',
  query_properties: 'Hledani nemovitosti',
  query_transactions: 'Analyza transakci',
  find_missing_data: 'Hledani chybejicich dat',
  generate_chart: 'Tvorba grafu',
  draft_email: 'Priprava emailu',
  check_calendar: 'Kontrola kalendare',
  create_task: 'Vytvareni ukolu',
  generate_report: 'Generovani reportu',
  generate_presentation: 'Priprava prezentace',
  setup_monitoring: 'Nastaveni monitoringu',
  get_dashboard_metrics: 'Nacitani metrik',
  get_weekly_summary: 'Tydenni prehled',
  compare_properties: 'Porovnani nemovitosti',
  generate_property_description: 'Tvorba popisu nemovitosti',
  analyze_portfolio: 'Analyza portfolia',
  client_activity_timeline: 'Historie klienta',
  market_overview: 'Prehled trhu',
}

function formatTime(iso: string, language: 'cs' | 'en') {
  return new Date(iso).toLocaleTimeString(language === 'cs' ? 'cs-CZ' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMetricLabel(key: string, labels: Record<string, string>) {
  return labels[key] ?? key.replace(/_/g, ' ')
}

function formatFullCZK(amount: number, language: 'cs' | 'en') {
  const locale = language === 'cs' ? 'cs-CZ' : 'en-US'
  return `${new Intl.NumberFormat(locale).format(Math.round(amount))} CZK`
}

function formatReportMetricValue(key: string, value: unknown, language: 'cs' | 'en') {
  if (typeof value !== 'number') return String(value ?? '')

  switch (key) {
    case 'revenue':
    case 'total_revenue':
      return value === 0 ? '0 CZK' : formatFullCZK(value, language)
    case 'commission':
    case 'total_commission':
      return formatFullCZK(value, language)
    case 'avg_deal_size':
    case 'pending_value':
      return formatCZK(value, language)
    default:
      return new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-US', {
        maximumFractionDigits: 1,
      }).format(value)
  }
}

function normalizePresentationContent(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()]
  }

  return []
}

function sanitizeSuggestion(value: string) {
  return value
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim()
}

function extractTextSuggestions(content: string) {
  const lines = content.split(/\r?\n/).map((line) => line.trim())
  const suggestions: string[] = []
  let collecting = false

  for (const line of lines) {
    if (!collecting && /^(dalsi kroky|další kroky|next steps?)[:]?$/i.test(line)) {
      collecting = true
      continue
    }

    if (!collecting) continue

    if (!line) {
      if (suggestions.length > 0) break
      continue
    }

    const isBullet = /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)
    if (!isBullet) {
      if (suggestions.length > 0) break
      continue
    }

    const suggestion = sanitizeSuggestion(line)
    if (suggestion) suggestions.push(suggestion)
    if (suggestions.length >= 3) break
  }

  if (suggestions.length > 0) return suggestions

  return lines
    .filter((line) => /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .slice(-2)
    .map(sanitizeSuggestion)
    .filter(Boolean)
}

function getContextualSuggestions(steps: ToolCallLogEntry[] | undefined, language: 'cs' | 'en') {
  if (!steps?.length) return []

  const toolNames = [...steps]
    .reverse()
    .map((step) => step.name)
    .filter((name, index, list) => list.indexOf(name) === index)

  const suggestions: string[] = []

  for (const toolName of toolNames) {
    const toolSuggestions = TOOL_SUGGESTIONS[toolName]?.[language] ?? []
    for (const suggestion of toolSuggestions) {
      if (!suggestions.includes(suggestion)) {
        suggestions.push(suggestion)
      }
    }
    if (suggestions.length >= 6) break
  }

  return suggestions
}

// ─── ThinkingSteps ────────────────────────────────────────────────────────

function ThinkingSteps({ steps }: { steps: ToolCallLogEntry[] }) {
  if (!steps.length) return null
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {steps.map((step, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary/90"
        >
          <Wrench className="h-2.5 w-2.5" />
          {TOOL_STEP_LABELS_CS[step.name] ?? step.name}
        </span>
      ))}
    </div>
  )
}

// ─── Rich content cards ────────────────────────────────────────────────────

function TaskCreatedCard({ task }: { task: Record<string, unknown> }) {
  const { t } = useTranslation()

  return (
    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-green-500/25 bg-green-500/10 p-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
      <div>
        <p className="text-xs font-semibold text-green-500">{t.chat.taskCreated}</p>
        <p className="mt-0.5 text-sm text-foreground">{String(task.title ?? '')}</p>
        {!!task.due_date && (
          <p className="mt-0.5 text-xs text-muted-foreground">{t.chat.dueDate}: {String(task.due_date)}</p>
        )}
      </div>
    </div>
  )
}

function MonitoringCard({ rule }: { rule: Record<string, unknown> }) {
  const { t, language } = useTranslation()
  const frequency = rule.frequency === 'daily' ? t.chat.frequencies.daily : t.chat.frequencies.weekly
  const propertyTypes = Array.isArray((rule.filters as { property_types?: unknown[] } | undefined)?.property_types)
    ? ((rule.filters as { property_types?: string[] }).property_types ?? [])
    : []
  const typeLabel = propertyTypes.length > 0
    ? propertyTypes
        .map((type) => t.properties.typeLabels[type as keyof typeof t.properties.typeLabels] ?? type)
        .join(', ')
    : t.chat.monitoringAllTypes
  const priceMin = typeof (rule.filters as { price_min?: unknown } | undefined)?.price_min === 'number'
    ? Number((rule.filters as { price_min?: number }).price_min)
    : null
  const priceMax = typeof (rule.filters as { price_max?: unknown } | undefined)?.price_max === 'number'
    ? Number((rule.filters as { price_max?: number }).price_max)
    : null
  const priceRange = priceMin !== null || priceMax !== null
    ? `${priceMin !== null ? new Intl.NumberFormat('cs-CZ').format(priceMin) : '0'} CZK - ${priceMax !== null ? new Intl.NumberFormat('cs-CZ').format(priceMax) : '∞'} CZK`
    : t.chat.monitoringNoPriceLimit
  const nextCheck =
    language === 'en'
      ? String(rule.next_check_relative_en ?? rule.next_check ?? '')
      : String(rule.next_check_relative_cs ?? rule.next_check ?? '')

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-green-500/20 bg-green-500/5 shadow-sm dark:shadow-none">
      <div className="flex items-start gap-3 border-l-4 border-green-500 px-4 py-3">
        <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
          <Bell className="h-4 w-4" />
          <CheckCircle2 className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-background text-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">{t.chat.monitoringSet}</p>
          <p className="mt-1 text-sm text-foreground">{String(rule.message ?? t.chat.monitoringConfirmation)}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{t.chat.monitoringLocation}</p>
              <p className="text-sm font-medium text-foreground">{String(rule.location ?? '')}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{t.chat.monitoringPropertyType}</p>
              <p className="text-sm font-medium text-foreground">{typeLabel}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{t.chat.monitoringPriceRange}</p>
              <p className="text-sm font-medium text-foreground">{priceRange}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{t.chat.frequency}</p>
              <p className="text-sm font-medium text-foreground">{frequency}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{t.chat.monitoringStatus}</p>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{String(rule.status ?? t.chat.monitoringActive)}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{t.chat.monitoringNextCheck}</p>
              <p className="text-sm font-medium text-foreground">{nextCheck}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportCard({ report }: { report: Record<string, unknown> }) {
  const { t, language } = useTranslation()
  const summary = report.summary as Record<string, unknown> | undefined
  const metrics = report.metrics as Record<string, unknown> | undefined
  const highlights = (report.highlights as string[]) ?? []
  const actions = (report.action_items as string[]) ?? []

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted/40">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <FileText className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold text-foreground">
          {summary ? String(summary.title ?? t.chat.report) : t.chat.report}
        </p>
      </div>
      <div className="space-y-3 px-4 py-3">
        {!!summary?.overview && (
          <p className="text-sm text-foreground/80">{String(summary.overview)}</p>
        )}
        {!!metrics && Object.keys(metrics).length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(metrics).slice(0, 6).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border bg-background/70 px-3 py-2">
                <p className="text-[11px] text-muted-foreground capitalize">{formatMetricLabel(k, t.chat.reportMetrics)}</p>
                <p className="text-sm font-semibold text-foreground">{formatReportMetricValue(k, v, language)}</p>
              </div>
            ))}
          </div>
        )}
        {highlights.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.chat.highlights}</p>
            <ul className="space-y-1">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
        {actions.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.chat.actionItems}</p>
            <ul className="space-y-1">
              {actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-0.5 text-primary">→</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function PresentationCard({ data }: { data: Record<string, unknown> }) {
  const { t } = useTranslation()
  const slides = Array.isArray(data.slides)
    ? (data.slides as Array<Record<string, unknown>>).map((slide) => ({
        title: typeof slide.title === 'string' ? slide.title : '',
        content: normalizePresentationContent(
          slide.content ?? slide.bullet_points ?? slide.key_points ?? []
        ),
      }))
    : []

  async function handleDownloadPPTX() {
    try {
      const response = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: String(data.topic ?? 'RE:Agent Report'),
          slides,
        }),
      })

      if (!response.ok) {
        throw new Error('PPTX generation failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 're-agent-report.pptx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Stažení prezentace selhalo. Zkuste to znovu.')
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted/40">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Presentation className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold text-foreground">{String(data.topic ?? t.chat.presentation)}</p>
        <span className="ml-auto text-xs text-muted-foreground">{slides.length} {t.chat.slides}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto p-4 pb-3">
        {slides.slice(0, 4).map((slide, i) => (
          <div key={i} className="w-48 shrink-0 rounded-xl border border-border bg-background/70 p-3">
            <p className="mb-1 text-[10px] text-muted-foreground">{t.chat.slide} {i + 1}</p>
            <p className="text-xs font-semibold text-foreground leading-tight mb-2">{slide.title}</p>
            {slide.content.slice(0, 2).map((c, j) => (
              <p key={j} className="text-[11px] text-muted-foreground leading-tight truncate">• {c}</p>
            ))}
          </div>
        ))}
        {slides.length > 4 && (
          <div className="flex w-32 shrink-0 items-center justify-center rounded-xl border border-border bg-background/40">
            <p className="text-xs text-muted-foreground">+{slides.length - 4} {t.chat.moreSlides}</p>
          </div>
        )}
      </div>
      <div className="border-t border-border px-4 py-2">
        <button
          onClick={handleDownloadPPTX}
          className="button-smooth flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <FileDown className="h-4 w-4" />
          {t.chat.downloadPptx}
        </button>
      </div>
    </div>
  )
}

function SuggestionChips({
  content,
  steps,
  language,
  onSend,
}: {
  content: string
  steps?: ToolCallLogEntry[]
  language: 'cs' | 'en'
  onSend: (message: string) => void
}) {
  const { t } = useTranslation()
  const suggestions = useMemo(() => {
    const merged = [...extractTextSuggestions(content), ...getContextualSuggestions(steps, language)]
    return merged.filter((suggestion, index) => merged.findIndex((item) => item.toLowerCase() === suggestion.toLowerCase()) === index).slice(0, 6)
  }, [content, language, steps])

  if (suggestions.length === 0) return null

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        <Sparkles className="h-3 w-3 text-primary" />
        {t.chat.nextSteps}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSend(suggestion)}
            className="button-smooth rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/25 hover:text-primary"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function MessageBubble({
  message,
  onSend,
}: {
  message: ChatMessage
  onSend: (message: string) => void
}) {
  const { language } = useTranslation()
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white shadow-sm dark:shadow-none">
            {message.content}
          </div>
          <p className="mt-1 text-right text-[11px] text-muted-foreground/70">
            {formatTime(message.timestamp, language)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm dark:shadow-none">
          {message.toolCallLog && message.toolCallLog.length > 0 && (
            <ThinkingSteps steps={message.toolCallLog} />
          )}

          <div className="prose prose-sm prose-invert max-w-none text-foreground/90
            [&_p]:leading-relaxed [&_p]:mb-2 last:[&_p]:mb-0
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline
            [&_ul]:mt-1 [&_ul]:space-y-0.5 [&_li]:text-foreground/80
            [&_ol]:mt-1 [&_ol]:space-y-0.5
            [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-primary
            [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground
            [&_h2]:text-sm  [&_h2]:font-semibold [&_h2]:text-foreground
            [&_h3]:text-sm  [&_h3]:font-medium  [&_h3]:text-foreground
            [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground
          ">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {message.charts?.map((chart, i) => (
            <InlineChart key={i} config={chart as ChartConfig} />
          ))}

          {message.tables && message.tables.length > 0
            ? message.tables.map((table, i) => <InlineTable key={i} table={table} />)
            : null}

          {message.emailDraft
            ? <EmailDraftCard draft={message.emailDraft} />
            : null}

          {message.taskCreated
            ? <TaskCreatedCard task={message.taskCreated as Record<string, unknown>} />
            : null}

          {message.monitoringSet
            ? <MonitoringCard rule={message.monitoringSet as Record<string, unknown>} />
            : null}

          {message.reportData
            ? <ReportCard report={message.reportData as Record<string, unknown>} />
            : null}

          {message.comparisonData
            ? <ComparisonCard comparison={message.comparisonData as { properties: never[]; comparison_fields: string[] }} />
            : null}

          {message.timelineData
            ? <TimelineCard timelineData={message.timelineData as { client: { id: string; name: string; email?: string } | null; timeline: never[] }} />
            : null}

          {message.presentationData
            ? <PresentationCard data={message.presentationData as Record<string, unknown>} />
            : null}

          <SuggestionChips
            content={message.content}
            steps={message.toolCallLog}
            language={language}
            onSend={onSend}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {formatTime(message.timestamp, language)}
        </p>
      </div>
    </div>
  )
}
