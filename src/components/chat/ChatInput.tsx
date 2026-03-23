'use client'

import { useRef, useState, useCallback, useEffect, KeyboardEvent } from 'react'
import { SendHorizontal, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  showSuggestions?: boolean
}

export default function ChatInput({ onSend, disabled, showSuggestions }: ChatInputProps) {
  const { t, language } = useTranslation()
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

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
    <div className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
      {showSuggestions && (
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
            'control-focus flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm dark:shadow-none',
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
