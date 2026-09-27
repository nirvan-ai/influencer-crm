import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase
    .from('creator')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!creator) redirect('/profile/setup')

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Your profile</h1>
      <ProfileForm creator={creator} />
    </div>
  )
}
