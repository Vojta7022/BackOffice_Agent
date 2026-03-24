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

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ConversationListItem {
  id: string
  title: string
  updatedAt: string
  messageCount: number
}

export interface ChatState {
  conversations: Record<string, ChatConversation>
  activeConversationId: string | null
  isLoading: boolean
  thinkingSteps: string[]
  createNewConversation: () => string
  setActiveConversation: (id: string) => void
  addUserMessage: (content: string) => void
  addAssistantMessage: (response: AgentResponse) => void
  deleteConversation: (id: string) => void
  setLoading: (loading: boolean) => void
  clearAll: () => void
  addThinkingStep: (step: string) => void
  clearThinkingSteps: () => void
}

function newId(prefix: 'msg' | 'conv') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIso() {
  return new Date().toISOString()
}

function createConversation(id = newId('conv')): ChatConversation {
  const timestamp = nowIso()
  return {
    id,
    title: '',
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function makeConversationTitle(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.length > 40 ? `${normalized.slice(0, 40)}…` : normalized
}

function getSortedConversationList(conversations: Record<string, ChatConversation>): ConversationListItem[] {
  return Object.values(conversations)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      messageCount: conversation.messages.length,
    }))
}

function buildAssistantMessage(response: AgentResponse): ChatMessage {
  return {
    id: newId('msg'),
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
  }
}

const EMPTY_MESSAGES: ChatMessage[] = []
const EMPTY_CONVERSATION_LIST: ConversationListItem[] = []

let cachedConversations: Record<string, ChatConversation> | null = null
let cachedConversationList = EMPTY_CONVERSATION_LIST

export function selectActiveMessages(state: ChatState): ChatMessage[] {
  if (!state.activeConversationId) return EMPTY_MESSAGES
  return state.conversations[state.activeConversationId]?.messages ?? EMPTY_MESSAGES
}

export function selectConversationList(state: ChatState): ConversationListItem[] {
  if (state.conversations === cachedConversations) {
    return cachedConversationList
  }

  cachedConversations = state.conversations
  cachedConversationList = getSortedConversationList(state.conversations)
  return cachedConversationList
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: {},
      activeConversationId: null,
      isLoading: false,
      thinkingSteps: [],

      createNewConversation: () => {
        const conversation = createConversation()
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversation.id]: conversation,
          },
          activeConversationId: conversation.id,
          isLoading: false,
          thinkingSteps: [],
        }))
        return conversation.id
      },

      setActiveConversation: (id) =>
        set((state) =>
          state.conversations[id]
            ? {
                activeConversationId: id,
                thinkingSteps: [],
              }
            : state
        ),

      addUserMessage: (content) =>
        set((state) => {
          const activeId = state.activeConversationId && state.conversations[state.activeConversationId]
            ? state.activeConversationId
            : newId('conv')

          const currentConversation = state.conversations[activeId] ?? createConversation(activeId)
          const message: ChatMessage = {
            id: newId('msg'),
            role: 'user',
            content,
            timestamp: nowIso(),
          }
          const updatedConversation: ChatConversation = {
            ...currentConversation,
            title: currentConversation.title || makeConversationTitle(content),
            messages: [...currentConversation.messages, message],
            updatedAt: message.timestamp,
          }

          return {
            conversations: {
              ...state.conversations,
              [activeId]: updatedConversation,
            },
            activeConversationId: activeId,
          }
        }),

      addAssistantMessage: (response) =>
        set((state) => {
          const activeId = state.activeConversationId && state.conversations[state.activeConversationId]
            ? state.activeConversationId
            : newId('conv')

          const currentConversation = state.conversations[activeId] ?? createConversation(activeId)
          const message = buildAssistantMessage(response)
          const updatedConversation: ChatConversation = {
            ...currentConversation,
            messages: [...currentConversation.messages, message],
            updatedAt: message.timestamp,
          }

          return {
            conversations: {
              ...state.conversations,
              [activeId]: updatedConversation,
            },
            activeConversationId: activeId,
            thinkingSteps: [],
          }
        }),

      deleteConversation: (id) =>
        set((state) => {
          if (!state.conversations[id]) return state

          const conversations = { ...state.conversations }
          delete conversations[id]

          const nextActiveConversationId =
            state.activeConversationId === id
              ? getSortedConversationList(conversations)[0]?.id ?? null
              : state.activeConversationId

          return {
            conversations,
            activeConversationId: nextActiveConversationId,
            isLoading: state.activeConversationId === id ? false : state.isLoading,
            thinkingSteps: state.activeConversationId === id ? [] : state.thinkingSteps,
          }
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      clearAll: () =>
        set({
          conversations: {},
          activeConversationId: null,
          isLoading: false,
          thinkingSteps: [],
        }),

      addThinkingStep: (step) =>
        set((state) => ({ thinkingSteps: [...state.thinkingSteps, step] })),

      clearThinkingSteps: () => set({ thinkingSteps: [] }),
    }),
    {
      name: 'backoffice-chat',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
)
