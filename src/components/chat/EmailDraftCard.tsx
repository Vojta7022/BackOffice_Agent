'use client'

import { useState } from 'react'
import { Copy, Check, Pencil } from 'lucide-react'

interface EmailDraft {
  to: string
  subject: string
  body: string
}

export default function EmailDraftCard({ draft }: { draft: EmailDraft }) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(draft.body)

  const copy = async () => {
    await navigator.clipboard.writeText(`Komu: ${draft.to}\nPředmět: ${draft.subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-primary/25 bg-primary/5">
      <div className="flex items-center gap-2 border-b border-primary/15 px-4 py-2.5">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Návrh emailu</span>
      </div>
      <div className="space-y-2 px-4 py-3">
        <div className="flex gap-2 text-sm">
          <span className="w-16 shrink-0 text-muted-foreground">Komu:</span>
          <span className="text-foreground font-medium">{draft.to}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="w-16 shrink-0 text-muted-foreground">Předmět:</span>
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
      </div>
      <div className="flex gap-2 border-t border-primary/15 px-4 py-2">
        <button
          onClick={copy}
          className="button-smooth flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Zkopírováno' : 'Kopírovat'}
        </button>
        <button
          onClick={() => setEditing(e => !e)}
          className="button-smooth flex items-center gap-1.5 rounded-xl bg-muted/70 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? 'Hotovo' : 'Upravit'}
        </button>
      </div>
    </div>
  )
}
