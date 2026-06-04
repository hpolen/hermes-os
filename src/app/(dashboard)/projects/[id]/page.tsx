'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProject } from '@/lib/firebase/projects'
import { Project } from '@/lib/types'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from '@/components/projects/tabs/OverviewTab'
import { KanbanTab } from '@/components/projects/tabs/KanbanTab'
import { TimelineTab } from '@/components/projects/tabs/TimelineTab'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) getProject(id).then(p => { setProject(p); setLoading(false) })
  }, [id])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 bg-muted rounded" /><div className="h-64 bg-muted rounded" /></div>
  if (!project) return <div className="text-muted-foreground">Project not found.</div>

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} onUpdate={setProject} />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab project={project} onUpdate={setProject} /></TabsContent>
        <TabsContent value="kanban"><KanbanTab projectId={project.id} /></TabsContent>
        <TabsContent value="timeline"><TimelineTab projectId={project.id} /></TabsContent>
      </Tabs>
    </div>
  )
}
