import { Project } from '@/lib/types'

export function usePortfolioHealth(projects: Project[]) {
  const total = projects.length
  const green = projects.filter(p => p.health === 'green').length
  const yellow = projects.filter(p => p.health === 'yellow').length
  const red = projects.filter(p => p.health === 'red').length
  const score = total > 0 ? Math.round((green / total) * 100) : 0
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
  const topProject = projects
    .filter(p => p.status === 'active')
    .sort((a, b) => a.tier - b.tier)[0] ?? null
  return { total, green, yellow, red, score, grade, topProject }
}
