export const DEAL_STATUSES = [
  'lead',
  'pitched',
  'negotiating',
  'agreed',
  'content_live',
  'invoiced',
  'paid',
  'closed_lost',
] as const

export type DealStatus = (typeof DEAL_STATUSES)[number]

export const DEAL_TYPES = ['gifted', 'paid', 'affiliate', 'hybrid'] as const
export type DealType = (typeof DEAL_TYPES)[number]

export const STATUS_LABELS: Record<DealStatus, string> = {
  lead: 'Lead',
  pitched: 'Pitched',
  negotiating: 'Negotiating',
  agreed: 'Agreed',
  content_live: 'Content Live',
  invoiced: 'Invoiced',
  paid: 'Paid',
  closed_lost: 'Closed / Lost',
}

export type Brand = {
  id: string
  name: string
  website: string | null
  contact_info: string | null
  category: string | null
  created_by: string
  created_at: string
}

export type Deal = {
  id: string
  creator_id: string
  brand_id: string | null
  status: DealStatus
  deal_type: DealType
  agreed_amount: number | null
  currency: string
  deliverables: string | null
  content_deadline: string | null
  notes: string | null
  created_at: string
  updated_at: string
  brand: { id: string; name: string } | null
}
