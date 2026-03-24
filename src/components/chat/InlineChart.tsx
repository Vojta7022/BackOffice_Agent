'use client'

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  LabelList,
  XAxis, YAxis, Tooltip, Legend,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
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
  return data.some((item) => item.secondary_value !== undefined)
}

function renderPieLabel({ cx, cy, midAngle, outerRadius, percent, name }: PieLabelRenderProps) {
  const radius = Number(outerRadius) + 18
  const x = Number(cx) + radius * Math.cos((-Number(midAngle) * Math.PI) / 180)
  const y = Number(cy) + radius * Math.sin((-Number(midAngle) * Math.PI) / 180)

  return (
    <text
      x={x}
      y={y}
      fill="var(--muted-foreground)"
      textAnchor={x > Number(cx) ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={11}
    >
      {name} {Math.round(Number(percent) * 100)}%
    </text>
  )
}

function ChartBody({ config }: { config: ChartConfig }) {
  const { chart_type, data } = config
  const chartData = data.map((item) => ({
    label: item.label,
    value: item.value,
    ...(item.secondary_value !== undefined ? { secondary: item.secondary_value } : {}),
  }))
  const dual = hasSecondary(data)
  const pieTotal = chartData.reduce((sum, item) => sum + item.value, 0)

  if (chart_type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={102}
            paddingAngle={3}
            stroke="transparent"
            labelLine={false}
            label={renderPieLabel}
            isAnimationActive
            animationDuration={800}
          >
            {chartData.map((item, index) => (
              <Cell key={item.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, _name, item) => {
              const currentValue = Number(value)
              const percentage = pieTotal > 0 ? Math.round((currentValue / pieTotal) * 100) : 0
              return [`${currentValue} (${percentage}%)`, (item as { payload?: { label?: string } })?.payload?.label ?? '']
            }}
          />
          <Legend formatter={(value) => <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{value}</span>} />
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
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={800}
          />
          {dual ? (
            <Line
              type="monotone"
              dataKey="secondary"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--chart-2)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={800}
            />
          ) : null}
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
            {dual ? (
              <linearGradient id="areaFill2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            ) : null}
          </defs>
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#areaFill1)"
            dot={false}
            isAnimationActive
            animationDuration={800}
          />
          {dual ? (
            <Area
              type="monotone"
              dataKey="secondary"
              stroke="var(--chart-2)"
              strokeWidth={2}
              fill="url(#areaFill2)"
              dot={false}
              isAnimationActive
              animationDuration={800}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[8, 8, 0, 0]} maxBarSize={48} isAnimationActive animationDuration={800}>
          {chartData.length < 5 ? (
            <LabelList dataKey="value" position="top" fill="var(--muted-foreground)" fontSize={11} />
          ) : null}
        </Bar>
        {dual ? (
          <Bar dataKey="secondary" fill="var(--chart-2)" radius={[8, 8, 0, 0]} maxBarSize={48} isAnimationActive animationDuration={800} />
        ) : null}
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
