import { PriorityTier, TIER_LABELS } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

const variants: Record<PriorityTier, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  1: 'default',
  2: 'destructive',
  3: 'secondary',
  4: 'outline',
}

export function TierBadge({ tier }: { tier: PriorityTier }) {
  return <Badge variant={variants[tier]}>T{tier} {TIER_LABELS[tier]}</Badge>
}
