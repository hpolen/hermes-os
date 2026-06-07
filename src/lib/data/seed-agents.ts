import { Agent } from '@/lib/types'

export const SEED_AGENTS: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Alfred',
    description: 'Chief-of-staff AI assistant. Primary interface for prioritization, planning, execution, and second-brain operations.',
    status: 'active',
    lifecycle: 'operational',
    capabilities: ['planning', 'code-review', 'research', 'automation', 'discord-delivery'],
    projectIds: [],
    metadata: { channel: 'discord', model: 'claude-sonnet-4-6', provider: 'anthropic' },
  },
  {
    name: 'PM Agent',
    description: 'Automated project management cron agent. Runs daily at 6:30 AM ET, surfaces blockers and project health updates.',
    status: 'paused',
    lifecycle: 'operational',
    capabilities: ['project-monitoring', 'status-reporting', 'cron'],
    projectIds: [],
    metadata: { schedule: '0 6:30 * * *', channel: 'discord' },
  },
  {
    name: 'AI Editor',
    description: 'Weekly editorial agent. Runs Sunday 8 AM ET, reviews content drafts, summarizes week, and posts briefings.',
    status: 'paused',
    lifecycle: 'operational',
    capabilities: ['content-review', 'summarization', 'cron'],
    projectIds: [],
    metadata: { schedule: '0 8 * * 0', channel: 'discord' },
  },
  {
    name: 'ATLAS Bot',
    description: 'Discord bot for the ATLAS project. Handles slash commands, LangGraph workflows, and MCP tool integrations.',
    status: 'active',
    lifecycle: 'operational',
    capabilities: ['discord-bot', 'langgraph', 'mcp', 'slash-commands'],
    projectIds: [],
    metadata: { handle: 'atlas#0648', startScript: 'scripts/start_discord_bot.sh' },
  },
  {
    name: 'atlas-dev-agent',
    description: 'Code execution and repo management agent. Executes repo changes only after APPROVE gate. Reports changed files + verification.',
    status: 'active',
    lifecycle: 'operational',
    capabilities: ['code-execution', 'git', 'pr-workflow', 'repo-management'],
    projectIds: [],
    metadata: { approvalRequired: true, repo: 'github.com/hpolen/ATLAS' },
  },
]
