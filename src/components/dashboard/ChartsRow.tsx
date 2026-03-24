'use client'

import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
  XAxis, YAxis,
  Tooltip,
} from 'recharts'
import { formatCZK, formatMonthLabel } from '@/lib/utils'
import type { MonthlyLeadCount, MonthlyTransactionSummary } from '@/lib/database'
import type { PropertyType } from '@/types'
import { useTranslation } from '@/lib/useTranslation'

interface ChartsRowProps {
  leadsByMonth: MonthlyLeadCount[]
  transactionsByMonth: MonthlyTransactionSummary[]
  propertyTypeDistribution: { type: PropertyType; count: number }[]
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-5">
      <p className="mb-4 text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className={i === 2 ? 'surface-card animate-pulse p-5 lg:col-span-2' : 'surface-card animate-pulse p-5'}>
          <div className="mb-4 h-4 w-32 rounded bg-muted" />
          <div className="h-48 rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  )
}

const TICK_STYLE = { fill: 'var(--muted-foreground)', fontSize: 11 }
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  fontSize: 12,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
}
const TOOLTIP_LABEL_STYLE = { color: 'var(--muted-foreground)' }
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#f43f5e']

function LeadsChart({ data }: { data: MonthlyLeadCount[] }) {
  const { t, language } = useTranslation()
  const chartData = data.map(d => ({ label: formatMonthLabel(d.month, language), count: d.count }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={{ color: 'var(--chart-1)' }}
          formatter={(v) => [Number(v), t.dashboard.leadsSeries]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#leadFill)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--chart-1)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function TransactionsChart({ data }: { data: MonthlyTransactionSummary[] }) {
  const { t, language } = useTranslation()
  const chartData = data.map(d => ({
    label: formatMonthLabel(d.month, language),
    count: d.count,
    value: d.total_value,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={{ color: 'var(--chart-2)' }}
          cursor={{ fill: 'rgb(var(--muted-rgb) / 0.35)' }}
          formatter={(v, name) =>
            name === 'count'
              ? [Number(v), t.dashboard.transactionsSeries]
              : [formatCZK(Number(v), language), t.dashboard.valueSeries]
          }
        />
        <Bar dataKey="count" fill="var(--chart-2)" radius={[8, 8, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function PortfolioChart({ data }: { data: { type: PropertyType; count: number }[] }) {
  const { t } = useTranslation()
  const chartData = data.map((item) => ({
    label: t.properties.typeLabels[item.type],
    value: item.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={68}
          outerRadius={110}
          paddingAngle={3}
          stroke="transparent"
        >
          {chartData.map((entry, index) => (
            <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={{ color: 'var(--foreground)' }}
          formatter={(value) => [Number(value), t.nav.properties]}
        />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          formatter={(value) => <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default function ChartsRow({ leadsByMonth, transactionsByMonth, propertyTypeDistribution }: ChartsRowProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title={t.dashboard.leadsChart}>
        <LeadsChart data={leadsByMonth} />
      </ChartCard>
      <ChartCard title={t.dashboard.transactionsChart}>
        <TransactionsChart data={transactionsByMonth} />
      </ChartCard>
      <div className="lg:col-span-2">
        <ChartCard title={t.dashboard.portfolioChart}>
          <PortfolioChart data={propertyTypeDistribution} />
        </ChartCard>
      </div>
    </div>
  )
}

ChartsRow.Skeleton = ChartSkeleton
