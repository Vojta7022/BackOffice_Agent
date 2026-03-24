import { GoogleGenAI } from '@google/genai'
import { agentTools, ToolName } from './tools'
import { handleToolCall, ToolResult } from './tool-handlers'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ChartConfig {
  chart_type: 'bar' | 'line' | 'pie' | 'area'
  title: string
  x_label?: string
  y_label?: string
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

const MODEL = 'gemini-2.5-flash'
const MAX_TOKENS = 2048
const MAX_ITERATIONS = 5

const SYSTEM_PROMPT =
  'Jsi back-office asistent české realitní firmy RE:Agent. DŮLEŽITÉ: Odpovídej VŽDY ve stejném jazyce, ve kterém uživatel napsal svou zprávu. Pokud píše česky, odpověz česky. Pokud anglicky, odpověz anglicky. Pokud v jakémkoli jiném jazyce, odpověz v tom jazyce. ' +
  'Používej nástroje pro získání dat — nehádej. ' +
  'Když uživatel chce graf, VŽDY nejdřív zavolej datový nástroj (query_clients, query_leads, query_transactions) ' +
  'a pak IHNED zavolej generate_chart s konkrétními čísly z výsledku. ' +
  'Pro porovnání nemovitostí použij compare_properties. Pro analýzu portfolia použij analyze_portfolio. Pro historii klienta použij client_activity_timeline. ' +
  'Formátuj částky v CZK. Datumy ve formátu DD.MM.YYYY. ' +
  'Po každé odpovědi navrhni 1-2 další kroky.'

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

function historyToGemini(history: HistoryMessage[]): GeminiContent[] {
  return history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
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
    response = await ai.models.generateContent({
      model: MODEL,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: contents as any,
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

      response = await ai.models.generateContent({
        model: MODEL,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contents: contents as any,
        config: geminiConfig,
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Agent] API error:', msg)
    return emptyResponse(`Chyba při komunikaci s AI: ${msg}`)
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
