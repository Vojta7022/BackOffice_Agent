'use client'

import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'

interface TimelineEntry {
  date: string
  event_type: 'lead' | 'transaction' | 'task'
  description: string
  description_cs?: string
  description_en?: string
}

interface TimelineData {
  client: {
    id: string
    name: string
    email?: string
  } | null
  timeline: TimelineEntry[]
}

function formatDate(date: string, language: 'cs' | 'en') {
  return new Date(date).toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-GB')
}

export default function TimelineCard({ timelineData }: { timelineData: TimelineData }) {
  const { t, language } = useTranslation()

  const eventConfig = {
    lead: {
      dot: 'bg-primary',
      badge: 'bg-primary/10 text-primary',
      label: t.chat.timelineLead,
    },
    transaction: {
      dot: 'bg-green-500',
      badge: 'bg-green-500/10 text-green-500',
      label: t.chat.timelineTransaction,
    },
    task: {
      dot: 'bg-amber-500',
      badge: 'bg-amber-500/10 text-amber-500',
      label: t.chat.timelineTask,
    },
  } as const

  return (
    <div className="surface-muted mt-3 overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          {t.chat.timelineTitle}{timelineData.client ? ` - ${timelineData.client.name}` : ''}
        </p>
        {timelineData.client?.email ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{timelineData.client.email}</p>
        ) : null}
      </div>

      <div className="px-4 py-4">
        {timelineData.timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.chat.noTimeline}</p>
        ) : (
          <div className="relative space-y-4 pl-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
            {timelineData.timeline.map((entry, index) => {
              const config = eventConfig[entry.event_type]
              const description = language === 'en'
                ? entry.description_en ?? entry.description
                : entry.description_cs ?? entry.description

              return (
                <div key={`${entry.date}-${entry.event_type}-${index}`} className="relative">
                  <span className={cn('absolute left-[-24px] top-2 h-3.5 w-3.5 rounded-full border-2 border-background', config.dot)} />
                  <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{formatDate(entry.date, language)}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', config.badge)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/90">{description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
