'use client'

import { useRef, useState, useCallback, useEffect, KeyboardEvent, useMemo } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  Building2,
  FileText,
  LayoutDashboard,
  Mail,
  Mic,
  Presentation,
  SendHorizontal,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  showSuggestions?: boolean
  initialValue?: string
}

interface QuickCommand {
  id: string
  name: string
  description: string
  prompt: string
  icon: LucideIcon
}

function normalizeCommandQuery(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function ChatInput({ onSend, disabled, showSuggestions, initialValue = '' }: ChatInputProps) {
  const { t, language } = useTranslation()
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [activeCommandIndex, setActiveCommandIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const commandIcons: Record<string, LucideIcon> = {
    clients: Users,
    leads: BarChart3,
    properties: Building2,
    missing: AlertTriangle,
    report: FileText,
    presentation: Presentation,
    email: Mail,
    monitoring: BellRing,
    portfolio: BarChart3,
    dashboard: LayoutDashboard,
  }

  const quickCommands = useMemo<QuickCommand[]>(() => {
    return t.chat.quickCommands.map((command) => ({
      ...command,
      icon: commandIcons[command.id] ?? Sparkles,
    }))
  }, [t.chat.quickCommands])

  // Check Web Speech API support on mount
  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) return
    setIsSupported(true)

    const rec = new Ctor()
    rec.lang = language === 'cs' ? 'cs-CZ' : 'en-US'
    rec.continuous = false
    rec.interimResults = true

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setValue(transcript)
      // Resize after injecting text
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`
      })
    }

    rec.onend = () => setIsListening(false)

    rec.onerror = (e) => {
      console.error('[SpeechRecognition] error:', e)
      setIsListening(false)
    }

    recognitionRef.current = rec
  }, [language])

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  useEffect(() => {
    setValue(initialValue)
    requestAnimationFrame(() => {
      resize()
    })
  }, [initialValue, resize])

  const slashQuery = useMemo(() => {
    const trimmed = value.trimStart()
    if (!trimmed.startsWith('/')) return null
    if (trimmed.includes(' ')) return null
    return trimmed.slice(1).toLowerCase()
  }, [value])

  const filteredCommands = useMemo(() => {
    if (slashQuery === null) return []
    const normalizedQuery = normalizeCommandQuery(slashQuery)
    return quickCommands.filter((command) => {
      const normalizedName = normalizeCommandQuery(command.name.slice(1))
      const normalizedDescription = normalizeCommandQuery(command.description)
      return normalizedName.includes(normalizedQuery) || normalizedDescription.includes(normalizedQuery)
    })
  }, [quickCommands, slashQuery])

  const isCommandPaletteOpen = slashQuery !== null

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setActiveCommandIndex(0)
      return
    }

    setActiveCommandIndex((current) => Math.min(current, Math.max(filteredCommands.length - 1, 0)))
  }, [filteredCommands.length, isCommandPaletteOpen])

  const runCommand = useCallback((command: QuickCommand) => {
    if (disabled) return
    setValue(command.prompt)
    onSend(command.prompt)
    setValue('')
    setActiveCommandIndex(0)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [disabled, onSend])

  const send = useCallback(() => {
    if (isCommandPaletteOpen && filteredCommands.length > 0) {
      runCommand(filteredCommands[activeCommandIndex] ?? filteredCommands[0])
      return
    }

    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
    setActiveCommandIndex(0)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [activeCommandIndex, disabled, filteredCommands, isCommandPaletteOpen, onSend, runCommand, value])

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isCommandPaletteOpen && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveCommandIndex((current) => (current + 1) % filteredCommands.length)
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveCommandIndex((current) => (current - 1 + filteredCommands.length) % filteredCommands.length)
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        runCommand(filteredCommands[activeCommandIndex] ?? filteredCommands[0])
        return
      }
    }

    if (isCommandPaletteOpen && e.key === 'Escape') {
      e.preventDefault()
      setValue('')
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const toggleMic = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    if (isListening) {
      rec.stop()
      setIsListening(false)
    } else {
      setValue('')
      rec.start()
      setIsListening(true)
    }
  }, [isListening])

  return (
    <div className="relative border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
      {showSuggestions && !isCommandPaletteOpen && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {t.chat.composerSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              disabled={disabled}
              className="button-smooth shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {isCommandPaletteOpen && (
        <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 z-20 overflow-hidden rounded-2xl border border-border bg-card shadow-xl dark:shadow-none">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            {t.chat.quickCommandsTitle}
          </div>
          {filteredCommands.length > 0 ? (
            <div className="max-h-72 overflow-y-auto p-2">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon
                const isActive = index === activeCommandIndex

                return (
                  <button
                    key={command.name}
                    type="button"
                    onMouseEnter={() => setActiveCommandIndex(index)}
                    onClick={() => runCommand(command)}
                    className={cn(
                      'button-smooth flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left',
                      isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/60'
                    )}
                  >
                    <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', isActive ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{command.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{command.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              {t.chat.noQuickCommandFound}
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        {isSupported && (
          <button
            onClick={toggleMic}
            disabled={disabled}
            aria-label={isListening ? t.chat.stopRecording : t.chat.recordVoice}
            className={cn(
              'button-smooth relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl border shadow-sm dark:shadow-none',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              isListening
                ? 'border-red-500/50 bg-red-500/10 text-red-500'
                : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-primary',
            )}
          >
            {isListening && (
              <span
                className="absolute inset-0 rounded-2xl border border-red-500/60"
                style={{ animation: 'pulse-recording 1.2s ease-in-out infinite' }}
              />
            )}
            <Mic className="h-4 w-4" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); resize() }}
          onKeyDown={onKey}
          disabled={disabled}
          placeholder={isListening ? t.chat.listening : t.chat.placeholder}
          rows={1}
          className={cn(
            'control-focus w-0 min-w-0 flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm dark:shadow-none',
            'text-sm text-foreground placeholder:text-muted-foreground/50',
            'disabled:opacity-50',
            'min-h-[42px] max-h-[120px] leading-relaxed',
            isListening && 'border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20',
          )}
        />

        <button
          onClick={send}
          disabled={disabled || !value.trim()}
          aria-label={t.chat.send}
          title={t.chat.send}
          className={cn(
            'button-smooth flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl',
            'bg-primary text-white shadow-sm hover:bg-primary/90 dark:shadow-none active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
          )}
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>

      <style>{`
        @keyframes pulse-recording {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.06); }
        }
      `}</style>
    </div>
  )
}
