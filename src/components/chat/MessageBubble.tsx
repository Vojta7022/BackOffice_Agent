'use client'

import ReactMarkdown from 'react-markdown'
import { CheckCircle2, Bell, FileText, Presentation, Wrench, Download } from 'lucide-react'
import InlineChart from './InlineChart'
import InlineTable from './InlineTable'
import EmailDraftCard from './EmailDraftCard'
import type { ChatMessage } from '@/lib/chat-store'
import type { ChartConfig, ToolCallLogEntry } from '@/lib/agent/orchestrator'
import { generatePPTX } from '@/lib/exports/generate-pptx'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
}

// ─── Czech tool labels ─────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  query_clients: 'Vyhledávání klientů',
  query_leads: 'Analýza leadů',
  query_properties: 'Prohledávání nemovitostí',
  query_transactions: 'Analýza transakcí',
  find_missing_data: 'Hledání chybějících dat',
  generate_chart: 'Tvorba grafu',
  draft_email: 'Příprava emailu',
  check_calendar: 'Kontrola kalendáře',
  create_task: 'Vytváření úkolu',
  generate_report: 'Generování reportu',
  generate_presentation: 'Příprava prezentace',
  setup_monitoring: 'Nastavení monitoringu',
  get_dashboard_metrics: 'Načítání metrik',
  get_weekly_summary: 'Týdenní přehled',
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
          {TOOL_LABELS[step.name] ?? step.name}
        </span>
      ))}
    </div>
  )
}

// ─── Rich content cards ────────────────────────────────────────────────────

function TaskCreatedCard({ task }: { task: Record<string, unknown> }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-green-500/25 bg-green-500/10 p-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
      <div>
        <p className="text-xs font-semibold text-green-500">Úkol vytvořen</p>
        <p className="mt-0.5 text-sm text-foreground">{String(task.title ?? '')}</p>
        {!!task.due_date && (
          <p className="mt-0.5 text-xs text-muted-foreground">Termín: {String(task.due_date)}</p>
        )}
      </div>
    </div>
  )
}

function MonitoringCard({ rule }: { rule: Record<string, unknown> }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3">
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs font-semibold text-primary">Monitoring nastaven</p>
        <p className="mt-0.5 text-sm text-foreground">{String(rule.location ?? '')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Frekvence: {rule.frequency === 'daily' ? 'denně' : 'týdně'}
        </p>
      </div>
    </div>
  )
}

function ReportCard({ report }: { report: Record<string, unknown> }) {
  const summary = report.summary as Record<string, unknown> | undefined
  const metrics = report.metrics as Record<string, unknown> | undefined
  const highlights = (report.highlights as string[]) ?? []
  const actions = (report.action_items as string[]) ?? []

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted/40">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <FileText className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold text-foreground">
          {summary ? String(summary.title ?? 'Report') : 'Report'}
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
                <p className="text-[11px] text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</p>
                <p className="text-sm font-semibold text-foreground">{String(v ?? '')}</p>
              </div>
            ))}
          </div>
        )}
        {highlights.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Highlights</p>
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
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Akční kroky</p>
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
  const slides = (data.slides as { title: string; content: string[] }[]) ?? []

  async function handleDownload() {
    const blob = await generatePPTX({ topic: String(data.topic ?? ''), slides })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${String(data.topic ?? 'prezentace')}.pptx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted/40">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Presentation className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold text-foreground">{String(data.topic ?? 'Prezentace')}</p>
        <span className="ml-auto text-xs text-muted-foreground">{slides.length} snímků</span>
      </div>
      <div className="flex gap-3 overflow-x-auto p-4 pb-3">
        {slides.slice(0, 4).map((slide, i) => (
          <div key={i} className="w-48 shrink-0 rounded-xl border border-border bg-background/70 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Snímek {i + 1}</p>
            <p className="text-xs font-semibold text-foreground leading-tight mb-2">{slide.title}</p>
            {slide.content.slice(0, 3).map((c, j) => (
              <p key={j} className="text-[11px] text-muted-foreground leading-tight truncate">• {c}</p>
            ))}
          </div>
        ))}
        {slides.length > 4 && (
          <div className="flex w-32 shrink-0 items-center justify-center rounded-xl border border-border bg-background/40">
            <p className="text-xs text-muted-foreground">+{slides.length - 4} dalších</p>
          </div>
        )}
      </div>
      <div className="border-t border-border px-4 py-2">
        <button
          onClick={handleDownload}
          className="button-smooth flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Download className="h-3.5 w-3.5" />
          Stáhnout PPTX
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white shadow-sm dark:shadow-none">
            {message.content}
          </div>
          <p className="mt-1 text-right text-[11px] text-muted-foreground/70">
            {formatTime(message.timestamp)}
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

          {message.presentationData
            ? <PresentationCard data={message.presentationData as Record<string, unknown>} />
            : null}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
