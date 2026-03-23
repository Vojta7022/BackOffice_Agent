'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { cn, relativeTime } from '@/lib/utils'
import type { Task, TaskPriority, TaskStatus } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-muted-foreground',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgentní',
  high: 'Vysoká',
  medium: 'Střední',
  low: 'Nízká',
}

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  urgent: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-muted-foreground',
}

const COLUMN_CONFIG: { status: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'todo',        label: 'K provedení',  icon: Clock,         color: 'text-muted-foreground' },
  { status: 'in_progress', label: 'Probíhá',       icon: AlertCircle,   color: 'text-violet-500' },
  { status: 'done',        label: 'Hotovo',        icon: CheckCircle2,  color: 'text-primary' },
]

function isDueSoon(dueDate: string): boolean {
  const now = new Date('2026-03-22')
  const due = new Date(dueDate)
  return due >= now && due.getTime() - now.getTime() <= 3 * 86_400_000
}

function isOverdue(dueDate: string): boolean {
  return dueDate < '2026-03-22'
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  const overdue = isOverdue(task.due_date)
  const dueSoon = !overdue && isDueSoon(task.due_date)

  return (
    <div className="rounded-2xl border border-border bg-background/70 p-3 transition-all duration-200 hover:border-primary/15 hover:bg-background">
      <div className="flex items-start gap-2 mb-2">
        <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', PRIORITY_COLORS[task.priority])} />
        <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2 pl-4">{task.description}</p>
      )}

      <div className="flex items-center justify-between pl-4">
        <span className={cn('text-[11px] font-medium', PRIORITY_TEXT[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <div className={cn(
          'flex items-center gap-1 text-[11px]',
          overdue ? 'text-red-400' : dueSoon ? 'text-amber-400' : 'text-muted-foreground',
        )}>
          <Calendar className="h-3 w-3" />
          {overdue ? 'Po termínu' : relativeTime(task.due_date)}
        </div>
      </div>
    </div>
  )
}

function TaskCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-3 animate-pulse">
      <div className="flex items-start gap-2 mb-2">
        <div className="mt-1.5 h-2 w-2 rounded-full bg-muted/60 shrink-0" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
      <div className="h-3 bg-muted/60 rounded w-full mb-1 ml-4" />
      <div className="h-3 bg-muted/60 rounded w-2/3 mb-2 ml-4" />
      <div className="flex justify-between pl-4">
        <div className="h-3 bg-muted/40 rounded w-12" />
        <div className="h-3 bg-muted/40 rounded w-16" />
      </div>
    </div>
  )
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  status, label, icon: Icon, color,
  tasks, loading,
}: {
  status: TaskStatus
  label: string
  icon: React.ElementType
  color: string
  tasks: Task[]
  loading: boolean
}) {
  return (
    <div className="surface-card flex min-h-[400px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className={cn(
          'ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
          status === 'todo' ? 'bg-muted text-muted-foreground' :
          status === 'in_progress' ? 'bg-violet-500/15 text-violet-500' :
          'bg-primary/10 text-primary',
        )}>
          {loading ? '…' : tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3 flex-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <TaskCardSkeleton key={i} />)
        ) : tasks.length > 0 ? (
          tasks.map(t => <TaskCard key={t.id} task={t} />)
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-muted-foreground/60">Žádné úkoly</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface TasksData {
  todo: Task[]
  in_progress: Task[]
  done: Task[]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TasksData>({ todo: [], in_progress: [], done: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then((data: TasksData) => setTasks(data))
      .finally(() => setLoading(false))
  }, [])

  const total = tasks.todo.length + tasks.in_progress.length + tasks.done.length
  const urgentCount = [...tasks.todo, ...tasks.in_progress].filter(t => t.priority === 'urgent').length
  const overdueCount = [...tasks.todo, ...tasks.in_progress].filter(t => isOverdue(t.due_date)).length

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="surface-card flex items-center gap-2 px-4 py-2.5">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{loading ? '…' : total}</span>
          <span className="text-xs text-muted-foreground">úkolů celkem</span>
        </div>
        {!loading && urgentCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 shadow-sm dark:shadow-none">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-500">{urgentCount}</span>
            <span className="text-xs text-red-500/70">urgentních</span>
          </div>
        )}
        {!loading && overdueCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 shadow-sm dark:shadow-none">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">{overdueCount}</span>
            <span className="text-xs text-amber-500/70">po termínu</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMN_CONFIG.map(col => (
          <KanbanColumn
            key={col.status}
            {...col}
            tasks={tasks[col.status]}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}
