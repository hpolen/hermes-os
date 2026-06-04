import { HealthStatus } from '@/lib/types'

const config: Record<HealthStatus, { color: string; label: string }> = {
  green: { color: 'bg-green-500', label: 'Healthy' },
  yellow: { color: 'bg-yellow-500', label: 'At Risk' },
  red: { color: 'bg-red-500', label: 'Critical' },
}

export function HealthBadge({ health }: { health: HealthStatus }) {
  const { color, label } = config[health]
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
      <span className="text-sm">{label}</span>
    </span>
  )
}
