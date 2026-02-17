// lib/analysis/ai.ts
import { analyzeContractWithAI, AI_MODELS, type AIAnalysisRequest } from '../openrouter/client'
import { analyzeContractRules, type RiskAnalysisResult } from './rules'
import { generateContractHash, getCachedAnalysis, cacheAnalysis } from './cache'
import type { RawContractData } from '../import/csv-parser'

export interface EnhancedAnalysisResult extends RiskAnalysisResult {
  ai_powered: boolean
  model_used?: string
  tokens_used?: number
  from_cache?: boolean
}

/**
 * Decides whether a contract needs AI analysis
 */
export function shouldUseAI(contract: RawContractData, ruleBasedScore: number): boolean {
  const isHighValue = Boolean(contract.contract_value && contract.contract_value > 500000)
  const isMediumRisk = ruleBasedScore >= 50
  const isSingleBidder = contract.num_bidders === 1
  
  let hasPriceAnomaly = false
  if (contract.contract_value && contract.estimated_value) {
    const priceDiff = Math.abs((contract.contract_value - contract.estimated_value) / contract.estimated_value)
    hasPriceAnomaly = priceDiff > 0.3
  }

  return isHighValue || isMediumRisk || isSingleBidder || hasPriceAnomaly
}

/**
 * Enhanced analysis combining rules and AI with caching
 */
export async function analyzeContract(
  contract: RawContractData,
  options: {
    useAI?: boolean
    similarContracts?: Array<{ contract_value: number, num_bidders: number }>
    buyerHistory?: { totalContracts: number, avgRiskScore: number }
    skipCache?: boolean
  } = {}
): Promise<EnhancedAnalysisResult> {
  
  // Step 1: Always run rule-based analysis (free, fast)
  const ruleAnalysis = analyzeContractRules(contract)
  
  // Step 2: Decide if we should use AI
  const useAI = options.useAI !== false && shouldUseAI(contract, ruleAnalysis.risk_score)
  
  if (!useAI) {
    return {
      ...ruleAnalysis,
      ai_powered: false,
    }
  }
  
  // Step 3: Check cache first (unless skipCache is true)
  const contractHash = generateContractHash({
    contract_id: contract.contract_id,
    title: contract.title,
    buyer_name: contract.buyer_name,
    winner_name: contract.winner_name,
    contract_value: contract.contract_value,
    estimated_value: contract.estimated_value,
    num_bidders: contract.num_bidders,
  })
  
  if (!options.skipCache) {
    const cachedAnalysis = await getCachedAnalysis(contractHash)
    
    if (cachedAnalysis) {
      // Use cached analysis
      const mergedRedFlags = [
        ...ruleAnalysis.red_flags,
        ...cachedAnalysis.red_flags.map(flag => ({
          flag_type: flag.type,
          severity: flag.severity,
          confidence: flag.confidence,
          description: `AI-detected: ${flag.type}`,
          ai_explanation: flag.explanation_ro,
        })),
      ]
      
      const uniqueFlags = mergedRedFlags.reduce((acc, flag) => {
        const existing = acc.find(f => f.flag_type === flag.flag_type)
        if (!existing) {
          acc.push(flag)
        } else if (flag.confidence > existing.confidence) {
          acc = acc.filter(f => f.flag_type !== flag.flag_type)
          acc.push(flag)
        }
        return acc
      }, [] as typeof mergedRedFlags)
      
      const finalRiskScore = Math.max(ruleAnalysis.risk_score, cachedAnalysis.risk_score)
      
      return {
        risk_score: finalRiskScore,
        red_flags: uniqueFlags,
        ai_powered: true,
        model_used: AI_MODELS.FREE_FAST,
        from_cache: true,
        tokens_used: 0, // No tokens used for cached result
      }
    }
  }
  
  // Step 4: Prepare AI request (cache miss, need to call API)
  const aiRequest: AIAnalysisRequest = {
    contract: {
      contract_id: contract.contract_id,
      title: contract.title,
      buyer_name: contract.buyer_name,
      winner_name: contract.winner_name,
      contract_value: contract.contract_value,
      estimated_value: contract.estimated_value,
      num_bidders: contract.num_bidders,
      procedure_type: contract.procedure_type,
    },
    similarContracts: options.similarContracts,
    buyerHistory: options.buyerHistory,
  }
  
  // Step 5: Call AI
  console.log(`🤖 Running AI analysis for contract ${contract.contract_id}...`)
  
  const { analysis: aiAnalysis, tokensUsed } = await analyzeContractWithAI(aiRequest, AI_MODELS.FREE_FAST)
  
  if (!aiAnalysis) {
    console.warn(`⚠️  AI analysis failed for ${contract.contract_id}, using rules only`)
    return {
      ...ruleAnalysis,
      ai_powered: false,
    }
  }
  
  // Step 6: Cache the result
  await cacheAnalysis(contractHash, aiAnalysis, AI_MODELS.FREE_FAST, tokensUsed)
  
  // Step 7: Merge AI results with rule-based results
  const mergedRedFlags = [
    ...ruleAnalysis.red_flags,
    ...aiAnalysis.red_flags.map(flag => ({
      flag_type: flag.type,
      severity: flag.severity,
      confidence: flag.confidence,
      description: `AI-detected: ${flag.type}`,
      ai_explanation: flag.explanation_ro,
    })),
  ]
  
  const uniqueFlags = mergedRedFlags.reduce((acc, flag) => {
    const existing = acc.find(f => f.flag_type === flag.flag_type)
    if (!existing) {
      acc.push(flag)
    } else if (flag.confidence > existing.confidence) {
      acc = acc.filter(f => f.flag_type !== flag.flag_type)
      acc.push(flag)
    }
    return acc
  }, [] as typeof mergedRedFlags)
  
  const finalRiskScore = Math.max(ruleAnalysis.risk_score, aiAnalysis.risk_score)
  
  return {
    risk_score: finalRiskScore,
    red_flags: uniqueFlags,
    ai_powered: true,
    model_used: AI_MODELS.FREE_FAST,
    from_cache: false,
    tokens_used: tokensUsed,
  }
}