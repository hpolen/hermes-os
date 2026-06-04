'use client'
import { TimelineEvent, TimelineEventType } from '@/lib/types'
import { getRelativeTime } from '@/lib/utils/date'
import {
  Sparkles,
  CheckCircle2,
  Plus,
  Bot,
  Scale,
  Flag,
  ClipboardCheck,
  StickyNote,
  RefreshCw,
  Circle,
} from 'lucide-react'

interface Props {
  event: TimelineEvent
}

const iconMap: Record<TimelineEventType, React.ElementType> = {
  created: Sparkles,
  task_completed: CheckCircle2,
  task_added: Plus,
  task_created: Plus,
  agent_assigned: Bot,
  agent_deployed: Bot,
  decision: Scale,
  milestone: Flag,
  milestone_reached: Flag,
  standup_mention: ClipboardCheck,
  standup_morning: ClipboardCheck,
  standup_midday: ClipboardCheck,
  standup_evening: ClipboardCheck,
  note: StickyNote,
  note_added: StickyNote,
  status_change: RefreshCw,
  project_status_changed: RefreshCw,
}

export function TimelineEventItem({ event }: Props) {
  const Icon = iconMap[event.type] ?? Circle
  const relativeTime = event.createdAt
    ? getRelativeTime((event.createdAt as unknown as { toDate(): Date }).toDate())
    : ''

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded hover:bg-muted/40 transition-colors">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm flex-1">{event.description}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0">{relativeTime}</span>
    </div>
  )
}
