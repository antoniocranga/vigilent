// components/ContractCard.tsx
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiskBadge } from './RiskBadge'
import { formatRON, formatDate } from '@/lib/utils'
import { AlertTriangle, Building, User, Calendar, MapPin } from 'lucide-react'
import type { Contract, RedFlag } from '@/types/database.types'

interface ContractCardProps {
  contract: Contract
  redFlags?: RedFlag[]
}

export function ContractCard({ contract, redFlags = [] }: ContractCardProps) {
  const highSeverityFlags = redFlags.filter(
    flag => flag.severity === 'critical' || flag.severity === 'high'
  )
  
  return (
    <Link href={`/contracts/${contract.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg line-clamp-2 flex-1">
              {contract.title}
            </CardTitle>
            <RiskBadge score={contract.risk_score} />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Buyer */}
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">Cumpărător:</span>
            <span className="text-muted-foreground truncate">{contract.buyer_name}</span>
          </div>
          
          {/* Winner */}
          {contract.winner_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Câștigător:</span>
              <span className="text-muted-foreground truncate">{contract.winner_name}</span>
            </div>
          )}
          
          {/* Value */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Valoare:</span>
            <span className="text-lg font-bold text-primary">
              {formatRON(contract.contract_value)}
            </span>
          </div>
          
          {/* Location & Date */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{contract.judet || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(contract.award_date)}</span>
            </div>
          </div>
          
          {/* Red Flags */}
          {highSeverityFlags.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">
                  {highSeverityFlags.length} red flag{highSeverityFlags.length > 1 ? 's' : ''} detectat{highSeverityFlags.length > 1 ? 'e' : ''}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}