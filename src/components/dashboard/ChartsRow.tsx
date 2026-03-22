'use client'

import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip,
} from 'recharts'
import { formatCZK, formatMonthLabel } from '@/lib/utils'
import type { MonthlyLeadCount, MonthlyTransactionSummary } from '@/lib/database'

interface ChartsRowProps {
  leadsByMonth: MonthlyLeadCount[]
  transactionsByMonth: MonthlyTransactionSummary[]
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-4 text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5">
          <div className="mb-4 h-4 w-32 rounded bg-muted" />
          <div className="h-48 rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  )
}

const TICK_STYLE = { fill: '#94a3b8', fontSize: 11 }

function LeadsChart({ data }: { data: MonthlyLeadCount[] }) {
  const chartData = data.map(d => ({ label: formatMonthLabel(d.month), count: d.count }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#10b981' }}
          formatter={(v) => [Number(v), 'Leady']}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#leadFill)"
          dot={false}
          activeDot={{ r: 4, fill: '#10b981' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function TransactionsChart({ data }: { data: MonthlyTransactionSummary[] }) {
  const chartData = data.map(d => ({
    label: formatMonthLabel(d.month),
    count: d.count,
    value: d.total_value,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          formatter={(v, name) =>
            name === 'count'
              ? [Number(v), 'Transakce']
              : [formatCZK(Number(v)), 'Hodnota']
          }
        />
        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function ChartsRow({ leadsByMonth, transactionsByMonth }: ChartsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Vývoj leadů — posledních 6 měsíců">
        <LeadsChart data={leadsByMonth} />
      </ChartCard>
      <ChartCard title="Transakce — posledních 6 měsíců">
        <TransactionsChart data={transactionsByMonth} />
      </ChartCard>
    </div>
  )
}

ChartsRow.Skeleton = ChartSkeleton
