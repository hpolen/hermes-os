import { Project, Task, Agent, StandupEntry } from '@/lib/types'

export type AttentionSeverity = 'high' | 'medium' | 'low'
export type AttentionType = 'risk' | 'blocker' | 'standup' | 'idle'

export interface AttentionItem {
  id: string
  type: AttentionType
  label: string
  sublabel?: string
  projectId?: string
  severity: AttentionSeverity
  href?: string
}

export function deriveAttentionItems(
  projects: Project[],
  tasks: Task[],
  agents: Agent[],
  todayStandups: StandupEntry[]
): AttentionItem[] {
  const items: AttentionItem[] = []

  // Red health active projects
  projects
    .filter(p => p.health === 'red' && p.status === 'active')
    .forEach(p => items.push({
      id: `risk-${p.id}`,
      type: 'risk',
      label: `${p.name} health is critical`,
      sublabel: 'Project needs attention',
      projectId: p.id,
      severity: 'high',
      href: `/projects/${p.id}`
    }))

  // Blocked tasks
  tasks
    .filter(t => t.status === 'blocked')
    .forEach(t => items.push({
      id: `blocker-${t.id}`,
      type: 'blocker',
      label: t.title,
      sublabel: t.blockedReason ?? 'Task is blocked',
      projectId: t.projectId,
      severity: 'medium',
      href: `/projects/${t.projectId}`
    }))

  // Missing morning standup (after 9 AM)
  const hour = new Date().getHours()
  const hasMorning = todayStandups.some(s => s.type === 'morning')
  if (!hasMorning && hour >= 9) {
    items.push({
      id: 'standup-missing',
      type: 'standup',
      label: 'Morning standup not completed',
      sublabel: 'Start your day with intention',
      severity: hour >= 11 ? 'high' : 'medium',
      href: '/standup'
    })
  }

  // Yellow health Tier 1 or 2 projects
  projects
    .filter(p => p.health === 'yellow' && p.tier <= 2 && p.status === 'active')
    .forEach(p => items.push({
      id: `yellow-${p.id}`,
      type: 'risk',
      label: `${p.name} needs review`,
      sublabel: `${p.tier === 1 ? 'Day Job' : 'Revenue'} project at risk`,
      projectId: p.id,
      severity: 'medium',
      href: `/projects/${p.id}`
    }))

  // Suppress unused variable warning for agents
  void agents

  return items.sort((a, b) => {
    const order: Record<AttentionSeverity, number> = { high: 0, medium: 1, low: 2 }
    return order[a.severity] - order[b.severity]
  })
}
