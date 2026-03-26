'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Check, Clock3, FileWarning, Loader2, Send, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProactiveGreetingProps {
  className?: string
}

const greetingText = 'Dobré ráno. Přes noc přišlo několik poptávek na ten loft v Holešovicích. Rovnou jsem zkontroloval tvůj kalendář a připravil do Gmailu koncepty s návrhem volných oken na úterý a středu. Mám je odeslat? A mimochodem, u včerejší nabrané nemovitosti chybí energetický štítek, mám vyžádat doplnění od majitele?'

async function postHiddenPrompt(message: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `HTTP ${response.status}`

    throw new Error(errorMessage)
  }

  return response
}

export default function ProactiveGreeting({ className }: ProactiveGreetingProps) {
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isRequested, setIsRequested] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const isMountedRef = useRef(true)
  const dismissTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false

      if (dismissTimeoutRef.current) {
        window.clearTimeout(dismissTimeoutRef.current)
      }
    }
  }, [])

  function dismissCard() {
    if (isExiting || isHidden) return

    setIsExiting(true)
    dismissTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return
      setIsHidden(true)
    }, 300)
  }

  async function handleSendDrafts() {
    if (isSending || isSent) return

    setIsSending(true)

    try {
      const response = await postHiddenPrompt('Create email drafts for the Holešovice loft leads proposing available times for Tuesday and Wednesday.')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (!isMountedRef.current) return
      setIsSent(true)
    } catch (error) {
      console.error('Failed to send draft request.', error)
    } finally {
      if (!isMountedRef.current) return
      setIsSending(false)
    }
  }

  async function handleRequestLabel() {
    if (isRequesting || isRequested) return

    setIsRequesting(true)

    try {
      const response = await postHiddenPrompt("Send a request to the owner of yesterday's new property to provide the energy label.")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (!isMountedRef.current) return
      setIsRequested(true)
    } catch (error) {
      console.error('Failed to request energy label.', error)
    } finally {
      if (!isMountedRef.current) return
      setIsRequesting(false)
    }
  }

  if (isHidden) {
    return null
  }

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-out',
        isExiting ? 'max-h-0 -translate-y-2 opacity-0' : 'max-h-[32rem] translate-y-0 opacity-100',
        className
      )}
    >
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-sky-400/35 via-cyan-300/10 to-emerald-300/25 p-[1px] shadow-[0_24px_90px_-36px_rgba(56,189,248,0.7)]">
        <div className="relative rounded-[29px] border border-white/10 bg-[linear-gradient(135deg,rgba(10,14,24,0.96),rgba(16,23,36,0.94))] px-5 py-5 text-white md:px-6 md:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_34%)]" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 rounded-2xl ring-1 ring-white/15">
                  <AvatarFallback className="rounded-2xl bg-sky-400/15 text-sky-100">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100/90">
                      <Sparkles className="h-3.5 w-3.5" />
                      Připraveno přes noc
                    </span>
                    <span className="text-xs font-medium text-slate-300">RE:Agent</span>
                  </div>
                  <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-50 md:text-base">
                    {greetingText}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void handleSendDrafts()}
                disabled={isSending || isSent}
                variant="default"
                className={cn(
                  'h-11 rounded-2xl border-sky-300/30 bg-sky-400/90 px-4 text-sm text-slate-950 backdrop-blur-sm hover:bg-sky-300',
                  isSent && 'border-emerald-300/30 bg-emerald-400 text-emerald-950',
                  isSending && 'cursor-wait'
                )}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : isSent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                <span>{isSent ? 'Hotovo' : 'Odeslat koncepty'}</span>
              </Button>

              <Button
                type="button"
                onClick={() => void handleRequestLabel()}
                disabled={isRequesting || isRequested}
                variant="default"
                className={cn(
                  'h-11 rounded-2xl border-sky-300/30 bg-sky-400/90 px-4 text-sm text-slate-950 backdrop-blur-sm hover:bg-sky-300',
                  isRequested && 'border-emerald-300/30 bg-emerald-400 text-emerald-950',
                  isRequesting && 'cursor-wait'
                )}
              >
                {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : isRequested ? <Check className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
                <span>{isRequested ? 'Hotovo' : 'Vyžádat štítek'}</span>
              </Button>

              <Button
                type="button"
                onClick={dismissCard}
                disabled={isSending || isRequesting}
                variant="outline"
                className="h-11 rounded-2xl border-white/12 bg-white/5 px-4 text-sm text-slate-100 backdrop-blur-sm hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <Clock3 className="h-4 w-4" />
                <span>Vyřešit později</span>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
