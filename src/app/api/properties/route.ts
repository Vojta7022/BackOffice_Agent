import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { Property, PropertyStatus, PropertyType, RenovationStatus } from '@/types'

const PROPERTY_STATUSES: PropertyStatus[] = ['available', 'reserved', 'sold', 'rented']
const RENOVATION_STATUSES: RenovationStatus[] = ['original', 'partial', 'full']

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isEnumValue<T extends string>(value: unknown, allowed: T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

function buildPropertyUpdates(body: Record<string, unknown>): { data?: Partial<Property>; error?: string } {
  const updates: Partial<Property> = {}

  if (body.price !== undefined) {
    if (!isNumber(body.price) || body.price < 0) return { error: 'Cena musí být kladné číslo.' }
    updates.price = body.price
  }

  if (body.status !== undefined) {
    if (!isEnumValue(body.status, PROPERTY_STATUSES)) return { error: 'Stav nemovitosti není platný.' }
    updates.status = body.status
  }

  if (body.renovation_status !== undefined) {
    if (body.renovation_status !== null && !isEnumValue(body.renovation_status, RENOVATION_STATUSES)) {
      return { error: 'Stav rekonstrukce není platný.' }
    }
    updates.renovation_status = body.renovation_status as RenovationStatus | null
  }

  if (body.renovation_year !== undefined) {
    if (body.renovation_year !== null && !isNumber(body.renovation_year)) {
      return { error: 'Rok rekonstrukce musí být číslo nebo prázdná hodnota.' }
    }
    updates.renovation_year = body.renovation_year as number | null
  }

  if (body.construction_notes !== undefined) {
    if (body.construction_notes !== null && !isString(body.construction_notes)) {
      return { error: 'Stavební poznámky musí být text nebo prázdná hodnota.' }
    }
    updates.construction_notes = body.construction_notes as string | null
  }

  if (body.description !== undefined) {
    if (!isString(body.description)) return { error: 'Popis musí být text.' }
    updates.description = body.description
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Nebyla zadána žádná data k úpravě.' }
  }

  return { data: updates }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search')
    const status = searchParams.get('status') as PropertyStatus | null
    const type = searchParams.get('type') as PropertyType | null
    const city = searchParams.get('city')

    const properties = search
      ? db.searchProperties(search)
      : db.getAllProperties({
          status: status ?? undefined,
          type: type ?? undefined,
          city: city ?? undefined,
        })

    return NextResponse.json({ properties, total: properties.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data nemovitosti.')
    if (!isString(body.id) || !body.id.trim()) return badRequest('ID nemovitosti je povinné.')

    const result = buildPropertyUpdates(body)
    if (result.error) return badRequest(result.error)

    const property = db.updateProperty(body.id, result.data as Partial<Property>)
    if (!property) {
      return NextResponse.json({ error: 'Nemovitost nebyla nalezena.' }, { status: 404 })
    }

    return NextResponse.json({ property })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
