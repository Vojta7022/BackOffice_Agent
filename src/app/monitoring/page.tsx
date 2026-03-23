'use client'

import Link from 'next/link'
import { Bell, Plus, MapPin, Clock, Zap, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'
import type { MonitoringRule } from '@/types'

// ─── Example rules shown as inspiration ───────────────────────────────────────

const EXAMPLE_RULES: Pick<MonitoringRule, 'id' | 'location' | 'frequency' | 'active' | 'filters'>[] = [
  {
    id: 'ex1',
    location: 'Praha – Holešovice',
    frequency: 'daily',
    active: true,
    filters: { property_types: ['apartment'], price_max: 8_000_000, rooms_min: 2 },
  },
  {
    id: 'ex2',
    location: 'Praha – Vinohrady',
    frequency: 'weekly',
    active: true,
    filters: { property_types: ['apartment', 'house'], price_min: 5_000_000, price_max: 15_000_000 },
  },
  {
    id: 'ex3',
    location: 'Brno – centrum',
    frequency: 'daily',
    active: false,
    filters: { property_types: ['commercial', 'office'] },
  },
]

function FilterPills({ filters }: { filters: MonitoringRule['filters'] }) {
  const { t } = useTranslation()
  const pills: string[] = []
  if (filters.property_types?.length) {
    pills.push(filters.property_types.map((type) => t.monitoring.propertyTypeLabels[type] ?? type).join(', '))
  }
  if (filters.price_min !== undefined) pills.push(`${t.monitoring.fromPrice} ${(filters.price_min / 1_000_000).toFixed(0)} mil. CZK`)
  if (filters.price_max !== undefined) pills.push(`${t.monitoring.toPrice} ${(filters.price_max / 1_000_000).toFixed(0)} mil. CZK`)
  if (filters.rooms_min !== undefined) pills.push(`${t.monitoring.minRooms} ${filters.rooms_min} ${t.properties.rooms}`)
  if (filters.rooms_max !== undefined) pills.push(`${t.monitoring.maxRooms} ${filters.rooms_max} ${t.properties.rooms}`)

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pills.map(p => (
        <span key={p} className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] text-muted-foreground">{p}</span>
      ))}
    </div>
  )
}

function RuleCard({ rule }: { rule: typeof EXAMPLE_RULES[0] }) {
  const { t } = useTranslation()

  return (
    <div className={cn(
      'surface-card p-4 transition-all duration-200',
      rule.active ? 'border-primary/20' : 'opacity-70',
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
          rule.active ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground',
        )}>
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{rule.location}</p>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0',
              rule.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {rule.active ? t.monitoring.active : t.monitoring.paused}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t.monitoring.frequencies[rule.frequency]}</span>
          </div>
          <FilterPills filters={rule.filters} />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {t.monitoring.description}
          </p>
        </div>
        <Link
          href="/chat"
          className={cn(
            'button-smooth inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 dark:shadow-none',
          )}
        >
          <Plus className="h-4 w-4" />
          {t.monitoring.newRule}
        </Link>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 shadow-sm dark:shadow-none">
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
        <div>
          <p className="mb-1 text-sm font-semibold text-violet-500">{t.monitoring.howItWorks}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.monitoring.howItWorksText}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.monitoring.quickActions}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {t.monitoring.quickPrompts.map(prompt => (
            <Link
              key={prompt}
              href={`/chat?prompt=${encodeURIComponent(prompt)}`}
              className={cn(
                'group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 dark:shadow-none',
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              <span className="text-sm text-foreground/85 transition-colors group-hover:text-foreground">{prompt}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.monitoring.exampleRules}</p>
          <span className="text-xs text-muted-foreground/60 italic">{t.monitoring.exampleRulesNote}</span>
        </div>
        <div className="flex flex-col gap-3">
          {EXAMPLE_RULES.map(rule => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center shadow-sm dark:shadow-none">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MapPin className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-foreground">
          {t.monitoring.firstMonitoringTitle}
        </h3>
        <p className="mx-auto mb-4 max-w-sm text-sm text-muted-foreground">
          {t.monitoring.firstMonitoringText}
        </p>
        <Link
          href={`/chat?prompt=${encodeURIComponent(t.monitoring.firstMonitoringPrompt)}`}
          className="button-smooth inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 dark:shadow-none"
        >
          <Bell className="h-4 w-4" />
          {t.monitoring.startChat}
        </Link>
      </div>
    </div>
  )
}
