'use client'

import type { Property, RenovationStatus } from '@/types'
import { cn, formatCZK } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'

interface ComparisonProperty extends Property {
  price_per_sqm?: number
}

interface ComparisonData {
  properties: ComparisonProperty[]
  comparison_fields: string[]
}

type ComparisonField = 'price' | 'area_sqm' | 'rooms' | 'renovation_status' | 'year_built' | 'price_per_sqm'

function renovationScore(status: RenovationStatus | null, year: number | null) {
  const base = {
    full: 3,
    partial: 2,
    original: 1,
    null: 0,
  }[status ?? 'null']

  return base * 10_000 + (year ?? 0)
}

export default function ComparisonCard({ comparison }: { comparison: ComparisonData }) {
  const { t, language } = useTranslation()
  const properties = comparison.properties ?? []
  const fields = comparison.comparison_fields as ComparisonField[]

  const fieldConfig: Record<ComparisonField, {
    label: string
    getValue: (property: ComparisonProperty) => string
    getRaw: (property: ComparisonProperty) => number | null
    better: 'min' | 'max'
  }> = {
    price: {
      label: t.properties.price,
      getValue: (property) => formatCZK(property.price, language),
      getRaw: (property) => property.price,
      better: 'min',
    },
    area_sqm: {
      label: t.properties.area,
      getValue: (property) => `${property.area_sqm} m²`,
      getRaw: (property) => property.area_sqm,
      better: 'max',
    },
    rooms: {
      label: t.properties.rooms,
      getValue: (property) => property.rooms === null ? t.properties.unspecified : String(property.rooms),
      getRaw: (property) => property.rooms,
      better: 'max',
    },
    renovation_status: {
      label: t.properties.renovationStatus,
      getValue: (property) =>
        property.renovation_status === null
          ? t.properties.unspecified
          : t.properties.renovationLabels[property.renovation_status],
      getRaw: (property) => renovationScore(property.renovation_status, property.renovation_year),
      better: 'max',
    },
    year_built: {
      label: t.properties.yearBuilt,
      getValue: (property) => property.year_built === null ? t.properties.unspecified : String(property.year_built),
      getRaw: (property) => property.year_built,
      better: 'max',
    },
    price_per_sqm: {
      label: t.properties.pricePerSqm,
      getValue: (property) => {
        const value = property.price_per_sqm ?? Math.round(property.price / property.area_sqm)
        return `${new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-US').format(value)} CZK`
      },
      getRaw: (property) => property.price_per_sqm ?? Math.round(property.price / property.area_sqm),
      better: 'min',
    },
  }

  function getWinners(field: ComparisonField) {
    const comparable = properties
      .map((property, index) => ({ index, value: fieldConfig[field].getRaw(property) }))
      .filter((item): item is { index: number; value: number } => item.value !== null)

    if (!comparable.length) return new Set<number>()

    const bestValue = fieldConfig[field].better === 'min'
      ? Math.min(...comparable.map((item) => item.value))
      : Math.max(...comparable.map((item) => item.value))

    return new Set(comparable.filter((item) => item.value === bestValue).map((item) => item.index))
  }

  if (properties.length === 0) {
    return null
  }

  return (
    <div className="surface-muted mt-3 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{t.chat.comparisonTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{properties.length}×</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card/40">
              <th className="sticky left-0 z-10 bg-card/40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.common.parameter}
              </th>
              {properties.map((property) => (
                <th key={property.id} className="min-w-[220px] px-4 py-3 text-left">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{property.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {t.properties.typeLabels[property.type]}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {property.address.city}
                      </span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => {
              const winners = getWinners(field)

              return (
                <tr key={field} className="border-b border-border/60 even:bg-muted/10">
                  <td className="sticky left-0 z-10 bg-background px-4 py-3 text-xs font-medium text-muted-foreground">
                    {fieldConfig[field].label}
                  </td>
                  {properties.map((property, index) => (
                    <td
                      key={`${property.id}-${field}`}
                      className={cn(
                        'px-4 py-3 text-sm text-foreground transition-colors',
                        winners.has(index) && 'bg-green-500/10 text-green-600 dark:text-green-400',
                      )}
                    >
                      {fieldConfig[field].getValue(property)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
