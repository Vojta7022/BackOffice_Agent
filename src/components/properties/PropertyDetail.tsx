'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BedDouble, Building2, ChartColumn, Hammer, Mail, MapPinned, Pencil, Ruler, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn, formatCZK } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'
import type { Client, Property, PropertyStatus, PropertyType } from '@/types'

type OwnerSummary = Pick<Client, 'id' | 'name' | 'email' | 'phone'> | null

interface PropertyDetailProps {
  open: boolean
  property: Property | null
  owner: OwnerSummary
  onOpenChange: (open: boolean) => void
  onEdit: (property: Property) => void
}

interface Coordinates {
  lat: number
  lon: number
}

const STATUS_COLORS: Record<PropertyStatus, string> = {
  available: 'bg-primary/10 text-primary',
  reserved: 'bg-amber-500/15 text-amber-500',
  sold: 'bg-muted text-muted-foreground',
  rented: 'bg-violet-500/15 text-violet-500',
}

const TYPE_COLORS: Record<PropertyType, string> = {
  apartment: 'bg-primary/10 text-primary',
  house: 'bg-violet-500/15 text-violet-500',
  land: 'bg-amber-500/15 text-amber-500',
  commercial: 'bg-primary/10 text-primary',
  office: 'bg-muted/70 text-muted-foreground',
}

const LOCATION_COORDINATES: Record<string, Coordinates> = {
  holesovice: { lat: 50.1050, lon: 14.4378 },
  karlin: { lat: 50.0924, lon: 14.4508 },
  vinohrady: { lat: 50.0755, lon: 14.4378 },
  smichov: { lat: 50.0700, lon: 14.4030 },
  zizkov: { lat: 50.0833, lon: 14.4500 },
  praha: { lat: 50.0755, lon: 14.4378 },
  brno: { lat: 49.1951, lon: 16.6068 },
  'brno-stred': { lat: 49.1951, lon: 16.6068 },
  'brno-jih': { lat: 49.1790, lon: 16.6186 },
  'kralovo pole': { lat: 49.2247, lon: 16.5988 },
  zabrdovice: { lat: 49.2012, lon: 16.6276 },
  bystrc: { lat: 49.2276, lon: 16.5243 },
  lesna: { lat: 49.2297, lon: 16.6267 },
  zidenice: { lat: 49.2018, lon: 16.6505 },
  plzen: { lat: 49.7384, lon: 13.3736 },
  'plzen 1': { lat: 49.7507, lon: 13.3668 },
  olomouc: { lat: 49.5938, lon: 17.2509 },
  'olomouc-mesto': { lat: 49.5938, lon: 17.2509 },
  turnov: { lat: 50.5836, lon: 15.1519 },
  semily: { lat: 50.6020, lon: 15.3355 },
  liberec: { lat: 50.7671, lon: 15.0562 },
  'liberec i': { lat: 50.7705, lon: 15.0584 },
  'ceske budejovice': { lat: 48.9747, lon: 14.4747 },
  'ceske budejovice 1': { lat: 48.9747, lon: 14.4747 },
  rajhrad: { lat: 49.0902, lon: 16.6030 },
  'brno-venkov': { lat: 49.1259, lon: 16.5220 },
  'zelezna ruda': { lat: 49.1374, lon: 13.2352 },
  klatovy: { lat: 49.3956, lon: 13.2950 },
  beroun: { lat: 49.9638, lon: 14.0720 },
}

function normalizeLocation(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getCoordinates(property: Property): Coordinates {
  const districtKey = normalizeLocation(property.address.district)
  const cityKey = normalizeLocation(property.address.city)

  return LOCATION_COORDINATES[districtKey] ?? LOCATION_COORDINATES[cityKey] ?? LOCATION_COORDINATES.praha
}

function getMapUrl(property: Property) {
  const { lat, lon } = getCoordinates(property)
  const bbox = `${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`
}

function isRental(property: Property) {
  return property.status === 'rented' || property.price < 200_000
}

function formatPrompt(template: string, name: string) {
  return template.replace('{name}', name)
}

function FactCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/25 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-foreground">{value}</p>
    </div>
  )
}

export default function PropertyDetail({
  open,
  property,
  owner,
  onOpenChange,
  onEdit,
}: PropertyDetailProps) {
  const router = useRouter()
  const { t, language } = useTranslation()

  if (!property) {
    return null
  }

  const rental = isRental(property)
  const pricePerSqm = property.area_sqm > 0 ? property.price / property.area_sqm : 0
  const address = `${property.address.street}, ${property.address.district}, ${property.address.city}`

  function goToChat(prompt: string) {
    onOpenChange(false)
    router.push(`/chat?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-l border-border bg-background p-0 sm:max-w-3xl">
        <div className="flex h-full flex-col">
          <div className="border-b border-border bg-card/90 px-6 py-5 backdrop-blur-sm">
            <SheetHeader className="space-y-3 pr-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_COLORS[property.status])}>
                  {t.properties.statusLabels[property.status]}
                </span>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', TYPE_COLORS[property.type])}>
                  {t.properties.typeLabels[property.type]}
                </span>
              </div>
              <SheetTitle className="text-2xl md:text-3xl">{property.name}</SheetTitle>
              <SheetDescription className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{address}</span>
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              <section className="surface-card rounded-[28px] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/70">
                      {t.properties.price}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                      {formatCZK(property.price, language)}
                      {rental ? <span className="ml-2 text-sm font-normal text-muted-foreground">{t.properties.perMonth}</span> : null}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/25 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                      {t.properties.pricePerSqm}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatCZK(Math.round(pricePerSqm), language)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t.properties.keyFacts}</h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <FactCard icon={Ruler} label={t.properties.area} value={`${property.area_sqm} m²`} />
                  <FactCard icon={BedDouble} label={t.properties.rooms} value={property.rooms !== null ? String(property.rooms) : t.properties.unspecified} />
                  <FactCard
                    icon={Building2}
                    label={t.properties.floor}
                    value={property.floor !== null && property.total_floors !== null ? `${property.floor}/${property.total_floors}` : t.properties.unspecified}
                  />
                  <FactCard
                    icon={Sparkles}
                    label={t.properties.yearBuilt}
                    value={property.year_built !== null ? String(property.year_built) : t.properties.unspecified}
                  />
                  <FactCard
                    icon={Hammer}
                    label={t.properties.renovationStatus}
                    value={property.renovation_status ? t.properties.renovationLabels[property.renovation_status] : t.properties.unspecified}
                  />
                  <FactCard
                    icon={ChartColumn}
                    label={t.properties.constructionNotes}
                    value={property.construction_notes ?? t.properties.unspecified}
                  />
                </div>
              </section>

              <section className="surface-card rounded-[28px] p-5">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/70">
                  {t.properties.description}
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground">{property.description}</p>
              </section>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="surface-card rounded-[28px] p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/70">
                    {t.properties.ownerInfo}
                  </p>
                  {owner ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{t.properties.owner}</p>
                        <Link
                          href={`/clients?search=${encodeURIComponent(owner.name)}`}
                          className="text-base font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
                        >
                          {owner.name}
                        </Link>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{owner.email}</p>
                        <p>{owner.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">{t.properties.ownerMissing}</p>
                  )}
                </div>

                <div className="surface-card rounded-[28px] p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/70">
                    {t.properties.map}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{address}</p>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                    <iframe
                      title={`${t.properties.map}: ${property.name}`}
                      src={getMapUrl(property)}
                      className="h-64 w-full"
                      loading="lazy"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="border-t border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(property)
                }}
              >
                <Pencil className="h-4 w-4" />
                {t.properties.edit}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => goToChat(formatPrompt(t.properties.contactOwnerPrompt, property.name))}
              >
                <Mail className="h-4 w-4" />
                {t.properties.contactOwner}
              </Button>
              <Button
                size="lg"
                onClick={() => goToChat(formatPrompt(t.properties.comparePrompt, property.name))}
              >
                <ChartColumn className="h-4 w-4" />
                {t.properties.compare}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
