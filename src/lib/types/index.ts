// ============================================================
// Hermes OS — Core TypeScript Data Model
// ============================================================

import { Timestamp } from 'firebase/firestore';

// ─── Priority ───────────────────────────────────────────────
export type PriorityTier = 1 | 2 | 3 | 4;

export const TIER_LABELS: Record<PriorityTier, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

// ─── Health & Project Status ─────────────────────────────────
export type HealthStatus = 'green' | 'yellow' | 'red';

export type ProjectStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'
  | 'planning'
  | 'incubation';

// ─── Project ─────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  health: HealthStatus;
  tier: PriorityTier;
  ownerId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivity?: Timestamp;
  dueDate?: Timestamp;
  tags?: string[];
  metadata?: Record<string, unknown>;
  // Extended portfolio fields
  mission?: string;
  goals?: string[];
  risks?: string[];
  dependencies?: string[];
  assignedAgents?: string[];
}

// ─── Task ────────────────────────────────────────────────────
export type TaskStatus =
  | 'backlog'
  | 'ready'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'deferred';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  blockedReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// ─── Agent ───────────────────────────────────────────────────
export type AgentStatus = 'active' | 'idle' | 'paused' | 'error' | 'offline';

export type AgentLifecycle =
  | 'bootstrapping'
  | 'operational'
  | 'maintenance'
  | 'deprecated';

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  lifecycle: AgentLifecycle;
  capabilities: string[];
  projectIds?: string[];
  lastActiveAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ─── Standup ─────────────────────────────────────────────────
export type StandupType = 'morning' | 'midday' | 'evening';

export interface StandupEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: StandupType;
  createdAt: Timestamp;

  // Morning fields
  goals?: string[];          // up to 3 goals
  topGoals?: string[];       // alias for goals used in some components
  projectId?: string;        // primary project focus
  blockers?: string;         // optional blockers
  energyLevel?: number;      // 1–5

  // Midday fields
  goalsOnTrack?: 'yes' | 'partially' | 'no';
  newBlockers?: string;
  afternoonShift?: string;   // priority shift note

  // Evening fields
  goalsCompleted?: boolean[]; // parallel array to morning goals
  whatMoved?: string;         // accomplishments narrative
  carryover?: string;         // items rolling to tomorrow
  reflection?: string;        // end-of-day reflection
}

// ─── Timeline ────────────────────────────────────────────────
export type TimelineEventType =
  | 'created'
  | 'standup_morning'
  | 'standup_midday'
  | 'standup_evening'
  | 'standup_mention'
  | 'task_created'
  | 'task_added'
  | 'task_completed'
  | 'project_status_changed'
  | 'status_change'
  | 'agent_deployed'
  | 'agent_assigned'
  | 'milestone_reached'
  | 'milestone'
  | 'decision'
  | 'note'
  | 'note_added';

export interface TimelineEvent {
  id: string;
  projectId: string;
  type: TimelineEventType;
  description: string;
  createdAt: Timestamp;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// ─── Idea ────────────────────────────────────────────────────
export type IdeaStatus =
  | 'raw'
  | 'evaluating'
  | 'approved'
  | 'rejected'
  | 'parked'
  | 'executing';

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Scoring dimensions (each 1–10)
  impactScore?: number;
  effortScore?: number;     // lower = less effort = better
  alignmentScore?: number;  // alignment with mission
  noveltyScore?: number;

  // overallScore is a derived/calculated field — use getIdeaOverallScore()
  // Stored optionally if pre-computed for querying
  overallScore?: number;

  tags?: string[];
  relatedProjectIds?: string[];
  notes?: string;
}

// ─── Focus / Daily Work ──────────────────────────────────────

/**
 * Pillar — top-level domain of work (5-6 max, mostly stable).
 * E.g. "EA Program", "Security Architecture", "ATLAS", "Hermes OS"
 */
export interface Pillar {
  id: string;
  name: string;
  shortKey: string;      // 1-2 char keyboard shortcut, e.g. "E", "S", "A"
  color: string;         // Tailwind color token, e.g. "blue", "violet", "green"
  emoji?: string;        // Optional icon, e.g. "🏛️"
  order: number;
  agentEnabled: boolean; // Can Alfred take action on this pillar?
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Initiative — a meaningful piece of work under a Pillar.
 * Lives for weeks to months. Links daily tasks upward to impact.
 */
export type InitiativeStatus = 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Initiative {
  id: string;
  pillarId: string;
  name: string;
  description?: string;
  status: InitiativeStatus;
  order: number;
  projectId?: string;    // Optional link to Projects tab
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * DailyTask — the hand-written to-do.
 * Lives on a specific date. Fast to create, satisfying to complete.
 */
export type DailyTaskStatus = 'todo' | 'done' | 'rolled' | 'dropped';

export interface DailyTask {
  id: string;
  userId: string;
  date: string;          // YYYY-MM-DD
  text: string;
  status: DailyTaskStatus;
  order: number;         // for drag-reorder
  pillarId?: string;     // optional tag
  initiativeId?: string; // optional link upward
  rollCount: number;     // how many times pushed to next day
  rolledFromDate?: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Calculate overall score for an Idea.
 * Formula: (impact + alignment + novelty + (10 - effort)) / 4
 * Returns null if no scoring data is available.
 */
export function getIdeaOverallScore(idea: Idea): number | null {
  const { impactScore, effortScore, alignmentScore, noveltyScore } = idea;
  const scores: number[] = [];
  if (impactScore !== undefined) scores.push(impactScore);
  if (alignmentScore !== undefined) scores.push(alignmentScore);
  if (noveltyScore !== undefined) scores.push(noveltyScore);
  // Invert effort: lower effort = higher score contribution
  if (effortScore !== undefined) scores.push(10 - effortScore);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

