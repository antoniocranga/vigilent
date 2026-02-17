// components/ContractContext.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRON } from '@/lib/utils'
import { Building, User, TrendingUp } from 'lucide-react'

interface ContractContextProps {
  buyerStats: {
    totalContracts: number
    flaggedContracts: number
    avgRiskScore: number
  }
  winnerStats: {
    totalContracts: number
    flaggedContracts: number
    singleBidderWins: number
  }
  similarContracts: Array<{
    id: string
    title: string
    contract_value: number | null
    risk_score: number
  }>
}

export function ContractContext({ buyerStats, winnerStats, similarContracts }: ContractContextProps) {
  return (
    <div className="space-y-6">
      {/* Buyer Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Istoric cumpărător
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Contracte totale</span>
            <span className="font-semibold">{buyerStats.totalContracts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Contracte cu red flags</span>
            <span className="font-semibold text-destructive">{buyerStats.flaggedContracts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Scor de risc mediu</span>
            <Badge variant={buyerStats.avgRiskScore >= 70 ? 'destructive' : 'secondary'}>
              {buyerStats.avgRiskScore.toFixed(1)}/100
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Winner Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Istoric câștigător
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Contracte câștigate</span>
            <span className="font-semibold">{winnerStats.totalContracts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Contracte cu red flags</span>
            <span className="font-semibold text-destructive">{winnerStats.flaggedContracts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Câștiguri cu ofertant unic</span>
            <span className="font-semibold text-warning">{winnerStats.singleBidderWins}</span>
          </div>
        </CardContent>
      </Card>

      {/* Similar Contracts */}
      {similarContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Contracte similare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {similarContracts.map((contract) => (
                <div key={contract.id} className="pb-3 border-b last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm line-clamp-2 flex-1">{contract.title}</p>
                    <Badge variant={contract.risk_score >= 70 ? 'destructive' : 'secondary'}>
                      {contract.risk_score}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRON(contract.contract_value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}