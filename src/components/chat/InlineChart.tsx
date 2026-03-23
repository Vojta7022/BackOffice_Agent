'use client'

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend,
} from 'recharts'
import type { ChartConfig } from '@/lib/agent/orchestrator'

const TICK = { fill: 'var(--muted-foreground)', fontSize: 11 }
const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    fontSize: 12,
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
  },
  labelStyle: { color: 'var(--muted-foreground)' },
  itemStyle: { color: 'var(--foreground)' },
  cursor: { fill: 'rgb(var(--muted-rgb) / 0.35)' },
}
const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', '#06b6d4', '#14b8a6']

function hasSecondary(data: ChartConfig['data']) {
  return data.some(d => d.secondary_value !== undefined)
}

function ChartBody({ config }: { config: ChartConfig }) {
  const { chart_type, data } = config
  const chartData = data.map(d => ({
    label: d.label,
    value: d.value,
    ...(d.secondary_value !== undefined ? { secondary: d.secondary_value } : {}),
  }))

  const dual = hasSecondary(data)

  if (chart_type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="50%"
            innerRadius={60} outerRadius={100} paddingAngle={3}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend formatter={(v) => <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chart_type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2}
            dot={false} activeDot={{ r: 4 }} isAnimationActive />
          {dual && <Line type="monotone" dataKey="secondary" stroke="var(--chart-2)" strokeWidth={2}
            dot={false} activeDot={{ r: 4 }} isAnimationActive />}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chart_type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaFill1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            {dual && (
              <linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2}
            fill="url(#areaFill1)" dot={false} isAnimationActive />
          {dual && <Area type="monotone" dataKey="secondary" stroke="var(--chart-2)" strokeWidth={2}
            fill="url(#areaFill2)" dot={false} isAnimationActive />}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // default: bar
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[8, 8, 0, 0]} maxBarSize={48} isAnimationActive />
        {dual && <Bar dataKey="secondary" fill="var(--chart-2)" radius={[8, 8, 0, 0]} maxBarSize={48} isAnimationActive />}
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function InlineChart({ config }: { config: ChartConfig }) {
  return (
    <div className="surface-muted mt-3 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{config.title}</p>
      <ChartBody config={config} />
    </div>
  )
}
