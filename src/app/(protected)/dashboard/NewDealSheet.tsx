'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEAL_TYPES, DealType } from '@/lib/types'
import { AUTO_REMINDER_CONFIG } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  open: boolean
  onClose: () => void
  creatorId: string
}

export function NewDealSheet({ open, onClose, creatorId }: Props) {
  const router = useRouter()
  const [brandName, setBrandName] = useState('')
  const [handle, setHandle] = useState('')
  const [dealType, setDealType] = useState<DealType>('paid')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brandName.trim()) { setError('Brand name is required.'); return }
    setError('')
    setLoading(true)

    const supabase = createClient()

    let brandId: string | null = null
    const { data: existing } = await supabase
      .from('brand')
      .select('id')
      .eq('created_by', creatorId)
      .ilike('name', brandName.trim())
      .single()

    if (existing) {
      brandId = existing.id
      if (handle.trim()) {
        await supabase.from('brand').update({ instagram_handle: handle.trim().replace(/^@/, '') }).eq('id', brandId)
      }
    } else {
      const { data: newBrand, error: brandErr } = await supabase
        .from('brand')
        .insert({
          name: brandName.trim(),
          created_by: creatorId,
          instagram_handle: handle.trim().replace(/^@/, '') || null,
        })
        .select('id')
        .single()
      if (brandErr) { setError(brandErr.message); setLoading(false); return }
      brandId = newBrand.id
    }

    const { data: deal, error: dealErr } = await supabase
      .from('deal')
      .insert({ creator_id: creatorId, brand_id: brandId, status: 'lead', deal_type: dealType, currency: 'USD' })
      .select('id')
      .single()

    if (dealErr) { setError(dealErr.message); setLoading(false); return }

    const reminders = AUTO_REMINDER_CONFIG['lead'] ?? []
    for (const r of reminders) {
      const remindAt = new Date()
      remindAt.setDate(remindAt.getDate() + r.days)
      await supabase.from('activity').insert({
        deal_id: deal!.id,
        event_type: 'reminder',
        text: r.text,
        remind_at: remindAt.toISOString(),
      })
    }

    setBrandName(''); setHandle(''); setDealType('paid')
    setLoading(false)
    onClose()
    router.refresh()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">

      {/* ── Sticky header ── */}
      <div className="shrink-0 border-b bg-background px-4 flex items-center gap-3 h-14">
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 -ml-1 text-sm"
        >
          ← Cancel
        </button>
        <span className="font-semibold flex-1">New deal</span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-5">
        <p className="text-sm text-muted-foreground">Add the basics — fill in details after.</p>

        <div className="space-y-2">
          <Label>Brand name *</Label>
          <Input
            className="h-12 text-base"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Glossier"
            autoFocus
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Instagram handle <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            className="h-12 text-base"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@glossier"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <div className="space-y-2">
          <Label>Deal type</Label>
          <Select value={dealType} onValueChange={(v) => setDealType(v as DealType)}>
            <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEAL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* ── Fixed save bar ── */}
      <div className="shrink-0 border-t bg-background px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-base"
          disabled={loading}
        >
          {loading ? 'Adding…' : 'Add deal'}
        </Button>
      </div>

    </div>
  )
}
