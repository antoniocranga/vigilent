// components/RedFlagList.tsx
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSeverityColor } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react'
import type { RedFlag } from '@/types/database.types'

interface RedFlagListProps {
  redFlags: RedFlag[]
}

const FLAG_TYPE_LABELS: Record<string, string> = {
  single_bidder: 'Ofertant unic',
  price_anomaly: 'Anomalie de preț',
  narrow_specs: 'Specificații înguste',
  contract_splitting: 'Împărțire artificială',
  repeated_winner: 'Câștigător recurent',
  last_minute_change: 'Modificare de ultimă oră',
  tax_haven: 'Paradis fiscal',
  direct_award: 'Atribuire directă nejustificată',
  award_delay: 'Întârziere în atribuire',
}

const SEVERITY_ICONS = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
}

export function RedFlagList({ redFlags }: RedFlagListProps) {
  if (redFlags.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Nu au fost detectate red flags pentru acest contract.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort by severity
  const sortedFlags = [...redFlags].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  return (
    <div className="space-y-4">
      {sortedFlags.map((flag) => {
        const Icon = SEVERITY_ICONS[flag.severity]
        const color = getSeverityColor(flag.severity)
        
        return (
          <Card key={flag.id} className="border-l-4" style={{ borderLeftColor: getColorValue(color) }}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getIconColor(flag.severity)}`} />
                  <div>
                    <CardTitle className="text-lg">
                      {FLAG_TYPE_LABELS[flag.flag_type] || flag.flag_type}
                    </CardTitle>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {flag.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={color as any}>
                    {flag.severity === 'critical' && 'CRITIC'}
                    {flag.severity === 'high' && 'RIDICAT'}
                    {flag.severity === 'medium' && 'MEDIU'}
                    {flag.severity === 'low' && 'SCĂZUT'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Încredere: {Math.round(flag.confidence * 100)}%
                  </span>
                </div>
              </div>
            </CardHeader>
            
            {flag.ai_explanation && (
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold">🤖 Analiză AI: </span>
                    {flag.ai_explanation}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function getColorValue(variant: string): string {
  switch (variant) {
    case 'destructive': return 'rgb(239 68 68)' // red-500
    case 'warning': return 'rgb(249 115 22)' // orange-500
    case 'default': return 'rgb(59 130 246)' // blue-500
    case 'secondary': return 'rgb(148 163 184)' // slate-400
    default: return 'rgb(148 163 184)'
  }
}

function getIconColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-500'
    case 'high': return 'text-orange-500'
    case 'medium': return 'text-yellow-500'
    case 'low': return 'text-blue-500'
    default: return 'text-gray-500'
  }
}