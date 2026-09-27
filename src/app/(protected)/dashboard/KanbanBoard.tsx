'use client'

import { useState } from 'react'
import { Deal, DEAL_STATUSES, STATUS_LABELS, ReminderWithDeal, DealStatus } from '@/lib/types'
import { DealCard } from './DealCard'
import { NewDealSheet } from './NewDealSheet'
import { DealSheet } from './DealSheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const STATUS_COLORS: Record<string, string> = {
  lead:         'bg-muted',
  pitched:      'bg-blue-50 dark:bg-blue-950/30',
  negotiating:  'bg-yellow-50 dark:bg-yellow-950/30',
  agreed:       'bg-green-50 dark:bg-green-950/30',
  content_live: 'bg-purple-50 dark:bg-purple-950/30',
  invoiced:     'bg-orange-50 dark:bg-orange-950/30',
  paid:         'bg-green-100 dark:bg-green-900/30',
  closed_lost:  'bg-red-50 dark:bg-red-950/30',
}

const STATUS_CHIP_COLORS: Record<string, string> = {
  lead:         'bg-muted text-muted-foreground',
  pitched:      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  negotiating:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  agreed:       'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  content_live: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  invoiced:     'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  paid:         'bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100',
  closed_lost:  'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
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
  const [mobileStage, setMobileStage] = useState<DealStatus | 'all'>('all')

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

  const mobileDeals = mobileStage === 'all'
    ? deals
    : deals.filter((d) => d.status === mobileStage)

  const needsAttentionBanner = overdueReminders.length > 0 && (
    <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm font-semibold text-destructive mb-2">
        Needs attention &middot; {overdueReminders.length}
      </p>
      <div className="space-y-1.5">
        {overdueReminders.map((r) => (
          <div
            key={r.id}
            className="flex items-start gap-2 text-sm cursor-pointer hover:bg-destructive/10 rounded px-1 py-0.5 -mx-1"
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
            <span className="text-xs text-destructive whitespace-nowrap shrink-0">{daysOverdue(r.remind_at!)}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* ── Mobile view ── */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Pipeline</h1>
          <Button size="sm" onClick={() => setNewDealOpen(true)}>+ New deal</Button>
        </div>

        {needsAttentionBanner}

        {/* Stage filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
          <button
            onClick={() => setMobileStage('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mobileStage === 'all'
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            All {deals.length > 0 && `(${deals.length})`}
          </button>
          {DEAL_STATUSES.map((s) => {
            const count = byStatus[s].length
            if (count === 0) return null
            return (
              <button
                key={s}
                onClick={() => setMobileStage(s)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  mobileStage === s
                    ? 'bg-foreground text-background'
                    : STATUS_CHIP_COLORS[s]
                }`}
              >
                {STATUS_LABELS[s]} ({count})
              </button>
            )
          })}
        </div>

        {/* Deal list */}
        <div className="space-y-2">
          {mobileDeals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No deals here yet.</p>
          )}
          {mobileDeals.map((deal) => (
            <div key={deal.id} className="relative">
              {mobileStage === 'all' && (
                <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${STATUS_CHIP_COLORS[deal.status]}`}>
                  {STATUS_LABELS[deal.status]}
                </span>
              )}
              <DealCard deal={deal} onClick={() => setActiveDeal(deal)} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop kanban ── */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          <Button onClick={() => setNewDealOpen(true)}>+ New deal</Button>
        </div>

        {needsAttentionBanner}

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
                      <DealCard key={deal.id} deal={deal} onClick={() => setActiveDeal(deal)} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <NewDealSheet open={newDealOpen} onClose={() => setNewDealOpen(false)} creatorId={creatorId} />
      <DealSheet key={activeDeal?.id ?? 'empty'} deal={activeDeal} onClose={() => setActiveDeal(null)} />
    </>
  )
}
