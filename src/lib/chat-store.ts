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
  emailDraft?: {
    to: string
    subject: string
    body: string
    gmail_draft?: string | null
    google_connected?: boolean
  } | null
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

export type ConversationSort = 'manual' | 'recent' | 'oldest' | 'alphabetical'

export interface ConversationListItem {
  id: string
  title: string
  updatedAt: string
  messageCount: number
}

export interface ChatState {
  conversations: Record<string, ChatConversation>
  conversationOrder: string[]
  conversationSort: ConversationSort
  activeConversationId: string | null
  isLoading: boolean
  thinkingSteps: string[]
  createNewConversation: () => string
  setActiveConversation: (id: string) => void
  setConversationSort: (sort: ConversationSort) => void
  moveConversation: (id: string, direction: 'up' | 'down') => void
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

function buildConversationListItem(conversation: ChatConversation): ConversationListItem {
  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    messageCount: conversation.messages.length,
  }
}

function getRecentConversationIds(conversations: Record<string, ChatConversation>): string[] {
  return Object.values(conversations)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((conversation) => conversation.id)
}

function ensureConversationOrder(
  conversations: Record<string, ChatConversation>,
  conversationOrder: string[]
): string[] {
  const existingIds = new Set(Object.keys(conversations))
  const orderedIds = conversationOrder.filter((id) => existingIds.has(id))
  const missingIds = getRecentConversationIds(conversations).filter((id) => !orderedIds.includes(id))
  return [...orderedIds, ...missingIds]
}

function getSortedConversationList(
  conversations: Record<string, ChatConversation>,
  conversationSort: ConversationSort,
  conversationOrder: string[]
): ConversationListItem[] {
  const items = Object.values(conversations).map(buildConversationListItem)

  if (conversationSort === 'recent') {
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  if (conversationSort === 'oldest') {
    return items.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
  }

  if (conversationSort === 'alphabetical') {
    return items.sort((a, b) => {
      const aTitle = a.title.trim().toLocaleLowerCase()
      const bTitle = b.title.trim().toLocaleLowerCase()
      if (!aTitle && !bTitle) return b.updatedAt.localeCompare(a.updatedAt)
      if (!aTitle) return 1
      if (!bTitle) return -1
      return aTitle.localeCompare(bTitle)
    })
  }

  return ensureConversationOrder(conversations, conversationOrder)
    .map((id) => conversations[id])
    .filter((conversation): conversation is ChatConversation => Boolean(conversation))
    .map(buildConversationListItem)
}

function moveConversationId(
  orderedIds: string[],
  id: string,
  direction: 'up' | 'down'
): string[] {
  const currentIndex = orderedIds.indexOf(id)
  if (currentIndex === -1) return orderedIds

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= orderedIds.length) return orderedIds

  const nextIds = [...orderedIds]
  ;[nextIds[currentIndex], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[currentIndex]]
  return nextIds
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
let cachedConversationOrder: string[] | null = null
let cachedConversationSort: ConversationSort | null = null
let cachedConversationList = EMPTY_CONVERSATION_LIST

export function selectActiveMessages(state: ChatState): ChatMessage[] {
  if (!state.activeConversationId) return EMPTY_MESSAGES
  return state.conversations[state.activeConversationId]?.messages ?? EMPTY_MESSAGES
}

export function selectConversationList(state: ChatState): ConversationListItem[] {
  if (
    state.conversations === cachedConversations &&
    state.conversationOrder === cachedConversationOrder &&
    state.conversationSort === cachedConversationSort
  ) {
    return cachedConversationList
  }

  cachedConversations = state.conversations
  cachedConversationOrder = state.conversationOrder
  cachedConversationSort = state.conversationSort
  cachedConversationList = getSortedConversationList(
    state.conversations,
    state.conversationSort,
    state.conversationOrder
  )
  return cachedConversationList
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: {},
      conversationOrder: [],
      conversationSort: 'recent',
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
          conversationOrder: [conversation.id, ...state.conversationOrder.filter((id) => id !== conversation.id)],
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

      setConversationSort: (conversationSort) =>
        set((state) => ({
          conversationSort,
          conversationOrder:
            conversationSort === 'manual'
              ? ensureConversationOrder(state.conversations, state.conversationOrder)
              : state.conversationOrder,
        })),

      moveConversation: (id, direction) =>
        set((state) => {
          const baseOrder =
            state.conversationSort === 'manual'
              ? ensureConversationOrder(state.conversations, state.conversationOrder)
              : getSortedConversationList(state.conversations, state.conversationSort, state.conversationOrder).map((item) => item.id)

          return {
            conversationSort: 'manual',
            conversationOrder: moveConversationId(baseOrder, id, direction),
          }
        }),

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
            conversationOrder: state.conversationOrder.includes(activeId)
              ? state.conversationOrder
              : [activeId, ...state.conversationOrder],
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
            conversationOrder: state.conversationOrder.includes(activeId)
              ? state.conversationOrder
              : [activeId, ...state.conversationOrder],
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
              ? getSortedConversationList(conversations, state.conversationSort, state.conversationOrder)[0]?.id ?? null
              : state.activeConversationId

          return {
            conversations,
            conversationOrder: state.conversationOrder.filter((conversationId) => conversationId !== id),
            activeConversationId: nextActiveConversationId,
            isLoading: state.activeConversationId === id ? false : state.isLoading,
            thinkingSteps: state.activeConversationId === id ? [] : state.thinkingSteps,
          }
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      clearAll: () =>
        set({
          conversations: {},
          conversationOrder: [],
          conversationSort: 'recent',
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
        conversationOrder: state.conversationOrder,
        conversationSort: state.conversationSort,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
)
