import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    const recentLeadCutoff = '2026-03-15'
    const stats = db.getDashboardStats()
    const leadsByMonth = db.getLeadsByMonth(6)
    const transactionsByMonth = db.getTransactionsByMonth(6)
    const tasksByStatus = db.getTasksByStatus()
    const recentLeads = db
      .getAllLeads({ date_from: recentLeadCutoff, date_to: '2026-03-22' })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6)
      .map((lead) => ({
        id: lead.id,
        created_at: lead.created_at,
        status: lead.status,
        type: lead.type,
        client_name: db.getClientById(lead.client_id)?.name ?? lead.client_id,
        property_name: lead.property_id ? db.getPropertyById(lead.property_id)?.name ?? null : null,
      }))
    const recentTransactions = db
      .getTransactions()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
      .map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        status: transaction.status,
        type: transaction.type,
        amount: transaction.amount,
        client_name: db.getClientById(transaction.client_id)?.name ?? transaction.client_id,
        property_name: db.getPropertyById(transaction.property_id)?.name ?? transaction.property_id,
      }))

    return NextResponse.json({
      stats,
      leadsByMonth,
      transactionsByMonth,
      tasksByStatus,
      recentLeads,
      recentTransactions,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
