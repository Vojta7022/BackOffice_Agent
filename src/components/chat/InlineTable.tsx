'use client'

import { Download } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TableData } from '@/lib/agent/orchestrator'
import { useTranslation } from '@/lib/useTranslation'

function downloadCsv(table: TableData, fallbackName: string) {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`
  const csv = '\uFEFF' + [
    table.headers.map(escapeCell).join(';'),
    ...table.rows.map((row) => row.map(escapeCell).join(';')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${table.title || fallbackName}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function InlineTable({ table }: { table: TableData }) {
  const { t } = useTranslation()

  return (
    <div className="surface-muted mt-3 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-4 py-2.5">
        {table.title && (
          <p className="flex-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {table.title}
          </p>
        )}
        <button
          onClick={() => downloadCsv(table, t.chat.exportFilename)}
          className="button-smooth flex items-center gap-1 rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/15"
        >
          <Download className="h-3 w-3" />
          {t.chat.downloadCsv}
        </button>
      </div>
      <ScrollArea className="max-h-[360px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card/50">
              {table.headers.map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-primary">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/60 transition-colors even:bg-muted/20 hover:bg-muted/40 last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="max-w-[200px] truncate px-4 py-2 text-xs text-foreground/90">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
      <div className="border-t border-border px-4 py-1.5">
        <p className="text-[11px] text-muted-foreground">{table.rows.length} {t.chat.records}</p>
      </div>
    </div>
  )
}
