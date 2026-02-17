// types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contracts: {
        Row: {
          id: string
          contract_id: string
          title: string
          description: string | null
          buyer_name: string
          buyer_cui: string | null
          winner_name: string | null
          winner_cui: string | null
          contract_value: number | null
          currency: string
          estimated_value: number | null
          num_bidders: number | null
          procedure_type: string | null
          cpv_code: string | null
          award_date: string | null
          publication_date: string | null
          location: string | null
          judet: string | null
          status: string | null
          risk_score: number
          analyzed_at: string | null
          analysis_version: string | null
          created_at: string
          updated_at: string
          source: string
        }
        Insert: {
          id?: string
          contract_id: string
          title: string
          description?: string | null
          buyer_name: string
          buyer_cui?: string | null
          winner_name?: string | null
          winner_cui?: string | null
          contract_value?: number | null
          currency?: string
          estimated_value?: number | null
          num_bidders?: number | null
          procedure_type?: string | null
          cpv_code?: string | null
          award_date?: string | null
          publication_date?: string | null
          location?: string | null
          judet?: string | null
          status?: string | null
          risk_score?: number
          analyzed_at?: string | null
          analysis_version?: string | null
          created_at?: string
          updated_at?: string
          source?: string
        }
        Update: {
          id?: string
          contract_id?: string
          title?: string
          description?: string | null
          buyer_name?: string
          buyer_cui?: string | null
          winner_name?: string | null
          winner_cui?: string | null
          contract_value?: number | null
          currency?: string
          estimated_value?: number | null
          num_bidders?: number | null
          procedure_type?: string | null
          cpv_code?: string | null
          award_date?: string | null
          publication_date?: string | null
          location?: string | null
          judet?: string | null
          status?: string | null
          risk_score?: number
          analyzed_at?: string | null
          analysis_version?: string | null
          created_at?: string
          updated_at?: string
          source?: string
        }
      }
      red_flags: {
        Row: {
          id: string
          contract_id: string
          flag_type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          confidence: number
          description: string | null
          ai_explanation: string | null
          detected_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          flag_type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          confidence: number
          description?: string | null
          ai_explanation?: string | null
          detected_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          flag_type?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          confidence?: number
          description?: string | null
          ai_explanation?: string | null
          detected_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          judete: string[] | null
          cpv_codes: string[] | null
          min_value: number | null
          keywords: string[] | null
          alert_on_high_risk: boolean
          alert_on_single_bidder: boolean
          alert_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          judete?: string[] | null
          cpv_codes?: string[] | null
          min_value?: number | null
          keywords?: string[] | null
          alert_on_high_risk?: boolean
          alert_on_single_bidder?: boolean
          alert_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          judete?: string[] | null
          cpv_codes?: string[] | null
          min_value?: number | null
          keywords?: string[] | null
          alert_on_high_risk?: boolean
          alert_on_single_bidder?: boolean
          alert_threshold?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_actions: {
        Row: {
          id: string
          user_id: string | null
          contract_id: string
          action_type: 'reported' | 'shared' | 'investigated' | 'resolved' | 'bookmarked'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          contract_id: string
          action_type: 'reported' | 'shared' | 'investigated' | 'resolved' | 'bookmarked'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          contract_id?: string
          action_type?: 'reported' | 'shared' | 'investigated' | 'resolved' | 'bookmarked'
          notes?: string | null
          created_at?: string
        }
      }
      // ADD THIS TABLE DEFINITION
      ai_analysis_cache: {
        Row: {
          id: string
          contract_hash: string
          analysis: Json
          model_used: string | null
          tokens_used: number | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          contract_hash: string
          analysis: Json
          model_used?: string | null
          tokens_used?: number | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          contract_hash?: string
          analysis?: Json
          model_used?: string | null
          tokens_used?: number | null
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Contract = Database['public']['Tables']['contracts']['Row']
export type RedFlag = Database['public']['Tables']['red_flags']['Row']
export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']
export type UserAction = Database['public']['Tables']['user_actions']['Row']
export type AIAnalysisCache = Database['public']['Tables']['ai_analysis_cache']['Row']

export type ContractWithRedFlags = Contract & {
  red_flags: RedFlag[]
}