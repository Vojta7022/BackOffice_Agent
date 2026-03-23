'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Home, SlidersHorizontal, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCZK } from '@/lib/utils'
import type { Property, PropertyStatus, PropertyType } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Byt',
  house: 'Dům',
  land: 'Pozemek',
  commercial: 'Komerční',
  office: 'Kancelář',
}

const STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'Volná',
  reserved: 'Rezervovaná',
  sold: 'Prodaná',
  rented: 'Pronajatá',
}

const STATUS_COLORS: Record<PropertyStatus, string> = {
  available: 'bg-primary/10 text-primary',
  reserved: 'bg-amber-500/15 text-amber-500',
  sold: 'bg-muted text-muted-foreground',
  rented: 'bg-violet-500/15 text-violet-500',
}

function StatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function TypeBadge({ type }: { type: PropertyType }) {
  return (
    <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {TYPE_LABELS[type]}
    </span>
  )
}

function isRental(p: Property): boolean {
  return p.status === 'rented' || p.price < 200_000
}

function PropertyCard({ property: p }: { property: Property }) {
  const missingData = p.type !== 'land' && (p.renovation_status === null || p.construction_notes === null)
  const rental = isRental(p)

  return (
    <div className="surface-card group flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{p.name}</h3>
        {missingData && (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-label="Chybějící data" />
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
        {p.address.street}, {p.address.district}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <TypeBadge type={p.type} />
        <StatusBadge status={p.status} />
        {rental && (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-500">
            Pronájem
          </span>
        )}
      </div>

      <div className="mt-auto space-y-1">
        <p className="text-base font-semibold text-foreground">
          {formatCZK(p.price)}{rental ? <span className="text-xs font-normal text-muted-foreground"> / měsíc</span> : null}
        </p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{p.area_sqm} m²</span>
          {p.rooms !== null && <span>{p.rooms} pokoje</span>}
          {p.floor !== null && p.total_floors !== null && (
            <span>{p.floor}/{p.total_floors}. patro</span>
          )}
        </div>
      </div>
    </div>
  )
}

function PropertyCardSkeleton() {
  return (
    <div className="surface-card flex flex-col animate-pulse p-4">
      <div className="h-4 bg-muted rounded w-3/4 mb-3" />
      <div className="h-3 bg-muted/60 rounded w-1/2 mb-3" />
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 bg-muted/40 rounded-full w-16" />
        <div className="h-5 bg-muted/40 rounded-full w-20" />
      </div>
      <div className="h-5 bg-muted rounded w-24 mb-1" />
      <div className="h-3 bg-muted/60 rounded w-32" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PropertyStatus | ''>('')
  const [type, setType] = useState<PropertyType | ''>('')
  const [city, setCity] = useState('')

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    if (city) params.set('city', city)

    try {
      const res = await fetch(`/api/properties?${params}`)
      const data = await res.json()
      setProperties(data.properties ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [search, status, type, city])

  useEffect(() => {
    const t = setTimeout(fetchProperties, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchProperties, search])

  const missingDataCount = properties.filter(
    p => p.type !== 'land' && (p.renovation_status === null || p.construction_notes === null)
  ).length

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="surface-card flex items-center gap-2 px-4 py-2.5">
          <Home className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">nemovitostí</span>
        </div>
        {missingDataCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 shadow-sm dark:shadow-none">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">{missingDataCount}</span>
            <span className="text-xs text-amber-500/70">s chybějícími daty</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hledat nemovitosti…"
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
            onChange={e => setStatus(e.target.value as PropertyStatus | '')}
            className="bg-transparent text-sm text-foreground outline-none"
          >
            <option value="">Všechny stavy</option>
            <option value="available">Volná</option>
            <option value="reserved">Rezervovaná</option>
            <option value="sold">Prodaná</option>
            <option value="rented">Pronajatá</option>
          </select>
        </div>

        <select
          value={type}
          onChange={e => setType(e.target.value as PropertyType | '')}
          className="control-focus rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none"
        >
          <option value="">Všechny typy</option>
          <option value="apartment">Byt</option>
          <option value="house">Dům</option>
          <option value="land">Pozemek</option>
          <option value="commercial">Komerční</option>
          <option value="office">Kancelář</option>
        </select>

        <select
          value={city}
          onChange={e => setCity(e.target.value)}
          className="control-focus rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none"
        >
          <option value="">Všechna města</option>
          <option value="Praha">Praha</option>
          <option value="Brno">Brno</option>
          <option value="Plzeň">Plzeň</option>
          <option value="Ostrava">Ostrava</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <PropertyCardSkeleton key={i} />)
          : properties.length > 0
            ? properties.map(p => <PropertyCard key={p.id} property={p} />)
            : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <Home className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Žádné nemovitosti nenalezeny</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Zkuste upravit filtry nebo vyhledávací dotaz</p>
              </div>
            )
        }
      </div>
    </div>
  )
}
