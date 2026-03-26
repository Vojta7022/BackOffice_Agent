import { NextRequest, NextResponse } from 'next/server'
import { fetchAllListings } from '@/lib/monitoring/fetcher'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const location = req.nextUrl.searchParams.get('location')?.trim() || 'Holešovice'
    const results = await fetchAllListings(location)
    return NextResponse.json(results)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
