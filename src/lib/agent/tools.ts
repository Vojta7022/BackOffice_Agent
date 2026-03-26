import type { FunctionDeclaration } from '@google/genai'

export type ToolName =
  | 'query_clients'
  | 'query_leads'
  | 'query_properties'
  | 'estimate_property_value'
  | 'find_missing_data'
  | 'query_transactions'
  | 'get_dashboard_metrics'
  | 'get_weekly_summary'
  | 'generate_chart'
  | 'draft_email'
  | 'check_calendar'
  | 'create_task'
  | 'generate_report'
  | 'generate_presentation'
  | 'setup_monitoring'
  | 'compare_properties'
  | 'generate_property_description'
  | 'analyze_portfolio'
  | 'client_activity_timeline'
  | 'market_overview'
  | 'web_search'
  | 'search_listings'

export const agentTools: FunctionDeclaration[] = [
  {
    name: 'query_clients',
    description: 'Search and filter clients. Use for questions about clients, sources, acquisition trends. User queries are typically in Czech.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string', description: 'ISO date, e.g. "2026-01-01"' },
        date_to: { type: 'string', description: 'ISO date, e.g. "2026-03-31"' },
        source: {
          type: 'string',
          enum: ['website', 'referral', 'sreality', 'bezrealitky', 'instagram', 'facebook', 'cold_call', 'walk_in', 'other'],
        },
        type: { type: 'string', enum: ['buyer', 'seller', 'investor', 'tenant'] },
        status: { type: 'string', enum: ['active', 'inactive', 'closed'] },
        quarter: { type: 'string', description: 'e.g. "Q1 2026" — returns clients grouped by source for that quarter' },
        group_by: { type: 'string', enum: ['source', 'type', 'month'] },
      },
    },
  },
  {
    name: 'query_leads',
    description: 'Search and filter leads. Use for funnel analysis, conversion rates, lead volume trends.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string' },
        date_to: { type: 'string' },
        status: {
          type: 'string',
          enum: ['new', 'contacted', 'viewing_scheduled', 'offer_made', 'negotiation', 'closed_won', 'closed_lost'],
        },
        type: { type: 'string', enum: ['inquiry', 'viewing_request', 'offer', 'purchase', 'rental'] },
        months_back: { type: 'number', description: 'Return monthly counts for last N months' },
        group_by: { type: 'string', enum: ['month', 'status', 'type'] },
      },
    },
  },
  {
    name: 'query_properties',
    description: 'Search and filter property listings. Use for portfolio questions, availability, pricing, location queries.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'e.g. "Praha", "Brno"' },
        district: { type: 'string', description: 'e.g. "Vinohrady", "Karlín"' },
        type: { type: 'string', enum: ['apartment', 'house', 'land', 'commercial', 'office'] },
        status: { type: 'string', enum: ['available', 'reserved', 'sold', 'rented'] },
        price_min: { type: 'number', description: 'CZK' },
        price_max: { type: 'number', description: 'CZK' },
        search_query: { type: 'string', description: 'Full-text search across name, address, description' },
      },
    },
  },
  {
    name: 'estimate_property_value',
    description: 'Estimate market value of a property based on comparable sales in the database. Use when user asks about property valuation, pricing, or market comparison.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City' },
        district: { type: 'string', description: 'District' },
        type: { type: 'string', description: 'Property type: apartment, house, commercial' },
        area_sqm: { type: 'number', description: 'Area in m²' },
        rooms: { type: 'number', description: 'Number of rooms' },
      },
      required: ['district', 'area_sqm'],
    },
  },
  {
    name: 'find_missing_data',
    description: 'Find properties with incomplete records (null renovation_status or construction_notes). Use when asked about data gaps.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['renovation_status', 'construction_notes', 'all'],
          description: 'Which field to check for missing data',
        },
      },
      required: ['field'],
    },
  },
  {
    name: 'query_transactions',
    description: 'Get sales and rental transaction data. Use for revenue, commission, deal volume questions.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string' },
        date_to: { type: 'string' },
        type: { type: 'string', enum: ['sale', 'rental'] },
        status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
        months_back: { type: 'number', description: 'Return monthly summary for last N months' },
        group_by: { type: 'string', enum: ['month', 'type'] },
      },
    },
  },
  {
    name: 'get_dashboard_metrics',
    description: 'Returns current KPIs: property counts, client totals, lead volume, revenue, month-over-month changes.',
    parametersJsonSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_weekly_summary',
    description: 'Returns last 7 days summary: new leads, new clients, viewings, closed deals, revenue.',
    parametersJsonSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'generate_chart',
    description: 'Renders a chart in the UI. Call this after querying data when a visual would help. Always provide meaningful title. Pro dva datasety v jednom grafu použij pole secondary_value v datech. Nevolej generate_chart dvakrát — použij jeden graf se dvěma řadami.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        chart_type: { type: 'string', enum: ['bar', 'line', 'pie', 'area'] },
        title: { type: 'string' },
        x_label: { type: 'string' },
        y_label: { type: 'string' },
        primary_label: { type: 'string', description: 'Label for the main data series' },
        secondary_label: { type: 'string', description: 'Label for the optional second data series' },
        data: {
          type: 'array',
          description: 'Data points to plot',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'number' },
              secondary_value: { type: 'number', description: 'Optional second series (e.g. target)' },
            },
            required: ['label', 'value'],
          },
        },
      },
      required: ['chart_type', 'title', 'data'],
    },
  },
  {
    name: 'draft_email',
    description: 'Compose a professional email. Use when asked to write, send, or prepare an email to a client or partner.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient name or email' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Full email body in the appropriate language (Czech if recipient is Czech)' },
        context: { type: 'string', description: 'Brief context about why this email is being sent' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'check_calendar',
    description: 'Check calendar availability for scheduling viewings, meetings, or calls.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string', description: 'ISO date, start of range' },
        date_to: { type: 'string', description: 'ISO date, end of range' },
        duration_minutes: { type: 'number', description: 'Duration of the event in minutes' },
      },
      required: ['date_from', 'date_to'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task for the team. Use when asked to add a to-do, reminder, or assign work.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        assigned_to: { type: 'string', description: 'Agent ID, e.g. "agent-003"' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        due_date: { type: 'string', description: 'ISO date' },
        related_property_id: { type: 'string', description: 'e.g. "prop-012"' },
        related_client_id: { type: 'string', description: 'e.g. "client-045"' },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a structured summary report for a time period. Use when asked for weekly/monthly/quarterly overview.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month', 'quarter'] },
        format: { type: 'string', enum: ['text', 'structured'] },
      },
      required: ['period'],
    },
  },
  {
    name: 'generate_presentation',
    description: 'Create or extend a PowerPoint presentation. When paired with generate_report, build a short deck based on the report findings. When adding slides to an existing presentation, preserve the prior slide content and add only the new material.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Presentation subject' },
        num_slides: { type: 'number', description: 'Number of slides to generate' },
        key_points: {
          type: 'array',
          items: { type: 'string' },
          description: 'Main points to cover',
        },
        existing_content: {
          type: 'string',
          description: 'Summary of existing slides to keep when adding more',
        },
        existing_slides: {
          type: 'array',
          description: 'Existing slide objects to preserve when extending a previous presentation',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: {
                anyOf: [
                  { type: 'string' },
                  {
                    type: 'array',
                    items: { type: 'string' },
                  },
                ],
              },
            },
          },
        },
      },
      required: ['topic', 'num_slides'],
    },
  },
  {
    name: 'setup_monitoring',
    description: 'Set up automated alerts for new listings matching criteria. If details are missing, create a sensible default monitoring rule instead of asking follow-up questions.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or district to monitor, e.g. "Praha 2"' },
        property_type: { type: 'string', enum: ['apartment', 'house', 'land', 'commercial', 'office'] },
        price_min: { type: 'number', description: 'CZK' },
        price_max: { type: 'number', description: 'CZK' },
        frequency: { type: 'string', enum: ['daily', 'weekly'] },
      },
      required: ['location'],
    },
  },
  {
    name: 'compare_properties',
    description: 'Compare 2+ properties side by side',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        property_ids: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
        },
      },
      required: ['property_ids'],
    },
  },
  {
    name: 'generate_property_description',
    description: 'Generate marketing description for a property listing',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        property_id: { type: 'string' },
        tone: { type: 'string', enum: ['professional', 'casual', 'luxury'], default: 'professional' },
        language: { type: 'string', enum: ['cs', 'en'], default: 'cs' },
      },
      required: ['property_id'],
    },
  },
  {
    name: 'analyze_portfolio',
    description: 'Analyze the full property portfolio — distribution, performance, recommendations',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        group_by: { type: 'string', enum: ['city', 'type', 'status', 'price_range'], default: 'type' },
      },
    },
  },
  {
    name: 'client_activity_timeline',
    description: 'Show full activity timeline for a specific client',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        client_name: { type: 'string' },
      },
    },
  },
  {
    name: 'market_overview',
    description: 'Generate market overview with key metrics and trends',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Optional city filter, e.g. "Praha"' },
        period_months: { type: 'number', default: 6 },
      },
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for any information. Use for general questions, current events, or anything not in the internal database.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_listings',
    description: 'Search Czech real estate portals (Sreality, Bezrealitky, Reality.iDNES, České reality) for current property listings in a specific location. Use when user asks about monitoring listings or finding properties on the market.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'Location to search, e.g. Praha Holešovice' },
        property_type: {
          type: 'string',
          description: 'Type: byt, dům, komerční, pozemek',
          enum: ['byt', 'dům', 'komerční', 'pozemek'],
        },
      },
      required: ['location'],
    },
  },
]
