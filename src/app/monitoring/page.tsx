'use client'

import Link from 'next/link'
import { Bell, Plus, MapPin, Clock, Zap, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MonitoringRule, MonitoringFrequency } from '@/types'

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

const FREQ_LABELS: Record<MonitoringFrequency, string> = {
  daily: 'Denně',
  weekly: 'Týdně',
}

const QUICK_PROMPTS = [
  'Monitoring nabídek v Holešovicích',
  'Sleduj byty 2+1 v Praze do 6 mil',
  'Upozorni na nové domy v Brně',
  'Monitoring komerčních prostor Praha 2',
]

function FilterPills({ filters }: { filters: MonitoringRule['filters'] }) {
  const pills: string[] = []
  if (filters.property_types?.length) {
    const typeMap: Record<string, string> = {
      apartment: 'Byty', house: 'Domy', land: 'Pozemky', commercial: 'Komerční', office: 'Kanceláře',
    }
    pills.push(filters.property_types.map(t => typeMap[t] ?? t).join(', '))
  }
  if (filters.price_min !== undefined) pills.push(`od ${(filters.price_min / 1_000_000).toFixed(0)} mil. CZK`)
  if (filters.price_max !== undefined) pills.push(`do ${(filters.price_max / 1_000_000).toFixed(0)} mil. CZK`)
  if (filters.rooms_min !== undefined) pills.push(`min. ${filters.rooms_min} pokoje`)
  if (filters.rooms_max !== undefined) pills.push(`max. ${filters.rooms_max} pokoje`)

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pills.map(p => (
        <span key={p} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">{p}</span>
      ))}
    </div>
  )
}

function RuleCard({ rule }: { rule: typeof EXAMPLE_RULES[0] }) {
  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 transition-all duration-150',
      rule.active ? 'border-emerald-500/30' : 'border-border opacity-60',
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          rule.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted/40 text-muted-foreground',
        )}>
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{rule.location}</p>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0',
              rule.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400',
            )}>
              {rule.active ? 'Aktivní' : 'Pozastaveno'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{FREQ_LABELS[rule.frequency]}</span>
          </div>
          <FilterPills filters={rule.filters} />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 max-w-4xl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Sledujte trh v reálném čase. Pravidla monitoringu nastavíte přes chat s agentem.
          </p>
        </div>
        <Link
          href="/chat"
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium',
            'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
            'hover:bg-emerald-600 transition-colors',
          )}
        >
          <Plus className="h-4 w-4" />
          Nové pravidlo
        </Link>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Zap className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-400 mb-1">Jak to funguje</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Popište agentovi, co chcete sledovat — lokalitu, typ nemovitosti, cenové rozmezí, počet pokojů.
            Agent nastaví monitoring a bude vás informovat o nových nabídkách odpovídajících vašim kritériím.
          </p>
        </div>
      </div>

      {/* Quick prompts */}
      <div>
        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rychlé akce</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_PROMPTS.map(prompt => (
            <Link
              key={prompt}
              href={`/chat?prompt=${encodeURIComponent(prompt)}`}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3',
                'hover:border-emerald-500/40 hover:bg-card/80 transition-all duration-150 group',
              )}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-emerald-400 transition-colors shrink-0" />
              <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{prompt}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Example rules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Příklad pravidel</p>
          <span className="text-xs text-muted-foreground/60 italic">Tato pravidla jsou jen ukázková</span>
        </div>
        <div className="flex flex-col gap-3">
          {EXAMPLE_RULES.map(rule => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </div>

      {/* CTA block */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto mb-4">
          <MapPin className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">
          Nastavte svůj první monitoring
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Řekněte agentovi, jaký trh chcete sledovat, a my se postaráme o zbytek.
        </p>
        <Link
          href="/chat?prompt=Nastav%20monitoring%20nov%C3%BDch%20nab%C3%ADdek%20v%20Praze"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
        >
          <Bell className="h-4 w-4" />
          Spustit chat
        </Link>
      </div>
    </div>
  )
}
