'use client'

import { useEffect, useState } from 'react'
import { Bell, CircleDollarSign, ClipboardList, UserPlus, type LucideIcon } from 'lucide-react'
import { cn, relativeTime } from '@/lib/utils'
import type { TasksByStatus } from '@/lib/database'
import type { LeadStatus, LeadType, Task, TransactionStatus, TransactionType } from '@/types'
import { useTranslation } from '@/lib/useTranslation'
import { useNotificationStore } from '@/lib/notification-store'

interface RecentActivityProps {
  tasksByStatus: TasksByStatus
  recentLeads: RecentLeadActivity[]
  recentTransactions: RecentTransactionActivity[]
}

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

interface ActivityItem {
  id: string
  badge: string
  description: string
  timestamp: string
  icon: LucideIcon
  iconClass: string
  badgeClass: string
}

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  low: 'text-muted-foreground',
  medium: 'text-primary',
  high: 'text-amber-500',
  urgent: 'text-red-500',
}

function ActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="surface-card animate-pulse p-5 lg:col-span-2">
        <div className="mb-4 h-4 w-32 rounded bg-muted" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
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

function getLeadTarget(lead: RecentLeadActivity) {
  return lead.property_name ? `${lead.property_name} - ${lead.client_name}` : lead.client_name
}

function getLeadDescription(lead: RecentLeadActivity, t: ReturnType<typeof useTranslation>['t']) {
  const target = getLeadTarget(lead)

  if (lead.status === 'viewing_scheduled') {
    return `${t.dashboard.leadViewingScheduled} ${target}`
  }

  if (lead.status === 'closed_won') {
    return `${t.dashboard.leadClosedWon} ${target}`
  }

  if (lead.status === 'new') {
    return `${t.dashboard.leadCreated} ${target}`
  }

  return `${t.dashboard.leadUpdated} ${target}`
}

function getTransactionDescription(transaction: RecentTransactionActivity, t: ReturnType<typeof useTranslation>['t']) {
  if (transaction.status === 'completed') {
    return `${t.dashboard.transactionCompleted} ${transaction.property_name}`
  }

  if (transaction.status === 'cancelled') {
    return `${t.dashboard.transactionCancelled} ${transaction.property_name}`
  }

  return `${t.dashboard.transactionPending} ${transaction.property_name}`
}

export default function RecentActivity({
  tasksByStatus,
  recentLeads,
  recentTransactions,
}: RecentActivityProps) {
  const { t, language } = useTranslation()
  const notifications = useNotificationStore((state) => state.notifications)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const priorityLabels: Record<Task['priority'], string> = {
    low: t.tasks.priorities.low,
    medium: t.tasks.priorities.medium,
    high: t.tasks.priorities.high,
    urgent: t.tasks.priorities.urgent,
  }

  const allTasks = [
    ...tasksByStatus.done,
    ...tasksByStatus.in_progress,
    ...tasksByStatus.todo,
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))

  const taskActivities: ActivityItem[] = allTasks.slice(0, 6).map((task) => ({
    id: task.id,
    badge: t.dashboard.badgeTask,
    description:
      task.status === 'done'
        ? `${t.dashboard.activityCompleted} ${task.title}`
        : task.status === 'in_progress'
          ? `${t.dashboard.activityInProgress} ${task.title}`
          : `${t.dashboard.activityNewTask} ${task.title}`,
    timestamp: task.created_at,
    icon: ClipboardList,
    iconClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  }))

  const leadActivities: ActivityItem[] = recentLeads.map((lead) => ({
    id: lead.id,
    badge: t.dashboard.badgeLead,
    description: getLeadDescription(lead, t),
    timestamp: lead.created_at,
    icon: UserPlus,
    iconClass: 'bg-primary/12 text-primary',
    badgeClass: 'bg-primary/12 text-primary',
  }))

  const transactionActivities: ActivityItem[] = recentTransactions.map((transaction) => ({
    id: transaction.id,
    badge: t.dashboard.badgeTransaction,
    description: getTransactionDescription(transaction, t),
    timestamp: transaction.date,
    icon: CircleDollarSign,
    iconClass: 'bg-green-500/15 text-green-600 dark:text-green-400',
    badgeClass: 'bg-green-500/15 text-green-600 dark:text-green-400',
  }))

  const notificationActivities: ActivityItem[] = (mounted ? notifications : []).map((notification) => ({
    id: notification.id,
    badge: t.dashboard.badgeNotification,
    description: notification.title,
    timestamp: notification.timestamp,
    icon: Bell,
    iconClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    badgeClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  }))

  const activities = [
    ...leadActivities,
    ...transactionActivities,
    ...taskActivities,
    ...notificationActivities,
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  const statuses = [
    { label: t.dashboard.taskTodo, count: tasksByStatus.todo.length, color: 'bg-warning/15 text-warning' },
    { label: t.dashboard.taskInProgress, count: tasksByStatus.in_progress.length, color: 'bg-primary/12 text-primary' },
    { label: t.dashboard.taskDone, count: tasksByStatus.done.length, color: 'bg-green-500/15 text-green-500' },
  ]

  const urgentTasks = [
    ...tasksByStatus.todo,
    ...tasksByStatus.in_progress,
  ]
    .filter((task) => task.priority === 'urgent' || task.priority === 'high')
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
    .slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="surface-card p-5 lg:col-span-2">
        <p className="mb-4 text-sm font-semibold text-foreground">{t.dashboard.recentActivity}</p>
        {activities.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            {t.dashboard.feedEmpty}
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((item) => {
              const Icon = item.icon

              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-border bg-muted/25 p-3 transition-all duration-200 hover:border-primary/20 hover:bg-muted/40"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl', item.iconClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', item.badgeClass)}>
                          {item.badge}
                        </span>
                        <span className="text-xs text-muted-foreground/80">{relativeTime(item.timestamp, language)}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium leading-6 text-foreground">{item.description}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="surface-card p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">{t.dashboard.tasks}</p>

        <div className="mb-4 flex gap-2">
          {statuses.map((status) => (
            <span
              key={status.label}
              className={cn('flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium', status.color)}
            >
              {status.count} {status.label}
            </span>
          ))}
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          {t.dashboard.priority}
        </p>
        {urgentTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashboard.noUrgentTasks}</p>
        ) : (
          <ul className="space-y-2">
            {urgentTasks.map((task) => (
              <li key={task.id} className="rounded-xl border border-border bg-muted/40 p-2.5">
                <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className={cn('text-xs font-medium', PRIORITY_COLOR[task.priority])}>
                    {priorityLabels[task.priority]}
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
