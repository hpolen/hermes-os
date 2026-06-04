'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, createProject } from '@/lib/firebase/projects'
import { Project, ProjectStatus, HealthStatus, PriorityTier } from '@/lib/types'
import { HealthBadge } from './HealthBadge'
import { TierBadge } from './TierBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, ExternalLink } from 'lucide-react'
import { getRelativeTime } from '@/lib/utils/date'

interface NewProjectForm {
  name: string
  tier: PriorityTier
  mission: string
  status: ProjectStatus
  health: HealthStatus
}

const DEFAULT_FORM: NewProjectForm = {
  name: '',
  tier: 3,
  mission: '',
  status: 'active',
  health: 'yellow',
}

export function PortfolioTable() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<NewProjectForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  async function loadProjects() {
    const projs = await getProjects()
    const sorted = [...projs].sort((a, b) => a.tier - b.tier)
    setProjects(sorted)
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createProject({
        name: form.name,
        tier: form.tier,
        mission: form.mission,
        status: form.status,
        health: form.health,
        goals: [],
        risks: [],
        dependencies: [],
        assignedAgents: [],
      })
      setForm(DEFAULT_FORM)
      setSheetOpen(false)
      await loadProjects()
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setSaving(false)
    }
  }

  const statusColors: Record<ProjectStatus, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-600',
    planning: 'bg-purple-100 text-purple-800',
    incubation: 'bg-orange-100 text-orange-800',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Portfolio</CardTitle>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger>
            <Button size="sm" className="gap-1" onClick={() => setSheetOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Project
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>New Project</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-1">Name</label>
                <Input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Tier</label>
                <Select
                  value={String(form.tier)}
                  onValueChange={v => setForm(f => ({ ...f, tier: Number(v) as PriorityTier }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">T1 — Critical (Day Job)</SelectItem>
                    <SelectItem value="2">T2 — High (Revenue)</SelectItem>
                    <SelectItem value="3">T3 — Medium (Infrastructure)</SelectItem>
                    <SelectItem value="4">T4 — Low (Incubation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Mission</label>
                <Textarea
                  value={form.mission}
                  onChange={e => setForm(f => ({ ...f, mission: e.target.value }))}
                  placeholder="What is this project trying to achieve?"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Status</label>
                <Select
                  value={form.status}
                  onValueChange={v => setForm(f => ({ ...f, status: v as ProjectStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="incubation">Incubation</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Health</label>
                <Select
                  value={form.health}
                  onValueChange={v => setForm(f => ({ ...f, health: v as HealthStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Green — Healthy</SelectItem>
                    <SelectItem value="yellow">Yellow — At Risk</SelectItem>
                    <SelectItem value="red">Red — Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Creating…' : 'Create Project'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-3">No projects yet.</p>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              Add your first project
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Name</th>
                  <th className="pb-2 font-medium text-muted-foreground">Tier</th>
                  <th className="pb-2 font-medium text-muted-foreground">Health</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 font-medium text-muted-foreground">Last Activity</th>
                  <th className="pb-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      {project.mission && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{project.mission}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <TierBadge tier={project.tier} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <HealthBadge health={project.health} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                      {project.lastActivity
                        ? getRelativeTime(project.lastActivity.toDate())
                        : project.updatedAt
                        ? getRelativeTime(project.updatedAt.toDate())
                        : '—'}
                    </td>
                    <td className="py-2.5">
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
