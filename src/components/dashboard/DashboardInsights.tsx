'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Lightbulb, Sparkles } from 'lucide-react'
import PropertyDetail from '@/components/properties/PropertyDetail'
import { cn, formatCZK } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'
import type { Client, Property } from '@/types'

type OwnerSummary = Pick<Client, 'id' | 'name' | 'email' | 'phone'> | null

interface TopPropertyItem {
  property: Property
  owner: OwnerSummary
}

interface RecommendationMetrics {
  missingDataCount: number
  staleListingsCount: number
  uncontactedLeadsCount: number
  conversionRate: number
}

interface DashboardInsightsProps {
  topProperties: TopPropertyItem[]
  recommendationMetrics: RecommendationMetrics
}

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  )
}

export default function DashboardInsights({
  topProperties,
  recommendationMetrics,
}: DashboardInsightsProps) {
  const router = useRouter()
  const { t, language } = useTranslation()
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const selectedItem = useMemo(
    () => topProperties.find((item) => item.property.id === selectedPropertyId) ?? null,
    [selectedPropertyId, topProperties]
  )

  const recommendations = [
    {
      id: 'missing-data',
      text: interpolate(t.dashboard.recommendationMissingData, { count: recommendationMetrics.missingDataCount }),
      prompt: t.dashboard.recommendationPromptMissingData,
      color: 'bg-primary/10 text-primary',
    },
    {
      id: 'stale-listings',
      text: interpolate(t.dashboard.recommendationStaleListings, { count: recommendationMetrics.staleListingsCount }),
      prompt: t.dashboard.recommendationPromptStaleListings,
      color: 'bg-amber-500/15 text-amber-500',
    },
    {
      id: 'new-leads',
      text: interpolate(t.dashboard.recommendationNewLeads, { count: recommendationMetrics.uncontactedLeadsCount }),
      prompt: t.dashboard.recommendationPromptNewLeads,
      color: 'bg-violet-500/15 text-violet-500',
    },
    {
      id: 'conversion',
      text: interpolate(t.dashboard.recommendationConversion, { rate: recommendationMetrics.conversionRate }),
      prompt: t.dashboard.recommendationPromptConversion,
      color: 'bg-green-500/15 text-green-500',
    },
  ]

  function openChat(prompt: string) {
    router.push(`/chat?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <section className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{t.dashboard.topProperties}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.dashboard.availableNow}</p>
            </div>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>

          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {topProperties.map(({ property }) => (
              <button
                key={property.id}
                type="button"
                onClick={() => setSelectedPropertyId(property.id)}
                className={cn(
                  'button-smooth min-w-[240px] rounded-2xl border border-border bg-muted/20 p-4 text-left shadow-sm dark:shadow-none',
                  'hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted/35'
                )}
              >
                <p className="line-clamp-2 text-sm font-semibold leading-6 text-foreground">{property.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{property.address.district}</p>
                <div className="mt-5 space-y-1.5">
                  <p className="text-lg font-semibold text-foreground">{formatCZK(property.price, language)}</p>
                  <p className="text-xs text-muted-foreground">{property.area_sqm} m²</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-violet-500/10 p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t.dashboard.aiRecommendations}</p>
              <p className="mt-1 text-xs text-muted-foreground">RE:Agent</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recommendations.map((recommendation) => (
              <button
                key={recommendation.id}
                type="button"
                onClick={() => openChat(recommendation.prompt)}
                className="button-smooth flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-left hover:border-primary/20 hover:bg-background"
              >
                <div className="min-w-0">
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold', recommendation.color)}>
                    AI
                  </span>
                  <p className="mt-2 text-sm font-medium leading-6 text-foreground">{recommendation.text}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <PropertyDetail
        open={!!selectedItem}
        property={selectedItem?.property ?? null}
        owner={selectedItem?.owner ?? null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPropertyId(null)
          }
        }}
        onEdit={(property) => {
          setSelectedPropertyId(null)
          router.push(`/properties?search=${encodeURIComponent(property.name)}`)
        }}
      />
    </>
  )
}
