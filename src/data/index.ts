export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'office';
export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented';
export type RenovationStatus = 'original' | 'partial' | 'full' | null;

export type ClientType = 'buyer' | 'seller' | 'investor' | 'tenant';
export type ClientSource = 'website' | 'referral' | 'sreality' | 'bezrealitky' | 'instagram' | 'facebook' | 'cold_call' | 'walk_in' | 'other';
export type ClientStatus = 'active' | 'inactive' | 'closed';

export type LeadType = 'inquiry' | 'viewing_request' | 'offer' | 'purchase' | 'rental';
export type LeadStatus = 'new' | 'contacted' | 'viewing_scheduled' | 'offer_made' | 'negotiation' | 'closed_won' | 'closed_lost';

export type TransactionType = 'sale' | 'rental';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AgentRole = 'agent' | 'manager' | 'admin';

export interface Property {
  id: string;
  name: string;
  address: { street: string; city: string; district: string; zip: string };
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  area_sqm: number;
  rooms: number;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  renovation_status: RenovationStatus;
  renovation_year: number | null;
  construction_notes: string | null;
  description: string;
  images: string[];
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ClientType;
  source: ClientSource;
  status: ClientStatus;
  notes: string;
  assigned_agent: string;
  created_at: string;
}

export interface Lead {
  id: string;
  client_id: string;
  property_id: string | null;
  type: LeadType;
  status: LeadStatus;
  value: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  property_id: string;
  client_id: string;
  type: TransactionType;
  amount: number;
  commission: number;
  status: TransactionStatus;
  date: string;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  related_property_id: string | null;
  related_client_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  phone: string;
}

export interface MonitoringRule {
  id: string;
  location: string;
  filters: {
    price_min?: number;
    price_max?: number;
    type?: PropertyType;
    min_area?: number;
  };
  frequency: 'daily' | 'weekly';
  active: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: {
    type: 'chart' | 'table' | 'file' | 'email_draft';
    data: any;
  }[];
}
