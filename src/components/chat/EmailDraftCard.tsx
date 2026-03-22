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
    <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
      <div className="border-b border-emerald-500/20 px-4 py-2.5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Návrh emailu</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex gap-2 text-sm">
          <span className="w-16 shrink-0 text-muted-foreground">Komu:</span>
          <span className="text-foreground font-medium">{draft.to}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="w-16 shrink-0 text-muted-foreground">Předmět:</span>
          <span className="text-foreground font-medium">{draft.subject}</span>
        </div>
        <div className="border-t border-emerald-500/20 pt-2 mt-2">
          {editing ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[120px] resize-y rounded-lg border border-border bg-background/50 p-2 text-sm text-foreground outline-none focus:border-emerald-500/50"
            />
          ) : (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{body}</p>
          )}
        </div>
      </div>
      <div className="border-t border-emerald-500/20 px-4 py-2 flex gap-2">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Zkopírováno' : 'Kopírovat'}
        </button>
        <button
          onClick={() => setEditing(e => !e)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? 'Hotovo' : 'Upravit'}
        </button>
      </div>
    </div>
  )
}
