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
  active: 'bg-primary/10 text-primary',
  inactive: 'bg-amber-500/15 text-amber-500',
  closed: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Aktivní',
  inactive: 'Neaktivní',
  closed: 'Uzavřený',
}

const TYPE_COLORS: Record<ClientType, string> = {
  buyer: 'bg-primary/10 text-primary',
  seller: 'bg-violet-500/15 text-violet-500',
  investor: 'bg-primary/10 text-primary',
  tenant: 'bg-amber-500/15 text-amber-500',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ClientRow({ client: c }: { client: Client }) {
  return (
    <tr className="group border-b border-border/60 transition-colors even:bg-muted/15 hover:bg-muted/30">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/15 to-violet-500/20 text-[11px] font-semibold text-primary">
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
        <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
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
      <div className="flex flex-wrap items-center gap-4">
        <div className="surface-card flex items-center gap-2 px-4 py-2.5">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">klientů celkem</span>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 shadow-sm dark:shadow-none">
            <span className="text-sm font-semibold text-primary">{activeCount}</span>
            <span className="text-xs text-primary/70">aktivních</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hledat klienty…"
            className={cn(
              'control-focus w-full rounded-2xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm shadow-sm dark:shadow-none',
              'text-foreground placeholder:text-muted-foreground/50',
            )}
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm dark:shadow-none">
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
          className="control-focus rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none"
        >
          <option value="">Všechny typy</option>
          <option value="buyer">Kupující</option>
          <option value="seller">Prodávající</option>
          <option value="investor">Investor</option>
          <option value="tenant">Nájemník</option>
        </select>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
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
                    <p className="mt-1 text-xs text-muted-foreground/60">Zkuste upravit filtry</p>
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
