'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  BellRing,
  Building2,
  FileText,
  Mail,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'
import { useChatStore } from '@/lib/chat-store'
import { useTranslation } from '@/lib/useTranslation'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface ChatMessagesProps {
  onSend: (message: string) => void
}

function WelcomeScreen({ onSend }: { onSend: (msg: string) => void }) {
  const { t, language } = useTranslation()
  const starterGroups = language === 'cs'
    ? [
        {
          title: '📊 Data a analýzy',
          items: [
            { icon: BarChart3, label: 'Novi klienti za Q1 2026 - graf podle zdroje' },
            { icon: Sparkles, label: 'Vyvoj leadu a prodeju za 6 mesicu' },
            { icon: Building2, label: 'Analyza portfolia nemovitosti' },
          ],
        },
        {
          title: '📧 Komunikace',
          items: [
            { icon: Mail, label: 'Napis email zajemci o nemovitost' },
            { icon: FileText, label: 'Shrn vysledky tydne pro vedeni' },
          ],
        },
        {
          title: '🔍 Správa dat',
          items: [
            { icon: Search, label: 'Nemovitosti s chybejicimi udaji' },
            { icon: BellRing, label: 'Monitoring nabidek v Holesovicich' },
            { icon: Sparkles, label: 'Porovnej dve nejdrazsi nemovitosti' },
          ],
        },
      ]
    : [
        {
          title: '📊 Data & Analytics',
          items: [
            { icon: BarChart3, label: 'New clients in Q1 2026 - chart by source' },
            { icon: Sparkles, label: 'Lead and sales trend for 6 months' },
            { icon: Building2, label: 'Analyze the property portfolio' },
          ],
        },
        {
          title: '📧 Communication',
          items: [
            { icon: Mail, label: 'Write an email to a property lead' },
            { icon: FileText, label: 'Summarize this week for leadership' },
          ],
        },
        {
          title: '🔍 Data Management',
          items: [
            { icon: Search, label: 'Properties with missing data' },
            { icon: BellRing, label: 'Set up listing monitoring in Holesovice' },
            { icon: Sparkles, label: 'Compare the two most expensive properties' },
          ],
        },
      ]

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

      <div className="w-full max-w-3xl space-y-5">
        {starterGroups.map((group, groupIndex) => (
          <section key={group.title}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/60">
              {group.title}
            </p>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => onSend(item.label)}
                    className="button-smooth rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/85 shadow-sm hover:-translate-y-0.5 hover:border-primary/20 hover:text-foreground dark:shadow-none"
                    style={{
                      opacity: 0,
                      animation: 'starter-chip-in 420ms ease forwards',
                      animationDelay: `${(groupIndex * 3 + itemIndex) * 80}ms`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="leading-6">{item.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        @keyframes starter-chip-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
          <MessageBubble key={msg.id} message={msg} onSend={onSend} />
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
