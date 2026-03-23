'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Plus,
  Check,
  GripVertical,
  X,
} from 'lucide-react'
import { agents } from '@/data/agents'
import FormModal from '@/components/ui/FormModal'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn, fetchJson, relativeTime } from '@/lib/utils'
import { useTranslation } from '@/lib/useTranslation'
import type { Client, Property, Task, TaskPriority, TaskStatus } from '@/types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-muted-foreground',
}

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-amber-500',
  low: 'text-muted-foreground',
}

const FIELD_CLASSNAME = 'control-focus w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm dark:shadow-none'

interface TasksData {
  todo: Task[]
  in_progress: Task[]
  done: Task[]
}

interface TaskFormValues {
  title: string
  description: string
  assigned_to: string
  priority: TaskPriority
  due_date: string
  related_property_id: string
  related_client_id: string
  status: TaskStatus
}

function createEmptyTaskForm(): TaskFormValues {
  return {
    title: '',
    description: '',
    assigned_to: agents[0]?.id ?? '',
    priority: 'medium',
    due_date: '',
    related_property_id: '',
    related_client_id: '',
    status: 'todo',
  }
}

function toTaskFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    assigned_to: task.assigned_to,
    priority: task.priority,
    due_date: task.due_date,
    related_property_id: task.related_property_id ?? '',
    related_client_id: task.related_client_id ?? '',
    status: task.status,
  }
}

function isDueSoon(dueDate: string): boolean {
  const now = new Date('2026-03-22')
  const due = new Date(dueDate)
  return due >= now && due.getTime() - now.getTime() <= 3 * 86_400_000
}

function isOverdue(dueDate: string): boolean {
  return dueDate < '2026-03-22'
}

function getNextStatus(status: TaskStatus): TaskStatus | null {
  if (status === 'todo') return 'in_progress'
  if (status === 'in_progress') return 'done'
  return null
}

function TaskCard({
  task,
  agentLabel,
  onEdit,
  onAdvance,
  onDelete,
}: {
  task: Task
  agentLabel?: string
  onEdit: (task: Task) => void
  onAdvance: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const { t, language } = useTranslation()
  const overdue = isOverdue(task.due_date)
  const dueSoon = !overdue && isDueSoon(task.due_date)
  const nextStatus = getNextStatus(task.status)
  const priorityLabels: Record<TaskPriority, string> = {
    urgent: t.tasks.priorities.urgent,
    high: t.tasks.priorities.high,
    medium: t.tasks.priorities.medium,
    low: t.tasks.priorities.low,
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(task)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onEdit(task)
        }
      }}
      className="group rounded-2xl border border-border bg-background/70 p-3 transition-all duration-200 hover:border-primary/15 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="mb-2 flex items-start gap-2">
        <div className="mt-0.5 flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          <div className={cn('h-2 w-2 rounded-full', PRIORITY_COLORS[task.priority])} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
          {agentLabel ? (
            <p className="mt-1 text-[11px] text-muted-foreground">{t.tasks.assignedPrefix} {agentLabel}</p>
          ) : null}
        </div>

        <div className="flex gap-1">
          {nextStatus ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onAdvance(task)
              }}
              className="button-smooth rounded-xl border border-border bg-background px-2 py-1 text-muted-foreground hover:border-primary/20 hover:text-primary"
              title={nextStatus === 'in_progress' ? t.tasks.moveToInProgress : t.tasks.markDone}
              aria-label={nextStatus === 'in_progress' ? t.tasks.moveToInProgress : t.tasks.markDone}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(task)
            }}
            className="button-smooth rounded-xl border border-border bg-background px-2 py-1 text-muted-foreground hover:border-red-500/30 hover:text-red-500"
            title={t.tasks.deleteTitle}
            aria-label={t.tasks.deleteTitle}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {task.description ? (
        <p className="mb-2 pl-6 text-xs leading-relaxed text-muted-foreground line-clamp-2">{task.description}</p>
      ) : null}

      <div className="flex items-center justify-between pl-6">
        <span className={cn('text-[11px] font-medium', PRIORITY_TEXT[task.priority])}>
          {priorityLabels[task.priority]}
        </span>
        <div className={cn(
          'flex items-center gap-1 text-[11px]',
          overdue ? 'text-red-500' : dueSoon ? 'text-amber-500' : 'text-muted-foreground',
        )}>
          <Calendar className="h-3 w-3" />
          {overdue ? t.tasks.overdueLabel : relativeTime(task.due_date, language)}
        </div>
      </div>
    </div>
  )
}

function TaskCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-3 animate-pulse">
      <div className="mb-2 flex items-start gap-2">
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted/60" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
      <div className="mb-1 ml-6 h-3 w-full rounded bg-muted/60" />
      <div className="mb-2 ml-6 h-3 w-2/3 rounded bg-muted/60" />
      <div className="flex justify-between pl-6">
        <div className="h-3 w-12 rounded bg-muted/40" />
        <div className="h-3 w-16 rounded bg-muted/40" />
      </div>
    </div>
  )
}

function KanbanColumn({
  status,
  label,
  icon: Icon,
  color,
  tasks,
  loading,
  agentNames,
  onEdit,
  onAdvance,
  onDelete,
}: {
  status: TaskStatus
  label: string
  icon: React.ElementType
  color: string
  tasks: Task[]
  loading: boolean
  agentNames: Record<string, string>
  onEdit: (task: Task) => void
  onAdvance: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const { t } = useTranslation()

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

      <div className="flex flex-1 flex-col gap-2 p-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <TaskCardSkeleton key={index} />)
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              agentLabel={agentNames[task.assigned_to]}
              onEdit={onEdit}
              onAdvance={onAdvance}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-muted-foreground/60">{t.tasks.noTasks}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { t } = useTranslation()
  const { confirm, dialog } = useConfirmDialog()
  const [tasks, setTasks] = useState<TasksData>({ todo: [], in_progress: [], done: [] })
  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formValues, setFormValues] = useState<TaskFormValues>(createEmptyTaskForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const agentNames = useMemo(
    () => Object.fromEntries(agents.map((agent) => [agent.id, agent.name])),
    []
  )

  async function fetchTasks() {
    const data = await fetchJson<TasksData>('/api/tasks')
    setTasks(data)
  }

  async function fetchOptions() {
    const [clientsData, propertiesData] = await Promise.all([
      fetchJson<{ clients: Client[] }>('/api/clients'),
      fetchJson<{ properties: Property[] }>('/api/properties'),
    ])

    setClients(clientsData.clients ?? [])
    setProperties(propertiesData.properties ?? [])
  }

  useEffect(() => {
    async function loadPage() {
      setLoading(true)
      try {
        await Promise.all([fetchTasks(), fetchOptions()])
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [])

  const total = tasks.todo.length + tasks.in_progress.length + tasks.done.length
  const urgentCount = [...tasks.todo, ...tasks.in_progress].filter((task) => task.priority === 'urgent').length
  const overdueCount = [...tasks.todo, ...tasks.in_progress].filter((task) => isOverdue(task.due_date)).length
  const priorityLabels: Record<TaskPriority, string> = {
    urgent: t.tasks.priorities.urgent,
    high: t.tasks.priorities.high,
    medium: t.tasks.priorities.medium,
    low: t.tasks.priorities.low,
  }
  const statusLabels: Record<TaskStatus, string> = {
    todo: t.tasks.statusLabels.todo,
    in_progress: t.tasks.statusLabels.in_progress,
    done: t.tasks.statusLabels.done,
  }
  const columnConfig: { status: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
    { status: 'todo', label: t.tasks.todo, icon: Clock, color: 'text-muted-foreground' },
    { status: 'in_progress', label: t.tasks.inProgress, icon: AlertCircle, color: 'text-violet-500' },
    { status: 'done', label: t.tasks.done, icon: CheckCircle2, color: 'text-primary' },
  ]

  function openCreateModal() {
    setEditingTask(null)
    setFormValues(createEmptyTaskForm())
    setFormError(null)
    setIsModalOpen(true)
  }

  function openEditModal(task: Task) {
    setEditingTask(task)
    setFormValues(toTaskFormValues(task))
    setFormError(null)
    setIsModalOpen(true)
  }

  async function handleAdvance(task: Task) {
    const nextStatus = getNextStatus(task.status)
    if (!nextStatus) return

    await fetchJson<{ task: Task }>('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: nextStatus }),
    })

    await fetchTasks()
  }

  async function handleDelete(task: Task) {
    const approved = await confirm({
      title: t.tasks.deleteTitle,
      message: `${t.tasks.confirmDelete} "${task.title}"?`,
      confirmLabel: t.common.delete,
    })

    if (!approved) return

    await fetchJson<{ success: boolean }>('/api/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id }),
    })

    await fetchTasks()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!formValues.title.trim()) {
      setFormError(t.tasks.validationTitleRequired)
      return
    }

    if (!formValues.due_date) {
      setFormError(t.tasks.validationDueDateRequired)
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        title: formValues.title.trim(),
        description: formValues.description,
        assigned_to: formValues.assigned_to,
        priority: formValues.priority,
        due_date: formValues.due_date,
        related_property_id: formValues.related_property_id || null,
        related_client_id: formValues.related_client_id || null,
        ...(editingTask ? { status: formValues.status } : {}),
      }

      if (editingTask) {
        await fetchJson<{ task: Task }>('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTask.id, ...payload }),
        })
      } else {
        await fetchJson<{ task: Task }>('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      setIsModalOpen(false)
      setEditingTask(null)
      setFormValues(createEmptyTaskForm())
      await fetchTasks()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t.common.unknownError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="surface-card flex items-center gap-2 px-4 py-2.5">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{loading ? '…' : total}</span>
            <span className="text-xs text-muted-foreground">{t.tasks.total}</span>
          </div>
          {!loading && urgentCount > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 shadow-sm dark:shadow-none">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-red-500">{urgentCount}</span>
              <span className="text-xs text-red-500/70">{t.tasks.urgent}</span>
            </div>
          ) : null}
          {!loading && overdueCount > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 shadow-sm dark:shadow-none">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-500">{overdueCount}</span>
              <span className="text-xs text-amber-500/70">{t.tasks.overdue}</span>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="button-smooth inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 dark:shadow-none"
        >
          <Plus className="h-4 w-4" />
          {t.tasks.addNew}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columnConfig.map((column) => (
          <KanbanColumn
            key={column.status}
            {...column}
            tasks={tasks[column.status]}
            loading={loading}
            agentNames={agentNames}
            onEdit={openEditModal}
            onAdvance={handleAdvance}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingTask ? t.tasks.editTitle : t.tasks.newTitle}
        submitLabel={editingTask ? t.tasks.saveEdit : t.tasks.saveNew}
        submitLoadingLabel={editingTask ? t.tasks.savingEdit : t.tasks.savingNew}
        isSubmitting={isSubmitting}
        error={formError}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">{t.tasks.taskTitle}</span>
            <input
              value={formValues.title}
              onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
              className={FIELD_CLASSNAME}
              placeholder={t.tasks.placeholderTitle}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">{t.tasks.description}</span>
            <textarea
              value={formValues.description}
              onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
              className={cn(FIELD_CLASSNAME, 'min-h-[120px] resize-y')}
              placeholder={t.tasks.placeholderDescription}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{t.tasks.assignedTo}</span>
            <select
              value={formValues.assigned_to}
              onChange={(event) => setFormValues((current) => ({ ...current, assigned_to: event.target.value }))}
              className={FIELD_CLASSNAME}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{t.tasks.priority}</span>
            <select
              value={formValues.priority}
              onChange={(event) => setFormValues((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
              className={FIELD_CLASSNAME}
            >
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{t.tasks.dueDate}</span>
            <input
              type="date"
              value={formValues.due_date}
              onChange={(event) => setFormValues((current) => ({ ...current, due_date: event.target.value }))}
              className={FIELD_CLASSNAME}
            />
          </label>

          {editingTask ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t.tasks.status}</span>
              <select
                value={formValues.status}
                onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as TaskStatus }))}
                className={FIELD_CLASSNAME}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{t.tasks.relatedProperty}</span>
            <select
              value={formValues.related_property_id}
              onChange={(event) => setFormValues((current) => ({ ...current, related_property_id: event.target.value }))}
              className={FIELD_CLASSNAME}
            >
              <option value="">{t.tasks.noRelation}</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">{t.tasks.relatedClient}</span>
            <select
              value={formValues.related_client_id}
              onChange={(event) => setFormValues((current) => ({ ...current, related_client_id: event.target.value }))}
              className={FIELD_CLASSNAME}
            >
              <option value="">{t.tasks.noRelation}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FormModal>

      {dialog}
    </div>
  )
}
