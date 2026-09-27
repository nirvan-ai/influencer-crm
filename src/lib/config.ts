import { DealStatus } from './types'

export const AUTO_REMINDER_CONFIG: Partial<Record<DealStatus, { days: number; text: string }[]>> = {
  lead: [
    { days: 3, text: 'Follow up with brand' },
  ],
  pitched: [
    { days: 3,  text: 'First follow-up — check if they received your pitch' },
    { days: 7,  text: 'Second follow-up — try a different channel (email/DM)' },
    { days: 14, text: 'Final follow-up — or move to Closed / Lost' },
  ],
  negotiating: [
    { days: 3, text: 'Check in on contract / terms' },
  ],
  agreed: [
    { days: 2, text: 'Confirm content deadline and deliverables' },
  ],
  content_live: [
    { days: 7, text: 'Check engagement stats and share with brand' },
  ],
  invoiced: [
    { days: 14, text: 'Chase payment if not received' },
  ],
  // paid and closed_lost: no auto-reminders
}
