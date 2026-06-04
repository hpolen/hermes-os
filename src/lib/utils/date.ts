import { format, startOfWeek } from 'date-fns'

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getWeekLabel(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return `Week of ${format(weekStart, 'MMM d')}`
}

export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}
