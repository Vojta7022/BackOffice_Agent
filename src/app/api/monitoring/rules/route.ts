import { NextRequest, NextResponse } from 'next/server'
import type { MonitoringRule } from '@/types'
import { monitoringStore } from '@/lib/monitoring/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(monitoringStore.getRules())
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const id = typeof body?.id === 'string' ? body.id : ''

    if (!id) {
      return NextResponse.json({ error: 'Monitoring rule id is required.' }, { status: 400 })
    }

    const removed = monitoringStore.removeRule(id)
    if (!removed) {
      return NextResponse.json({ error: 'Monitoring rule was not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const id = typeof body?.id === 'string' ? body.id : ''

    if (!id) {
      return NextResponse.json({ error: 'Monitoring rule id is required.' }, { status: 400 })
    }

    const { id: _id, ...updates } = body as Record<string, unknown>
    const updatedRule = monitoringStore.updateRule(id, updates as Partial<MonitoringRule>)

    if (!updatedRule) {
      return NextResponse.json({ error: 'Monitoring rule was not found.' }, { status: 404 })
    }

    return NextResponse.json(updatedRule)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
