'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import type { TableData } from '@/lib/agent/orchestrator'

export default function InlineTable({ table }: { table: TableData }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/30">
      {table.title && (
        <div className="border-b border-border px-4 py-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {table.title}
          </p>
        </div>
      )}
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
