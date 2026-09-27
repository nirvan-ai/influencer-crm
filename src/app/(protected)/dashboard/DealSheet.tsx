'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Deal, DEAL_STATUSES, DEAL_TYPES, DealStatus, DealType, STATUS_LABELS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

type Props = {
  deal: Deal | null
  onClose: () => void
}

export function DealSheet({ deal, onClose }: Props) {
  const router = useRouter()
  const [brandName, setBrandName] = useState(deal?.brand?.name ?? '')
  const [dealType, setDealType] = useState<DealType>(deal?.deal_type ?? 'paid')
  const [status, setStatus] = useState<DealStatus>(deal?.status ?? 'lead')
  const [amount, setAmount] = useState(deal?.agreed_amount?.toString() ?? '')
  const [currency, setCurrency] = useState(deal?.currency ?? 'USD')
  const [deliverables, setDeliverables] = useState(deal?.deliverables ?? '')
  const [deadline, setDeadline] = useState(deal?.content_deadline ?? '')
  const [notes, setNotes] = useState(deal?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Reset state when deal changes
  const currentId = deal?.id
  if (deal && deal.id !== currentId) {
    setBrandName(deal.brand?.name ?? '')
    setDealType(deal.deal_type)
    setStatus(deal.status)
    setAmount(deal.agreed_amount?.toString() ?? '')
    setCurrency(deal.currency)
    setDeliverables(deal.deliverables ?? '')
    setDeadline(deal.content_deadline ?? '')
    setNotes(deal.notes ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deal) return
    setError('')
    setLoading(true)

    const supabase = createClient()

    // Update brand name if changed
    if (deal.brand_id && brandName.trim() !== deal.brand?.name) {
      await supabase.from('brand').update({ name: brandName.trim() }).eq('id', deal.brand_id)
    }

    const { error: err } = await supabase
      .from('deal')
      .update({
        status,
        deal_type: dealType,
        agreed_amount: amount ? parseFloat(amount) : null,
        currency,
        deliverables: deliverables.trim() || null,
        content_deadline: deadline || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deal.id)

    if (err) { setError(err.message); setLoading(false); return }
    setLoading(false)
    onClose()
    router.refresh()
  }

  async function handleDelete() {
    if (!deal) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('deal').delete().eq('id', deal.id)
    setDeleting(false)
    onClose()
    router.refresh()
  }

  return (
    <Sheet open={!!deal} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{deal?.brand?.name ?? 'Deal'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label>Brand name</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
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
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
          <Separator />
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? 'Deleting…' : 'Delete deal'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
