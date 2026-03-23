'use client'

import { Building2, TrendingUp, Handshake, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn, formatCZK } from '@/lib/utils'
import type { DashboardStatsResult } from '@/lib/database'

interface KPICardsProps {
  stats: DashboardStatsResult
}

interface CardDef {
  label: string
  value: string
  sub?: string
  change?: number
  icon: React.ElementType
  iconColor: string
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="surface-card animate-pulse p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-9 w-9 rounded-full bg-muted" />
          </div>
          <div className="h-8 w-24 rounded bg-muted" />
          <div className="mt-2 h-3 w-20 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function Card({ label, value, sub, change, icon: Icon, iconColor }: CardDef) {
  const isPositive = (change ?? 0) >= 0
  return (
    <div className="surface-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {change !== undefined && (
        <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', isPositive ? 'text-green-500' : 'text-red-500')}>
          {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {isPositive ? '+' : ''}{change} % vs. minulý měsíc
        </div>
      )}
    </div>
  )
}

export default function KPICards({ stats }: KPICardsProps) {
  const cards: CardDef[] = [
    {
      label: 'Aktivní nemovitosti',
      value: String(stats.active_properties),
      sub: `z celkem ${stats.total_properties}`,
      icon: Building2,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      label: 'Nové leady',
      value: String(stats.total_leads_this_month),
      change: stats.monthly_changes.leads,
      icon: TrendingUp,
      iconColor: stats.monthly_changes.leads >= 0
        ? 'bg-green-500/10 text-green-500'
        : 'bg-red-500/10 text-red-500',
    },
    {
      label: 'Uzavřené obchody',
      value: String(stats.deals_this_month),
      change: stats.monthly_changes.deals,
      icon: Handshake,
      iconColor: stats.monthly_changes.deals >= 0
        ? 'bg-primary/10 text-primary'
        : 'bg-red-500/10 text-red-500',
    },
    {
      label: 'Tržby tento měsíc',
      value: formatCZK(stats.revenue_this_month),
      change: stats.monthly_changes.revenue,
      icon: DollarSign,
      iconColor: stats.monthly_changes.revenue >= 0
        ? 'bg-primary/10 text-primary'
        : 'bg-red-500/10 text-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => <Card key={c.label} {...c} />)}
    </div>
  )
}

KPICards.Skeleton = KPISkeleton
