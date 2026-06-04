'use client'
import { useEffect, useState } from 'react'
import { getActiveRecommendations, dismissRecommendation, Recommendation } from '@/lib/firebase/recommendations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const TYPE_COLORS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  action: 'default',
  review: 'secondary',
  focus: 'outline',
  risk: 'destructive',
}

export function RecommendationsWidget() {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveRecommendations().then(r => { setRecs(r); setLoading(false) })
  }, [])

  const dismiss = async (id: string) => {
    await dismissRecommendation(id)
    setRecs(prev => prev.filter(r => r.id !== id))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Alfred Recommends
          <span className="text-xs text-muted-foreground font-normal ml-1">Updated daily at 6:55 AM</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
          </div>
        ) : recs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No recommendations right now. Check back tomorrow morning.</p>
        ) : (
          <div className="space-y-2">
            {recs.map(rec => (
              <div key={rec.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted group">
                <Badge variant={TYPE_COLORS[rec.type] ?? 'outline'} className="text-xs flex-shrink-0">{rec.type}</Badge>
                <p className="text-sm flex-1">{rec.text}</p>
                {rec.projectId && (
                  <Link href={`/projects/${rec.projectId}`}>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </Link>
                )}
                <button onClick={() => dismiss(rec.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
