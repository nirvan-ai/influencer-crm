import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './SignOutButton'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm">Influencer CRM</span>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <Link href="/pipeline" className="text-sm text-muted-foreground hover:text-foreground">
            Pipeline
          </Link>
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
            Profile
          </Link>
        </div>
        <SignOutButton />
      </nav>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
