'use client'

import { useEffect, useState } from 'react'
import type { DashboardStatsResult, MonthlyLeadCount, MonthlyTransactionSummary, TasksByStatus } from '@/lib/database'
import KPICards from './KPICards'
import ChartsRow from './ChartsRow'
import RecentActivity from './RecentActivity'
import QuickActions from './QuickActions'

interface DashboardData {
  stats: DashboardStatsResult
  leadsByMonth: MonthlyLeadCount[]
  transactionsByMonth: MonthlyTransactionSummary[]
  tasksByStatus: TasksByStatus
}

export default function DashboardContent() {
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
      <div className="flex h-48 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/5 text-sm text-red-400">
        Chyba při načítání dat: {error}
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
        ? <RecentActivity tasksByStatus={data.tasksByStatus} />
        : <RecentActivity.Skeleton />
      }

      {/* Quick actions */}
      <QuickActions />
    </div>
  )
}
