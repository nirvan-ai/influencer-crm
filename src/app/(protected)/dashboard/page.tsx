import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from './KanbanBoard'
import { Deal } from '@/lib/types'

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

  const { data: deals } = await supabase
    .from('deal')
    .select('*, brand(id, name)')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })

  return <KanbanBoard deals={(deals ?? []) as Deal[]} creatorId={creator.id} />
}
