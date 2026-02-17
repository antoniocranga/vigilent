// app/page.tsx
import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ContractCard } from '@/components/ContractCard'
import { SearchFilters } from '@/components/SearchFilters'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, FileText, Shield } from 'lucide-react'

async function getContracts(searchParams: {
  search?: string
  judet?: string
  risk?: string
}) {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase
    .from('contracts')
    .select(`
      *,
      red_flags (*)
    `)
    .order('risk_score', { ascending: false })
    .limit(20)
  
  // Apply filters
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,buyer_name.ilike.%${searchParams.search}%,winner_name.ilike.%${searchParams.search}%`)
  }
  
  if (searchParams.judet && searchParams.judet !== 'all') {
    query = query.eq('judet', searchParams.judet)
  }
  
  if (searchParams.risk && searchParams.risk !== 'all') {
    switch (searchParams.risk) {
      case 'critical':
        query = query.gte('risk_score', 85)
        break
      case 'high':
        query = query.gte('risk_score', 70).lt('risk_score', 85)
        break
      case 'medium':
        query = query.gte('risk_score', 50).lt('risk_score', 70)
        break
      case 'low':
        query = query.lt('risk_score', 50)
        break
    }
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching contracts:', error)
    return []
  }
  
  return data || []
}

async function getStats() {
  const supabase = await createServerSupabaseClient()
  
  const [
    { count: totalContracts },
    { count: highRiskCount },
    { count: singleBidderCount },
  ] = await Promise.all([
    supabase.from('contracts').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).gte('risk_score', 70),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('num_bidders', 1),
  ])
  
  return {
    totalContracts: totalContracts || 0,
    highRiskCount: highRiskCount || 0,
    singleBidderCount: singleBidderCount || 0,
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; judet?: string; risk?: string }>
}) {
  // Await searchParams first
  const resolvedSearchParams = await searchParams
  
  const [contracts, stats] = await Promise.all([
    getContracts(resolvedSearchParams),
    getStats(),
  ])
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">🚨 VIGILENT</h1>
              <p className="text-muted-foreground mt-1">
                Monitorizare AI pentru achizițiile publice din România
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contracte monitorizate</p>
                  <p className="text-3xl font-bold">{stats.totalContracts.toLocaleString('ro-RO')}</p>
                </div>
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Risc ridicat detectat</p>
                  <p className="text-3xl font-bold text-destructive">{stats.highRiskCount.toLocaleString('ro-RO')}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ofertant unic</p>
                  <p className="text-3xl font-bold text-warning">{stats.singleBidderCount.toLocaleString('ro-RO')}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search & Filters */}
        <div className="mb-8">
          <Suspense fallback={<div>Loading filters...</div>}>
            <SearchFilters />
          </Suspense>
        </div>
        
        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              Contracte cu risc ridicat
            </h2>
            <p className="text-muted-foreground">
              {contracts.length} rezultat{contracts.length !== 1 ? 'e' : ''}
            </p>
          </div>
          
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Nu s-au găsit contracte care să corespundă filtrelor.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  redFlags={contract.red_flags || []}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Vigilent folosește inteligență artificială pentru a detecta potențiale nereguli în achizițiile publice.
          </p>
          <p className="mt-2">
            Date din SEAP (Sistema Electronică de Achiziții Publice). Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
          </p>
        </div>
      </footer>
    </div>
  )
}