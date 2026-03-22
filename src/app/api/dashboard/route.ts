import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    const stats = db.getDashboardStats()
    const leadsByMonth = db.getLeadsByMonth(6)
    const transactionsByMonth = db.getTransactionsByMonth(6)
    const tasksByStatus = db.getTasksByStatus()

    return NextResponse.json({ stats, leadsByMonth, transactionsByMonth, tasksByStatus })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
