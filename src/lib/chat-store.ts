'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentResponse, ChartConfig, TableData, ToolCallLogEntry } from '@/lib/agent/orchestrator'

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
  comparisonData?: unknown | null
  timelineData?: unknown | null
  toolCallLog?: ToolCallLogEntry[]
}

interface ChatStore {
  messages: ChatMessage[]
  isLoading: boolean
  thinkingSteps: string[]
  addUserMessage: (content: string) => void
  addAssistantMessage: (response: AgentResponse) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
  addThinkingStep: (step: string) => void
  clearThinkingSteps: () => void
}

function newId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIso() {
  return new Date().toISOString()
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      thinkingSteps: [],

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
              comparisonData: response.comparisonData ?? undefined,
              timelineData: response.timelineData ?? undefined,
              toolCallLog: response.toolCallLog?.length ? response.toolCallLog : undefined,
            },
          ],
          thinkingSteps: [],
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      clearMessages: () => set({ messages: [], isLoading: false, thinkingSteps: [] }),

      addThinkingStep: (step) =>
        set((s) => ({ thinkingSteps: [...s.thinkingSteps, step] })),

      clearThinkingSteps: () => set({ thinkingSteps: [] }),
    }),
    {
      name: 'backoffice-chat',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
