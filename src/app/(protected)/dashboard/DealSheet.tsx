'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Deal, DEAL_STATUSES, DEAL_TYPES, DealStatus, DealType, STATUS_LABELS } from '@/lib/types'
import { AUTO_REMINDER_CONFIG } from '@/lib/config'
import { ActivityFeed } from './ActivityFeed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  deal: Deal | null
  onClose: () => void
}

export function DealSheet({ deal, onClose }: Props) {
  const router = useRouter()
  const [brandName, setBrandName] = useState(deal?.brand?.name ?? '')
  const [handle, setHandle] = useState(deal?.brand?.instagram_handle ?? '')
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

  const cleanHandle = handle.replace(/^@/, '')
  const instagramProfileUrl = cleanHandle ? `https://www.instagram.com/${cleanHandle}` : null
  const instagramDmUrl = cleanHandle ? `https://ig.me/m/${cleanHandle}` : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deal) return
    setError('')
    setLoading(true)

    const supabase = createClient()
    const prevStatus = deal.status

    if (deal.brand_id) {
      await supabase.from('brand').update({
        name: brandName.trim(),
        instagram_handle: handle.trim().replace(/^@/, '') || null,
      }).eq('id', deal.brand_id)
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

    if (status !== prevStatus) {
      await supabase.from('activity').insert({
        deal_id: deal.id,
        event_type: 'status_change',
        text: `Stage changed from ${STATUS_LABELS[prevStatus]} to ${STATUS_LABELS[status]}`,
      })
      const reminders = AUTO_REMINDER_CONFIG[status] ?? []
      for (const r of reminders) {
        const remindAt = new Date()
        remindAt.setDate(remindAt.getDate() + r.days)
        await supabase.from('activity').insert({
          deal_id: deal.id,
          event_type: 'reminder',
          text: r.text,
          remind_at: remindAt.toISOString(),
        })
      }
    }

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

  if (!deal) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">

      {/* ── Sticky header ── */}
      <div className="shrink-0 border-b bg-background px-4 flex items-center gap-3 h-14">
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 -ml-1 text-sm"
        >
          ← Back
        </button>
        <span className="font-semibold flex-1 truncate">{deal.brand?.name ?? 'Deal'}</span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} id="deal-form">

          {/* Brand section */}
          <div className="px-4 pt-6 pb-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Brand</p>

            <div className="space-y-2">
              <Label>Brand name</Label>
              <Input
                className="h-12 text-base"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Instagram handle</Label>
              <Input
                className="h-12 text-base"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@glossier"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            {(instagramProfileUrl || instagramDmUrl) && (
              <div className="flex gap-2">
                {instagramProfileUrl && (
                  <a
                    href={instagramProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-11 flex items-center justify-center rounded-md border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    View profile
                  </a>
                )}
                {instagramDmUrl && (
                  <a
                    href={instagramDmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-11 flex items-center justify-center rounded-md border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Message
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="border-t mx-4" />

          {/* Deal details section */}
          <div className="px-4 pt-6 pb-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Deal details</p>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DealStatus)}>
                <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <Label>Amount</Label>
                <Input
                  className="h-12 text-base"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2 w-20">
                <Label>Currency</Label>
                <Input
                  className="h-12 text-base"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  autoCapitalize="characters"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deliverables</Label>
              <Input
                className="h-12 text-base"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="1 reel + 2 stories"
              />
            </div>

            <div className="space-y-2">
              <Label>Content deadline</Label>
              <Input
                className="h-12 text-base"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                className="text-base"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="border-t mx-4" />

          {/* Activity section */}
          <div className="px-4 pt-6 pb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Activity</p>
            <ActivityFeed dealId={deal.id} />
          </div>

          <div className="border-t mx-4" />

          {/* Danger zone */}
          <div className="px-4 pt-4 pb-32">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full h-12 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete deal'}
            </button>
          </div>

        </form>
      </div>

      {/* ── Fixed save bar ── */}
      <div className="shrink-0 border-t bg-background px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        <Button form="deal-form" type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

    </div>
  )
}
