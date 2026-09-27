'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Deal, DealType, DEAL_STATUSES, STATUS_LABELS, DealStatus } from '@/lib/types'
import { AUTO_REMINDER_CONFIG } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'

const TYPE_VARIANT: Record<DealType, 'default' | 'secondary' | 'outline'> = {
  paid:      'default',
  gifted:    'secondary',
  affiliate: 'outline',
  hybrid:    'secondary',
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function deadlineLabel(iso: string) {
  const d = new Date(iso)
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000)
  if (days < 0) return { text: 'Overdue', urgent: true }
  if (days === 0) return { text: 'Due today', urgent: true }
  if (days <= 3) return { text: `${days}d left`, urgent: true }
  return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false }
}

function nextStage(current: DealStatus): DealStatus | null {
  const idx = DEAL_STATUSES.indexOf(current)
  const terminal = ['paid', 'closed_lost']
  if (terminal.includes(current)) return null
  return DEAL_STATUSES[idx + 1] ?? null
}

export function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const router = useRouter()
  const deadline = deal.content_deadline ? deadlineLabel(deal.content_deadline) : null
  const next = nextStage(deal.status)
  const handle = deal.brand?.instagram_handle
  const dmUrl = handle ? `https://ig.me/m/${handle}` : null

  async function advance(e: React.MouseEvent) {
    e.stopPropagation()
    if (!next) return
    const supabase = createClient()
    await supabase.from('deal').update({ status: next, updated_at: new Date().toISOString() }).eq('id', deal.id)
    await supabase.from('activity').insert({
      deal_id: deal.id,
      event_type: 'status_change',
      text: `Stage changed from ${STATUS_LABELS[deal.status]} to ${STATUS_LABELS[next]}`,
    })
    const reminder = AUTO_REMINDER_CONFIG[next]
    if (reminder) {
      const remindAt = new Date()
      remindAt.setDate(remindAt.getDate() + reminder.days)
      await supabase.from('activity').insert({
        deal_id: deal.id,
        event_type: 'reminder',
        text: reminder.text,
        remind_at: remindAt.toISOString(),
      })
    }
    router.refresh()
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3 space-y-2">
        {/* Top row: brand name + message button */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight">{deal.brand?.name ?? 'Unknown brand'}</p>
          {dmUrl && (
            <a
              href={dmUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-xs text-blue-600 dark:text-blue-400 underline-offset-2 hover:underline"
            >
              Message
            </a>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant={TYPE_VARIANT[deal.deal_type]} className="text-xs">{deal.deal_type}</Badge>
          {deal.agreed_amount != null && (
            <Badge variant="outline" className="text-xs">{fmt(deal.agreed_amount, deal.currency)}</Badge>
          )}
        </div>

        {/* Deadline */}
        {deadline && (
          <p className={`text-xs ${deadline.urgent ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {deadline.text}
          </p>
        )}

        {/* Next stage button */}
        {next && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs mt-1"
            onClick={advance}
          >
            Move to {STATUS_LABELS[next]} →
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
