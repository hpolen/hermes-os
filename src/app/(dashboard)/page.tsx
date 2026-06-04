'use client'
import { ExecutiveBanner } from '@/components/dashboard/ExecutiveBanner'
import { AttentionWidget } from '@/components/dashboard/AttentionWidget'
import { RecommendationsWidget } from '@/components/dashboard/RecommendationsWidget'
import { PortfolioSnapshotWidget } from '@/components/dashboard/PortfolioSnapshotWidget'
import { StandupStatusWidget } from '@/components/dashboard/StandupStatusWidget'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <ExecutiveBanner />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AttentionWidget />
        <PortfolioSnapshotWidget />
        <StandupStatusWidget />
      </div>
      <RecommendationsWidget />
    </div>
  )
}
