'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus } from 'lucide-react'
import { useChatStore } from '@/lib/chat-store'
import { useTranslation } from '@/lib/useTranslation'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface ChatMessagesProps {
  onSend: (message: string) => void
}

function WelcomeScreen({ onSend }: { onSend: (msg: string) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t.chat.welcomeTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.chat.welcomeDescription}
          </p>
        </div>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-2">
        {t.chat.welcomeSuggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSend(s)}
            className="button-smooth rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/85 shadow-sm hover:-translate-y-0.5 hover:border-primary/20 hover:text-foreground dark:shadow-none"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChatMessages({ onSend }: ChatMessagesProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const messages = useChatStore((state) => state.getActiveMessages())
  const isLoading = useChatStore((state) => state.isLoading)
  const createNewConversation = useChatStore((state) => state.createNewConversation)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return <WelcomeScreen onSend={onSend} />
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto px-4 py-4">
      <button
        onClick={() => {
          createNewConversation()
          router.push('/chat')
        }}
        className="button-smooth absolute right-4 top-3 z-10 flex items-center gap-1.5 rounded-xl border border-border bg-card/95 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm hover:border-primary/20 hover:text-primary dark:shadow-none"
      >
        <Plus className="h-3.5 w-3.5" />
        {t.chat.newChat}
      </button>

      <div className="mx-auto w-full max-w-3xl space-y-4 pt-8">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2 shadow-sm dark:shadow-none">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
