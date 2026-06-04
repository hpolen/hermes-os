'use client'
import { Task, TaskStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'

interface Props {
  task: Task
  onMove: (taskId: string, newStatus: TaskStatus) => void
}

const STATUSES: { status: TaskStatus; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'ready', label: 'Ready' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'completed', label: 'Completed' },
  { status: 'deferred', label: 'Deferred' },
]

const priorityVariant: Record<string, 'destructive' | 'secondary' | 'outline'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
}

const priorityClass: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function TaskCard({ task, onMove }: Props) {
  const dueDateStr = task.dueDate
    ? (task.dueDate as unknown as { toDate(): Date }).toDate().toLocaleDateString()
    : null

  return (
    <div className="bg-card border rounded-md p-2 text-xs space-y-1 group">
      <div className="flex items-start justify-between gap-1">
        <span className="font-medium leading-tight flex-1">{task.title}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUSES.filter(s => s.status !== task.status).map(s => (
              <DropdownMenuItem key={s.status} onClick={() => onMove(task.id, s.status)}>
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className={`inline-flex items-center rounded border px-1 py-0.5 text-xs font-medium ${priorityClass[task.priority] ?? ''}`}>
          {task.priority}
        </span>
        {dueDateStr && <span className="text-muted-foreground">due {dueDateStr}</span>}
      </div>
      {task.status === 'blocked' && task.blockedReason && (
        <p className="text-red-600 text-xs leading-tight">{task.blockedReason}</p>
      )}
    </div>
  )
}
