'use client'
import { Project } from '@/lib/types'
import { updateProject } from '@/lib/firebase/projects'
import { HealthBadge } from './HealthBadge'
import { TierBadge } from './TierBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props { project: Project; onUpdate: (p: Project) => void }

export function ProjectHeader({ project, onUpdate }: Props) {
  const handleHealthChange = async (health: string | null, _evt?: unknown) => {
    if (!health) return
    const updated = { ...project, health: health as Project['health'] }
    await updateProject(project.id, { health: updated.health })
    onUpdate(updated)
  }

  return (
    <div className="flex items-start gap-4 flex-wrap">
      <Link href="/projects"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button></Link>
      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <TierBadge tier={project.tier} />
          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <HealthBadge health={project.health} />
          <span className="text-sm text-muted-foreground">Health:</span>
          <Select value={project.health} onValueChange={handleHealthChange}>
            <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
