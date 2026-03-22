// ─── Enums ────────────────────────────────────────────────────────────────────

export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'office'

export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented'

export type RenovationStatus = 'original' | 'partial' | 'full'

export type ClientType = 'buyer' | 'seller' | 'investor' | 'tenant'

export type ClientSource =
  | 'website'
  | 'referral'
  | 'sreality'
  | 'bezrealitky'
  | 'instagram'
  | 'facebook'
  | 'cold_call'
  | 'walk_in'
  | 'other'

export type ClientStatus = 'active' | 'inactive' | 'closed'

export type LeadType = 'inquiry' | 'viewing_request' | 'offer' | 'purchase' | 'rental'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'viewing_scheduled'
  | 'offer_made'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export type TransactionType = 'sale' | 'rental'

export type TransactionStatus = 'pending' | 'completed' | 'cancelled'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type AgentRole = 'agent' | 'manager' | 'admin'

export type MonitoringFrequency = 'daily' | 'weekly'

export type ChatRole = 'user' | 'assistant'

// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  street: string       // e.g. "Václavské náměstí 1"
  city: string         // e.g. "Praha"
  district: string     // e.g. "Praha 1" | "Vinohrady" | "Brno-střed"
  zip: string          // e.g. "110 00"
}

// ─── Property ─────────────────────────────────────────────────────────────────

export interface Property {
  id: string
  name: string                          // e.g. "Byt 3+1 Vinohrady"
  address: Address
  type: PropertyType
  status: PropertyStatus
  price: number                         // CZK
  area_sqm: number
  rooms: number | null                  // null for land/commercial
  floor: number | null                  // null for house/land
  total_floors: number | null
  year_built: number | null
  renovation_status: RenovationStatus | null
  renovation_year: number | null
  construction_notes: string | null     // e.g. "Cihlová stavba", "Panel"
  description: string
  images: string[]                      // URLs or file paths
  owner_id: string                      // ref → Client.id
  created_at: string                    // ISO 8601
  updated_at: string
}

// ─── Client ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string                          // e.g. "Jan Novák"
  email: string
  phone: string                         // e.g. "+420 721 000 001"
  type: ClientType
  source: ClientSource
  status: ClientStatus
  notes: string
  assigned_agent: string                // ref → Agent.id
  created_at: string
}

// ─── Lead ─────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  client_id: string                     // ref → Client.id
  property_id: string | null            // ref → Property.id (null = general inquiry)
  type: LeadType
  status: LeadStatus
  value: number | null                  // CZK — expected deal value, if known
  notes: string
  created_at: string
  updated_at: string
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  property_id: string                   // ref → Property.id
  client_id: string                     // ref → Client.id
  type: TransactionType
  amount: number                        // CZK — sale price or annual rent
  commission: number                    // CZK
  status: TransactionStatus
  date: string                          // ISO 8601 date of transaction
  notes: string
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  title: string
  description: string
  assigned_to: string                   // ref → Agent.id
  related_property_id: string | null    // ref → Property.id
  related_client_id: string | null      // ref → Client.id
  status: TaskStatus
  priority: TaskPriority
  due_date: string                      // ISO 8601
  created_at: string
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export interface Agent {
  id: string
  name: string                          // e.g. "Petra Svobodová"
  email: string
  role: AgentRole
  phone: string                         // e.g. "+420 602 000 001"
}

// ─── Monitoring Rule ──────────────────────────────────────────────────────────

export interface MonitoringFilters {
  property_types?: PropertyType[]
  price_min?: number                    // CZK
  price_max?: number                    // CZK
  area_sqm_min?: number
  area_sqm_max?: number
  rooms_min?: number
  rooms_max?: number
  districts?: string[]                  // e.g. ["Praha 2", "Praha 3", "Vinohrady"]
}

export interface MonitoringRule {
  id: string
  location: string                      // e.g. "Praha 2", "Brno"
  filters: MonitoringFilters
  frequency: MonitoringFrequency
  active: boolean
  created_at: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type AttachmentType = 'chart' | 'table' | 'file' | 'property_list'

export interface ChartAttachment {
  type: 'chart'
  chart_type: 'bar' | 'line' | 'pie' | 'area'
  title: string
  data: Record<string, unknown>[]
  x_key: string
  y_keys: string[]
}

export interface TableAttachment {
  type: 'table'
  title: string
  columns: { key: string; label: string }[]
  rows: Record<string, unknown>[]
}

export interface FileAttachment {
  type: 'file'
  filename: string
  url: string
  mime_type: string
}

export interface PropertyListAttachment {
  type: 'property_list'
  title: string
  properties: Pick<Property, 'id' | 'name' | 'address' | 'price' | 'area_sqm' | 'status' | 'type'>[]
}

export type Attachment =
  | ChartAttachment
  | TableAttachment
  | FileAttachment
  | PropertyListAttachment

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string                       // markdown
  timestamp: string                     // ISO 8601
  attachments?: Attachment[]
}

// ─── Dashboard / Analytics helpers ───────────────────────────────────────────

export interface KPIMetric {
  label: string
  value: number | string
  unit?: string                         // e.g. "CZK", "m²", "%"
  change_pct?: number                   // month-over-month
  trend?: 'up' | 'down' | 'flat'
}

export interface DashboardStats {
  total_properties: number
  available_properties: number
  total_clients: number
  active_leads: number
  monthly_revenue: number               // CZK
  conversion_rate: number               // 0–1
  avg_deal_value: number                // CZK
  open_tasks: number
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}
