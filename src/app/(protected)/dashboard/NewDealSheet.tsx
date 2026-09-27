'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEAL_STATUSES, DEAL_TYPES, DealStatus, DealType, STATUS_LABELS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  const [dealType, setDealType] = useState<DealType>('paid')
  const [status, setStatus] = useState<DealStatus>('lead')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [deliverables, setDeliverables] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brandName.trim()) { setError('Brand name is required.'); return }
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Upsert brand by name for this creator
    let brandId: string | null = null
    const { data: existing } = await supabase
      .from('brand')
      .select('id')
      .eq('created_by', creatorId)
      .ilike('name', brandName.trim())
      .single()

    if (existing) {
      brandId = existing.id
    } else {
      const { data: newBrand, error: brandErr } = await supabase
        .from('brand')
        .insert({ name: brandName.trim(), created_by: creatorId })
        .select('id')
        .single()
      if (brandErr) { setError(brandErr.message); setLoading(false); return }
      brandId = newBrand.id
    }

    const { error: dealErr } = await supabase.from('deal').insert({
      creator_id: creatorId,
      brand_id: brandId,
      status,
      deal_type: dealType,
      agreed_amount: amount ? parseFloat(amount) : null,
      currency,
      deliverables: deliverables.trim() || null,
      content_deadline: deadline || null,
      notes: notes.trim() || null,
    })

    if (dealErr) { setError(dealErr.message); setLoading(false); return }

    // Reset form
    setBrandName(''); setDealType('paid'); setStatus('lead')
    setAmount(''); setDeliverables(''); setDeadline(''); setNotes('')
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
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label>Brand name *</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Glossier" required />
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
          <div className="space-y-1">
            <Label>Stage</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DealStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <div className="space-y-1 flex-1">
              <Label>Amount</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1 w-24">
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Deliverables</Label>
            <Input value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="1 reel + 2 stories" />
          </div>
          <div className="space-y-1">
            <Label>Content deadline</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Add deal'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
