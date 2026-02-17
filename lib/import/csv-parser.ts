// lib/import/csv-parser.ts
import fs from 'fs'
import path from 'path'
// @ts-ignore - csv-parse types issue
import { parse } from 'csv-parse/sync'
import iconv from 'iconv-lite'

export interface RawContractData {
  contract_id: string
  title: string
  description?: string
  buyer_name: string
  buyer_cui?: string
  winner_name?: string
  winner_cui?: string
  contract_value?: number
  currency?: string
  estimated_value?: number
  num_bidders?: number
  procedure_type?: string
  cpv_code?: string
  award_date?: string
  publication_date?: string
  location?: string
  judet?: string
  status?: string
}

// Common column name mappings (SEAP data has inconsistent naming)
const COLUMN_MAPPINGS: Record<string, string[]> = {
  contract_id: ['contract_id', 'numar_contract', 'id_contract', 'contractId'],
  title: ['title', 'titlu', 'denumire', 'obiect'],
  description: ['description', 'descriere', 'detalii'],
  buyer_name: ['buyer_name', 'achizitor', 'autoritate_contractanta', 'cumparator'],
  buyer_cui: ['buyer_cui', 'cui_achizitor', 'cod_fiscal_achizitor'],
  winner_name: ['winner_name', 'castigator', 'operator_economic', 'furnizor'],
  winner_cui: ['winner_cui', 'cui_castigator', 'cod_fiscal_castigator'],
  contract_value: ['contract_value', 'valoare', 'valoare_contract', 'pret'],
  currency: ['currency', 'moneda', 'valuta'],
  estimated_value: ['estimated_value', 'valoare_estimata', 'estimare'],
  num_bidders: ['num_bidders', 'numar_ofertanti', 'nr_ofertanti'],
  procedure_type: ['procedure_type', 'tip_procedura', 'procedura'],
  cpv_code: ['cpv_code', 'cod_cpv', 'cpv'],
  award_date: ['award_date', 'data_atribuire', 'data_contract'],
  publication_date: ['publication_date', 'data_publicare'],
  location: ['location', 'locatie', 'adresa'],
  judet: ['judet', 'judet', 'county'],
  status: ['status', 'stare', 'stadiu'],
}

function findColumnName(headers: string[], fieldName: string): string | null {
  const possibleNames = COLUMN_MAPPINGS[fieldName] || [fieldName]
  
  for (const name of possibleNames) {
    const found = headers.find(h => 
      h.toLowerCase().trim() === name.toLowerCase() ||
      h.toLowerCase().trim().includes(name.toLowerCase())
    )
    if (found) return found
  }
  
  return null
}

function cleanValue(value: any): any {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string') {
    const cleaned = value.trim()
    if (cleaned === '' || cleaned === 'N/A' || cleaned === '-') return null
    return cleaned
  }
  return value
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  
  // Remove Romanian number formatting (1.234.567,89 -> 1234567.89)
  const cleaned = String(value)
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remove thousand separators
    .replace(',', '.') // Replace decimal comma with dot
  
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseDate(value: any): string | null {
  if (!value) return null
  
  try {
    // Try to parse various date formats
    const date = new Date(value)
    if (isNaN(date.getTime())) return null
    
    // Return in ISO format (YYYY-MM-DD)
    return date.toISOString().split('T')[0]
  } catch {
    return null
  }
}

export function parseCSV(filePath: string): RawContractData[] {
  console.log(`📄 Parsing CSV file: ${filePath}`)
  
  // Read file with multiple encoding attempts (Romanian CSVs are often broken)
  let content: string
  try {
    // First try UTF-8
    content = fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    try {
      // Try Latin1
      const buffer = fs.readFileSync(filePath)
      content = iconv.decode(buffer, 'latin1')
    } catch (error2) {
      // Finally try Windows-1252
      const buffer = fs.readFileSync(filePath)
      content = iconv.decode(buffer, 'win1252')
    }
  }
  
  // Parse CSV with relaxed settings (SEAP data is messy)
  let records: any[]
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      bom: true,
    })
  } catch (error) {
    console.error('❌ CSV parse error:', error)
    return []
  }
  
  if (records.length === 0) {
    console.warn('⚠️  No records found in CSV')
    return []
  }
  
  // Get headers from first record
  const headers = Object.keys(records[0])
  console.log(`📊 Found ${records.length} records with ${headers.length} columns`)
  
  // Map columns
  const columnMap: Record<string, string | null> = {}
  for (const field of Object.keys(COLUMN_MAPPINGS)) {
    columnMap[field] = findColumnName(headers, field)
  }
  
  console.log('🗺️  Column mapping:', columnMap)
  
  // Transform records
  const contracts: RawContractData[] = []
  let skipped = 0
  
  for (const record of records) {
    try {
      // Contract ID is required
      const contractIdCol = columnMap.contract_id
      if (!contractIdCol || !record[contractIdCol]) {
        skipped++
        continue
      }
      
      const titleCol = columnMap.title
      const buyerCol = columnMap.buyer_name
      
      if (!titleCol || !buyerCol || !record[titleCol] || !record[buyerCol]) {
        skipped++
        continue
      }
      
      const contract: RawContractData = {
        contract_id: cleanValue(record[contractIdCol])!,
        title: cleanValue(record[titleCol])!,
        buyer_name: cleanValue(record[buyerCol])!,
      }
      
      // Optional fields
      if (columnMap.description && record[columnMap.description]) {
        contract.description = cleanValue(record[columnMap.description]) || undefined
      }
      
      if (columnMap.buyer_cui && record[columnMap.buyer_cui]) {
        contract.buyer_cui = cleanValue(record[columnMap.buyer_cui]) || undefined
      }
      
      if (columnMap.winner_name && record[columnMap.winner_name]) {
        contract.winner_name = cleanValue(record[columnMap.winner_name]) || undefined
      }
      
      if (columnMap.winner_cui && record[columnMap.winner_cui]) {
        contract.winner_cui = cleanValue(record[columnMap.winner_cui]) || undefined
      }
      
      if (columnMap.contract_value && record[columnMap.contract_value]) {
        contract.contract_value = parseNumber(record[columnMap.contract_value]) || undefined
      }
      
      if (columnMap.currency && record[columnMap.currency]) {
        contract.currency = cleanValue(record[columnMap.currency]) || 'RON'
      }
      
      if (columnMap.estimated_value && record[columnMap.estimated_value]) {
        contract.estimated_value = parseNumber(record[columnMap.estimated_value]) || undefined
      }
      
      if (columnMap.num_bidders && record[columnMap.num_bidders]) {
        contract.num_bidders = parseNumber(record[columnMap.num_bidders]) || undefined
      }
      
      if (columnMap.procedure_type && record[columnMap.procedure_type]) {
        contract.procedure_type = cleanValue(record[columnMap.procedure_type]) || undefined
      }
      
      if (columnMap.cpv_code && record[columnMap.cpv_code]) {
        contract.cpv_code = cleanValue(record[columnMap.cpv_code]) || undefined
      }
      
      if (columnMap.award_date && record[columnMap.award_date]) {
        contract.award_date = parseDate(record[columnMap.award_date]) || undefined
      }
      
      if (columnMap.publication_date && record[columnMap.publication_date]) {
        contract.publication_date = parseDate(record[columnMap.publication_date]) || undefined
      }
      
      if (columnMap.location && record[columnMap.location]) {
        contract.location = cleanValue(record[columnMap.location]) || undefined
      }
      
      if (columnMap.judet && record[columnMap.judet]) {
        contract.judet = cleanValue(record[columnMap.judet]) || undefined
      }
      
      if (columnMap.status && record[columnMap.status]) {
        contract.status = cleanValue(record[columnMap.status]) || undefined
      }
      
      contracts.push(contract)
    } catch (error) {
      skipped++
      console.error('❌ Error parsing record:', error)
    }
  }
  
  console.log(`✅ Parsed ${contracts.length} contracts (skipped ${skipped})`)
  
  return contracts
}

export function validateContract(contract: RawContractData): boolean {
  // Minimum required fields
  if (!contract.contract_id || contract.contract_id.length < 3) return false
  if (!contract.title || contract.title.length < 5) return false
  if (!contract.buyer_name || contract.buyer_name.length < 3) return false
  
  return true
}