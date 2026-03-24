'use client'

import { useEffect, useState } from 'react'
import type { DashboardStatsResult, MonthlyLeadCount, MonthlyTransactionSummary, TasksByStatus } from '@/lib/database'
import type { LeadStatus, LeadType, TransactionStatus, TransactionType } from '@/types'
import { useTranslation } from '@/lib/useTranslation'
import KPICards from './KPICards'
import ChartsRow from './ChartsRow'
import RecentActivity from './RecentActivity'
import QuickActions from './QuickActions'

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

interface DashboardData {
  stats: DashboardStatsResult
  leadsByMonth: MonthlyLeadCount[]
  transactionsByMonth: MonthlyTransactionSummary[]
  tasksByStatus: TasksByStatus
  recentLeads: RecentLeadActivity[]
  recentTransactions: RecentTransactionActivity[]
}

export default function DashboardContent() {
  const { t } = useTranslation()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="mx-4 mt-4 flex h-48 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/5 text-sm text-red-500 md:mx-6">
        {t.dashboard.loadError} {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* KPI row */}
      {data ? <KPICards stats={data.stats} /> : <KPICards.Skeleton />}

      {/* Charts */}
      {data
        ? <ChartsRow leadsByMonth={data.leadsByMonth} transactionsByMonth={data.transactionsByMonth} />
        : <ChartsRow.Skeleton />
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
