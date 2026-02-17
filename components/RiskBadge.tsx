// components/RiskBadge.tsx
import { Badge } from '@/components/ui/badge'
import { getRiskColor, getRiskLabel } from '@/lib/utils'

interface RiskBadgeProps {
  score: number
  showLabel?: boolean
}

export function RiskBadge({ score, showLabel = true }: RiskBadgeProps) {
  const color = getRiskColor(score)
  const label = getRiskLabel(score)
  
  return (
    <Badge variant={color as any} className="font-semibold">
      {showLabel ? label : score}/100
    </Badge>
  )
}