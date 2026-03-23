'use client'

import { Download } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TableData } from '@/lib/agent/orchestrator'

function downloadCsv(table: TableData) {
  const csv = [table.headers.join(','), ...table.rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${table.title || 'export'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function InlineTable({ table }: { table: TableData }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
        {table.title && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
            {table.title}
          </p>
        )}
        <button
          onClick={() => downloadCsv(table)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          <Download className="h-3 w-3" />
          Stáhnout CSV
        </button>
      </div>
      <ScrollArea className="max-h-[360px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {table.headers.map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/50 last:border-0 hover:bg-white/5 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 text-xs text-foreground/90 max-w-[200px] truncate">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
      <div className="border-t border-border/50 px-4 py-1.5">
        <p className="text-[11px] text-muted-foreground">{table.rows.length} záznamů</p>
      </div>
    </div>
  )
}
