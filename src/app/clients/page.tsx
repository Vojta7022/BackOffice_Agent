'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Users, SlidersHorizontal } from 'lucide-react'
import { cn, relativeTime } from '@/lib/utils'
import type { Client, ClientStatus, ClientType, ClientSource } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ClientType, string> = {
  buyer: 'Kupující',
  seller: 'Prodávající',
  investor: 'Investor',
  tenant: 'Nájemník',
}

const SOURCE_LABELS: Record<ClientSource, string> = {
  website: 'Web',
  referral: 'Doporučení',
  sreality: 'Sreality',
  bezrealitky: 'Bezrealitky',
  instagram: 'Instagram',
  facebook: 'Facebook',
  cold_call: 'Cold call',
  walk_in: 'Walk-in',
  other: 'Jiné',
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  inactive: 'bg-amber-500/15 text-amber-400',
  closed: 'bg-slate-500/15 text-slate-400',
}

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Aktivní',
  inactive: 'Neaktivní',
  closed: 'Uzavřený',
}

const TYPE_COLORS: Record<ClientType, string> = {
  buyer: 'bg-blue-500/15 text-blue-400',
  seller: 'bg-purple-500/15 text-purple-400',
  investor: 'bg-emerald-500/15 text-emerald-400',
  tenant: 'bg-orange-500/15 text-orange-400',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ClientRow({ client: c }: { client: Client }) {
  return (
    <tr className="group border-b border-border/50 transition-colors hover:bg-white/[0.02]">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-600/20 text-[11px] font-semibold text-emerald-400">
            {initials(c.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', TYPE_COLORS[c.type])}>
          {TYPE_LABELS[c.type]}
        </span>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {SOURCE_LABELS[c.source]}
        </span>
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <span className="text-xs text-muted-foreground">{c.phone}</span>
      </td>
      <td className="py-3 px-4">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_COLORS[c.status])}>
          {STATUS_LABELS[c.status]}
        </span>
      </td>
      <td className="py-3 px-4 hidden xl:table-cell text-right">
        <span className="text-xs text-muted-foreground">{relativeTime(c.created_at)}</span>
      </td>
    </tr>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <tr key={i} className="border-b border-border/50 animate-pulse">
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted/40 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-muted rounded w-28" />
                <div className="h-3 bg-muted/60 rounded w-36" />
              </div>
            </div>
          </td>
          <td className="py-3 px-4 hidden sm:table-cell"><div className="h-5 bg-muted/40 rounded-full w-16" /></td>
          <td className="py-3 px-4 hidden md:table-cell"><div className="h-5 bg-muted/40 rounded-full w-20" /></td>
          <td className="py-3 px-4 hidden lg:table-cell"><div className="h-3 bg-muted/40 rounded w-28" /></td>
          <td className="py-3 px-4"><div className="h-5 bg-muted/40 rounded-full w-16" /></td>
          <td className="py-3 px-4 hidden xl:table-cell"><div className="h-3 bg-muted/40 rounded w-16 ml-auto" /></td>
        </tr>
      ))}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ClientStatus | ''>('')
  const [type, setType] = useState<ClientType | ''>('')

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (type) params.set('type', type)

    try {
      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data.clients ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [search, status, type])

  useEffect(() => {
    const t = setTimeout(fetchClients, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchClients, search])

  const activeCount = clients.filter(c => c.status === 'active').length

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
          <Users className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">klientů celkem</span>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5">
            <span className="text-sm font-semibold text-emerald-400">{activeCount}</span>
            <span className="text-xs text-emerald-400/70">aktivních</span>
          </div>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hledat klienty…"
            className={cn(
              'w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm',
              'text-foreground placeholder:text-muted-foreground/50',
              'outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors',
            )}
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={status}
            onChange={e => setStatus(e.target.value as ClientStatus | '')}
            className="bg-transparent text-sm text-foreground outline-none"
          >
            <option value="">Všechny stavy</option>
            <option value="active">Aktivní</option>
            <option value="inactive">Neaktivní</option>
            <option value="closed">Uzavřený</option>
          </select>
        </div>

        <select
          value={type}
          onChange={e => setType(e.target.value as ClientType | '')}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="">Všechny typy</option>
          <option value="buyer">Kupující</option>
          <option value="seller">Prodávající</option>
          <option value="investor">Investor</option>
          <option value="tenant">Nájemník</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Klient</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Typ</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Zdroj</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Telefon</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stav</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">Přidán</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : clients.length > 0 ? (
                clients.map(c => <ClientRow key={c.id} client={c} />)
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Žádní klienti nenalezeni</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Zkuste upravit filtry</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
