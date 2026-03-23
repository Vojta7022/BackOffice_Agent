import {
  Property, Client, Lead, Transaction, Task, Agent,
  PropertyType, PropertyStatus,
  ClientType, ClientSource, ClientStatus,
  LeadType, LeadStatus,
  TransactionType, TransactionStatus,
  TaskStatus,
} from '@/types'
import { agents } from '@/data/agents'
import { properties } from '@/data/properties'
import { clients } from '@/data/clients'
import { leads } from '@/data/leads'
import { transactions } from '@/data/transactions'
import { tasks } from '@/data/tasks'

// ─── Reference date ───────────────────────────────────────────────────────────

const NOW = '2026-03-22'
const NOW_MONTH = NOW.substring(0, 7) // '2026-03'

// ─── Date helpers (string-based, YYYY-MM-DD) ──────────────────────────────────

function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

function subtractMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const date = new Date(y, m - 1 - n, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthOf(dateStr: string): string {
  return dateStr.substring(0, 7)
}

function lastNMonths(n: number): string[] {
  const months: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    months.push(subtractMonths(NOW_MONTH, i))
  }
  return months
}

function quarterBounds(year: number, quarter: number): { from: string; to: string } {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = startMonth + 2
  const endDay = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][endMonth]
  return {
    from: `${year}-${String(startMonth).padStart(2, '0')}-01`,
    to: `${year}-${String(endMonth).padStart(2, '0')}-${endDay}`,
  }
}

// ─── Filter type definitions ──────────────────────────────────────────────────

export interface PropertyFilters {
  status?: PropertyStatus
  type?: PropertyType
  city?: string
  district?: string
  price_min?: number
  price_max?: number
}

export interface ClientFilters {
  type?: ClientType
  source?: ClientSource
  status?: ClientStatus
  date_from?: string
  date_to?: string
}

export interface LeadFilters {
  status?: LeadStatus
  type?: LeadType
  date_from?: string
  date_to?: string
}

export interface TransactionFilters {
  type?: TransactionType
  status?: TransactionStatus
  date_from?: string
  date_to?: string
}

// ─── Return types ─────────────────────────────────────────────────────────────

export interface ClientsByQuarter {
  source: ClientSource
  count: number
  clients: Client[]
}

export interface MonthlyClientCount {
  month: string
  count: number
}

export interface MonthlyLeadCount {
  month: string
  count: number
}

export interface MonthlyTransactionSummary {
  month: string
  count: number
  total_value: number
}

export interface MonthlySoldCount {
  month: string
  count: number
}

export interface SalesMetrics {
  total_revenue: number
  total_commission: number
  deals_closed: number
  avg_deal_size: number
  pending_deals: number
  pending_value: number
}

export interface WeeklySummary {
  new_leads: number
  new_clients: number
  viewings_scheduled: number
  deals_closed: number
  revenue: number
}

export interface MonthlyChanges {
  clients: number   // % change vs previous month (rounded to 1dp)
  leads: number
  deals: number
  revenue: number
}

export interface DashboardStatsResult {
  total_properties: number
  active_properties: number             // available + reserved
  total_clients: number
  new_clients_this_month: number
  total_leads_this_month: number
  deals_this_month: number              // completed transactions this month
  revenue_this_month: number            // CZK
  monthly_changes: MonthlyChanges
}

export interface TasksByStatus {
  todo: Task[]
  in_progress: Task[]
  done: Task[]
}

// ─── Database singleton ───────────────────────────────────────────────────────

class Database {
  private readonly agents: Agent[] = agents
  private readonly properties: Property[] = properties
  private readonly clients: Client[] = clients
  private readonly leads: Lead[] = leads
  private readonly transactions: Transaction[] = transactions
  private readonly tasks: Task[] = tasks

  // ── 1. Properties ──────────────────────────────────────────────────────────

  getAllProperties(filters?: PropertyFilters): Property[] {
    return this.properties.filter(p => {
      if (filters?.status && p.status !== filters.status) return false
      if (filters?.type && p.type !== filters.type) return false
      if (filters?.city && p.address.city.toLowerCase() !== filters.city.toLowerCase()) return false
      if (filters?.district && p.address.district.toLowerCase() !== filters.district.toLowerCase()) return false
      if (filters?.price_min !== undefined && p.price < filters.price_min) return false
      if (filters?.price_max !== undefined && p.price > filters.price_max) return false
      return true
    })
  }

  getPropertyById(id: string): Property | undefined {
    return this.properties.find((property) => property.id === id)
  }

  updateProperty(id: string, updates: Partial<Property>): Property | null {
    const index = this.properties.findIndex((property) => property.id === id)
    if (index === -1) return null

    const current = this.properties[index]
    const next: Property = {
      ...current,
      ...updates,
      id: current.id,
      created_at: current.created_at,
      updated_at: NOW,
    }

    this.properties[index] = next
    return next
  }

  // ── 2. Missing data ────────────────────────────────────────────────────────

  getPropertiesWithMissingData(): Property[] {
    return this.properties.filter(p =>
      p.type !== 'land' &&
      (p.renovation_status === null || p.construction_notes === null)
    )
  }

  // ── 3. Clients ─────────────────────────────────────────────────────────────

  getAllClients(filters?: ClientFilters): Client[] {
    return this.clients.filter(c => {
      if (filters?.type && c.type !== filters.type) return false
      if (filters?.source && c.source !== filters.source) return false
      if (filters?.status && c.status !== filters.status) return false
      if (filters?.date_from && c.created_at < filters.date_from) return false
      if (filters?.date_to && c.created_at > filters.date_to) return false
      return true
    })
  }

  getClientById(id: string): Client | undefined {
    return this.clients.find((client) => client.id === id)
  }

  addClient(client: Omit<Client, 'id' | 'created_at'>): Client {
    const createdClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      created_at: NOW,
    }

    this.clients.push(createdClient)
    return createdClient
  }

  updateClient(id: string, updates: Partial<Client>): Client | null {
    const index = this.clients.findIndex((client) => client.id === id)
    if (index === -1) return null

    const current = this.clients[index]
    const next: Client = {
      ...current,
      ...updates,
      id: current.id,
      created_at: current.created_at,
    }

    this.clients[index] = next
    return next
  }

  deleteClient(id: string): boolean {
    const index = this.clients.findIndex((client) => client.id === id)
    if (index === -1) return false

    this.clients.splice(index, 1)
    return true
  }

  // ── 4. Clients by quarter grouped by source ────────────────────────────────

  getNewClientsByQuarter(year: number, quarter: number): ClientsByQuarter[] {
    const { from, to } = quarterBounds(year, quarter)
    const quarterClients = this.clients.filter(
      c => c.created_at >= from && c.created_at <= to
    )

    const grouped = new Map<ClientSource, Client[]>()
    for (const c of quarterClients) {
      if (!grouped.has(c.source)) grouped.set(c.source, [])
      grouped.get(c.source)!.push(c)
    }

    return Array.from(grouped.entries())
      .map(([source, clients]) => ({ source, count: clients.length, clients }))
      .sort((a, b) => b.count - a.count)
  }

  // ── 5. Clients by month ────────────────────────────────────────────────────

  getClientsByMonth(months: number): MonthlyClientCount[] {
    const monthList = lastNMonths(months)
    return monthList.map(month => ({
      month,
      count: this.clients.filter(c => monthOf(c.created_at) === month).length,
    }))
  }

  // ── 6. Leads ───────────────────────────────────────────────────────────────

  getAllLeads(filters?: LeadFilters): Lead[] {
    return this.leads.filter(l => {
      if (filters?.status && l.status !== filters.status) return false
      if (filters?.type && l.type !== filters.type) return false
      if (filters?.date_from && l.created_at < filters.date_from) return false
      if (filters?.date_to && l.created_at > filters.date_to) return false
      return true
    })
  }

  // ── 7. Leads by month ──────────────────────────────────────────────────────

  getLeadsByMonth(months: number): MonthlyLeadCount[] {
    const monthList = lastNMonths(months)
    return monthList.map(month => ({
      month,
      count: this.leads.filter(l => monthOf(l.created_at) === month).length,
    }))
  }

  // ── 8. Transactions ────────────────────────────────────────────────────────

  getTransactions(filters?: TransactionFilters): Transaction[] {
    return this.transactions.filter(t => {
      if (filters?.type && t.type !== filters.type) return false
      if (filters?.status && t.status !== filters.status) return false
      if (filters?.date_from && t.date < filters.date_from) return false
      if (filters?.date_to && t.date > filters.date_to) return false
      return true
    })
  }

  // ── 9. Transactions by month ───────────────────────────────────────────────

  getTransactionsByMonth(months: number): MonthlyTransactionSummary[] {
    const monthList = lastNMonths(months)
    return monthList.map(month => {
      const monthTxs = this.transactions.filter(t => monthOf(t.date) === month)
      return {
        month,
        count: monthTxs.length,
        total_value: monthTxs.reduce((sum, t) => sum + t.amount, 0),
      }
    })
  }

  // ── 10. Sold properties by month ───────────────────────────────────────────

  getSoldPropertiesByMonth(months: number): MonthlySoldCount[] {
    const monthList = lastNMonths(months)
    const completed = this.transactions.filter(
      t => t.type === 'sale' && t.status === 'completed'
    )
    return monthList.map(month => ({
      month,
      count: completed.filter(t => monthOf(t.date) === month).length,
    }))
  }

  // ── 11. Sales metrics ──────────────────────────────────────────────────────

  getSalesMetrics(): SalesMetrics {
    const completed = this.transactions.filter(t => t.status === 'completed')
    const completedSales = completed.filter(t => t.type === 'sale')
    const pending = this.transactions.filter(t => t.status === 'pending')

    const total_revenue = completedSales.reduce((sum, t) => sum + t.amount, 0)
    const total_commission = completed.reduce((sum, t) => sum + t.commission, 0)
    const deals_closed = completed.length
    const avg_deal_size = completedSales.length > 0 ? total_revenue / completedSales.length : 0
    const pending_deals = pending.length
    const pending_value = pending.reduce((sum, t) => sum + t.amount, 0)

    return { total_revenue, total_commission, deals_closed, avg_deal_size, pending_deals, pending_value }
  }

  // ── 12. Weekly summary (last 7 days from 2026-03-22) ──────────────────────

  getWeeklySummary(): WeeklySummary {
    const weekStart = subtractDays(NOW, 7)

    const new_leads = this.leads.filter(
      l => l.created_at >= weekStart && l.created_at <= NOW
    ).length

    const new_clients = this.clients.filter(
      c => c.created_at >= weekStart && c.created_at <= NOW
    ).length

    const viewings_scheduled = this.leads.filter(
      l => l.status === 'viewing_scheduled' &&
           l.updated_at >= weekStart && l.updated_at <= NOW
    ).length

    const completedThisWeek = this.transactions.filter(
      t => t.status === 'completed' && t.date >= weekStart && t.date <= NOW
    )
    const deals_closed = completedThisWeek.length
    const revenue = completedThisWeek.reduce((sum, t) => sum + t.amount, 0)

    return { new_leads, new_clients, viewings_scheduled, deals_closed, revenue }
  }

  // ── 13. Search properties ─────────────────────────────────────────────────

  searchProperties(query: string): Property[] {
    const q = query.toLowerCase()
    return this.properties.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.address.street.toLowerCase().includes(q) ||
      p.address.city.toLowerCase().includes(q) ||
      p.address.district.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    )
  }

  // ── 14. Search clients ────────────────────────────────────────────────────

  searchClients(query: string): Client[] {
    const q = query.toLowerCase()
    return this.clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.notes.toLowerCase().includes(q)
    )
  }

  // ── 15. Dashboard stats ───────────────────────────────────────────────────

  getDashboardStats(): DashboardStatsResult {
    const prevMonth = subtractMonths(NOW_MONTH, 1)

    const countInMonth = (arr: { created_at: string }[], m: string) =>
      arr.filter(x => monthOf(x.created_at) === m).length

    const completedInMonth = (m: string) =>
      this.transactions.filter(t => t.status === 'completed' && monthOf(t.date) === m)

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 1000) / 10
    }

    const newClientsCurr = countInMonth(this.clients, NOW_MONTH)
    const newClientsPrev = countInMonth(this.clients, prevMonth)
    const leadsCurr = countInMonth(this.leads, NOW_MONTH)
    const leadsPrev = countInMonth(this.leads, prevMonth)
    const completedCurr = completedInMonth(NOW_MONTH)
    const completedPrev = completedInMonth(prevMonth)
    const revenueCurr = completedCurr.reduce((s, t) => s + t.amount, 0)
    const revenuePrev = completedPrev.reduce((s, t) => s + t.amount, 0)

    return {
      total_properties: this.properties.length,
      active_properties: this.properties.filter(
        p => p.status === 'available' || p.status === 'reserved'
      ).length,
      total_clients: this.clients.length,
      new_clients_this_month: newClientsCurr,
      total_leads_this_month: leadsCurr,
      deals_this_month: completedCurr.length,
      revenue_this_month: revenueCurr,
      monthly_changes: {
        clients: pctChange(newClientsCurr, newClientsPrev),
        leads: pctChange(leadsCurr, leadsPrev),
        deals: pctChange(completedCurr.length, completedPrev.length),
        revenue: pctChange(revenueCurr, revenuePrev),
      },
    }
  }

  // ── 16. Stale listings ────────────────────────────────────────────────────

  getStaleListings(days: number): Property[] {
    const cutoff = subtractDays(NOW, days)
    return this.properties.filter(
      p => p.status === 'available' && p.created_at <= cutoff
    )
  }

  // ── 17. Tasks by status ───────────────────────────────────────────────────

  getTasksByStatus(): TasksByStatus {
    return {
      todo: this.tasks.filter(t => t.status === 'todo'),
      in_progress: this.tasks.filter(t => t.status === 'in_progress'),
      done: this.tasks.filter(t => t.status === 'done'),
    }
  }

  // ── 18. All tasks ─────────────────────────────────────────────────────────

  getAllTasks(): Task[] {
    return this.tasks
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id)
  }

  addTask(task: Omit<Task, 'id' | 'created_at'>): Task {
    const createdTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      created_at: NOW,
    }

    this.tasks.push(createdTask)
    return createdTask
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const index = this.tasks.findIndex((task) => task.id === id)
    if (index === -1) return null

    const current = this.tasks[index]
    const next: Task = {
      ...current,
      ...updates,
      id: current.id,
      created_at: current.created_at,
    }

    this.tasks[index] = next
    return next
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex((task) => task.id === id)
    if (index === -1) return false

    this.tasks.splice(index, 1)
    return true
  }

  moveTask(id: string, newStatus: TaskStatus): Task | null {
    return this.updateTask(id, { status: newStatus })
  }

  // ── 19. All agents ────────────────────────────────────────────────────────

  getAgents(): Agent[] {
    return this.agents
  }

  // ── 20. Agent by ID ───────────────────────────────────────────────────────

  getAgentById(id: string): Agent | undefined {
    return this.agents.find(a => a.id === id)
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const db = new Database()
