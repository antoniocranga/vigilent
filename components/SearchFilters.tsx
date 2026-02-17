// components/SearchFilters.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { JUDETE, CPV_CATEGORIES } from '@/lib/utils'
import { Search, X } from 'lucide-react'

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [judet, setJudet] = useState(searchParams.get('judet') || 'all')
  const [riskLevel, setRiskLevel] = useState(searchParams.get('risk') || 'all')
  
  const handleSearch = () => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (judet !== 'all') params.set('judet', judet)
    if (riskLevel !== 'all') params.set('risk', riskLevel)
    
    router.push(`/?${params.toString()}`)
  }
  
  const handleReset = () => {
    setSearch('')
    setJudet('all')
    setRiskLevel('all')
    router.push('/')
  }
  
  const hasActiveFilters = search || judet !== 'all' || riskLevel !== 'all'
  
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după titlu, cumpărător, câștigător..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>
          Caută
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* County Filter */}
        <Select value={judet} onValueChange={setJudet}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toate județele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate județele</SelectItem>
            {JUDETE.map((j) => (
              <SelectItem key={j} value={j}>
                {j}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Risk Level Filter */}
        <Select value={riskLevel} onValueChange={setRiskLevel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toate nivelurile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate nivelurile</SelectItem>
            <SelectItem value="critical">Risc critic (85+)</SelectItem>
            <SelectItem value="high">Risc ridicat (70-84)</SelectItem>
            <SelectItem value="medium">Risc mediu (50-69)</SelectItem>
            <SelectItem value="low">Risc scăzut (&lt;50)</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Reset Button */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            Resetează
          </Button>
        )}
      </div>
    </div>
  )
}