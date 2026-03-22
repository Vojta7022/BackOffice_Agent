'use client'

import { useRef, useState, useCallback, KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Zobraz jako graf',
  'Exportuj do CSV',
  'Více detailů',
]

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  showSuggestions?: boolean
}

export default function ChatInput({ onSend, disabled, showSuggestions }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  const send = useCallback(() => {
    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend])

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
      {/* Contextual suggestion chips */}
      {showSuggestions && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              disabled={disabled}
              className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground
                hover:border-emerald-500/40 hover:text-emerald-400 transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); resize() }}
          onKeyDown={onKey}
          disabled={disabled}
          placeholder="Napište zprávu…"
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-xl border border-border bg-card px-4 py-2.5',
            'text-sm text-foreground placeholder:text-muted-foreground/50',
            'outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20',
            'transition-colors disabled:opacity-50',
            'min-h-[42px] max-h-[120px] leading-relaxed',
          )}
        />
        <button
          onClick={send}
          disabled={disabled || !value.trim()}
          className={cn(
            'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl',
            'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
            'transition-all hover:bg-emerald-600 active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
          )}
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
