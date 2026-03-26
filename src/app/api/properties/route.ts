import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { Property, PropertyStatus, PropertyType, RenovationStatus } from '@/types'

const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'land', 'commercial', 'office']
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

function buildPropertyCreateData(body: Record<string, unknown>): { data?: Omit<Property, 'id' | 'created_at' | 'updated_at'>; error?: string } {
  if (!isString(body.name) || !body.name.trim()) return { error: 'Název nemovitosti je povinný.' }
  if (!isEnumValue(body.type, PROPERTY_TYPES)) return { error: 'Typ nemovitosti není platný.' }
  if (!isEnumValue(body.status, PROPERTY_STATUSES)) return { error: 'Stav nemovitosti není platný.' }
  if (!isNumber(body.price) || body.price <= 0) return { error: 'Cena musí být kladné číslo.' }
  if (!isNumber(body.area_sqm) || body.area_sqm <= 0) return { error: 'Plocha musí být kladné číslo.' }
  if (!isRecord(body.address)) return { error: 'Adresa nemovitosti je povinná.' }

  const address = body.address
  if (!isString(address.street) || !address.street.trim()) return { error: 'Ulice je povinná.' }
  if (!isString(address.city) || !address.city.trim()) return { error: 'Město je povinné.' }
  if (!isString(address.district) || !address.district.trim()) return { error: 'Městská část je povinná.' }
  if (address.zip !== undefined && !isString(address.zip)) return { error: 'PSČ musí být text.' }

  if (body.rooms !== undefined && body.rooms !== null && !isNumber(body.rooms)) {
    return { error: 'Počet pokojů musí být číslo nebo prázdná hodnota.' }
  }
  if (body.floor !== undefined && body.floor !== null && !isNumber(body.floor)) {
    return { error: 'Patro musí být číslo nebo prázdná hodnota.' }
  }
  if (body.total_floors !== undefined && body.total_floors !== null && !isNumber(body.total_floors)) {
    return { error: 'Celkem pater musí být číslo nebo prázdná hodnota.' }
  }
  if (body.year_built !== undefined && body.year_built !== null && !isNumber(body.year_built)) {
    return { error: 'Rok výstavby musí být číslo nebo prázdná hodnota.' }
  }
  if (body.renovation_status !== undefined && body.renovation_status !== null && !isEnumValue(body.renovation_status, RENOVATION_STATUSES)) {
    return { error: 'Stav rekonstrukce není platný.' }
  }
  if (body.description !== undefined && !isString(body.description)) {
    return { error: 'Popis musí být text.' }
  }

  return {
    data: {
      name: body.name.trim(),
      type: body.type,
      status: body.status,
      price: body.price,
      area_sqm: body.area_sqm,
      rooms: (body.rooms as number | null | undefined) ?? null,
      floor: (body.floor as number | null | undefined) ?? null,
      total_floors: (body.total_floors as number | null | undefined) ?? null,
      year_built: (body.year_built as number | null | undefined) ?? null,
      renovation_status: (body.renovation_status as RenovationStatus | null | undefined) ?? null,
      renovation_year: null,
      construction_notes: null,
      description: isString(body.description) ? body.description.trim() : '',
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        district: address.district.trim(),
        zip: isString(address.zip) ? address.zip.trim() : '',
      },
      images: [],
      owner_id: '',
    },
  }
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!isRecord(body)) return badRequest('Neplatná data nemovitosti.')

    const result = buildPropertyCreateData(body)
    if (result.error) return badRequest(result.error)

    const property = db.addProperty(result.data as Omit<Property, 'id' | 'created_at' | 'updated_at'>)
    return NextResponse.json({ property }, { status: 201 })
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
