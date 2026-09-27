import { DealStatus } from './types'

export const AUTO_REMINDER_CONFIG: Partial<Record<DealStatus, { days: number; text: string }>> = {
  lead:         { days: 3,  text: 'Follow up with brand' },
  pitched:      { days: 5,  text: 'Follow up if no reply' },
  negotiating:  { days: 3,  text: 'Check in on contract' },
  agreed:       { days: 2,  text: 'Confirm deadline and deliverables' },
  content_live: { days: 7,  text: 'Check engagement stats' },
  invoiced:     { days: 14, text: 'Chase payment if not received' },
  // paid and closed_lost: no auto-reminder
}
