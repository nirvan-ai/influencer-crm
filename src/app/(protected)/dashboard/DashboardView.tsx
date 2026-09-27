'use client'

import Link from 'next/link'
import { Deal, ReminderWithDeal, DEAL_STATUSES, STATUS_LABELS, DealStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function fmt(amount: number, currency: string) {
  if (amount === 0) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function daysOverdue(remind_at: string) {
  const days = Math.floor((Date.now() - new Date(remind_at).getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1d overdue'
  return `${days}d overdue`
}

function daysSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1d'
  return `${days}d`
}

const STAGE_BAR_COLORS: Record<DealStatus, string> = {
  lead:         'bg-muted-foreground/40',
  pitched:      'bg-blue-400',
  negotiating:  'bg-yellow-400',
  agreed:       'bg-green-400',
  content_live: 'bg-purple-400',
  invoiced:     'bg-orange-400',
  paid:         'bg-green-600',
  closed_lost:  'bg-red-300',
}

type Props = {
  activeDealsCount: number
  pipelineValue: number
  pitchedThisWeek: number
  earnedThisMonth: number
  closedThisMonthCount: number
  byStage: Record<DealStatus, number>
  overdueReminders: ReminderWithDeal[]
  coldLeads: Deal[]
  currency: string
}

export function DashboardView({
  activeDealsCount, pipelineValue, pitchedThisWeek,
  earnedThisMonth, closedThisMonthCount,
  byStage, overdueReminders, coldLeads, currency,
}: Props) {
  const maxStageCount = Math.max(...DEAL_STATUSES.map(s => byStage[s] ?? 0), 1)
  const focusCount = overdueReminders.length + coldLeads.length

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* ── Today's focus ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Today&apos;s focus {focusCount > 0 && <span className="text-destructive">· {focusCount}</span>}
          </h2>
          <Link href="/pipeline">
            <Button size="sm" variant="outline">+ New deal</Button>
          </Link>
        </div>

        {focusCount === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground text-center py-6">
              All caught up — go pitch some brands.
            </CardContent>
          </Card>
        )}

        {overdueReminders.map(r => (
          <Link href="/pipeline" key={r.id}>
            <Card className="mb-2 border-destructive/30 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors">
              <CardContent className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.deal?.brand?.name ?? 'Unknown brand'}</p>
                  <p className="text-xs text-muted-foreground">{r.text}</p>
                </div>
                <span className="text-xs text-destructive shrink-0">{daysOverdue(r.remind_at!)}</span>
              </CardContent>
            </Card>
          </Link>
        ))}

        {coldLeads.map(d => {
          const acts = d.activity ?? []
          const lastTs = acts.length
            ? Math.max(...acts.map(a => new Date(a.created_at).getTime()))
            : new Date(d.created_at).getTime()
          return (
            <Link href="/pipeline" key={d.id}>
              <Card className="mb-2 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors">
                <CardContent className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{d.brand?.name ?? 'Unknown brand'}</p>
                    <p className="text-xs text-muted-foreground">{STATUS_LABELS[d.status]} · no activity</p>
                  </div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">{daysSince(new Date(lastTs).toISOString())} cold</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>

      {/* ── Quick stats ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{activeDealsCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active deals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{fmt(pipelineValue, currency)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pipeline value</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{pitchedThisWeek}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Moved forward this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{fmt(earnedThisMonth, currency)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Earned this month {closedThisMonthCount > 0 && `(${closedThisMonthCount} deals)`}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Stage breakdown ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Pipeline breakdown</h2>
        <Card>
          <CardContent className="p-4 space-y-2.5">
            {DEAL_STATUSES.map(s => {
              const count = byStage[s] ?? 0
              if (count === 0) return null
              const pct = Math.round((count / maxStageCount) * 100)
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{STATUS_LABELS[s]}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${STAGE_BAR_COLORS[s]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium w-4 text-right">{count}</span>
                </div>
              )
            })}
            {DEAL_STATUSES.every(s => (byStage[s] ?? 0) === 0) && (
              <p className="text-sm text-muted-foreground text-center py-2">No deals yet — <Link href="/pipeline" className="underline">add your first one</Link>.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Go to pipeline ── */}
      <Link href="/pipeline">
        <Button variant="outline" className="w-full">View full pipeline →</Button>
      </Link>

    </div>
  )
}
