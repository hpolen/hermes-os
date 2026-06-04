import { Project } from '@/lib/types'

export const SEED_PROJECTS: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'lastActivity'>[] = [
  { name: 'EA Program', tier: 1, health: 'green', status: 'active', mission: 'Lead Enterprise Architecture program at the day job — commitments, threat modeling, well-architected framework.', goals: ['Define cloud hosting strategy', 'Mentor junior developers', 'Lead COBIT-aligned governance'], risks: [], dependencies: [], assignedAgents: [] },
  { name: 'Club Report', tier: 2, health: 'yellow', status: 'active', mission: 'Revenue generating initiative — details TBD.', goals: [], risks: ['Not yet fully defined'], dependencies: [], assignedAgents: [] },
  { name: 'Insure Connect', tier: 2, health: 'yellow', status: 'active', mission: 'Revenue generating initiative — details TBD.', goals: [], risks: ['Not yet fully defined'], dependencies: [], assignedAgents: [] },
  { name: 'ATLAS', tier: 3, health: 'green', status: 'active', mission: 'Primary AI agent platform — LangGraph + Claude, Discord bot, MCP integrations.', goals: ['Wire Discord bot as systemd service', 'Expand MCP tool coverage'], risks: [], dependencies: [], assignedAgents: ['Alfred', 'atlas-dev-agent'] },
  { name: 'Hermes OS', tier: 3, health: 'green', status: 'active', mission: 'Executive operating system — single pane of glass for life, work, and AI workforce.', goals: ['Complete Phase 1', 'Deploy to Render'], risks: [], dependencies: [], assignedAgents: ['Alfred', 'atlas-dev-agent'] },
  { name: 'Petri', tier: 3, health: 'yellow', status: 'active', mission: 'AI red-teaming and security evaluation platform using inspect-ai.', goals: ['Complete MVP', 'Deploy to Render'], risks: [], dependencies: [], assignedAgents: [] },
  { name: 'OpenClaw', tier: 3, health: 'yellow', status: 'active', mission: 'AI platform — openclaw-gateway running.', goals: [], risks: [], dependencies: [], assignedAgents: [] },
  { name: 'ThreatShield', tier: 3, health: 'yellow', status: 'active', mission: 'Cybersecurity and threat modeling project.', goals: [], risks: [], dependencies: [], assignedAgents: [] },
  { name: 'my-consulting-app', tier: 3, health: 'yellow', status: 'active', mission: 'Green Tree Consulting full-stack AI platform with multiple bots, fitness dashboard, and admin tools.', goals: ['Production deployment'], risks: [], dependencies: [], assignedAgents: [] },
  { name: 'Quantum.ai', tier: 3, health: 'yellow', status: 'active', mission: 'Personal modular life-management web app.', goals: [], risks: [], dependencies: [], assignedAgents: [] },
  { name: 'Shopicorn', tier: 4, health: 'yellow', status: 'incubation', mission: 'Compare Bidfta auction prices against Amazon and eBay to find deals.', goals: [], risks: [], dependencies: [], assignedAgents: [] },
]
