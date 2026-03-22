import Anthropic from '@anthropic-ai/sdk'
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

export interface AgentResponse {
  message: string
  charts: ChartConfig[]
  tables: TableData[]
  emailDraft: { to: string; subject: string; body: string } | null
  taskCreated: unknown | null
  monitoringSet: unknown | null
  presentationData: unknown | null
  reportData: unknown | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 2048
const MAX_ITERATIONS = 5

const SYSTEM_PROMPT =
  'Jsi back-office asistent české realitní firmy. Odpovídej česky. ' +
  'Používej nástroje pro získání dat — nehádej. ' +
  'Formátuj čísla v CZK. Datumy ve formátu DD.MM.YYYY. ' +
  'Navrhuj další kroky. ' +
  'Pokud uživatel chce graf, použij generate_chart s daty z jiného nástroje.'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type HistoryMessage = { role: 'user' | 'assistant'; content: string }

function trimHistory(history: HistoryMessage[], maxMessages = 10): HistoryMessage[] {
  return history.slice(-maxMessages)
}

function toTableData(data: unknown, title: string): TableData | null {
  if (!Array.isArray(data) || data.length === 0) return null
  const first = data[0]
  if (typeof first !== 'object' || first === null) return null
  const headers = Object.keys(first as object)
  const rows = (data as Record<string, unknown>[]).map(row =>
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
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function processMessage(
  userMessage: string,
  conversationHistory: HistoryMessage[]
): Promise<AgentResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return emptyResponse(
      'API klíč není nakonfigurován. Nastavte prosím proměnnou prostředí `ANTHROPIC_API_KEY`.'
    )
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Build message chain
  const messages: Anthropic.MessageParam[] = [
    ...trimHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ]

  // Accumulate all tool results for post-processing
  const allToolResults: ToolResult[] = []

  let response: Anthropic.Message
  let iterations = 0

  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: agentTools,
      messages,
    })

    // ── Tool-use loop ───────────────────────────────────────────────────────
    while (response.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
      iterations++

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      console.log(`[Agent] Iteration ${iterations}/${MAX_ITERATIONS} — ${toolUseBlocks.length} tool(s)`)

      // Execute tools in parallel
      const toolResultContents = await Promise.all(
        toolUseBlocks.map(async (tool): Promise<Anthropic.ToolResultBlockParam> => {
          console.log(`[Agent]  → ${tool.name}`, JSON.stringify(tool.input))
          try {
            const result = await handleToolCall(
              tool.name as ToolName,
              tool.input as Record<string, unknown>
            )
            console.log(`[Agent]  ✓ ${tool.name}: ${result.summary}`)
            allToolResults.push(result)
            return {
              type: 'tool_result',
              tool_use_id: tool.id,
              content: JSON.stringify({ summary: result.summary, data: result.data }),
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(`[Agent]  ✗ ${tool.name}: ${msg}`)
            return {
              type: 'tool_result',
              tool_use_id: tool.id,
              content: `Chyba nástroje: ${msg}`,
              is_error: true,
            }
          }
        })
      )

      // Append assistant turn + tool results and continue
      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResultContents })

      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: agentTools,
        messages,
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Agent] API error:', msg)
    return emptyResponse(`Chyba při komunikaci s AI: ${msg}`)
  }

  // ── Extract final text ──────────────────────────────────────────────────
  const message = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
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
  }

  for (const result of allToolResults) {
    switch (result.display_hint) {
      case 'chart':
        agentResponse.charts.push(result.data as ChartConfig)
        break

      case 'table': {
        // Detect structured report before generic table conversion
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

      // 'text' hint — no structured output, skip
    }
  }

  return agentResponse
}
