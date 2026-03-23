import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { Client, ClientSource, ClientStatus, ClientType } from '@/types'

const CLIENT_TYPES: ClientType[] = ['buyer', 'seller', 'investor', 'tenant']
const CLIENT_SOURCES: ClientSource[] = ['website', 'referral', 'sreality', 'bezrealitky', 'instagram', 'facebook', 'cold_call', 'walk_in', 'other']
const CLIENT_STATUSES: ClientStatus[] = ['active', 'inactive', 'closed']

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEnumValue<T extends string>(value: unknown, allowed: T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function buildClientPayload(
  body: Record<string, unknown>,
  mode: 'create' | 'update'
): { data?: Omit<Client, 'id' | 'created_at'> | Partial<Client>; error?: string } {
  const payload: Partial<Client> = {}

  if (mode === 'create' || body.name !== undefined) {
    if (!isString(body.name) || !body.name.trim()) return { error: 'Jméno klienta je povinné.' }
    payload.name = body.name.trim()
  }

  if (mode === 'create' || body.email !== undefined) {
    if (!isString(body.email) || !body.email.trim()) return { error: 'E-mail je povinný.' }
    if (!body.email.includes('@')) return { error: 'E-mail nemá správný formát.' }
    payload.email = body.email.trim()
  }

  if (mode === 'create' || body.phone !== undefined) {
    if (!isString(body.phone)) return { error: 'Telefon musí být text.' }
    payload.phone = body.phone.trim()
  }

  if (mode === 'create' || body.type !== undefined) {
    if (!isEnumValue(body.type, CLIENT_TYPES)) return { error: 'Typ klienta není platný.' }
    payload.type = body.type
  }

  if (mode === 'create' || body.source !== undefined) {
    if (!isEnumValue(body.source, CLIENT_SOURCES)) return { error: 'Zdroj klienta není platný.' }
    payload.source = body.source
  }

  if (mode === 'create' || body.status !== undefined) {
    if (!isEnumValue(body.status, CLIENT_STATUSES)) return { error: 'Stav klienta není platný.' }
    payload.status = body.status
  }

  if (mode === 'create' || body.notes !== undefined) {
    if (!isString(body.notes)) return { error: 'Poznámka musí být text.' }
    payload.notes = body.notes
  }

  if (mode === 'create' || body.assigned_agent !== undefined) {
    if (!isString(body.assigned_agent) || !body.assigned_agent.trim()) {
      return { error: 'Přiřazený agent je povinný.' }
    }
    if (!db.getAgentById(body.assigned_agent)) {
      return { error: 'Vybraný agent neexistuje.' }
    }
    payload.assigned_agent = body.assigned_agent
  }

  if (mode === 'update' && Object.keys(payload).length === 0) {
    return { error: 'Nebyla zadána žádná data k úpravě.' }
  }

  return {
    data: mode === 'create'
      ? payload as Omit<Client, 'id' | 'created_at'>
      : payload,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search')
    const type = searchParams.get('type') as ClientType | null
    const source = searchParams.get('source') as ClientSource | null
    const status = searchParams.get('status') as ClientStatus | null

    const clients = search
      ? db.searchClients(search)
      : db.getAllClients({
          type: type ?? undefined,
          source: source ?? undefined,
          status: status ?? undefined,
        })

    return NextResponse.json({ clients, total: clients.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data klienta.')

    const result = buildClientPayload(body, 'create')
    if (result.error) return badRequest(result.error)

    const client = db.addClient(result.data as Omit<Client, 'id' | 'created_at'>)
    return NextResponse.json({ client }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data klienta.')
    if (!isString(body.id) || !body.id.trim()) return badRequest('ID klienta je povinné.')

    const result = buildClientPayload(body, 'update')
    if (result.error) return badRequest(result.error)

    const client = db.updateClient(body.id, result.data as Partial<Client>)
    if (!client) {
      return NextResponse.json({ error: 'Klient nebyl nalezen.' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data požadavku.')
    if (!isString(body.id) || !body.id.trim()) return badRequest('ID klienta je povinné.')

    const deleted = db.deleteClient(body.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Klient nebyl nalezen.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
