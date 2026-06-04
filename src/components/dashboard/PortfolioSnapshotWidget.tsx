'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects } from '@/lib/firebase/projects'
import { Project } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HealthBadge } from '@/components/projects/HealthBadge'
import { TierBadge } from '@/components/projects/TierBadge'
import { FolderKanban, ArrowRight } from 'lucide-react'

export function PortfolioSnapshotWidget() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects().then(p => {
      setProjects(p.filter(x => x.status === 'active').sort((a, b) => a.tier - b.tier).slice(0, 5))
      setLoading(false)
    })
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-blue-500" />
          Portfolio
          <Link href="/projects" className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active projects. <Link href="/projects" className="underline">Add one</Link>.</p>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-muted transition-colors">
                  <HealthBadge health={p.health} />
                  <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                  <TierBadge tier={p.tier} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
