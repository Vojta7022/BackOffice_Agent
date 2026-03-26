'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Clock, ExternalLink, Loader2, MapPin, MessageSquare, Pause, Play, Plus, RefreshCw, Trash2, Zap } from 'lucide-react'
import { cn, fetchJson } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'
import type { MonitoringRule } from '@/types'
import type { ListingResult, ListingSourceStatus } from '@/lib/monitoring/fetcher'

const NEW_RULE_PROMPT = 'Nastav nový monitoring nemovitostí'
const CHECK_NOW_LOCATION = 'Holešovice'
const MONITORING_SOURCE_STYLES: Record<string, string> = {
  'Sreality.cz': 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'Bezrealitky.cz': 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
  'Reality.iDNES.cz': 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  'České reality.cz': 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
}

type MonitoringResultsResponse = {
  listings: ListingResult[]
  sources: { name: string; count: number; status: ListingSourceStatus }[]
  fetchedAt: string
}

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

function formatRuleDate(value: string, language: 'cs' | 'en') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'cs-CZ', {
    dateStyle: 'medium',
  }).format(date)
}

function formatPriceRange(
  filters: MonitoringRule['filters'],
  language: 'cs' | 'en',
  fallbackLabel: string
) {
  const formatter = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'cs-CZ')
  const parts: string[] = []

  if (filters.price_min !== undefined) {
    parts.push(`${language === 'en' ? 'from' : 'od'} ${formatter.format(filters.price_min)} CZK`)
  }

  if (filters.price_max !== undefined) {
    parts.push(`${language === 'en' ? 'to' : 'do'} ${formatter.format(filters.price_max)} CZK`)
  }

  return parts.length > 0 ? parts.join(' · ') : fallbackLabel
}

function formatPropertyTypes(filters: MonitoringRule['filters'], ruleTypeFallback: string, labels: Record<string, string>) {
  if (!filters.property_types?.length) return ruleTypeFallback
  return filters.property_types.map((type) => labels[type] ?? type).join(', ')
}

function FilterPills({ filters }: { filters: MonitoringRule['filters'] }) {
  const { t } = useTranslation()
  const pills: string[] = []
  if (filters.property_types?.length) {
    pills.push(filters.property_types.map((type) => t.monitoring.propertyTypeLabels[type] ?? type).join(', '))
  }
  if (filters.price_min !== undefined) pills.push(`${t.monitoring.fromPrice} ${(filters.price_min / 1_000_000).toFixed(0)} mil. CZK`)
  if (filters.price_max !== undefined) pills.push(`${t.monitoring.toPrice} ${(filters.price_max / 1_000_000).toFixed(0)} mil. CZK`)
  if (filters.rooms_min !== undefined) pills.push(`${t.monitoring.minRooms} ${filters.rooms_min} ${t.properties.rooms}`)
  if (filters.rooms_max !== undefined) pills.push(`${t.monitoring.maxRooms} ${filters.rooms_max} ${t.properties.rooms}`)

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pills.map(p => (
        <span key={p} className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] text-muted-foreground">{p}</span>
      ))}
    </div>
  )
}

function ExampleRuleCard({ rule }: { rule: typeof EXAMPLE_RULES[0] }) {
  const { t } = useTranslation()

  return (
    <div className={cn(
      'surface-card p-4 transition-all duration-200',
      rule.active ? 'border-primary/20' : 'opacity-70',
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
          rule.active ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground',
        )}>
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{rule.location}</p>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0',
              rule.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {rule.active ? t.monitoring.active : t.monitoring.paused}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t.monitoring.frequencies[rule.frequency]}</span>
          </div>
          <FilterPills filters={rule.filters} />
        </div>
      </div>
    </div>
  )
}

function RealRuleCard({
  rule,
  isMutating,
  onDelete,
  onToggle,
}: {
  rule: MonitoringRule
  isMutating: boolean
  onDelete: (id: string) => void
  onToggle: (rule: MonitoringRule) => void
}) {
  const { t, language } = useTranslation()
  const propertyTypeLabel = formatPropertyTypes(rule.filters, t.chat.monitoringAllTypes, t.monitoring.propertyTypeLabels)
  const priceRangeLabel = formatPriceRange(rule.filters, language, t.chat.monitoringNoPriceLimit)

  return (
    <div
      className={cn(
        'surface-card p-4 transition-all duration-200',
        rule.active ? 'border-primary/20' : 'opacity-80'
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  rule.active ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{rule.location}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {language === 'en' ? 'Created' : 'Vytvořeno'}: {formatRuleDate(rule.created_at, language)}
                </p>
              </div>
            </div>
          </div>

          <span
            className={cn(
              'inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium',
              rule.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            {rule.active ? t.monitoring.active : t.monitoring.paused}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {language === 'en' ? 'Frequency' : 'Frekvence'}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t.monitoring.frequencies[rule.frequency]}</span>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {language === 'en' ? 'Property type' : 'Typ nemovitosti'}
            </p>
            <p className="mt-1 text-sm text-foreground">{propertyTypeLabel}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {language === 'en' ? 'Price range' : 'Cenové rozpětí'}
            </p>
            <p className="mt-1 text-sm text-foreground">{priceRangeLabel}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {language === 'en' ? 'Status' : 'Status'}
            </p>
            <p className="mt-1 text-sm text-foreground">{rule.active ? t.monitoring.active : t.monitoring.paused}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onToggle(rule)}
            disabled={isMutating}
            className="button-smooth inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : rule.active ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {rule.active ? (language === 'en' ? 'Pause' : 'Pozastavit') : (language === 'en' ? 'Activate' : 'Aktivovat')}
          </button>

          <button
            type="button"
            onClick={() => onDelete(rule.id)}
            disabled={isMutating}
            className="button-smooth inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
          >
            {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {language === 'en' ? 'Delete' : 'Smazat'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MonitoringPage() {
  const { t, language } = useTranslation()
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; hasOAuthConfig: boolean } | null>(null)
  const [realRules, setRealRules] = useState<MonitoringRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [rulesError, setRulesError] = useState<string | null>(null)
  const [mutatingRuleId, setMutatingRuleId] = useState<string | null>(null)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const [results, setResults] = useState<ListingResult[]>([])
  const [resultsMeta, setResultsMeta] = useState<MonitoringResultsResponse | null>(null)

  const loadRules = useCallback(async () => {
    setRulesLoading(true)
    setRulesError(null)

    try {
      const data = await fetchJson<MonitoringRule[]>('/api/monitoring/rules')
      setRealRules(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.common.unknownError
      setRulesError(message)
    } finally {
      setRulesLoading(false)
    }
  }, [t.common.unknownError])

  useEffect(() => {
    fetchJson<{ connected: boolean; hasOAuthConfig: boolean }>('/api/google/status')
      .then(setGoogleStatus)
      .catch((error) => {
        console.error('Google status load failed:', error)
      })
  }, [])

  useEffect(() => {
    void loadRules()
  }, [loadRules])

  const handleDeleteRule = useCallback(async (id: string) => {
    setMutatingRuleId(id)

    try {
      await fetchJson<{ success: boolean }>('/api/monitoring/rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      setRealRules((currentRules) => currentRules.filter((rule) => rule.id !== id))
    } catch (error) {
      const message = error instanceof Error ? error.message : t.common.unknownError
      setRulesError(message)
    } finally {
      setMutatingRuleId(null)
    }
  }, [t.common.unknownError])

  const handleToggleRule = useCallback(async (rule: MonitoringRule) => {
    setMutatingRuleId(rule.id)

    try {
      const updatedRule = await fetchJson<MonitoringRule>('/api/monitoring/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, active: !rule.active }),
      })

      setRealRules((currentRules) =>
        currentRules.map((currentRule) => (currentRule.id === updatedRule.id ? updatedRule : currentRule))
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : t.common.unknownError
      setRulesError(message)
    } finally {
      setMutatingRuleId(null)
    }
  }, [t.common.unknownError])

  const handleCheckNow = useCallback(async () => {
    setResultsLoading(true)
    setResultsError(null)

    try {
      const data = await fetchJson<MonitoringResultsResponse>(
        `/api/monitoring/results?location=${encodeURIComponent(CHECK_NOW_LOCATION)}&fresh=true`
      )
      setResults(data.listings)
      setResultsMeta(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.common.unknownError
      setResultsError(message)
      setResults([])
      setResultsMeta(null)
    } finally {
      setResultsLoading(false)
    }
  }, [t.common.unknownError])

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {t.monitoring.description}
          </p>
        </div>
        <Link
          href={`/chat?prompt=${encodeURIComponent(NEW_RULE_PROMPT)}`}
          className={cn(
            'button-smooth inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 dark:shadow-none',
          )}
        >
          <Plus className="h-4 w-4" />
          {t.monitoring.newRule}
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {language === 'en' ? 'Google Integration' : 'Google integrace'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {googleStatus?.connected
                ? language === 'en'
                  ? 'Google Calendar is connected and Gmail drafts/sending are available.'
                  : 'Google Calendar je připojen a Gmail drafty i odesílání jsou k dispozici.'
                : language === 'en'
                  ? 'Connect Google to use your real calendar and Gmail.'
                  : 'Propojte Google pro práci s reálným kalendářem a Gmailem.'}
            </p>
          </div>
          {googleStatus?.connected ? (
            <div className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
              Google Calendar ✅ Gmail ✅
            </div>
          ) : googleStatus?.hasOAuthConfig === false ? (
            <div className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-300">
              {language === 'en' ? 'Google OAuth is not configured' : 'Google OAuth není nakonfigurován'}
            </div>
          ) : (
            <Link
              href="/api/auth/google"
              className="button-smooth inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {language === 'en' ? 'Connect Google account' : 'Propojit Google účet'}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 shadow-sm dark:shadow-none">
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
        <div>
          <p className="mb-1 text-sm font-semibold text-violet-500">{t.monitoring.howItWorks}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.monitoring.howItWorksText}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.monitoring.quickActions}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {t.monitoring.quickPrompts.map(prompt => (
            <Link
              key={prompt}
              href={`/chat?prompt=${encodeURIComponent(prompt)}`}
              className={cn(
                'group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 dark:shadow-none',
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              <span className="text-sm text-foreground/85 transition-colors group-hover:text-foreground">{prompt}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {language === 'en' ? 'Your monitoring rules' : 'Vaše pravidla monitoringu'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {language === 'en'
                ? 'Rules created through the agent chat appear here.'
                : 'Pravidla vytvořená přes chat s agentem se zobrazují tady.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckNow}
            disabled={resultsLoading}
            className="button-smooth inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resultsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {language === 'en' ? 'Check now' : 'Zkontrolovat nyní'}
          </button>
        </div>

        {rulesError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {rulesError}
          </div>
        ) : null}

        {rulesLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground shadow-sm dark:shadow-none">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.common.loading}
          </div>
        ) : realRules.length > 0 ? (
          <div className="flex flex-col gap-3">
            {realRules.map((rule) => (
              <RealRuleCard
                key={rule.id}
                rule={rule}
                isMutating={mutatingRuleId === rule.id}
                onDelete={handleDeleteRule}
                onToggle={handleToggleRule}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-5 text-sm text-muted-foreground">
            {language === 'en'
              ? 'No monitoring rules have been created yet. Start from chat and they will appear here.'
              : 'Zatím nemáte vytvořená žádná pravidla monitoringu. Spusťte je přes chat a objeví se tady.'}
          </div>
        )}

        {(resultsLoading || resultsError || resultsMeta !== null) ? (
          <div className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm dark:shadow-none">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {language === 'en' ? `Current listings for ${CHECK_NOW_LOCATION}` : `Aktuální nabídky pro ${CHECK_NOW_LOCATION}`}
                </p>
                {resultsMeta?.fetchedAt ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {language === 'en' ? 'Updated' : 'Aktualizováno'}: {formatRuleDate(resultsMeta.fetchedAt, language)}
                  </p>
                ) : null}
              </div>

              {resultsMeta?.sources?.length ? (
                <div className="flex flex-wrap gap-2">
                  {resultsMeta.sources.map((source) => (
                    <span
                      key={source.name}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] font-medium',
                        source.status === 'live'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                          : source.status === 'unavailable'
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                          : 'border-muted bg-muted text-muted-foreground'
                      )}
                    >
                      {source.name}:{' '}
                      {source.status === 'unavailable'
                        ? language === 'en'
                          ? 'requires extension'
                          : 'vyžaduje rozšíření'
                        : source.count}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {resultsError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                {resultsError}
              </div>
            ) : null}

            {resultsLoading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {language === 'en' ? 'Loading live listings...' : 'Načítám aktuální nabídky...'}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {results.map((listing) => (
                  <div key={listing.url} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{listing.name}</p>
                        <p className="mt-1 text-base font-medium text-primary">{listing.price}</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          MONITORING_SOURCE_STYLES[listing.source] ?? 'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        {listing.source}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{listing.address}</span>
                      </div>
                    </div>

                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noreferrer"
                      className="button-smooth mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground hover:border-primary/20 hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {language === 'en' ? 'Open listing' : 'Otevřít inzerát'}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                {language === 'en'
                  ? 'No listings were found for this check.'
                  : 'Pro tuto kontrolu nebyly nalezeny žádné nabídky.'}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.monitoring.exampleRules}</p>
          <span className="text-xs text-muted-foreground/60 italic">{t.monitoring.exampleRulesNote}</span>
        </div>
        <div className="flex flex-col gap-3">
          {EXAMPLE_RULES.map(rule => (
            <ExampleRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center shadow-sm dark:shadow-none">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MapPin className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-foreground">
          {t.monitoring.firstMonitoringTitle}
        </h3>
        <p className="mx-auto mb-4 max-w-sm text-sm text-muted-foreground">
          {t.monitoring.firstMonitoringText}
        </p>
        <Link
          href={`/chat?prompt=${encodeURIComponent(t.monitoring.firstMonitoringPrompt)}`}
          className="button-smooth inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 dark:shadow-none"
        >
          <Bell className="h-4 w-4" />
          {t.monitoring.startChat}
        </Link>
      </div>
    </div>
  )
}
