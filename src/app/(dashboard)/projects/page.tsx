'use client'
import { useEffect, useState } from 'react'
import { getProjects } from '@/lib/firebase/projects'
import { PortfolioTable } from '@/components/projects/PortfolioTable'
import { Button } from '@/components/ui/button'

export default function ProjectsPage() {
  const [projectCount, setProjectCount] = useState<number | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  useEffect(() => {
    getProjects().then(p => setProjectCount(p.length))
  }, [])

  async function handleSeed() {
    setSeeding(true)
    setSeedMsg('')
    try {
      const res = await fetch('/api/projects/seed', { method: 'POST' })
      const data = await res.json()
      setSeedMsg(data.message ?? 'Done')
      setProjectCount(data.count ?? 0)
    } catch (err) {
      setSeedMsg('Seed failed: ' + String(err))
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm">Your full portfolio at a glance</p>
        </div>
        {projectCount === 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSeed} disabled={seeding} className="gap-2">
              🌱 {seeding ? 'Seeding…' : 'Seed Initial Projects'}
            </Button>
            {seedMsg && <span className="text-sm text-muted-foreground">{seedMsg}</span>}
          </div>
        )}
      </div>
      <PortfolioTable />
    </div>
  )
}
