'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Deal, DealType } from '@/lib/types'

const TYPE_VARIANT: Record<DealType, 'default' | 'secondary' | 'outline'> = {
  paid: 'default',
  gifted: 'secondary',
  affiliate: 'outline',
  hybrid: 'secondary',
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function deadlineLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.ceil((d.getTime() - now.getTime()) / 86400000)
  if (days < 0) return { text: 'Overdue', urgent: true }
  if (days === 0) return { text: 'Today', urgent: true }
  if (days <= 3) return { text: `${days}d left`, urgent: true }
  return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false }
}

export function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const deadline = deal.content_deadline ? deadlineLabel(deal.content_deadline) : null

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <p className="font-medium text-sm leading-tight">
          {deal.brand?.name ?? 'Unknown brand'}
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant={TYPE_VARIANT[deal.deal_type]} className="text-xs">
            {deal.deal_type}
          </Badge>
          {deal.agreed_amount != null && (
            <Badge variant="outline" className="text-xs">
              {fmt(deal.agreed_amount, deal.currency)}
            </Badge>
          )}
        </div>
        {deadline && (
          <p className={`text-xs ${deadline.urgent ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {deadline.text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
