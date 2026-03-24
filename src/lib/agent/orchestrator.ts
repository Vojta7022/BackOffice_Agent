import { GoogleGenAI } from '@google/genai'
import { agentTools, ToolName } from './tools'
import { handleToolCall, ToolResult } from './tool-handlers'
import { buildGroqToolResult, callGroq, parseGroqResponse } from './groq-provider'

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
  emailDraft: {
    to: string
    subject: string
    body: string
    gmail_draft?: string | null
    google_connected?: boolean
  } | null
  taskCreated: unknown | null
  monitoringSet: unknown | null
  presentationData: unknown | null
  reportData: unknown | null
  comparisonData: unknown | null
  timelineData: unknown | null
  toolCallLog: ToolCallLogEntry[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDERS = ['gemini', 'groq'] as const
const GEMINI_MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'] as const
const MAX_TOKENS = 2048
const MAX_ITERATIONS = 5
const RETRY_DELAYS_MS = [5000, 15000, 30000] as const

const SYSTEM_PROMPT = `Jsi back-office asistent české realitní firmy RE:Agent.

JAZYK: Odpovídej VŽDY ve stejném jazyce jako uživatel.

GRAFY: Pokud uživatel žádá graf/vizualizaci/znázornění, MUSÍŠ: 1) zavolat datový nástroj, 2) IHNED zavolat generate_chart s reálnými čísly. Nikdy neříkej "mohu vytvořit graf" — prostě ho vytvoř. Pro dvě časové řady na jednom grafu nejdřív získej oba datasety a pak je spoj do jednoho generate_chart s položkami { label, value, secondary_value }.
Když vytváříš DVA grafy (např. leady a prodeje), dej každému JINÝ název. Například: "Vývoj počtu leadů (říjen 2025 – březen 2026)" a "Vývoj prodaných nemovitostí (říjen 2025 – březen 2026)". NIKDY nedávej dvěma grafům stejný nadpis.

VYHLEDÁVÁNÍ: Uživatel NIKDY nezná ID. Když zmíní nemovitost ("Loftový byt", "byt v Holešovicích", "Komunardů 32"), IHNED zavolej query_properties s search_query. Když zmíní klienta jménem, zavolej query_clients. NIKDY se NEPTEJ na ID — vždy hledej podle jména nebo adresy.

EMAIL PRO ZÁJEMCE: 1) Zavolej query_properties s názvem nebo adresou nemovitosti z uživatelova dotazu, 2) zavolej check_calendar, 3) zavolej draft_email s údaji o nemovitosti a termíny. Pokud uživatel zmínil email zájemce, použij ho. Pokud ne, použij "zajemce@email.cz".

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

function isDuplicateStructuredResult(existingResults: ToolResult[], candidate: ToolResult) {
  return existingResults.some(
    (result) => result.display_hint === candidate.display_hint && result.summary === candidate.summary
  )
}

// ─── Gemini content helpers ───────────────────────────────────────────────────

// We use loose types here because the Gemini Part type is a large union and
// we only need a small subset. The API accepts these shapes correctly at runtime.
type GeminiPart = Record<string, unknown>
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] }
type ProviderName = typeof PROVIDERS[number]
type GroqConversationMessage = {
  role: 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: unknown[]
}
type ParsedProviderResponse = {
  text: string
  toolCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }>
  raw: unknown
}

class GeminiQuotaError extends Error {}
class GeminiOverloadedError extends Error {}

function historyToGemini(history: HistoryMessage[]): GeminiContent[] {
  return history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

function historyToGroq(history: HistoryMessage[]): GroqConversationMessage[] {
  return history.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: message.content,
  }))
}

function extractGeminiParts(response: unknown): GeminiPart[] {
  return ((response as { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> })?.candidates?.[0]?.content?.parts ?? [])
}

function parseGeminiResponse(response: unknown): ParsedProviderResponse {
  const parts = extractGeminiParts(response)
  const text = parts
    .filter((part) => typeof part.text === 'string' && part.text)
    .map((part) => part.text as string)
    .join('\n')
    .trim()

  const toolCalls = parts
    .filter((part) => part.functionCall != null)
    .map((part, index) => {
      const functionCall = part.functionCall as { name?: string; args?: Record<string, unknown> }
      return {
        name: functionCall?.name ?? '',
        args: functionCall?.args ?? {},
        id: `gemini-tool-${Date.now()}-${index}`,
      }
    })

  return { text, toolCalls, raw: response }
}

function extractGroqToolCalls(response: unknown): unknown[] {
  return ((response as { choices?: Array<{ message?: { tool_calls?: unknown[] } }> })?.choices?.[0]?.message?.tool_calls ?? [])
}

function rememberToolResult(
  name: string,
  result: ToolResult,
  allToolResults: ToolResult[],
  toolCallLog: ToolCallLogEntry[]
) {
  if (!isDuplicateStructuredResult(allToolResults, result)) {
    allToolResults.push(result)
    toolCallLog.push({ name, timestamp: Date.now() })
  }
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

async function callWithProvider(
  provider: ProviderName,
  systemPrompt: string,
  messages: GeminiContent[] | GroqConversationMessage[],
  tools: typeof agentTools
): Promise<ParsedProviderResponse> {
  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set')
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const geminiConfig = {
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: tools }],
      maxOutputTokens: MAX_TOKENS,
    }

    let lastError: unknown = null

    for (const model of GEMINI_MODELS) {
      try {
        const response = await generateContentWithRetry(ai, {
          model,
          contents: messages as GeminiContent[],
          config: geminiConfig,
        })
        return parseGeminiResponse(response)
      } catch (error) {
        lastError = error
        console.log(`Gemini ${model} failed:`, getErrorMessage(error))
      }
    }

    throw lastError ?? new Error('All Gemini models failed')
  }

  if (provider === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not set')
    }

    const response = await callGroq(systemPrompt, messages as GroqConversationMessage[], tools)
    const parsed = parseGroqResponse(response)
    return {
      text: parsed.text,
      toolCalls: parsed.toolCalls,
      raw: response,
    }
  }

  throw new Error(`Unknown provider: ${provider}`)
}

async function runGeminiConversation(
  userMessage: string,
  conversationHistory: HistoryMessage[],
  allToolResults: ToolResult[],
  toolCallLog: ToolCallLogEntry[]
) {
  const contents: GeminiContent[] = [
    ...historyToGemini(trimHistory(conversationHistory)),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  let iterations = 0
  let response = await callWithProvider('gemini', SYSTEM_PROMPT, contents, agentTools)

  while (iterations < MAX_ITERATIONS) {
    if (response.toolCalls.length === 0) break
    iterations += 1

    console.log(`[Agent] Gemini iteration ${iterations}/${MAX_ITERATIONS} — ${response.toolCalls.length} tool(s)`)

    const fnResponseParts = await Promise.all(
      response.toolCalls.map(async (toolCall): Promise<GeminiPart> => {
        console.log(`[Agent]  → ${toolCall.name}`, JSON.stringify(toolCall.args))

        try {
          const result = await handleToolCall(toolCall.name as ToolName, toolCall.args, { userMessage })
          console.log(`[Agent]  ✓ ${toolCall.name}: ${result.summary}`)
          rememberToolResult(toolCall.name, result, allToolResults, toolCallLog)
          return {
            functionResponse: {
              name: toolCall.name,
              response: { summary: result.summary, data: result.data },
            },
          }
        } catch (error) {
          const message = getErrorMessage(error)
          console.error(`[Agent]  ✗ ${toolCall.name}: ${message}`)
          return {
            functionResponse: {
              name: toolCall.name,
              response: { error: `Chyba nástroje: ${message}` },
            },
          }
        }
      })
    )

    contents.push({ role: 'model', parts: extractGeminiParts(response.raw) })
    contents.push({ role: 'user', parts: fnResponseParts })
    response = await callWithProvider('gemini', SYSTEM_PROMPT, contents, agentTools)
  }

  return response.text || 'Hotovo.'
}

async function runGroqConversation(
  userMessage: string,
  conversationHistory: HistoryMessage[],
  allToolResults: ToolResult[],
  toolCallLog: ToolCallLogEntry[]
) {
  const messages: GroqConversationMessage[] = [
    ...historyToGroq(trimHistory(conversationHistory)),
    { role: 'user', content: userMessage },
  ]

  let iterations = 0
  let response = await callWithProvider('groq', SYSTEM_PROMPT, messages, agentTools)

  while (iterations < MAX_ITERATIONS) {
    if (response.toolCalls.length === 0) break
    iterations += 1

    console.log(`[Agent] Groq iteration ${iterations}/${MAX_ITERATIONS} — ${response.toolCalls.length} tool(s)`)

    messages.push({
      role: 'assistant',
      content: response.text,
      tool_calls: extractGroqToolCalls(response.raw),
    })

    const toolResultMessages = await Promise.all(
      response.toolCalls.map(async (toolCall) => {
        console.log(`[Agent]  → ${toolCall.name}`, JSON.stringify(toolCall.args))

        try {
          const result = await handleToolCall(toolCall.name as ToolName, toolCall.args, { userMessage })
          console.log(`[Agent]  ✓ ${toolCall.name}: ${result.summary}`)
          rememberToolResult(toolCall.name, result, allToolResults, toolCallLog)
          return buildGroqToolResult(
            toolCall.id ?? `groq-tool-${Date.now()}`,
            JSON.stringify({ summary: result.summary, data: result.data })
          )
        } catch (error) {
          const message = getErrorMessage(error)
          console.error(`[Agent]  ✗ ${toolCall.name}: ${message}`)
          return buildGroqToolResult(
            toolCall.id ?? `groq-tool-${Date.now()}`,
            JSON.stringify({ error: `Chyba nástroje: ${message}` })
          )
        }
      })
    )

    messages.push(...toolResultMessages)
    response = await callWithProvider('groq', SYSTEM_PROMPT, messages, agentTools)
  }

  return response.text || 'Hotovo.'
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function processMessage(
  userMessage: string,
  conversationHistory: HistoryMessage[]
): Promise<AgentResponse> {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return emptyResponse(
      'API klíč není nakonfigurován. Nastavte prosím proměnné prostředí `GEMINI_API_KEY` nebo `GROQ_API_KEY`.'
    )
  }

  // Accumulate all tool results and call log for post-processing
  const allToolResults: ToolResult[] = []
  const toolCallLog: ToolCallLogEntry[] = []
  const providerErrors: Partial<Record<ProviderName, unknown>> = {}
  let message = ''

  for (const provider of PROVIDERS) {
    if (provider === 'gemini' && !process.env.GEMINI_API_KEY) continue
    if (provider === 'groq' && !process.env.GROQ_API_KEY) continue

    try {
      message =
        provider === 'gemini'
          ? await runGeminiConversation(userMessage, conversationHistory, allToolResults, toolCallLog)
          : await runGroqConversation(userMessage, conversationHistory, allToolResults, toolCallLog)

      console.log(`[Agent] Provider used: ${provider}`)
      break
    } catch (error) {
      providerErrors[provider] = error
      console.error(`[Agent] ${provider} failed:`, getErrorMessage(error))
    }
  }

  if (!message) {
    const geminiError = providerErrors.gemini
    const groqError = providerErrors.groq

    if (!groqError && geminiError) {
      if (geminiError instanceof GeminiQuotaError || isQuotaError(geminiError)) {
        return emptyResponse('Byl překročen denní limit AI dotazů. Zkuste to prosím později nebo kontaktujte administrátora.')
      }

      if (geminiError instanceof GeminiOverloadedError || getErrorStatus(geminiError) === 429) {
        return emptyResponse('AI služba je dočasně přetížená. Zkuste to prosím za minutu.')
      }
    }

    return emptyResponse('Při komunikaci s AI došlo k chybě. Zkuste to prosím znovu.')
  }

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
