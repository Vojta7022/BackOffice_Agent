'use client'

import { create } from 'zustand'
import type { AgentResponse, ChartConfig, TableData } from '@/lib/agent/orchestrator'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  charts?: ChartConfig[]
  tables?: TableData[]
  emailDraft?: { to: string; subject: string; body: string } | null
  taskCreated?: unknown | null
  monitoringSet?: unknown | null
  presentationData?: unknown | null
  reportData?: unknown | null
}

interface ChatStore {
  messages: ChatMessage[]
  isLoading: boolean
  addUserMessage: (content: string) => void
  addAssistantMessage: (response: AgentResponse) => void
  setLoading: (loading: boolean) => void
}

function newId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIso() {
  return new Date().toISOString()
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,

  addUserMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: newId(), role: 'user', content, timestamp: nowIso() },
      ],
    })),

  addAssistantMessage: (response) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: newId(),
          role: 'assistant',
          content: response.message,
          timestamp: nowIso(),
          charts: response.charts?.length ? response.charts : undefined,
          tables: response.tables?.length ? response.tables : undefined,
          emailDraft: response.emailDraft ?? undefined,
          taskCreated: response.taskCreated ?? undefined,
          monitoringSet: response.monitoringSet ?? undefined,
          presentationData: response.presentationData ?? undefined,
          reportData: response.reportData ?? undefined,
        },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}))
