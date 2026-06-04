'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/firebase/projects'
import { getTasksByProject } from '@/lib/firebase/tasks'
import { getTodayStandups } from '@/lib/firebase/standup'
import { getTodayString } from '@/lib/utils/date'
import { deriveAttentionItems, AttentionItem } from '@/lib/utils/attention'
import { Task } from '@/lib/types'
import { AlertTriangle, AlertCircle, ClipboardList, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ICONS = {
  risk: AlertTriangle,
  blocker: AlertCircle,
  standup: ClipboardList,
  idle: AlertCircle,
}

const SEVERITY_COLORS: Record<string, 'destructive' | 'secondary' | 'outline'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
}

export function AttentionWidget() {
  const [items, setItems] = useState<AttentionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [projects, standups] = await Promise.all([
        getProjects(),
        getTodayStandups(getTodayString())
      ])
      // Fetch all tasks for active projects
      const taskPromises = projects
        .filter(p => p.status === 'active')
        .map(p => getTasksByProject(p.id))
      const taskArrays = await Promise.all(taskPromises)
      const tasks: Task[] = taskArrays.flat()
      setItems(deriveAttentionItems(projects, tasks, [], standups))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Attention Required
          {items.length > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">{items.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600 text-sm py-2">
            <CheckCircle2 className="w-4 h-4" />
            All clear — nothing needs immediate attention
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 6).map(item => {
              const Icon = ICONS[item.type]
              const content = (
                <div className="flex items-start gap-2 p-2 rounded hover:bg-muted transition-colors cursor-pointer">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.severity === 'high' ? 'text-red-500' : 'text-orange-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    {item.sublabel && <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>}
                  </div>
                  <Badge variant={SEVERITY_COLORS[item.severity]} className="text-xs flex-shrink-0">{item.severity}</Badge>
                </div>
              )
              return item.href ? (
                <Link key={item.id} href={item.href}>{content}</Link>
              ) : (
                <div key={item.id}>{content}</div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
