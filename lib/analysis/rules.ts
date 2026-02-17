// lib/analysis/rules.ts
import type { RawContractData } from '../import/csv-parser'

export interface RiskAnalysisResult {
  risk_score: number
  red_flags: Array<{
    flag_type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    confidence: number
    description: string
    ai_explanation: string
  }>
}

export function analyzeContractRules(contract: RawContractData): RiskAnalysisResult {
  const redFlags: RiskAnalysisResult['red_flags'] = []
  let riskScore = 0
  
  // Rule 1: Single Bidder (HIGH RISK)
  if (contract.num_bidders === 1) {
    redFlags.push({
      flag_type: 'single_bidder',
      severity: 'high',
      confidence: 0.95,
      description: 'Contract had only one bidder',
      ai_explanation: 'Acest contract a avut un singur ofertant, ceea ce ridică suspiciuni de manipulare a licitației. În piețe competitive, ar trebui să existe mai mulți ofertanți.',
    })
    riskScore += 30
  }
  
  // Rule 2: Price Anomaly (CRITICAL)
  if (contract.contract_value && contract.estimated_value) {
    const priceDiff = ((contract.contract_value - contract.estimated_value) / contract.estimated_value) * 100
    
    if (Math.abs(priceDiff) > 30) {
      redFlags.push({
        flag_type: 'price_anomaly',
        severity: priceDiff > 0 ? 'critical' : 'high',
        confidence: 0.85,
        description: `Contract value ${priceDiff > 0 ? 'exceeds' : 'below'} estimated value by ${Math.abs(priceDiff).toFixed(1)}%`,
        ai_explanation: `Valoarea contractului este cu ${Math.abs(priceDiff).toFixed(1)}% ${priceDiff > 0 ? 'mai mare' : 'mai mică'} decât estimarea inițială. Acest lucru poate indica manipulare a specificațiilor sau evaluare incorectă.`,
      })
      riskScore += priceDiff > 0 ? 35 : 25
    }
  }
  
  // Rule 3: Direct Award without high value justification (HIGH)
  if (contract.procedure_type?.toLowerCase().includes('direct') && 
      contract.contract_value && contract.contract_value > 50000) {
    redFlags.push({
      flag_type: 'direct_award',
      severity: 'high',
      confidence: 0.80,
      description: 'High-value direct award',
      ai_explanation: 'Contract de valoare mare atribuit direct, fără competiție deschisă. Acest lucru necesită justificare clară conform legislației achizițiilor publice.',
    })
    riskScore += 25
  }
  
  // Rule 4: Very high value contract (increase scrutiny)
  if (contract.contract_value && contract.contract_value > 1000000) {
    riskScore += 10 // Base risk for high-value contracts
  }
  
  // Rule 5: Missing critical data (MEDIUM)
  const missingFields: string[] = []
  if (!contract.award_date) missingFields.push('data atribuire')
  if (!contract.winner_name) missingFields.push('câștigător')
  if (!contract.contract_value) missingFields.push('valoare')
  
  if (missingFields.length >= 2) {
    redFlags.push({
      flag_type: 'missing_data',
      severity: 'medium',
      confidence: 1.0,
      description: `Missing critical fields: ${missingFields.join(', ')}`,
      ai_explanation: `Lipsesc informații critice: ${missingFields.join(', ')}. Lipsa transparenței poate indica probleme în procesul de achiziție.`,
    })
    riskScore += 15
  }
  
  // Cap risk score at 100
  riskScore = Math.min(100, riskScore)
  
  return {
    risk_score: riskScore,
    red_flags: redFlags,
  }
}