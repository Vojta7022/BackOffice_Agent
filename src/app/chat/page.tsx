'use client'

import { useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { selectActiveMessages, useChatStore } from '@/lib/chat-store'
import type { AgentResponse } from '@/lib/agent/orchestrator'
import { useTranslation } from '@/lib/useTranslation'
import ChatMessages from '@/components/chat/ChatMessages'
import ChatInput from '@/components/chat/ChatInput'

function ChatPageInner() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const messages = useChatStore(selectActiveMessages)
  const isLoading = useChatStore((state) => state.isLoading)
  const addUserMessage = useChatStore((state) => state.addUserMessage)
  const addAssistantMessage = useChatStore((state) => state.addAssistantMessage)
  const setLoading = useChatStore((state) => state.setLoading)
  const createNewConversation = useChatStore((state) => state.createNewConversation)
  const prompt = searchParams.get('prompt')
  const processedPromptRef = useRef<string | null>(null)
  const initializedConversationRef = useRef(false)

  const send = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || useChatStore.getState().isLoading) return

    addUserMessage(message)
    setLoading(true)

    const history = selectActiveMessages(useChatStore.getState())
      .slice(-10)
      .map((entry) => ({ role: entry.role, content: entry.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: history.slice(0, -1) }),
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
  }, [addAssistantMessage, addUserMessage, setLoading, t])

  useEffect(() => {
    if (initializedConversationRef.current || prompt) return

    initializedConversationRef.current = true
    if (!useChatStore.getState().activeConversationId) {
      createNewConversation()
    }
  }, [createNewConversation, prompt])

  useEffect(() => {
    if (!prompt) return

    const decodedPrompt = decodeURIComponent(prompt)
    if (processedPromptRef.current === decodedPrompt) return

    processedPromptRef.current = decodedPrompt
    createNewConversation()
    void send(decodedPrompt)
  }, [createNewConversation, prompt, send])

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
