import { Pillar, Initiative } from '@/lib/types'

export const SEED_PILLARS: Omit<Pillar, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'EA Program',
    shortKey: 'E',
    color: 'blue',
    emoji: '🏛️',
    order: 1,
    agentEnabled: false, // work computer — no agent access
  },
  {
    name: 'Security Architecture',
    shortKey: 'S',
    color: 'red',
    emoji: '🛡️',
    order: 2,
    agentEnabled: false,
  },
  {
    name: 'ATLAS',
    shortKey: 'A',
    color: 'violet',
    emoji: '⚡',
    order: 3,
    agentEnabled: true,
  },
  {
    name: 'Hermes OS',
    shortKey: 'H',
    color: 'sky',
    emoji: '🚀',
    order: 4,
    agentEnabled: true,
  },
  {
    name: 'Consulting',
    shortKey: 'C',
    color: 'amber',
    emoji: '💼',
    order: 5,
    agentEnabled: false,
  },
  {
    name: 'Personal',
    shortKey: 'P',
    color: 'green',
    emoji: '🌱',
    order: 6,
    agentEnabled: false,
  },
]

// pillarId values are placeholders replaced at seed time.
// Format: PLACEHOLDER_pillarIndex_<N> where N is the 0-based index into SEED_PILLARS.
export const SEED_INITIATIVES: Omit<Initiative, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ── EA Program (index 0) ──────────────────────────────────────
  {
    pillarId: 'PLACEHOLDER_pillarIndex_0',
    name: 'Cloud Hosting Strategy',
    status: 'active',
    order: 1,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_0',
    name: 'COBIT Governance Rollout',
    status: 'active',
    order: 2,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_0',
    name: 'Well-Architected Framework Reviews',
    status: 'active',
    order: 3,
  },

  // ── Security Architecture (index 1) ──────────────────────────
  {
    pillarId: 'PLACEHOLDER_pillarIndex_1',
    name: 'Threat Modeling Program',
    status: 'active',
    order: 1,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_1',
    name: 'Security Review Pipeline',
    status: 'active',
    order: 2,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_1',
    name: 'Zero Trust Roadmap',
    status: 'active',
    order: 3,
  },

  // ── ATLAS (index 2) ───────────────────────────────────────────
  {
    pillarId: 'PLACEHOLDER_pillarIndex_2',
    name: 'MCP Tool Expansion',
    status: 'active',
    order: 1,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_2',
    name: 'LangGraph Workflow Library',
    status: 'active',
    order: 2,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_2',
    name: 'Discord Bot Hardening',
    status: 'active',
    order: 3,
  },

  // ── Hermes OS (index 3) ───────────────────────────────────────
  {
    pillarId: 'PLACEHOLDER_pillarIndex_3',
    name: 'Focus Module Launch',
    status: 'active',
    order: 1,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_3',
    name: 'Vercel Production Stability',
    status: 'active',
    order: 2,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_3',
    name: 'Agent Token Tracking',
    status: 'active',
    order: 3,
  },

  // ── Consulting (index 4) ──────────────────────────────────────
  {
    pillarId: 'PLACEHOLDER_pillarIndex_4',
    name: 'Green Tree Platform MVP',
    status: 'active',
    order: 1,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_4',
    name: 'Client AI Automation Proposals',
    status: 'active',
    order: 2,
  },

  // ── Personal (index 5) ────────────────────────────────────────
  {
    pillarId: 'PLACEHOLDER_pillarIndex_5',
    name: 'Fitness Consistency',
    status: 'active',
    order: 1,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_5',
    name: 'Skill Development',
    status: 'active',
    order: 2,
  },
  {
    pillarId: 'PLACEHOLDER_pillarIndex_5',
    name: 'Weekly Review Habit',
    status: 'active',
    order: 3,
  },
]
