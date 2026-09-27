'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, ActivityEventType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const EVENT_LABELS: Record<ActivityEventType, string> = {
  status_change: 'Stage',
  note: 'Note',
  reminder: 'Reminder',
}

const EVENT_COLORS: Record<ActivityEventType, string> = {
  status_change: 'secondary',
  note: 'outline',
  reminder: 'default',
}

export function ActivityFeed({ dealId }: { dealId: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'note' | 'reminder'>('note')
  const [noteText, setNoteText] = useState('')
  const [reminderText, setReminderText] = useState('')
  const [remindAt, setRemindAt] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetch() {
    const supabase = createClient()
    const { data } = await supabase
      .from('activity')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
    setActivities(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetch()
  }, [dealId])

  async function addNote() {
    if (!noteText.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('activity').insert({
      deal_id: dealId,
      event_type: 'note',
      text: noteText.trim(),
    })
    setNoteText('')
    setSaving(false)
    fetch()
  }

  async function addReminder() {
    if (!reminderText.trim() || !remindAt) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('activity').insert({
      deal_id: dealId,
      event_type: 'reminder',
      text: reminderText.trim(),
      remind_at: new Date(remindAt).toISOString(),
    })
    setReminderText('')
    setRemindAt('')
    setSaving(false)
    fetch()
  }

  async function remove(id: string) {
    const supabase = createClient()
    await supabase.from('activity').delete().eq('id', id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function isOverdue(remind_at: string) {
    return new Date(remind_at) < new Date()
  }

  return (
    <div className="space-y-4 mt-4">
      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</p>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={tab === 'note' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('note')}
          >
            Note
          </Button>
          <Button
            type="button"
            variant={tab === 'reminder' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('reminder')}
          >
            Reminder
          </Button>
        </div>

        {tab === 'note' && (
          <div className="space-y-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note…"
              rows={2}
            />
            <Button
              type="button"
              size="sm"
              onClick={addNote}
              disabled={saving || !noteText.trim()}
            >
              {saving ? 'Saving…' : 'Save note'}
            </Button>
          </div>
        )}

        {tab === 'reminder' && (
          <div className="space-y-2">
            <Input
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="e.g. Follow up on contract"
            />
            <Input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              onClick={addReminder}
              disabled={saving || !reminderText.trim() || !remindAt}
            >
              {saving ? 'Saving…' : 'Set reminder'}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && activities.length === 0 && (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}
        {activities.map((a) => (
          <div key={a.id} className="flex gap-2 group">
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={EVENT_COLORS[a.event_type as ActivityEventType] as 'secondary' | 'outline' | 'default'} className="text-xs">
                  {EVENT_LABELS[a.event_type as ActivityEventType]}
                </Badge>
                {a.remind_at && (
                  <span className={`text-xs ${isOverdue(a.remind_at) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {isOverdue(a.remind_at) ? 'Overdue · ' : 'Due · '}{formatDate(a.remind_at)}
                  </span>
                )}
                {!a.remind_at && (
                  <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                )}
              </div>
              <p className="text-sm">{a.text}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(a.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-sm leading-none mt-0.5 transition-opacity"
              aria-label="Delete"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
