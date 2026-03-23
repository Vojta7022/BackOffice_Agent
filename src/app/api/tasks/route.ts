import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { Task, TaskPriority, TaskStatus } from '@/types'

const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isEnumValue<T extends string>(value: unknown, allowed: T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

function parseRelationId(
  value: unknown,
  label: string,
  exists: (id: string) => boolean
): { value?: string | null; error?: string } {
  if (value === undefined) return {}
  if (value === null || value === '') return { value: null }
  if (!isString(value)) return { error: `${label} musí být text nebo prázdná hodnota.` }
  if (!exists(value)) return { error: `${label} neexistuje.` }
  return { value }
}

function buildTaskPayload(
  body: Record<string, unknown>,
  mode: 'create' | 'update'
): { data?: Omit<Task, 'id' | 'created_at'> | Partial<Task>; error?: string } {
  const payload: Partial<Task> = {}

  if (mode === 'create' || body.title !== undefined) {
    if (!isString(body.title) || !body.title.trim()) return { error: 'Název úkolu je povinný.' }
    payload.title = body.title.trim()
  }

  if (mode === 'create' || body.description !== undefined) {
    if (!isString(body.description)) return { error: 'Popis úkolu musí být text.' }
    payload.description = body.description
  }

  if (mode === 'create' || body.assigned_to !== undefined) {
    if (!isString(body.assigned_to) || !body.assigned_to.trim()) return { error: 'Přiřazený agent je povinný.' }
    if (!db.getAgentById(body.assigned_to)) return { error: 'Vybraný agent neexistuje.' }
    payload.assigned_to = body.assigned_to
  }

  if (mode === 'create' || body.priority !== undefined) {
    if (!isEnumValue(body.priority, TASK_PRIORITIES)) return { error: 'Priorita úkolu není platná.' }
    payload.priority = body.priority
  }

  if (mode === 'create' || body.status !== undefined) {
    if (!isEnumValue(body.status, TASK_STATUSES)) return { error: 'Stav úkolu není platný.' }
    payload.status = body.status
  }

  if (mode === 'create' || body.due_date !== undefined) {
    if (!isString(body.due_date) || !body.due_date.trim()) return { error: 'Termín splnění je povinný.' }
    payload.due_date = body.due_date
  }

  const relatedProperty = parseRelationId(body.related_property_id, 'Vybraná nemovitost', (id) => !!db.getPropertyById(id))
  if (relatedProperty.error) return { error: relatedProperty.error }
  if (relatedProperty.value !== undefined) payload.related_property_id = relatedProperty.value

  const relatedClient = parseRelationId(body.related_client_id, 'Vybraný klient', (id) => !!db.getClientById(id))
  if (relatedClient.error) return { error: relatedClient.error }
  if (relatedClient.value !== undefined) payload.related_client_id = relatedClient.value

  if (mode === 'create' && payload.status === undefined) {
    payload.status = 'todo'
  }

  if (mode === 'update' && Object.keys(payload).length === 0) {
    return { error: 'Nebyla zadána žádná data k úpravě.' }
  }

  return {
    data: mode === 'create'
      ? payload as Omit<Task, 'id' | 'created_at'>
      : payload,
  }
}

export async function GET() {
  try {
    const tasksByStatus = db.getTasksByStatus()
    return NextResponse.json(tasksByStatus)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data úkolu.')

    const result = buildTaskPayload(body, 'create')
    if (result.error) return badRequest(result.error)

    const task = db.addTask(result.data as Omit<Task, 'id' | 'created_at'>)
    return NextResponse.json({ task }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data úkolu.')
    if (!isString(body.id) || !body.id.trim()) return badRequest('ID úkolu je povinné.')

    const result = buildTaskPayload(body, 'update')
    if (result.error) return badRequest(result.error)

    const task = db.updateTask(body.id, result.data as Partial<Task>)
    if (!task) {
      return NextResponse.json({ error: 'Úkol nebyl nalezen.' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data požadavku.')
    if (!isString(body.id) || !body.id.trim()) return badRequest('ID úkolu je povinné.')
    if (!isEnumValue(body.status, TASK_STATUSES)) return badRequest('Cílový stav úkolu není platný.')

    const task = db.moveTask(body.id, body.status)
    if (!task) {
      return NextResponse.json({ error: 'Úkol nebyl nalezen.' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data požadavku.')
    if (!isString(body.id) || !body.id.trim()) return badRequest('ID úkolu je povinné.')

    const deleted = db.deleteTask(body.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Úkol nebyl nalezen.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
