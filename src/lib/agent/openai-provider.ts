import OpenAI from 'openai'
import { agentTools, ToolName } from './tools'
import { handleToolCall, resolveToolInput, ToolResult } from './tool-handlers'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set')
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function convertTools() {
  return agentTools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name ?? '',
      description: tool.description ?? '',
      parameters: tool.parametersJsonSchema || {},
    },
  })).filter((tool) => tool.function.name.length > 0)
}

function parseArgs(rawArgs: string): Record<string, unknown> {
  try {
    return JSON.parse(rawArgs || '{}') as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function callOpenAI(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxIterations: number = 5,
  currentUserMessage?: string
): Promise<{
  text: string
  toolResults: Array<{ name: string; result: ToolResult }>
  toolCallLog: Array<{ name: string; timestamp: number }>
}> {
  const openai = getOpenAIClient()
  const tools = convertTools()
  const toolResults: Array<{ name: string; result: ToolResult }> = []
  const toolCallLog: Array<{ name: string; timestamp: number }> = []

  const latestUserMessage =
    currentUserMessage ??
    [...messages].reverse().find((message) => message.role === 'user')?.content ??
    ''

  const openaiMessages: Array<Record<string, unknown>> = [
    { role: 'system', content: systemPrompt },
    ...messages.map((message) => ({
      role: message.role === 'model' ? 'assistant' : message.role,
      content: message.content,
    })),
  ]

  for (let i = 0; i < maxIterations; i += 1) {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: openaiMessages as never,
      tools: tools as never,
      tool_choice: 'auto',
      max_tokens: 2048,
    })

    const message = response.choices[0]?.message
    if (!message) {
      return { text: '', toolResults, toolCallLog }
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { text: message.content || '', toolResults, toolCallLog }
    }

    const functionToolCalls = message.tool_calls.filter((toolCall) => toolCall.type === 'function') as Array<{
      id: string
      type: 'function'
      function: { name: string; arguments: string }
    }>
    const orderedToolCalls = [
      ...functionToolCalls.filter((toolCall) => toolCall.function.name !== 'generate_chart'),
      ...functionToolCalls.filter((toolCall) => toolCall.function.name === 'generate_chart'),
    ]

    openaiMessages.push({
      role: 'assistant',
      content: message.content ?? '',
      tool_calls: message.tool_calls,
    })

    const results: Array<Record<string, unknown>> = []
    for (const toolCall of orderedToolCalls) {
      const name = toolCall.function.name
      const parsedArgs = parseArgs(toolCall.function.arguments || '{}')
      const args = resolveToolInput(name as ToolName, parsedArgs, toolResults.map((entry) => entry.result))
      toolCallLog.push({ name, timestamp: Date.now() })

      try {
        console.log(`[Agent]  → ${name}`, JSON.stringify(args))
        const result = await handleToolCall(name as ToolName, args, { userMessage: latestUserMessage })
        console.log(`[Agent]  ✓ ${name}: ${result.summary}`)
        toolResults.push({ name, result })
        results.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ summary: result.summary, data: result.data }),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[Agent]  ✗ ${name}: ${message}`)
        results.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: message }),
        })
      }
    }

    openaiMessages.push(...results)
  }

  const finalResponse = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: openaiMessages as never,
    max_tokens: 2048,
  })

  return {
    text: finalResponse.choices[0]?.message?.content || '',
    toolResults,
    toolCallLog,
  }
}
