'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

type Creator = {
  id: string
  handle: string | null
  niche_tags: string[]
  follower_count: number | null
  bio: string | null
}

export function ProfileForm({ creator }: { creator: Creator }) {
  const router = useRouter()
  const [handle, setHandle] = useState(creator.handle ?? '')
  const [bio, setBio] = useState(creator.bio ?? '')
  const [nicheTags, setNicheTags] = useState((creator.niche_tags ?? []).join(', '))
  const [followerCount, setFollowerCount] = useState(creator.follower_count?.toString() ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!handle.trim()) { setError('Instagram handle is required.'); return }
    setError('')
    setSaved(false)
    setLoading(true)

    const supabase = createClient()
    const tags = nicheTags.split(',').map((t) => t.trim()).filter(Boolean)

    const { error } = await supabase
      .from('creator')
      .update({
        handle: handle.trim().replace(/^@/, ''),
        niche_tags: tags,
        follower_count: followerCount ? parseInt(followerCount, 10) : null,
        bio: bio.trim() || null,
      })
      .eq('id', creator.id)

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardContent className="pt-6">
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
          {saved && <p className="text-sm text-green-600">Changes saved.</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
