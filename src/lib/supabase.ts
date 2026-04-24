import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          tax_id: string | null
          plan: 'FREE' | 'PRO' | 'ENTERPRISE'
          logo_url: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      users: {
        Row: {
          id: string
          organization_id: string | null
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      stores: {
        Row: {
          id: string
          organization_id: string
          parent_store_id: string | null
          name: string
          code: string
          address: string | null
          city: string | null
          country: string
          currency_id: string
          phone: string | null
          email: string | null
          is_active: boolean
          config: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['stores']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['stores']['Insert']>
      }
      products: {
        Row: {
          id: string
          organization_id: string
          store_id: string | null
          category_id: string | null
          name: string
          sku: string | null
          barcode: string | null
          description: string | null
          price: string
          cost: string | null
          min_stock: number
          max_stock: number
          is_active: boolean
          has_variants: boolean
          attributes: Record<string, unknown>
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      customers: {
        Row: {
          id: string
          organization_id: string
          name: string
          code: string
          type: 'INDIVIDUAL' | 'BUSINESS'
          tax_id: string | null
          email: string | null
          phone: string | null
          credit_limit: string
          current_balance: string
          is_active: boolean
          tags: string[]
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          organization_id: string
          store_id: string
          customer_id: string | null
          offer_id: string | null
          document_number: string
          status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED'
          payment_status: 'PENDING' | 'PARTIAL' | 'PAID'
          subtotal: string
          tax_amount: string
          discount_amount: string
          total: string
          paid_amount: string
          currency_id: string
          issued_at: string | null
          due_date: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      offers: {
        Row: {
          id: string
          organization_id: string
          store_id: string
          customer_id: string | null
          document_number: string
          status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
          subtotal: string
          tax_amount: string
          discount_amount: string
          total: string
          currency_id: string
          notes: string | null
          valid_until: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['offers']['Insert']>
      }
    }
  }
}
