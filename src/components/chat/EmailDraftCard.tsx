'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Copy, Check, Pencil, Send } from 'lucide-react'
import { useTranslation } from '@/lib/useTranslation'

interface EmailDraft {
  to: string
  subject: string
  body: string
  gmail_draft?: string | null
  google_connected?: boolean
}

export default function EmailDraftCard({ draft }: { draft: EmailDraft }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [body, setBody] = useState(draft.body)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const copy = async () => {
    await navigator.clipboard.writeText(`${t.chat.to}: ${draft.to}\n${t.chat.subject}: ${draft.subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const send = async () => {
    if (!draft.google_connected) {
      setNotice({ type: 'error', message: 'Pro odesilani emailu propojte Google ucet.' })
      return
    }

    try {
      setSending(true)
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: draft.to,
          subject: draft.subject,
          body,
        }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.sent) {
        throw new Error(result?.reason || 'Email send failed')
      }

      setNotice({ type: 'success', message: 'Email byl odeslan.' })
    } catch (error) {
      console.error('Email send failed:', error)
      setNotice({ type: 'error', message: 'Odeslani emailu selhalo. Zkuste to znovu.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-primary/25 bg-primary/5">
      <div className="flex items-center gap-2 border-b border-primary/15 px-4 py-2.5">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{t.chat.emailDraft}</span>
        {draft.gmail_draft ? (
          <span className="ml-auto rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
            {draft.gmail_draft}
          </span>
        ) : null}
      </div>
      <div className="space-y-2 px-4 py-3">
        <div className="flex gap-2 text-sm">
          <span className="w-16 shrink-0 text-muted-foreground">{t.chat.to}:</span>
          <span className="text-foreground font-medium">{draft.to}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="w-16 shrink-0 text-muted-foreground">{t.chat.subject}:</span>
          <span className="text-foreground font-medium">{draft.subject}</span>
        </div>
        <div className="mt-2 border-t border-primary/15 pt-2">
          {editing ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="control-focus min-h-[120px] w-full resize-y rounded-xl border border-border bg-background/60 p-2 text-sm text-foreground"
            />
          ) : (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{body}</p>
          )}
        </div>
        {!draft.google_connected ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <p>Pro odesilani emailu propojte Google ucet.</p>
            <Link href="/api/auth/google" className="mt-1 inline-flex font-medium underline underline-offset-2">
              Propojit Google ucet
            </Link>
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 border-t border-primary/15 px-4 py-2">
        <button
          onClick={copy}
          className="button-smooth flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t.chat.copied : t.chat.copy}
        </button>
        <button
          onClick={() => setEditing(e => !e)}
          className="button-smooth flex items-center gap-1.5 rounded-xl bg-muted/70 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? t.chat.done : t.chat.edit}
        </button>
        <button
          onClick={send}
          disabled={sending}
          className="button-smooth flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? 'Odesilam...' : 'Odeslat email'}
        </button>
      </div>
      {notice ? (
        <div className={`border-t px-4 py-2 text-xs ${notice.type === 'success' ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300' : 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300'}`}>
          {notice.message}
        </div>
      ) : null}
    </div>
  )
}
