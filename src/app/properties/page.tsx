'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Home, SlidersHorizontal, AlertTriangle, Pencil } from 'lucide-react'
import FormModal from '@/components/ui/FormModal'
import { cn, fetchJson, formatCZK } from '@/lib/utils'
import type { Property, PropertyStatus, PropertyType, RenovationStatus } from '@/types'

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

const RENOVATION_LABELS: Record<RenovationStatus, string> = {
  original: 'Původní stav',
  partial: 'Částečná rekonstrukce',
  full: 'Kompletní rekonstrukce',
}

const FIELD_CLASSNAME = 'control-focus w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none'

interface PropertyFormValues {
  price: string
  status: PropertyStatus
  renovation_status: RenovationStatus | ''
  renovation_year: string
  construction_notes: string
  description: string
}

function createPropertyFormValues(property: Property): PropertyFormValues {
  return {
    price: String(property.price),
    status: property.status,
    renovation_status: property.renovation_status ?? '',
    renovation_year: property.renovation_year ? String(property.renovation_year) : '',
    construction_notes: property.construction_notes ?? '',
    description: property.description,
  }
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

function isRental(property: Property): boolean {
  return property.status === 'rented' || property.price < 200_000
}

function PropertyCard({
  property,
  onEdit,
}: {
  property: Property
  onEdit: (property: Property) => void
}) {
  const missingData = property.type !== 'land' && (property.renovation_status === null || property.construction_notes === null)
  const rental = isRental(property)

  return (
    <div className="surface-card group relative flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      <button
        type="button"
        onClick={() => onEdit(property)}
        className="button-smooth absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl border border-border bg-background/95 px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-100 shadow-sm hover:border-primary/20 hover:text-primary dark:shadow-none md:opacity-0 md:group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
        Upravit
      </button>

      <div className="mb-3 flex items-start justify-between gap-2 pr-20">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{property.name}</h3>
        {missingData ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-label="Chybějící data" />
        ) : null}
      </div>

      <p className="mb-3 line-clamp-1 text-xs text-muted-foreground">
        {property.address.street}, {property.address.district}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <TypeBadge type={property.type} />
        <StatusBadge status={property.status} />
        {rental ? (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-500">
            Pronájem
          </span>
        ) : null}
      </div>

      <div className="mt-auto space-y-1">
        <p className="text-base font-semibold text-foreground">
          {formatCZK(property.price)}
          {rental ? <span className="text-xs font-normal text-muted-foreground"> / měsíc</span> : null}
        </p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{property.area_sqm} m²</span>
          {property.rooms !== null ? <span>{property.rooms} pokoje</span> : null}
          {property.floor !== null && property.total_floors !== null ? (
            <span>{property.floor}/{property.total_floors}. patro</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PropertyCardSkeleton() {
  return (
    <div className="surface-card flex flex-col animate-pulse p-4">
      <div className="mb-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mb-3 h-3 w-1/2 rounded bg-muted/60" />
      <div className="mb-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-muted/40" />
        <div className="h-5 w-20 rounded-full bg-muted/40" />
      </div>
      <div className="mb-1 h-5 w-24 rounded bg-muted" />
      <div className="h-3 w-32 rounded bg-muted/60" />
    </div>
  )
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PropertyStatus | ''>('')
  const [type, setType] = useState<PropertyType | ''>('')
  const [city, setCity] = useState('')
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formValues, setFormValues] = useState<PropertyFormValues | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    if (city) params.set('city', city)

    try {
      const data = await fetchJson<{ properties: Property[]; total: number }>(`/api/properties?${params.toString()}`)
      setProperties(data.properties ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [search, status, type, city])

  useEffect(() => {
    const timeout = setTimeout(fetchProperties, search ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [fetchProperties, search])

  const missingDataCount = properties.filter(
    (property) => property.type !== 'land' && (property.renovation_status === null || property.construction_notes === null)
  ).length

  function openEditModal(property: Property) {
    setEditingProperty(property)
    setFormValues(createPropertyFormValues(property))
    setFormError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingProperty || !formValues) return

    const price = Number(formValues.price)
    if (!Number.isFinite(price) || price < 0) {
      setFormError('Cena musí být kladné číslo.')
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    try {
      await fetchJson<{ property: Property }>('/api/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProperty.id,
          price,
          status: formValues.status,
          renovation_status: formValues.renovation_status || null,
          renovation_year: formValues.renovation_year ? Number(formValues.renovation_year) : null,
          construction_notes: formValues.construction_notes.trim() ? formValues.construction_notes.trim() : null,
          description: formValues.description,
        }),
      })

      setEditingProperty(null)
      setFormValues(null)
      await fetchProperties()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nepodařilo se uložit nemovitost.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="surface-card flex items-center gap-2 px-4 py-2.5">
          <Home className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">nemovitostí</span>
        </div>
        {missingDataCount > 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 shadow-sm dark:shadow-none">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">{missingDataCount}</span>
            <span className="text-xs text-amber-500/70">s chybějícími daty</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Hledat nemovitosti…"
            className={cn(
              'control-focus w-full rounded-2xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm shadow-sm dark:shadow-none',
              'text-foreground placeholder:text-muted-foreground/50',
            )}
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm dark:shadow-none">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as PropertyStatus | '')}
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
          onChange={(event) => setType(event.target.value as PropertyType | '')}
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
          onChange={(event) => setCity(event.target.value)}
          className="control-focus rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none"
        >
          <option value="">Všechna města</option>
          <option value="Praha">Praha</option>
          <option value="Brno">Brno</option>
          <option value="Plzeň">Plzeň</option>
          <option value="Ostrava">Ostrava</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 12 }).map((_, index) => <PropertyCardSkeleton key={index} />)
        ) : properties.length > 0 ? (
          properties.map((property) => (
            <PropertyCard key={property.id} property={property} onEdit={openEditModal} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <Home className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Žádné nemovitosti nenalezeny</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Zkuste upravit filtry nebo vyhledávací dotaz</p>
          </div>
        )}
      </div>

      <FormModal
        open={!!editingProperty && !!formValues}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProperty(null)
            setFormValues(null)
            setFormError(null)
          }
        }}
        title={editingProperty ? `Upravit: ${editingProperty.name}` : 'Upravit nemovitost'}
        submitLabel="Uložit změny"
        submitLoadingLabel="Ukládám změny…"
        isSubmitting={isSubmitting}
        error={formError}
        onSubmit={handleSubmit}
      >
        {formValues ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Cena</span>
              <input
                type="number"
                value={formValues.price}
                onChange={(event) => setFormValues((current) => current ? { ...current, price: event.target.value } : current)}
                className={FIELD_CLASSNAME}
                placeholder="8500000"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Stav</span>
              <select
                value={formValues.status}
                onChange={(event) => setFormValues((current) => current ? { ...current, status: event.target.value as PropertyStatus } : current)}
                className={FIELD_CLASSNAME}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Stav rekonstrukce</span>
              <select
                value={formValues.renovation_status}
                onChange={(event) => setFormValues((current) => current ? { ...current, renovation_status: event.target.value as RenovationStatus | '' } : current)}
                className={FIELD_CLASSNAME}
              >
                <option value="">Neuvedeno</option>
                {Object.entries(RENOVATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Rok rekonstrukce</span>
              <input
                type="number"
                value={formValues.renovation_year}
                onChange={(event) => setFormValues((current) => current ? { ...current, renovation_year: event.target.value } : current)}
                className={FIELD_CLASSNAME}
                placeholder="Např. 2022"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Stavební poznámky</span>
              <textarea
                value={formValues.construction_notes}
                onChange={(event) => setFormValues((current) => current ? { ...current, construction_notes: event.target.value } : current)}
                className={cn(FIELD_CLASSNAME, 'min-h-[110px] resize-y')}
                placeholder="Např. cihlová stavba, nové rozvody, původní podlahy…"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Popis</span>
              <textarea
                value={formValues.description}
                onChange={(event) => setFormValues((current) => current ? { ...current, description: event.target.value } : current)}
                className={cn(FIELD_CLASSNAME, 'min-h-[140px] resize-y')}
                placeholder="Doplňte popis nemovitosti…"
              />
            </label>
          </div>
        ) : null}
      </FormModal>
    </div>
  )
}
