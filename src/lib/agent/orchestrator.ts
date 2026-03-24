import { GoogleGenAI } from '@google/genai'
import { agentTools, ToolName } from './tools'
import { handleToolCall, ToolResult } from './tool-handlers'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ChartConfig {
  chart_type: 'bar' | 'line' | 'pie' | 'area'
  title: string
  x_label?: string
  y_label?: string
  primary_label?: string
  secondary_label?: string
  data: { label: string; value: number; secondary_value?: number }[]
}

export interface TableData {
  title: string
  headers: string[]
  rows: string[][]
}

export interface ToolCallLogEntry {
  name: string
  timestamp: number
}

export interface AgentResponse {
  message: string
  charts: ChartConfig[]
  tables: TableData[]
  emailDraft: { to: string; subject: string; body: string } | null
  taskCreated: unknown | null
  monitoringSet: unknown | null
  presentationData: unknown | null
  reportData: unknown | null
  comparisonData: unknown | null
  timelineData: unknown | null
  toolCallLog: ToolCallLogEntry[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'gemini-2.5-flash-lite'
const MAX_TOKENS = 2048
const MAX_ITERATIONS = 5
const RETRY_DELAYS_MS = [5000, 15000, 30000] as const

const SYSTEM_PROMPT = `Jsi back-office asistent české realitní firmy RE:Agent.

JAZYK: Odpovídej VŽDY ve stejném jazyce jako uživatel.

GRAFY: Pokud uživatel žádá graf/vizualizaci/znázornění, MUSÍŠ: 1) zavolat datový nástroj, 2) IHNED zavolat generate_chart s reálnými čísly. Nikdy neříkej "mohu vytvořit graf" — prostě ho vytvoř. Pro dvě časové řady na jednom grafu nejdřív získej oba datasety a pak je spoj do jednoho generate_chart s položkami { label, value, secondary_value }.

EMAIL + KALENDÁŘ: Pro email s termínem prohlídky: 1) zavolej check_calendar, 2) zavolej draft_email s termíny v těle.

REPORT + PREZENTACE: Pro report s prezentací: 1) zavolej generate_report, 2) zavolej generate_presentation.

MONITORING: Pro monitoring nemovitostí okamžitě zavolej setup_monitoring. Neptej se na upřesnění.

DALŠÍ NÁSTROJE: Pro porovnání nemovitostí použij compare_properties. Pro analýzu portfolia použij analyze_portfolio. Pro historii klienta použij client_activity_timeline.

OBECNĚ: Používej nástroje — nehádej. Částky v CZK. Datumy DD.MM.YYYY. Navrhni 1-2 další kroky.`

// ─── Helpers ──────────────────────────────────────────────────────────────────

type HistoryMessage = { role: 'user' | 'assistant'; content: string }

function trimHistory(history: HistoryMessage[], maxMessages = 10): HistoryMessage[] {
  return history.slice(-maxMessages)
}

function toTableData(data: unknown, title: string): TableData | null {
  const rowsSource =
    Array.isArray(data)
      ? data
      : typeof data === 'object' && data !== null && 'rows' in data && Array.isArray((data as { rows: unknown }).rows)
      ? (data as { rows: unknown[] }).rows
      : null

  if (!rowsSource || rowsSource.length === 0) return null

  const first = rowsSource[0]
  if (typeof first !== 'object' || first === null) return null
  const headers = Object.keys(first as object)
  const rows = (rowsSource as Record<string, unknown>[]).map(row =>
    headers.map(h => {
      const v = row[h]
      return v === null || v === undefined ? '—' : String(v)
    })
  )
  return { title, headers, rows }
}

function isReportData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'highlights' in (data as object) &&
    'action_items' in (data as object)
  )
}

function emptyResponse(message: string): AgentResponse {
  return {
    message,
    charts: [],
    tables: [],
    emailDraft: null,
    taskCreated: null,
    monitoringSet: null,
    presentationData: null,
    reportData: null,
    comparisonData: null,
    timelineData: null,
    toolCallLog: [],
  }
}

// ─── Gemini content helpers ───────────────────────────────────────────────────

// We use loose types here because the Gemini Part type is a large union and
// we only need a small subset. The API accepts these shapes correctly at runtime.
type GeminiPart = Record<string, unknown>
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] }

class GeminiQuotaError extends Error {}
class GeminiOverloadedError extends Error {}

function historyToGemini(history: HistoryMessage[]): GeminiContent[] {
  return history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string') return maybeMessage
  }
  return String(error)
}

function getErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null

  const directStatus = (error as { status?: unknown }).status
  if (typeof directStatus === 'number') return directStatus

  const responseStatus = (error as { response?: { status?: unknown } }).response?.status
  if (typeof responseStatus === 'number') return responseStatus

  const code = (error as { code?: unknown }).code
  if (typeof code === 'number') return code

  return null
}

function isQuotaError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('daily limit') ||
    message.includes('rate limit exceeded')
  )
}

function isRetryable429(error: unknown): boolean {
  return getErrorStatus(error) === 429
}

function parseRetryDelayMs(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1000 ? value : value * 1000
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d+ms$/i.test(trimmed)) return Number(trimmed.replace(/ms/i, ''))
  if (/^\d+(\.\d+)?s$/i.test(trimmed)) return Math.round(Number(trimmed.replace(/s/i, '')) * 1000)
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed)
    return numeric > 1000 ? numeric : numeric * 1000
  }

  const asDate = Date.parse(trimmed)
  if (!Number.isNaN(asDate)) {
    const delta = asDate - Date.now()
    return delta > 0 ? delta : null
  }

  return null
}

function extractRetryDelayMs(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null

  const retryAfterHeader = (() => {
    const headers = (error as { headers?: Headers | Record<string, unknown> }).headers
    if (headers && typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get('retry-after')
    }

    const responseHeaders = (error as { response?: { headers?: Headers | Record<string, unknown> } }).response?.headers
    if (responseHeaders && typeof (responseHeaders as Headers).get === 'function') {
      return (responseHeaders as Headers).get('retry-after')
    }

    if (responseHeaders && typeof responseHeaders === 'object') {
      const maybeHeader = (responseHeaders as Record<string, unknown>)['retry-after']
      return typeof maybeHeader === 'string' ? maybeHeader : null
    }

    if (headers && typeof headers === 'object') {
      const maybeHeader = (headers as Record<string, unknown>)['retry-after']
      return typeof maybeHeader === 'string' ? maybeHeader : null
    }

    return null
  })()

  const fromHeader = parseRetryDelayMs(retryAfterHeader)
  if (fromHeader !== null) return fromHeader

  const candidates: unknown[] = [
    (error as { retryAfter?: unknown }).retryAfter,
    (error as { retryAfterMs?: unknown }).retryAfterMs,
    (error as { retryDelay?: unknown }).retryDelay,
    (error as { retryDelayMs?: unknown }).retryDelayMs,
    (error as { error?: { retryAfter?: unknown; retryDelay?: unknown } }).error?.retryAfter,
    (error as { error?: { retryAfter?: unknown; retryDelay?: unknown } }).error?.retryDelay,
  ]

  const details = (error as { details?: unknown[]; errorDetails?: unknown[] }).details
    ?? (error as { details?: unknown[]; errorDetails?: unknown[] }).errorDetails

  if (Array.isArray(details)) {
    for (const detail of details) {
      if (typeof detail === 'object' && detail !== null) {
        candidates.push((detail as { retryDelay?: unknown }).retryDelay)
        candidates.push((detail as { retry_delay?: unknown }).retry_delay)
      }
    }
  }

  for (const candidate of candidates) {
    const parsed = parseRetryDelayMs(candidate)
    if (parsed !== null) return parsed
  }

  return null
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string
    contents: GeminiContent[]
    config: {
      systemInstruction: string
      tools: { functionDeclarations: typeof agentTools }[]
      maxOutputTokens: number
    }
  }
) {
  let retryCount = 0

  while (true) {
    try {
      return await ai.models.generateContent({
        model: params.model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contents: params.contents as any,
        config: params.config,
      })
    } catch (error) {
      if (isQuotaError(error)) {
        throw new GeminiQuotaError(getErrorMessage(error))
      }

      if (!isRetryable429(error)) {
        throw error
      }

      if (retryCount >= RETRY_DELAYS_MS.length) {
        throw new GeminiOverloadedError(getErrorMessage(error))
      }

      const retryDelay = extractRetryDelayMs(error) ?? RETRY_DELAYS_MS[retryCount]
      retryCount += 1
      console.warn(`[Agent] 429 from Gemini, retrying in ${Math.round(retryDelay / 1000)}s (${retryCount}/${RETRY_DELAYS_MS.length})`)
      await sleep(retryDelay)
    }
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function processMessage(
  userMessage: string,
  conversationHistory: HistoryMessage[]
): Promise<AgentResponse> {
  if (!process.env.GEMINI_API_KEY) {
    return emptyResponse(
      'API klíč není nakonfigurován. Nastavte prosím proměnnou prostředí `GEMINI_API_KEY`.'
    )
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const contents: GeminiContent[] = [
    ...historyToGemini(trimHistory(conversationHistory)),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const geminiConfig = {
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: agentTools }],
    maxOutputTokens: MAX_TOKENS,
  }

  // Accumulate all tool results and call log for post-processing
  const allToolResults: ToolResult[] = []
  const toolCallLog: ToolCallLogEntry[] = []
  let iterations = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any

  try {
    response = await generateContentWithRetry(ai, {
      model: MODEL,
      contents,
      config: geminiConfig,
    })

    // ── Tool-use loop ───────────────────────────────────────────────────────
    while (iterations < MAX_ITERATIONS) {
      const parts: GeminiPart[] = response?.candidates?.[0]?.content?.parts ?? []
      const fnCallParts = parts.filter(p => p.functionCall != null)

      if (fnCallParts.length === 0) break
      iterations++

      console.log(`[Agent] Iteration ${iterations}/${MAX_ITERATIONS} — ${fnCallParts.length} tool(s)`)

      // Execute tools in parallel
      const fnResponseParts = await Promise.all(
        fnCallParts.map(async (part): Promise<GeminiPart> => {
          const fc = part.functionCall as { name?: string; args?: Record<string, unknown> }
          const name = fc?.name ?? ''
          const args = fc?.args ?? {}

          console.log(`[Agent]  → ${name}`, JSON.stringify(args))

          try {
            const result = await handleToolCall(name as ToolName, args)
            console.log(`[Agent]  ✓ ${name}: ${result.summary}`)
            allToolResults.push(result)
            toolCallLog.push({ name, timestamp: Date.now() })
            return {
              functionResponse: {
                name,
                response: { summary: result.summary, data: result.data },
              },
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(`[Agent]  ✗ ${name}: ${msg}`)
            return {
              functionResponse: {
                name,
                response: { error: `Chyba nástroje: ${msg}` },
              },
            }
          }
        })
      )

      // Append model turn (with function call parts) and user turn (with results)
      contents.push({ role: 'model', parts })
      contents.push({ role: 'user', parts: fnResponseParts })

      response = await generateContentWithRetry(ai, {
        model: MODEL,
        contents,
        config: geminiConfig,
      })
    }
  } catch (err) {
    const msg = getErrorMessage(err)
    console.error('[Agent] API error:', msg)

    if (err instanceof GeminiQuotaError || isQuotaError(err)) {
      return emptyResponse('Byl překročen denní limit AI dotazů. Zkuste to prosím později nebo kontaktujte administrátora.')
    }

    if (err instanceof GeminiOverloadedError || getErrorStatus(err) === 429) {
      return emptyResponse('AI služba je dočasně přetížená. Zkuste to prosím za minutu.')
    }

    return emptyResponse('Při komunikaci s AI došlo k chybě. Zkuste to prosím znovu.')
  }

  // ── Extract final text ──────────────────────────────────────────────────
  const finalParts: GeminiPart[] = response?.candidates?.[0]?.content?.parts ?? []
  const message = finalParts
    .filter(p => typeof p.text === 'string' && p.text)
    .map(p => p.text as string)
    .join('\n')
    .trim()

  // ── Categorise tool results ─────────────────────────────────────────────
  const agentResponse: AgentResponse = {
    message: message || 'Hotovo.',
    charts: [],
    tables: [],
    emailDraft: null,
    taskCreated: null,
    monitoringSet: null,
    presentationData: null,
    reportData: null,
    comparisonData: null,
    timelineData: null,
    toolCallLog,
  }

  for (const result of allToolResults) {
    switch (result.display_hint) {
      case 'chart':
        agentResponse.charts.push(result.data as ChartConfig)
        break

      case 'table': {
        if (isReportData(result.data)) {
          agentResponse.reportData = result.data
          break
        }
        const table = toTableData(result.data, result.summary)
        if (table) agentResponse.tables.push(table)
        break
      }

      case 'report':
        agentResponse.reportData = result.data
        break

      case 'email_draft':
        agentResponse.emailDraft = result.data as AgentResponse['emailDraft']
        break

      case 'task_created':
        agentResponse.taskCreated = result.data
        break

      case 'monitoring_set':
        agentResponse.monitoringSet = result.data
        break

      case 'file_download':
        agentResponse.presentationData = result.data
        break

      case 'comparison':
        agentResponse.comparisonData = result.data
        break

      case 'timeline':
        agentResponse.timelineData = result.data
        break

      // 'text' hint — no structured output, skip
    }
  }

  return agentResponse
}
