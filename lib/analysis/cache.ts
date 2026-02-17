// lib/analysis/cache.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import type { Database } from '@/types/database.types'
import type { AIAnalysisResponse } from '../openrouter/client'

// Create a properly typed Supabase client
function getSupabaseClient(): SupabaseClient<Database> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Generate a hash for a contract to use as cache key
 */
export function generateContractHash(contract: {
  contract_id: string
  title: string
  buyer_name: string
  winner_name?: string | null
  contract_value?: number | null
  estimated_value?: number | null
  num_bidders?: number | null
}): string {
  // Create a deterministic string from contract data
  const data = JSON.stringify({
    contract_id: contract.contract_id,
    title: contract.title,
    buyer_name: contract.buyer_name,
    winner_name: contract.winner_name,
    contract_value: contract.contract_value,
    estimated_value: contract.estimated_value,
    num_bidders: contract.num_bidders,
  })
  
  // Generate SHA256 hash
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Check if we have a cached analysis for this contract
 */
export async function getCachedAnalysis(contractHash: string): Promise<AIAnalysisResponse | null> {
  const supabase = getSupabaseClient()
  
  try {
    // @ts-ignore - Supabase type inference issue
    const { data, error } = await supabase
      .from('ai_analysis_cache')
      .select('analysis, created_at, expires_at')
      .eq('contract_hash', contractHash)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching from cache:', error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    // Check if cache is expired
    const now = new Date()
    // @ts-ignore - Type is correct at runtime
    const expiresAt = new Date(data.expires_at)
    
    if (now > expiresAt) {
      console.log(`⏰ Cache expired for hash ${contractHash.substring(0, 8)}...`)
      return null
    }
    
    console.log(`✅ Cache hit for hash ${contractHash.substring(0, 8)}...`)
    // @ts-ignore - Type is correct at runtime
    return data.analysis as AIAnalysisResponse
    
  } catch (error) {
    console.error('Error checking cache:', error)
    return null
  }
}

/**
 * Save analysis to cache
 */
export async function cacheAnalysis(
  contractHash: string,
  analysis: AIAnalysisResponse,
  modelUsed: string,
  tokensUsed?: number
): Promise<void> {
  const supabase = getSupabaseClient()
  
  try {
    const cacheData = {
      contract_hash: contractHash,
      analysis: analysis as any,
      model_used: modelUsed,
      tokens_used: tokensUsed || 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
    
    // @ts-ignore - Supabase type inference issue
    const { error } = await supabase
      .from('ai_analysis_cache')
           // @ts-ignore - Supabase type inference issue
      .upsert(cacheData)
    
    if (error) {
      console.error('Error caching analysis:', error)
    } else {
      console.log(`💾 Cached analysis for hash ${contractHash.substring(0, 8)}...`)
    }
  } catch (error) {
    console.error('Error caching analysis:', error)
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalCached: number
  totalTokensSaved: number
  oldestEntry: string | null
  newestEntry: string | null
}> {
  const supabase = getSupabaseClient()
  
  try {
    // @ts-ignore - Supabase type inference issue
    const { data, error } = await supabase
      .from('ai_analysis_cache')
      .select('tokens_used, created_at')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error getting cache stats:', error)
      return {
        totalCached: 0,
        totalTokensSaved: 0,
        oldestEntry: null,
        newestEntry: null,
      }
    }
    
    if (!data || data.length === 0) {
      return {
        totalCached: 0,
        totalTokensSaved: 0,
        oldestEntry: null,
        newestEntry: null,
      }
    }
    
    // @ts-ignore - Type is correct at runtime
    const totalTokensSaved = data.reduce((sum, item) => sum + (item.tokens_used || 0), 0)
    
    return {
      totalCached: data.length,
      totalTokensSaved,
      // @ts-ignore - Type is correct at runtime
      oldestEntry: data[0].created_at,
      // @ts-ignore - Type is correct at runtime
      newestEntry: data[data.length - 1].created_at,
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return {
      totalCached: 0,
      totalTokensSaved: 0,
      oldestEntry: null,
      newestEntry: null,
    }
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  const supabase = getSupabaseClient()
  
  try {
    const now = new Date().toISOString()
    
    // @ts-ignore - Supabase type inference issue
    const { data, error } = await supabase
      .from('ai_analysis_cache')
      .delete()
      .lt('expires_at', now)
      .select('id')
    
    if (error) {
      console.error('Error clearing expired cache:', error)
      return 0
    }
    
    const deletedCount = data?.length || 0
    console.log(`🗑️  Cleared ${deletedCount} expired cache entries`)
    return deletedCount
    
  } catch (error) {
    console.error('Error clearing expired cache:', error)
    return 0
  }
}