import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { parseCSV, validateContract, type RawContractData } from '../lib/import/csv-parser'
import { analyzeContractRules } from '../lib/analysis/rules'
import type { Database } from '../types/supabase' // Use generated types
import path from 'path'
import fs from 'fs'

import { analyzeContract } from '../lib/analysis/ai'

import { getCacheStats } from '../lib/analysis/cache'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔍 Checking credentials...')
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Found' : '❌ Missing')
console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Found' : '❌ Missing')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure .env.local has:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your_url')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function importContract(rawContract: RawContractData) {
  // Validate
  if (!validateContract(rawContract)) {
    console.warn(`⚠️  Invalid contract: ${rawContract.contract_id}`)
    return { success: false, reason: 'validation_failed' }
  }
  
  // Analyze with AI (if applicable) + rules
  const analysis = await analyzeContract(rawContract, {
    useAI: true, // Enable AI for eligible contracts
  })
  
  // Insert contract with proper type
  const contractData: Database['public']['Tables']['contracts']['Insert'] = {
    contract_id: rawContract.contract_id,
    title: rawContract.title,
    description: rawContract.description || null,
    buyer_name: rawContract.buyer_name,
    buyer_cui: rawContract.buyer_cui || null,
    winner_name: rawContract.winner_name || null,
    winner_cui: rawContract.winner_cui || null,
    contract_value: rawContract.contract_value || null,
    currency: rawContract.currency || 'RON',
    estimated_value: rawContract.estimated_value || null,
    num_bidders: rawContract.num_bidders || null,
    procedure_type: rawContract.procedure_type || null,
    cpv_code: rawContract.cpv_code || null,
    award_date: rawContract.award_date || null,
    publication_date: rawContract.publication_date || null,
    location: rawContract.location || null,
    judet: rawContract.judet || null,
    status: rawContract.status || 'awarded',
    risk_score: analysis.risk_score,
    analyzed_at: new Date().toISOString(),
    analysis_version: analysis.ai_powered ? 'ai-v1' : 'rules-v1',
  }
  
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert(contractData)
    .select()
    .single()
  
  if (contractError) {
    if (contractError.code === '23505') {
      return { success: false, reason: 'duplicate' }
    }
    console.error('❌ Error inserting contract:', contractError)
    return { success: false, reason: 'insert_error', error: contractError }
  }
  
  // Insert red flags with proper type
  if (analysis.red_flags.length > 0 && contract) {
    const redFlagsData: Database['public']['Tables']['red_flags']['Insert'][] = analysis.red_flags.map(flag => ({
      contract_id: contract.id,
      flag_type: flag.flag_type,
      severity: flag.severity,
      confidence: flag.confidence,
      description: flag.description,
      ai_explanation: flag.ai_explanation,
    }))
    
    const { error: flagsError } = await supabase
      .from('red_flags')
      .insert(redFlagsData)
    
    if (flagsError) {
      console.error('❌ Error inserting red flags:', flagsError)
    }
  }
  
  return { 
    success: true, 
    contract,
    ai_powered: analysis.ai_powered 
  }
}

async function importFromCSV(filePath: string) {
  console.log(`\n🚀 Starting import from: ${filePath}\n`)
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    process.exit(1)
  }
  
  // Parse CSV
  const contracts = parseCSV(filePath)
  
  if (contracts.length === 0) {
    console.error('❌ No valid contracts found in CSV')
    process.exit(1)
  }
  
  console.log(`\n📦 Processing ${contracts.length} contracts...\n`)
  
  // Import contracts in batches
  const BATCH_SIZE = 100
  let imported = 0
  let duplicates = 0
  let errors = 0
  let aiPowered = 0  // ← ADD THIS LINE
  
  for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
    const batch = contracts.slice(i, i + BATCH_SIZE)
    
    console.log(`📊 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(contracts.length / BATCH_SIZE)}...`)
    
    const results = await Promise.all(
      batch.map(contract => importContract(contract))
    )
    
    imported += results.filter(r => r.success).length
    duplicates += results.filter(r => !r.success && r.reason === 'duplicate').length
    errors += results.filter(r => !r.success && r.reason !== 'duplicate').length
    aiPowered += results.filter(r => r.success && r.ai_powered).length  // ← ADD THIS LINE
    
    // Progress update
    console.log(`   ✅ Imported: ${imported} | 🤖 AI: ${aiPowered} | ⏭️  Duplicates: ${duplicates} | ❌ Errors: ${errors}`)  // ← UPDATE THIS LINE
  }
  
console.log(`\n✨ Import complete!\n`)
  console.log(`📈 Summary:`)
  console.log(`   Total processed: ${contracts.length}`)
  console.log(`   Successfully imported: ${imported}`)
  console.log(`   AI-powered analysis: ${aiPowered}`)
  console.log(`   Duplicates skipped: ${duplicates}`)
  console.log(`   Errors: ${errors}`)
  
  // Add cache statistics
  console.log(`\n💾 Cache Statistics:`)
  const cacheStats = await getCacheStats()
  console.log(`   Total cached analyses: ${cacheStats.totalCached}`)
  console.log(`   Total tokens saved: ${cacheStats.totalTokensSaved.toLocaleString()}`)
  
  // Refresh materialized view
  console.log(`\n🔄 Refreshing statistics...`)
  const { error: refreshError } = await supabase.rpc('refresh_contract_stats')
  
  if (refreshError) {
    console.warn('⚠️  Could not refresh stats:', refreshError.message)
  } else {
    console.log('✅ Statistics refreshed')
  }
}

// Main execution
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`
Usage: npm run import <csv-file-path>

Example:
  npm run import data/seap-2024.csv
  npm run import data/contracts.csv
  `)
  process.exit(0)
}

const csvPath = path.resolve(args[0])
importFromCSV(csvPath).catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})