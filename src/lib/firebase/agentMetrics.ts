import { Agent } from '../types'
import { MonitoringEvent } from './monitoring'

export interface AgentMetrics {
  agentId: string
  agentName: string
  totalRuns: number
  successRuns: number
  errorRuns: number
  warningRuns: number
  tokensIn: number
  tokensOut: number
  totalTokens: number
  lastRunAt: Date | null
}

export interface OverallMetrics {
  totalAgents: number
  activeAgents: number
  totalRuns: number
  totalTokens: number
  tokensIn: number
  tokensOut: number
  successRate: number
  errorRate: number
}

export function aggregateAgentMetrics(
  agents: Agent[],
  events: MonitoringEvent[]
): AgentMetrics[] {
  const agentRunEvents = events.filter(e => e.type === 'agent_run')

  return agents.map(agent => {
    const agentEvents = agentRunEvents.filter(
      e => e.source === agent.name || e.source === agent.id
    )
    const tokensIn = agentEvents.reduce(
      (sum, e) => sum + ((e.metadata?.tokensIn as number) ?? 0), 0
    )
    const tokensOut = agentEvents.reduce(
      (sum, e) => sum + ((e.metadata?.tokensOut as number) ?? 0), 0
    )
    const lastEvent = agentEvents[0] // events are sorted desc

    return {
      agentId: agent.id,
      agentName: agent.name,
      totalRuns: agentEvents.length,
      successRuns: agentEvents.filter(e => e.status === 'ok').length,
      errorRuns: agentEvents.filter(e => e.status === 'error').length,
      warningRuns: agentEvents.filter(e => e.status === 'warning').length,
      tokensIn,
      tokensOut,
      totalTokens: tokensIn + tokensOut,
      lastRunAt: lastEvent?.timestamp?.toDate?.() ?? null,
    }
  })
}

export function aggregateOverallMetrics(
  agents: Agent[],
  agentMetrics: AgentMetrics[]
): OverallMetrics {
  const totalRuns = agentMetrics.reduce((s, m) => s + m.totalRuns, 0)
  const successRuns = agentMetrics.reduce((s, m) => s + m.successRuns, 0)
  const errorRuns = agentMetrics.reduce((s, m) => s + m.errorRuns, 0)
  const tokensIn = agentMetrics.reduce((s, m) => s + m.tokensIn, 0)
  const tokensOut = agentMetrics.reduce((s, m) => s + m.tokensOut, 0)

  return {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    totalRuns,
    totalTokens: tokensIn + tokensOut,
    tokensIn,
    tokensOut,
    successRate: totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0,
    errorRate: totalRuns > 0 ? Math.round((errorRuns / totalRuns) * 100) : 0,
  }
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
