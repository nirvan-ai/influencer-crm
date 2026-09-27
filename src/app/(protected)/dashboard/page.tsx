import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Deal, ReminderWithDeal, DEAL_STATUSES, STATUS_LABELS, DealStatus } from '@/lib/types'
import { DashboardView } from './DashboardView'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase
    .from('creator')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!creator) redirect('/profile/setup')

  const { data: rawDeals } = await supabase
    .from('deal')
    .select('*, brand(id, name, instagram_handle, dm_thread_url), activity(created_at, event_type)')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })

  const deals = (rawDeals ?? []) as Deal[]
  const activeDeals = deals.filter(d => !['paid', 'closed_lost'].includes(d.status))

  // Pipeline value — sum of agreed amounts not yet paid
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.agreed_amount ?? 0), 0)

  // Closed this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const closedThisMonth = deals.filter(d =>
    d.status === 'paid' && new Date(d.updated_at) >= startOfMonth
  )
  const earnedThisMonth = closedThisMonth.reduce((sum, d) => sum + (d.agreed_amount ?? 0), 0)

  // New pitches this week (deals created or moved to pitched in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const pitchedThisWeek = deals.filter(d =>
    d.status !== 'lead' && new Date(d.updated_at) >= sevenDaysAgo
  ).length

  // Stage breakdown
  const byStage = Object.fromEntries(
    DEAL_STATUSES.map(s => [s, deals.filter(d => d.status === s).length])
  ) as Record<DealStatus, number>

  // Overdue reminders
  const { data: allReminders } = await supabase
    .from('activity')
    .select('*, deal!inner(id, status, brand(id, name))')
    .eq('event_type', 'reminder')
    .lte('remind_at', new Date().toISOString())
    .order('remind_at', { ascending: true })

  const overdueReminders = ((allReminders ?? []) as ReminderWithDeal[]).filter(
    r => r.deal && !['paid', 'closed_lost'].includes(r.deal.status)
  )

  // Cold leads — active deals with no activity in 7+ days
  const coldLeads = activeDeals.filter(d => {
    const acts = d.activity ?? []
    if (!acts.length) return new Date(d.created_at) < sevenDaysAgo
    const latest = Math.max(...acts.map(a => new Date(a.created_at).getTime()))
    return latest < sevenDaysAgo.getTime()
  })

  return (
    <DashboardView
      activeDealsCount={activeDeals.length}
      pipelineValue={pipelineValue}
      pitchedThisWeek={pitchedThisWeek}
      earnedThisMonth={earnedThisMonth}
      closedThisMonthCount={closedThisMonth.length}
      byStage={byStage}
      overdueReminders={overdueReminders}
      coldLeads={coldLeads}
      currency="USD"
    />
  )
}
