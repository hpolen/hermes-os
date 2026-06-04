'use client'
import { useEffect, useState } from 'react'
import { getProjectTimeline, logTimelineEvent } from '@/lib/firebase/timeline'
import { TimelineEvent } from '@/lib/types'
import { TimelineEventItem } from '@/components/projects/TimelineEventItem'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { StickyNote } from 'lucide-react'

interface Props { projectId: string }

export function TimelineTab({ projectId }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = async () => {
    const e = await getProjectTimeline(projectId)
    setEvents(e)
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleLogNote = async () => {
    if (!note.trim()) return
    await logTimelineEvent(projectId, 'note', note.trim())
    setNote('')
    setDialogOpen(false)
    await load()
  }

  if (loading) return <div className="h-64 bg-muted rounded animate-pulse" />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm"><StickyNote className="w-4 h-4 mr-1" />Log Note</Button>
            }
          />
          <DialogContent>
            <DialogHeader><DialogTitle>Log a Note</DialogTitle></DialogHeader>
            <Textarea placeholder="What happened? Decision made, context to capture..." value={note} onChange={e => setNote(e.target.value)} rows={4} />
            <Button onClick={handleLogNote} className="w-full">Save Note</Button>
          </DialogContent>
        </Dialog>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No timeline events yet. Events are logged automatically as you work on this project.</p>
      ) : (
        <div className="space-y-1">
          {events.map(event => <TimelineEventItem key={event.id} event={event} />)}
        </div>
      )}
    </div>
  )
}
