import Groq from 'groq-sdk'
import type { FunctionDeclaration } from '@google/genai'

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set')
  }

  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function callGroq(
  systemPrompt: string,
  messages: Array<Record<string, unknown>>,
  tools: FunctionDeclaration[]
): Promise<unknown> {
  const groq = getGroqClient()
  const openaiTools = tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: String(tool.name ?? ''),
      description: tool.description ?? '',
      parameters: (tool.parametersJsonSchema || {}) as Record<string, unknown>,
    },
  })).filter((tool) => tool.function.name.length > 0)

  const groqMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map((message) => {
      if (message.role === 'tool') {
        return {
          role: 'tool' as const,
          tool_call_id: String(message.tool_call_id ?? ''),
          content: String(message.content ?? ''),
        }
      }

      return {
        role: (message.role === 'model' ? 'assistant' : message.role) as 'user' | 'assistant',
        content: String(message.content ?? ''),
        ...(Array.isArray(message.tool_calls) ? { tool_calls: message.tool_calls } : {}),
      }
    }),
  ]

  return groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: groqMessages,
    tools: openaiTools,
    tool_choice: 'auto',
    max_tokens: 2048,
  })
}

export function parseGroqResponse(response: unknown): {
  text: string
  toolCalls: Array<{ name: string; args: Record<string, unknown>; id: string }>
} {
  const choice = (response as { choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ id: string; function?: { name?: string; arguments?: string } }> } }> })?.choices?.[0]
  const message = choice?.message
  const text = typeof message?.content === 'string' ? message.content : ''
  const toolCalls = (message?.tool_calls || []).map((toolCall) => ({
    name: toolCall.function?.name || '',
    args: (() => {
      try {
        return JSON.parse(toolCall.function?.arguments || '{}') as Record<string, unknown>
      } catch {
        return {}
      }
    })(),
    id: toolCall.id,
  }))

  return { text, toolCalls }
}

export function buildGroqToolResult(toolCallId: string, result: string) {
  return {
    role: 'tool' as const,
    tool_call_id: toolCallId,
    content: result,
  }
}
