import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { ClientStatus, ClientType, ClientSource } from '@/types'

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
