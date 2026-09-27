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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

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

    // Upsert brand by name
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

    // Auto-reminders for lead stage
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

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New deal</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Add the basics — fill in details after.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Brand name *</Label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Glossier"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Instagram handle <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@glossier"
            />
          </div>
          <div className="space-y-1">
            <Label>Deal type</Label>
            <Select value={dealType} onValueChange={(v) => setDealType(v as DealType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding…' : 'Add deal'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
