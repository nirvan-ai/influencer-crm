'use client'

import { useState } from 'react'
import { Deal, DEAL_STATUSES, STATUS_LABELS, ReminderWithDeal } from '@/lib/types'
import { DealCard } from './DealCard'
import { NewDealSheet } from './NewDealSheet'
import { DealSheet } from './DealSheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-muted',
  pitched: 'bg-blue-50 dark:bg-blue-950/30',
  negotiating: 'bg-yellow-50 dark:bg-yellow-950/30',
  agreed: 'bg-green-50 dark:bg-green-950/30',
  content_live: 'bg-purple-50 dark:bg-purple-950/30',
  invoiced: 'bg-orange-50 dark:bg-orange-950/30',
  paid: 'bg-green-100 dark:bg-green-900/30',
  closed_lost: 'bg-red-50 dark:bg-red-950/30',
}

export function KanbanBoard({
  deals,
  creatorId,
  overdueReminders = [],
}: {
  deals: Deal[]
  creatorId: string
  overdueReminders?: ReminderWithDeal[]
}) {
  const [newDealOpen, setNewDealOpen] = useState(false)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)

  const byStatus = Object.fromEntries(
    DEAL_STATUSES.map((s) => [s, deals.filter((d) => d.status === s)])
  )

  function daysOverdue(remind_at: string) {
    const diff = Date.now() - new Date(remind_at).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'today'
    if (days === 1) return '1 day overdue'
    return `${days} days overdue`
  }

  return (
    <>
      {overdueReminders.length > 0 && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-destructive mb-3">
            Needs attention &middot; {overdueReminders.length}
          </p>
          <div className="space-y-2">
            {overdueReminders.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 text-sm cursor-pointer hover:bg-destructive/10 rounded px-2 py-1 -mx-2"
                onClick={() => {
                  const deal = deals.find((d) => d.id === r.deal?.id)
                  if (deal) setActiveDeal(deal)
                }}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{r.deal?.brand?.name ?? 'Unknown brand'}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span>{r.text}</span>
                </div>
                <span className="text-xs text-destructive whitespace-nowrap">{daysOverdue(r.remind_at!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <Button onClick={() => setNewDealOpen(true)}>+ New deal</Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_STATUSES.map((status) => {
          const colDeals = byStatus[status]
          return (
            <div key={status} className="flex-shrink-0 w-60">
              <div className={`rounded-lg p-3 min-h-32 ${STATUS_COLORS[status]}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {STATUS_LABELS[status]}
                  </span>
                  {colDeals.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-4 px-1.5">
                      {colDeals.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {colDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onClick={() => setActiveDeal(deal)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <NewDealSheet
        open={newDealOpen}
        onClose={() => setNewDealOpen(false)}
        creatorId={creatorId}
      />
      <DealSheet
        deal={activeDeal}
        onClose={() => setActiveDeal(null)}
      />
    </>
  )
}
