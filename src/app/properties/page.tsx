'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Home, SlidersHorizontal, AlertTriangle, Pencil, Eye } from 'lucide-react'
import FormModal from '@/components/ui/FormModal'
import { ErrorState } from '@/components/ui/async-state'
import PropertyDetail from '@/components/properties/PropertyDetail'
import { cn, fetchJson, formatCZK, getErrorMessage, isNetworkError } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'
import type { Client, Property, PropertyStatus, PropertyType, RenovationStatus } from '@/types'

const STATUS_COLORS: Record<PropertyStatus, string> = {
  available: 'bg-primary/10 text-primary',
  reserved: 'bg-amber-500/15 text-amber-500',
  sold: 'bg-muted text-muted-foreground',
  rented: 'bg-violet-500/15 text-violet-500',
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
  const { t } = useTranslation()

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_COLORS[status])}>
      {t.properties.statusLabels[status]}
    </span>
  )
}

function TypeBadge({ type }: { type: PropertyType }) {
  const { t } = useTranslation()

  return (
    <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {t.properties.typeLabels[type]}
    </span>
  )
}

function isRental(property: Property): boolean {
  return property.status === 'rented' || property.price < 200_000
}

function PropertyCard({
  property,
  onOpenDetail,
  onEdit,
}: {
  property: Property
  onOpenDetail: (property: Property) => void
  onEdit: (property: Property) => void
}) {
  const { t, language } = useTranslation()
  const missingData = property.type !== 'land' && (property.renovation_status === null || property.construction_notes === null)
  const rental = isRental(property)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(property)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenDetail(property)
        }
      }}
      className="surface-card group relative flex cursor-pointer flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20"
    >
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onOpenDetail(property)
          }}
          className="button-smooth inline-flex items-center gap-1 rounded-xl border border-border bg-background/95 px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-100 shadow-sm hover:border-primary/20 hover:text-primary dark:shadow-none md:opacity-0 md:group-hover:opacity-100"
        >
          <Eye className="h-3.5 w-3.5" />
          {t.properties.detail}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(property)
          }}
          className="button-smooth inline-flex items-center gap-1 rounded-xl border border-border bg-background/95 px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-100 shadow-sm hover:border-primary/20 hover:text-primary dark:shadow-none md:opacity-0 md:group-hover:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t.properties.edit}
        </button>
      </div>

      <div className="mb-3 flex items-start justify-between gap-2 pr-36">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{property.name}</h3>
        {missingData ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-label={t.properties.missingDataShort} />
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
            {t.properties.rental}
          </span>
        ) : null}
      </div>

      <div className="mt-auto space-y-1">
        <p className="text-base font-semibold text-foreground">
          {formatCZK(property.price, language)}
          {rental ? <span className="text-xs font-normal text-muted-foreground"> {t.properties.perMonth}</span> : null}
        </p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{property.area_sqm} m²</span>
          {property.rooms !== null ? <span>{property.rooms} {t.properties.rooms}</span> : null}
          {property.floor !== null && property.total_floors !== null ? (
            <span>{property.floor}/{property.total_floors}. {t.properties.floor}</span>
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
  const { t } = useTranslation()
  const [properties, setProperties] = useState<Property[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PropertyStatus | ''>('')
  const [type, setType] = useState<PropertyType | ''>('')
  const [city, setCity] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
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
      setLoadError(null)
      const data = await fetchJson<{ properties: Property[]; total: number }>(`/api/properties?${params.toString()}`)
      setProperties(data.properties ?? [])
      setTotal(data.total ?? 0)
    } catch (error) {
      setLoadError(isNetworkError(error) ? t.common.connectionError : (getErrorMessage(error) || t.common.unknownError))
    } finally {
      setLoading(false)
    }
  }, [city, search, status, t.common.connectionError, t.common.unknownError, type])

  useEffect(() => {
    const initialSearch = new URLSearchParams(window.location.search).get('search')
    if (initialSearch) {
      setSearch(initialSearch)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(fetchProperties, search ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [fetchProperties, search])

  useEffect(() => {
    fetchJson<{ clients: Client[] }>('/api/clients')
      .then((data) => setClients(data.clients ?? []))
      .catch((error) => {
        console.error('Client lookup failed:', error)
        setClients([])
      })
  }, [])

  useEffect(() => {
    if (!selectedProperty) return

    const nextProperty = properties.find((property) => property.id === selectedProperty.id)
    if (!nextProperty) {
      setSelectedProperty(null)
      return
    }

    if (nextProperty !== selectedProperty) {
      setSelectedProperty(nextProperty)
    }
  }, [properties, selectedProperty])

  const missingDataCount = properties.filter(
    (property) => property.type !== 'land' && (property.renovation_status === null || property.construction_notes === null)
  ).length
  const owner = selectedProperty ? clients.find((client) => client.id === selectedProperty.owner_id) ?? null : null

  function openDetail(property: Property) {
    setSelectedProperty(property)
  }

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
      setFormError(t.properties.invalidPrice)
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
      setFormError(error instanceof Error ? error.message : t.common.unknownError)
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
          <span className="text-xs text-muted-foreground">{t.properties.total}</span>
        </div>
        {missingDataCount > 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 shadow-sm dark:shadow-none">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">{missingDataCount}</span>
            <span className="text-xs text-amber-500/70">{t.properties.missingData}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.properties.search}
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
            <option value="">{t.properties.allStatuses}</option>
            <option value="available">{t.properties.statusLabels.available}</option>
            <option value="reserved">{t.properties.statusLabels.reserved}</option>
            <option value="sold">{t.properties.statusLabels.sold}</option>
            <option value="rented">{t.properties.statusLabels.rented}</option>
          </select>
        </div>

        <select
          value={type}
          onChange={(event) => setType(event.target.value as PropertyType | '')}
          className="control-focus rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none"
        >
          <option value="">{t.properties.allTypes}</option>
          <option value="apartment">{t.properties.typeLabels.apartment}</option>
          <option value="house">{t.properties.typeLabels.house}</option>
          <option value="land">{t.properties.typeLabels.land}</option>
          <option value="commercial">{t.properties.typeLabels.commercial}</option>
          <option value="office">{t.properties.typeLabels.office}</option>
        </select>

        <select
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="control-focus rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none"
        >
          <option value="">{t.properties.allCities}</option>
          <option value="Praha">Praha</option>
          <option value="Brno">Brno</option>
          <option value="Plzeň">Plzeň</option>
          <option value="Ostrava">Ostrava</option>
        </select>
      </div>

      {loadError ? (
        <ErrorState
          title={t.common.loadError}
          message={loadError}
          retryLabel={t.common.retry}
          onRetry={() => void fetchProperties()}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 12 }).map((_, index) => <PropertyCardSkeleton key={index} />)
        ) : properties.length > 0 ? (
          properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onOpenDetail={openDetail}
              onEdit={openEditModal}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <Home className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">{t.properties.noResults}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">{t.properties.noResultsHint}</p>
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
        title={editingProperty ? `${t.properties.edit}: ${editingProperty.name}` : t.properties.editTitle}
        submitLabel={t.properties.saveEdit}
        submitLoadingLabel={t.properties.savingEdit}
        isSubmitting={isSubmitting}
        error={formError}
        onSubmit={handleSubmit}
      >
        {formValues ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t.properties.price}</span>
              <input
                type="number"
                value={formValues.price}
                onChange={(event) => setFormValues((current) => current ? { ...current, price: event.target.value } : current)}
                className={FIELD_CLASSNAME}
                placeholder={t.properties.pricePlaceholder}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t.properties.status}</span>
              <select
                value={formValues.status}
                onChange={(event) => setFormValues((current) => current ? { ...current, status: event.target.value as PropertyStatus } : current)}
                className={FIELD_CLASSNAME}
              >
                {Object.entries(t.properties.statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t.properties.renovationStatus}</span>
              <select
                value={formValues.renovation_status}
                onChange={(event) => setFormValues((current) => current ? { ...current, renovation_status: event.target.value as RenovationStatus | '' } : current)}
                className={FIELD_CLASSNAME}
              >
                <option value="">{t.properties.unspecified}</option>
                {Object.entries(t.properties.renovationLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t.properties.renovationYear}</span>
              <input
                type="number"
                value={formValues.renovation_year}
                onChange={(event) => setFormValues((current) => current ? { ...current, renovation_year: event.target.value } : current)}
                className={FIELD_CLASSNAME}
                placeholder={t.properties.renovationYearPlaceholder}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">{t.properties.constructionNotes}</span>
              <textarea
                value={formValues.construction_notes}
                onChange={(event) => setFormValues((current) => current ? { ...current, construction_notes: event.target.value } : current)}
                className={cn(FIELD_CLASSNAME, 'min-h-[110px] resize-y')}
                placeholder={t.properties.constructionNotesPlaceholder}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">{t.properties.description}</span>
              <textarea
                value={formValues.description}
                onChange={(event) => setFormValues((current) => current ? { ...current, description: event.target.value } : current)}
                className={cn(FIELD_CLASSNAME, 'min-h-[140px] resize-y')}
                placeholder={t.properties.descriptionPlaceholder}
              />
            </label>
          </div>
        ) : null}
      </FormModal>

      <PropertyDetail
        open={!!selectedProperty}
        property={selectedProperty}
        owner={owner}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProperty(null)
          }
        }}
        onEdit={(property) => {
          setSelectedProperty(null)
          openEditModal(property)
        }}
      />
    </div>
  )
}
