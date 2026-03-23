'use client'

import { useEffect, useRef } from 'react'
import { Building2, Plus } from 'lucide-react'
import { useChatStore } from '@/lib/chat-store'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

const SUGGESTIONS = [
  'Noví klienti za Q1 2026',
  'Graf leadů za 6 měsíců',
  'Nemovitosti s chybějícími daty',
  'Týdenní report pro vedení',
  'Napiš email zájemci o nemovitost',
  'Monitoring nabídek v Holešovicích',
]

interface ChatMessagesProps {
  onSend: (message: string) => void
}

function WelcomeScreen({ onSend }: { onSend: (msg: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          <Building2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Jak vám mohu pomoci?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Zeptejte se mě na nemovitosti, klienty, statistiky nebo nechte mě připravit report.
          </p>
        </div>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSend(s)}
            className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/80
              hover:border-emerald-500/40 hover:bg-card/80 hover:text-foreground transition-all duration-150"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChatMessages({ onSend }: ChatMessagesProps) {
  const { messages, isLoading, clearMessages } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return <WelcomeScreen onSend={onSend} />
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto px-4 py-4">
      {/* New chat button — top-right corner */}
      <button
        onClick={clearMessages}
        className="absolute right-4 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:text-emerald-400"
      >
        <Plus className="h-3.5 w-3.5" />
        Nový chat
      </button>

      <div className="mx-auto w-full max-w-3xl space-y-4 pt-8">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
