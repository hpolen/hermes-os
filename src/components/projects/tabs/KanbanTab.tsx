'use client'
import { useEffect, useState } from 'react'
import { getTasksByProject, createTask, updateTask } from '@/lib/firebase/tasks'
import { logTimelineEvent } from '@/lib/firebase/timeline'
import { Task, TaskStatus } from '@/lib/types'
import { TaskCard } from '@/components/projects/TaskCard'
import { AddTaskSheet } from '@/components/projects/AddTaskSheet'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'ready', label: 'Ready' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'completed', label: 'Completed' },
  { status: 'deferred', label: 'Deferred' },
]

interface Props { projectId: string }

export function KanbanTab({ projectId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = async () => {
    const t = await getTasksByProject(projectId)
    setTasks(t)
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleMove = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus })
    if (newStatus === 'completed') {
      const task = tasks.find(t => t.id === taskId)
      if (task) await logTimelineEvent(projectId, 'task_completed', `Task completed: "${task.title}"`)
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const handleAdd = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createTask(data)
    await logTimelineEvent(projectId, 'task_added', `Task added: "${data.title}"`)
    await load()
    setSheetOpen(false)
  }

  if (loading) return <div className="h-64 bg-muted rounded animate-pulse" />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setSheetOpen(true)}><Plus className="w-4 h-4 mr-1" />Add Task</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {COLUMNS.map(col => (
          <div key={col.status} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5">{tasks.filter(t => t.status === col.status).length}</span>
            </div>
            <div className="space-y-2 min-h-16">
              {tasks.filter(t => t.status === col.status).map(task => (
                <TaskCard key={task.id} task={task} onMove={handleMove} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <AddTaskSheet open={sheetOpen} onOpenChange={setSheetOpen} projectId={projectId} onAdd={handleAdd} />
    </div>
  )
}
