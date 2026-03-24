'use client'

import { useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChatStore } from '@/lib/chat-store'
import type { AgentResponse } from '@/lib/agent/orchestrator'
import { useTranslation } from '@/lib/useTranslation'
import ChatMessages from '@/components/chat/ChatMessages'
import ChatInput from '@/components/chat/ChatInput'

function ChatPageInner() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const { messages, isLoading, addUserMessage, addAssistantMessage, setLoading } = useChatStore()

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    addUserMessage(text)
    setLoading(true)

    // Build history from last 10 messages (role + content only)
    const history = [...messages, { role: 'user' as const, content: text }]
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      const data: AgentResponse = await res.json()
      addAssistantMessage(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.common.unknownError
      addAssistantMessage({
        message: `${t.chat.errorIntro} **${msg}**. ${t.chat.errorRetry}`,
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
      })
    } finally {
      setLoading(false)
    }
  }, [isLoading, messages, addUserMessage, addAssistantMessage, setLoading])

  // Auto-send from URL ?prompt= param (e.g. from dashboard quick actions)
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt && messages.length === 0) {
      send(decodeURIComponent(prompt))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showSuggestions = messages.length > 0 && !isLoading

  return (
    <div className="flex h-full flex-col">
      <ChatMessages onSend={send} />
      <ChatInput onSend={send} disabled={isLoading} showSuggestions={showSuggestions} />
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageFallback />}>
      <ChatPageInner />
    </Suspense>
  )
}

function ChatPageFallback() {
  const { t } = useTranslation()

  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t.common.loading}</div>
}
