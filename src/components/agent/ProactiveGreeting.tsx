'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Check, Clock3, FileWarning, Loader2, Send, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ActionId = 'send-drafts' | 'request-label' | 'resolve-later'

interface ProactiveGreetingProps {
  className?: string
}

const greetingText = 'Dobré ráno. Přes noc přišlo několik poptávek na ten loft v Holešovicích. Rovnou jsem zkontroloval tvůj kalendář a připravil do Gmailu koncepty s návrhem volných oken na úterý a středu. Mám je odeslat? A mimochodem, u včerejší nabrané nemovitosti chybí energetický štítek, mám vyžádat doplnění od majitele?'

const actionItems: Array<{ id: ActionId; label: string; icon: typeof Send }> = [
  { id: 'send-drafts', label: 'Odeslat koncepty', icon: Send },
  { id: 'request-label', label: 'Vyžádat štítek', icon: FileWarning },
  { id: 'resolve-later', label: 'Vyřešit později', icon: Clock3 },
]

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export default function ProactiveGreeting({ className }: ProactiveGreetingProps) {
  const [pendingAction, setPendingAction] = useState<ActionId | null>(null)
  const [completedAction, setCompletedAction] = useState<ActionId | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function handleAction(actionId: ActionId) {
    if (pendingAction || completedAction || isExiting) return

    setPendingAction(actionId)
    await wait(900)

    if (!isMountedRef.current) return
    setPendingAction(null)
    setCompletedAction(actionId)

    await wait(850)
    if (!isMountedRef.current) return
    setIsExiting(true)

    await wait(350)
    if (!isMountedRef.current) return
    setIsHidden(true)
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
              {actionItems.map((actionItem) => {
                const Icon = actionItem.icon
                const isPending = pendingAction === actionItem.id
                const isCompleted = completedAction === actionItem.id
                const isDisabled = Boolean(pendingAction || completedAction)

                return (
                  <Button
                    key={actionItem.id}
                    type="button"
                    onClick={() => void handleAction(actionItem.id)}
                    disabled={isDisabled && !isPending && !isCompleted}
                    variant={actionItem.id === 'resolve-later' ? 'outline' : 'default'}
                    className={cn(
                      'h-11 rounded-2xl px-4 text-sm backdrop-blur-sm',
                      actionItem.id === 'resolve-later'
                        ? 'border-white/12 bg-white/5 text-slate-100 hover:border-white/20 hover:bg-white/10 hover:text-white'
                        : 'border-sky-300/30 bg-sky-400/90 text-slate-950 hover:bg-sky-300',
                      isCompleted && 'border-emerald-300/30 bg-emerald-400 text-emerald-950',
                      isPending && 'cursor-wait'
                    )}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    <span>{isCompleted ? 'Hotovo' : actionItem.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
