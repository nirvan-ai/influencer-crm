'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfileSetupPage() {
  const router = useRouter()
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [nicheTags, setNicheTags] = useState('')
  const [followerCount, setFollowerCount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('creator').select('id').eq('user_id', user.id).single()
      if (data) router.replace('/dashboard')
    }
    checkProfile()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!handle.trim()) { setError('Instagram handle is required.'); return }
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const tags = nicheTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const { error } = await supabase.from('creator').insert({
      user_id: user.id,
      handle: handle.trim().replace(/^@/, ''),
      platform: 'instagram',
      niche_tags: tags,
      follower_count: followerCount ? parseInt(followerCount, 10) : null,
      bio: bio.trim() || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your profile</CardTitle>
          <CardDescription>Tell us about your Instagram presence.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="handle">Instagram handle <span className="text-destructive">*</span></Label>
              <Input
                id="handle"
                placeholder="@yourcreatorhandle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="follower-count">Follower count</Label>
              <Input
                id="follower-count"
                type="number"
                min="0"
                placeholder="e.g. 25000"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="niche-tags">Niches</Label>
              <Input
                id="niche-tags"
                placeholder="beauty, fitness, lifestyle"
                value={nicheTags}
                onChange={(e) => setNicheTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="A short description of what you create…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving…' : 'Save and continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
