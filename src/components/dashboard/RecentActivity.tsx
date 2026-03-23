'use client'

import { cn, relativeTime } from '@/lib/utils'
import type { TasksByStatus } from '@/lib/database'
import type { Task } from '@/types'

interface RecentActivityProps {
  tasksByStatus: TasksByStatus
}

interface ActivityItem {
  dot: 'green' | 'blue' | 'orange' | 'red'
  text: string
  time: string
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  low: 'Nízká', medium: 'Střední', high: 'Vysoká', urgent: 'Urgentní',
}

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  low: 'text-muted-foreground', medium: 'text-primary', high: 'text-amber-500', urgent: 'text-red-500',
}

function dot(color: ActivityItem['dot']) {
  return {
    green: 'bg-green-500',
    blue: 'bg-primary',
    orange: 'bg-amber-500',
    red: 'bg-red-500',
  }[color]
}

function ActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="surface-card animate-pulse p-5 lg:col-span-2">
        <div className="mb-4 h-4 w-32 rounded bg-muted" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-muted" />
            <div className="h-3 flex-1 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="surface-card animate-pulse p-5">
        <div className="mb-4 h-4 w-24 rounded bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-3 h-10 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default function RecentActivity({ tasksByStatus }: RecentActivityProps) {
  // Build activity feed from tasks sorted by created_at desc
  const allTasks = [
    ...tasksByStatus.done,
    ...tasksByStatus.in_progress,
    ...tasksByStatus.todo,
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))

  const activities: ActivityItem[] = allTasks.slice(0, 8).map(task => ({
    dot:
      task.status === 'done' ? 'green' :
      task.status === 'in_progress' ? 'blue' :
      task.priority === 'urgent' ? 'red' : 'orange',
    text:
      task.status === 'done'
        ? `Dokončeno: ${task.title}`
        : task.status === 'in_progress'
        ? `Probíhá: ${task.title}`
        : `Nový úkol: ${task.title}`,
    time: relativeTime(task.created_at),
  }))

  // Status badge counts
  const statuses = [
    { label: 'K řešení', count: tasksByStatus.todo.length, color: 'bg-warning/15 text-warning' },
    { label: 'Probíhá', count: tasksByStatus.in_progress.length, color: 'bg-primary/12 text-primary' },
    { label: 'Hotovo', count: tasksByStatus.done.length, color: 'bg-green-500/15 text-green-500' },
  ]

  // Top urgent tasks
  const urgentTasks = [
    ...tasksByStatus.todo,
    ...tasksByStatus.in_progress,
  ]
    .filter(t => t.priority === 'urgent' || t.priority === 'high')
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
    .slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="surface-card p-5 lg:col-span-2">
        <p className="mb-4 text-sm font-semibold text-foreground">Poslední aktivita</p>
        <ul className="space-y-3">
          {activities.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', dot(item.dot))} />
              <span className="flex-1 text-sm text-muted-foreground">{item.text}</span>
              <span className="shrink-0 text-xs text-muted-foreground/70">{item.time}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="surface-card p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">Úkoly</p>

        <div className="mb-4 flex gap-2">
          {statuses.map(s => (
            <span key={s.label} className={cn('flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium', s.color)}>
              {s.count} {s.label}
            </span>
          ))}
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          Prioritní
        </p>
        {urgentTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné urgentní úkoly</p>
        ) : (
          <ul className="space-y-2">
            {urgentTasks.map(task => (
              <li key={task.id} className="rounded-xl border border-border bg-muted/40 p-2.5">
                <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className={cn('text-xs font-medium', PRIORITY_COLOR[task.priority])}>
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                  <span className="text-xs text-muted-foreground">{task.due_date}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

RecentActivity.Skeleton = ActivitySkeleton
