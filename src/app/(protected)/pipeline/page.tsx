import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '../dashboard/KanbanBoard'
import { Deal, ReminderWithDeal } from '@/lib/types'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase
    .from('creator')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!creator) redirect('/profile/setup')

  const { data: deals } = await supabase
    .from('deal')
    .select('*, brand(id, name, instagram_handle, dm_thread_url), activity(created_at, event_type)')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })

  const { data: allReminders } = await supabase
    .from('activity')
    .select('*, deal!inner(id, status, brand(id, name))')
    .eq('event_type', 'reminder')
    .lte('remind_at', new Date().toISOString())
    .order('remind_at', { ascending: true })

  const overdueReminders = ((allReminders ?? []) as ReminderWithDeal[]).filter(
    (r) => r.deal && !['paid', 'closed_lost'].includes(r.deal.status)
  )

  return (
    <KanbanBoard
      deals={(deals ?? []) as Deal[]}
      creatorId={creator.id}
      overdueReminders={overdueReminders}
    />
  )
}
