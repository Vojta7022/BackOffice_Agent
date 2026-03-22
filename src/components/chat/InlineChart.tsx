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

const TICK = { fill: '#94a3b8', fontSize: 11 }
const TOOLTIP_STYLE = {
  contentStyle: { background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}
const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']

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
          <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
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
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2}
            dot={false} activeDot={{ r: 4 }} isAnimationActive />
          {dual && <Line type="monotone" dataKey="secondary" stroke="#3b82f6" strokeWidth={2}
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
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            {dual && (
              <linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2}
            fill="url(#areaFill1)" dot={false} isAnimationActive />
          {dual && <Area type="monotone" dataKey="secondary" stroke="#3b82f6" strokeWidth={2}
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
        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive />
        {dual && <Bar dataKey="secondary" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive />}
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function InlineChart({ config }: { config: ChartConfig }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{config.title}</p>
      <ChartBody config={config} />
    </div>
  )
}
