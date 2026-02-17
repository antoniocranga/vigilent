// app/contracts/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RiskBadge } from '@/components/RiskBadge'
import { RedFlagList } from '@/components/RedFlagList'
import { ContractContext } from '@/components/ContractContext'
import { formatRON, formatDate } from '@/lib/utils'
import { 
  ArrowLeft, 
  Building, 
  User, 
  Calendar, 
  MapPin, 
  FileText,
  Users,
  Banknote,
  Share2,
  Download
} from 'lucide-react'

async function getContract(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      red_flags (*)
    `)
    .eq('id', id)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

async function getBuyerStats(buyerCui: string | null) {
  if (!buyerCui) return { totalContracts: 0, flaggedContracts: 0, avgRiskScore: 0 }
  
  const supabase = await createServerSupabaseClient()
  
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, risk_score')
    .eq('buyer_cui', buyerCui)
  
  if (!contracts) return { totalContracts: 0, flaggedContracts: 0, avgRiskScore: 0 }
  
  const totalContracts = contracts.length
  const flaggedContracts = contracts.filter(c => c.risk_score >= 70).length
  const avgRiskScore = contracts.reduce((sum, c) => sum + c.risk_score, 0) / totalContracts
  
  return { totalContracts, flaggedContracts, avgRiskScore }
}

async function getWinnerStats(winnerCui: string | null) {
  if (!winnerCui) return { totalContracts: 0, flaggedContracts: 0, singleBidderWins: 0 }
  
  const supabase = await createServerSupabaseClient()
  
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, risk_score, num_bidders')
    .eq('winner_cui', winnerCui)
  
  if (!contracts) return { totalContracts: 0, flaggedContracts: 0, singleBidderWins: 0 }
  
  const totalContracts = contracts.length
  const flaggedContracts = contracts.filter(c => c.risk_score >= 70).length
  const singleBidderWins = contracts.filter(c => c.num_bidders === 1).length
  
  return { totalContracts, flaggedContracts, singleBidderWins }
}

async function getSimilarContracts(cpvCode: string | null, currentId: string) {
  if (!cpvCode) return []
  
  const supabase = await createServerSupabaseClient()
  
  const { data } = await supabase
    .from('contracts')
    .select('id, title, contract_value, risk_score')
    .eq('cpv_code', cpvCode)
    .neq('id', currentId)
    .order('award_date', { ascending: false })
    .limit(5)
  
  return data || []
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const contract = await getContract(id)
  
  if (!contract) {
    notFound()
  }
  
  const [buyerStats, winnerStats, similarContracts] = await Promise.all([
    getBuyerStats(contract.buyer_cui),
    getWinnerStats(contract.winner_cui),
    getSimilarContracts(contract.cpv_code, contract.id),
  ])
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la listă
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{contract.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      ID Contract: {contract.contract_id}
                    </p>
                  </div>
                  <RiskBadge score={contract.risk_score} />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Description */}
                {contract.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descriere</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {contract.description}
                    </p>
                  </div>
                )}
                
                {/* Key Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Cumpărător</p>
                      <p className="text-sm text-muted-foreground">{contract.buyer_name}</p>
                      {contract.buyer_cui && (
                        <p className="text-xs text-muted-foreground mt-1">CUI: {contract.buyer_cui}</p>
                      )}
                    </div>
                  </div>
                  
                  {contract.winner_name && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Câștigător</p>
                        <p className="text-sm text-muted-foreground">{contract.winner_name}</p>
                        {contract.winner_cui && (
                          <p className="text-xs text-muted-foreground mt-1">CUI: {contract.winner_cui}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Banknote className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Valoare contract</p>
                      <p className="text-lg font-bold text-primary">
                        {formatRON(contract.contract_value)}
                      </p>
                      {contract.estimated_value && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Estimat: {formatRON(contract.estimated_value)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {contract.num_bidders !== null && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Număr ofertanți</p>
                        <p className="text-lg font-bold">
                          {contract.num_bidders}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Dată atribuire</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(contract.award_date)}
                      </p>
                    </div>
                  </div>
                  
                  {contract.judet && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Locație</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.location || contract.judet}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {contract.procedure_type && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Tip procedură</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {contract.procedure_type}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Distribuie
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă raport
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Red Flags Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                🚩 Red Flags Detectate ({contract.red_flags?.length || 0})
              </h2>
              <RedFlagList redFlags={contract.red_flags || []} />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <ContractContext
              buyerStats={buyerStats}
              winnerStats={winnerStats}
              similarContracts={similarContracts}
            />
          </div>
        </div>
      </main>
    </div>
  )
}