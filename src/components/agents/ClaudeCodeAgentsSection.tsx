'use client'
import { useEffect, useState } from 'react'
import { Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface ClaudeAgent {
  name: string
  description: string
  model: string
  tools: string[]
  instructions: string
  filename: string
}

function AgentCard({ agent }: { agent: ClaudeAgent }): React.ReactElement {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{agent.name}</CardTitle>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {agent.model && (
              <Badge variant="outline" className="text-[10px] h-4 font-mono">
                {agent.model}
              </Badge>
            )}
          </div>
        </div>
        {agent.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{agent.description}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {agent.tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.tools.map(tool => (
              <span
                key={tool}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
              >
                {tool}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Hide' : 'Show'} instructions
        </button>

        {expanded && agent.instructions && (
          <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono bg-muted/50 rounded-md p-3 text-muted-foreground overflow-x-auto max-h-80 overflow-y-auto">
            {agent.instructions}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardContent className="pt-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-1.5">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ClaudeCodeAgentsSection(): React.ReactElement {
  const [agents, setAgents] = useState<ClaudeAgent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agents/claude-code')
      .then(r => r.json())
      .then((data: ClaudeAgent[]) => setAgents(data))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        <Bot className="w-3.5 h-3.5" /> Claude Code Agents
      </h2>

      {loading ? (
        <LoadingSkeleton />
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No Claude Code agents found.{' '}
            <span className="text-xs">Add .md files to ~/.claude/agents/ to define agents.</span>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents.map(agent => (
            <AgentCard key={agent.filename} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}
