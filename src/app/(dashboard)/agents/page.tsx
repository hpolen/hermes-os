'use client'
import { useEffect, useState } from 'react'
import {
  Bot, Activity, Zap, CheckCircle2, AlertCircle, Clock,
  TrendingUp, ArrowUpRight, BarChart3, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getAgents } from '@/lib/firebase/agents'
import { getRecentEvents } from '@/lib/firebase/monitoring'
import { Agent } from '@/lib/types'
import { MonitoringEvent } from '@/lib/firebase/monitoring'
import {
  AgentMetrics,
  OverallMetrics,
  aggregateAgentMetrics,
  aggregateOverallMetrics,
  formatTokens,
} from '@/lib/firebase/agentMetrics'
import { formatDistanceToNow } from 'date-fns'
import ClaudeCodeAgentsSection from '@/components/agents/ClaudeCodeAgentsSection'

// ─── Status helpers ──────────────────────────────────────────────────────────

function statusColor(status: Agent['status']) {
  switch (status) {
    case 'active':  return 'bg-green-500'
    case 'idle':    return 'bg-yellow-400'
    case 'paused':  return 'bg-blue-400'
    case 'error':   return 'bg-red-500'
    case 'offline': return 'bg-slate-400'
    default:        return 'bg-slate-400'
  }
}

function statusBadgeVariant(status: Agent['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':  return 'default'
    case 'error':   return 'destructive'
    default:        return 'secondary'
  }
}

function lifecycleBadge(lc: Agent['lifecycle']) {
  const colors: Record<Agent['lifecycle'], string> = {
    bootstrapping: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
    operational:   'text-green-400 border-green-400/40 bg-green-400/10',
    maintenance:   'text-blue-400 border-blue-400/40 bg-blue-400/10',
    deprecated:    'text-slate-400 border-slate-400/40 bg-slate-400/10',
  }
  return colors[lc] ?? colors.operational
}

function eventStatusIcon(status: MonitoringEvent['status']) {
  switch (status) {
    case 'ok':      return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
    case 'warning': return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
    case 'error':   return <AlertCircle className="w-3.5 h-3.5 text-red-400" />
  }
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Token Bar ───────────────────────────────────────────────────────────────

function TokenBar({ metrics, max }: { metrics: AgentMetrics; max: number }) {
  const pct = max > 0 ? Math.round((metrics.totalTokens / max) * 100) : 0
  const inPct = metrics.totalTokens > 0
    ? Math.round((metrics.tokensIn / metrics.totalTokens) * 100)
    : 50

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium truncate max-w-[140px]">{metrics.agentName}</span>
        <span className="text-muted-foreground tabular-nums">{formatTokens(metrics.totalTokens)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full flex" style={{ width: `${pct}%` }}>
          <div className="bg-blue-500" style={{ width: `${inPct}%` }} />
          <div className="bg-violet-500 flex-1" />
        </div>
      </div>

      <Separator />

      <ClaudeCodeAgentsSection />

    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [events, setEvents] = useState<MonitoringEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(quiet = false) {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const [a, e] = await Promise.all([
        getAgents(),
        getRecentEvents(200),
      ])
      setAgents(a)
      setEvents(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const agentMetrics = aggregateAgentMetrics(agents, events)
  const overall = aggregateOverallMetrics(agents, agentMetrics)
  const maxTokens = Math.max(...agentMetrics.map(m => m.totalTokens), 1)
  const recentAgentEvents = events.filter(e => e.type === 'agent_run').slice(0, 20)

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI workforce overview — status, usage, and token metrics</p>
        </div>
        <button
          onClick={() => load(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Bot}
          label="Total Agents"
          value={overall.totalAgents}
          sub={`${overall.activeAgents} active`}
          color="bg-blue-500"
        />
        <KpiCard
          icon={Activity}
          label="Total Runs (30d)"
          value={overall.totalRuns > 0 ? overall.totalRuns.toLocaleString() : '—'}
          sub={overall.totalRuns > 0 ? `${overall.successRate}% success rate` : 'No runs logged yet'}
          color="bg-green-500"
        />
        <KpiCard
          icon={Zap}
          label="Total Tokens"
          value={overall.totalTokens > 0 ? formatTokens(overall.totalTokens) : '—'}
          sub={overall.totalTokens > 0
            ? `↑ ${formatTokens(overall.tokensIn)} in  ↓ ${formatTokens(overall.tokensOut)} out`
            : 'No usage logged yet'}
          color="bg-violet-500"
        />
        <KpiCard
          icon={TrendingUp}
          label="Error Rate"
          value={overall.totalRuns > 0 ? `${overall.errorRate}%` : '—'}
          sub={overall.totalRuns > 0 ? `${overall.totalRuns - agentMetrics.reduce((s, m) => s + m.errorRuns, 0)} clean runs` : 'No data yet'}
          color={overall.errorRate > 10 ? 'bg-red-500' : 'bg-slate-500'}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Agent Roster — spans 2 cols */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Agent Roster
          </h2>
          <Card>
            <CardContent className="p-0">
              {agents.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No agents found.{' '}
                  <span className="text-xs">Seed agents via the API or add them in Firestore.</span>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {agents.map(agent => {
                    const m = agentMetrics.find(x => x.agentId === agent.id)
                    return (
                      <div key={agent.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                        {/* Status dot */}
                        <div className="mt-1 flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${statusColor(agent.status)}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{agent.name}</span>
                            <Badge variant={statusBadgeVariant(agent.status)} className="text-[10px] h-4">
                              {agent.status}
                            </Badge>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${lifecycleBadge(agent.lifecycle)}`}>
                              {agent.lifecycle}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{agent.description}</p>
                          {agent.capabilities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {agent.capabilities.map(cap => (
                                <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {cap}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Metrics */}
                        <div className="text-right flex-shrink-0 space-y-0.5">
                          <div className="text-xs font-semibold tabular-nums">
                            {m && m.totalRuns > 0 ? (
                              <span className="flex items-center gap-1 justify-end text-green-400">
                                <ArrowUpRight className="w-3 h-3" />
                                {m.totalRuns} runs
                              </span>
                            ) : (
                              <span className="text-muted-foreground">no runs</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {m && m.totalTokens > 0 ? (
                              <span className="text-violet-400">{formatTokens(m.totalTokens)} tokens</span>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                          {agent.lastActiveAt && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDistanceToNow(agent.lastActiveAt.toDate(), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: token breakdown + activity */}
        <div className="space-y-6">

          {/* Token Usage by Agent */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Token Usage by Agent
            </h2>
            <Card>
              <CardContent className="pt-4 pb-5 space-y-4">
                {agentMetrics.filter(m => m.totalTokens > 0).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No token data yet. Usage is logged via monitoring events with{' '}
                    <code className="text-[10px] bg-muted px-1 rounded">tokensIn</code> /{' '}
                    <code className="text-[10px] bg-muted px-1 rounded">tokensOut</code> in metadata.
                  </p>
                ) : (
                  <>
                    {agentMetrics
                      .filter(m => m.totalTokens > 0)
                      .sort((a, b) => b.totalTokens - a.totalTokens)
                      .map(m => (
                        <TokenBar key={m.agentId} metrics={m} max={maxTokens} />
                      ))}
                    <div className="flex items-center gap-4 pt-1 border-t border-border">
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Input
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Output
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Feed */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Recent Activity
            </h2>
            <Card>
              <CardContent className="p-0">
                {recentAgentEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No agent run events yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {recentAgentEvents.map(e => (
                      <div key={e.id} className="px-4 py-2.5 flex items-start gap-2.5">
                        <div className="mt-0.5">{eventStatusIcon(e.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium">{e.source}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{e.message}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {e.timestamp?.toDate
                            ? formatDistanceToNow(e.timestamp.toDate(), { addSuffix: true })
                            : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      <Separator />

      <ClaudeCodeAgentsSection />

    </div>
  )
}
