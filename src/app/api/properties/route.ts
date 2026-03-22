import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { PropertyStatus, PropertyType } from '@/types'

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
