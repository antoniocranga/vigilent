// lib/openrouter/client.ts

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AIAnalysisRequest {
  contract: {
    contract_id: string
    title: string
    buyer_name: string
    winner_name?: string | null
    contract_value?: number | null
    estimated_value?: number | null
    num_bidders?: number | null
    procedure_type?: string | null
  }
  similarContracts?: Array<{
    contract_value: number
    num_bidders: number
  }>
  buyerHistory?: {
    totalContracts: number
    avgRiskScore: number
  }
}

export interface AIAnalysisResponse {
  risk_score: number
  red_flags: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    confidence: number
    explanation_ro: string
  }>
  summary_ro: string
  recommendations: string[]
  similar_contracts_comparison?: string
}

export interface AIAnalysisResult {
  analysis: AIAnalysisResponse | null
  tokensUsed?: number
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️  OPENROUTER_API_KEY not set. AI analysis will be limited.')
}

const SYSTEM_PROMPT = `Tu ești un analist anti-corupție specializat în achizițiile publice din România.

Context important:
- România are cel mai mare risc de corupție din UE în domeniul achizițiilor publice
- 25% din contractele finanțate de stat au un singur ofertant (vs 14% medie UE)
- Piața anuală de achiziții publice: ~€13 miliarde

Red flags validate științific:
1. **Single Bidder** (Ofertant unic) - Un singur ofertant în piețe competitive
2. **Price Anomaly** (Anomalie de preț) - Preț cu >30% diferență față de estimare sau piață
3. **Narrow Specifications** (Specificații înguste) - Cerințe prea specifice care favorează un furnizor
4. **Contract Splitting** (Împărțire artificială) - Contracte mici pentru a evita pragurile legale
5. **Repeated Winner** (Câștigător recurent) - Același câștigător pentru același cumpărător
6. **Last-Minute Changes** (Modificări de ultimă oră) - Schimbări în caietul de sarcini aproape de deadline
7. **Direct Award** (Atribuire directă) - Contract direct fără justificare legală clară
8. **Award Delays** (Întârzieri) - Timp anormal între licitație și atribuire

Sarcina ta:
Analizează contractul furnizat și returnează DOAR un obiect JSON valid (fără text suplimentar, fără markdown) cu următoarea structură:

{
  "risk_score": 0-100,
  "red_flags": [
    {
      "type": "single_bidder" | "price_anomaly" | "narrow_specs" | "contract_splitting" | "repeated_winner" | "last_minute_change" | "direct_award" | "award_delay",
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": 0.0-1.0,
      "explanation_ro": "Explicație detaliată în română pentru cetățeni"
    }
  ],
  "summary_ro": "Rezumat în 2-3 propoziții în română",
  "recommendations": ["Recomandări concrete pentru jurnaliști/ONG-uri"],
  "similar_contracts_comparison": "Cum se compară cu contracte similare"
}

Reguli importante:
- Fii obiectiv și bazat pe dovezi
- Explică raționamentul clar în română
- Consideră contextul pieței (locație, industrie, moment)
- Încredere mai mare = dovezi mai solide
- Compară cu contracte similare dacă sunt furnizate`

export async function analyzeContractWithAI(
  request: AIAnalysisRequest,
  model: string = 'deepseek/deepseek-chat'
): Promise<AIAnalysisResult> {
  if (!OPENROUTER_API_KEY) {
    console.warn('⚠️  No OpenRouter API key, skipping AI analysis')
    return { analysis: null }
  }

  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: JSON.stringify(request, null, 2),
      },
    ]

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_VERCEL_URL 
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
          : 'http://localhost:3000',
        'X-Title': 'Vigilent - AI Procurement Monitor',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      return { analysis: null }
    }

    const data: OpenRouterResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      console.error('No choices in OpenRouter response')
      return { analysis: null }
    }

    const content = data.choices[0].message.content

    // Parse JSON response
    let analysis: AIAnalysisResponse
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      analysis = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      return { analysis: null }
    }

    const tokensUsed = data.usage.total_tokens
    console.log(`✅ AI Analysis complete. Tokens used: ${tokensUsed}`)

    return {
      analysis,
      tokensUsed,
    }

  } catch (error) {
    console.error('Error calling OpenRouter:', error)
    return { analysis: null }
  }
}

// Model recommendations based on use case
export const AI_MODELS = {
  // Free models (best for bulk analysis)
  FREE_FAST: 'deepseek/deepseek-chat', // Free, very fast
  FREE_QUALITY: 'meta-llama/llama-3.3-70b-instruct', // Free, better quality
  
  // Paid models (use for high-value contracts)
  PREMIUM: 'anthropic/claude-sonnet-4', // Best quality, costs credits
  
  // Fallback
  FALLBACK: 'openai/gpt-3.5-turbo', // Cheap and reliable
} as const

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS]