'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DashboardStatsResult, MonthlyLeadCount, MonthlyTransactionSummary, TasksByStatus } from '@/lib/database'
import type { Client, LeadStatus, LeadType, Property, PropertyType, TransactionStatus, TransactionType } from '@/types'
import { useTranslation } from '@/lib/useTranslation'
import { ErrorState } from '@/components/ui/async-state'
import { fetchJson, getErrorMessage, isNetworkError } from '@/lib/utils'
import KPICards from './KPICards'
import ChartsRow from './ChartsRow'
import DashboardInsights from './DashboardInsights'
import RecentActivity from './RecentActivity'
import QuickActions from './QuickActions'
import ProactiveGreeting from '@/components/agent/ProactiveGreeting'

interface RecentLeadActivity {
  id: string
  created_at: string
  status: LeadStatus
  type: LeadType
  client_name: string
  property_name: string | null
}

interface RecentTransactionActivity {
  id: string
  date: string
  status: TransactionStatus
  type: TransactionType
  amount: number
  client_name: string
  property_name: string
}

interface PropertyTypeDistribution {
  type: PropertyType
  count: number
}

interface TopPropertyItem {
  property: Property
  owner: Pick<Client, 'id' | 'name' | 'email' | 'phone'> | null
}

interface RecommendationMetrics {
  missingDataCount: number
  staleListingsCount: number
  uncontactedLeadsCount: number
  conversionRate: number
}

interface DashboardData {
  stats: DashboardStatsResult
  leadsByMonth: MonthlyLeadCount[]
  transactionsByMonth: MonthlyTransactionSummary[]
  propertyTypeDistribution: PropertyTypeDistribution[]
  topProperties: TopPropertyItem[]
  recommendationMetrics: RecommendationMetrics
  tasksByStatus: TasksByStatus
  recentLeads: RecentLeadActivity[]
  recentTransactions: RecentTransactionActivity[]
}

export default function DashboardContent() {
  const { t } = useTranslation()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      setError(null)
      const response = await fetchJson<DashboardData>('/api/dashboard')
      setData(response)
    } catch (loadError) {
      setError(isNetworkError(loadError) ? t.common.connectionError : (getErrorMessage(loadError) || t.common.unknownError))
    }
  }, [t.common.connectionError, t.common.unknownError])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  if (error) {
    return (
      <div className="mx-4 mt-4 md:mx-6">
        <ErrorState
          title={t.common.loadError}
          message={error}
          retryLabel={t.common.retry}
          onRetry={() => void loadDashboard()}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <ProactiveGreeting />

      {/* KPI row */}
      {data ? <KPICards stats={data.stats} /> : <KPICards.Skeleton />}

      {/* Charts */}
      {data
        ? (
          <ChartsRow
            leadsByMonth={data.leadsByMonth}
            transactionsByMonth={data.transactionsByMonth}
            propertyTypeDistribution={data.propertyTypeDistribution}
          />
        )
        : <ChartsRow.Skeleton />
      }

      {data
        ? (
          <DashboardInsights
            topProperties={data.topProperties}
            recommendationMetrics={data.recommendationMetrics}
          />
        )
        : null
      }

      {/* Activity + tasks */}
      {data
        ? (
          <RecentActivity
            tasksByStatus={data.tasksByStatus}
            recentLeads={data.recentLeads}
            recentTransactions={data.recentTransactions}
          />
        )
        : <RecentActivity.Skeleton />
      }

      {/* Quick actions */}
      <QuickActions />
    </div>
  )
}
