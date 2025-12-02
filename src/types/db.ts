export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string // uuid
          name: string | null
          email: string | null
          address: string | null
          phone: string | null
          website: string | null
          principal_fullname: string | null
          secondary_fullname: string | null
          color_primary: string | null
          color_secondary: string | null
          logo_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          principal_fullname?: string | null
          secondary_fullname?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          principal_fullname?: string | null
          secondary_fullname?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string // uuid
          company_id: string | null
          name: string | null
          email: string | null
          address: string | null
          phone: string | null
          website: string | null
          principal_fullname: string | null
          secondary_fullname: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string // default uuid_generate_v4()
          company_id?: string | null
          name?: string | null
          email?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          principal_fullname?: string | null
          secondary_fullname?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          name?: string | null
          email?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          principal_fullname?: string | null
          secondary_fullname?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          id: number
          created_at: string
          order_id: string
          transaction_id: string | null // Cambiado a string (text en DB) para coincidir con el webhook
          amount: number | null
          status_id: number | null
          status_name: string | null
          payer_email: string | null
          payer_phone: string | null
          payer_name: string | null
          payment_method: string | null
          raw_response: Json | null
          user_id: number | null // bigint FK -> dentix_clients
        }
        Insert: {
          id?: number
          created_at?: string
          order_id: string
          transaction_id?: string | null
          amount?: number | null
          status_id?: number | null
          status_name?: string | null
          payer_email?: string | null
          payer_phone?: string | null
          payer_name?: string | null
          payment_method?: string | null
          raw_response?: Json | null
          user_id?: number | null
        }
        Update: {
          id?: number
          created_at?: string
          order_id?: string
          transaction_id?: string | null
          amount?: number | null
          status_id?: number | null
          status_name?: string | null
          payer_email?: string | null
          payer_phone?: string | null
          payer_name?: string | null
          payment_method?: string | null
          raw_response?: Json | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dentix_clients"
            referencedColumns: ["id"]
          }
        ]
      }
      item_categories: {
        Row: {
          id: number
          company_id: string | null
          name: string | null
          code: string | null
        }
        Insert: {
          id?: number
          company_id?: string | null
          name?: string | null
          code?: string | null
        }
        Update: {
          id?: number
          company_id?: string | null
          name?: string | null
          code?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          id: number // bigserial (handled as number for JS safety, technically string in some drivers)
          company_id: string | null
          name: string | null
          unit: string | null // 'SF', 'LF', 'EA'
          unit_cost: number | null // numeric(12,2)
          category_id: number | null
        }
        Insert: {
          id?: number
          company_id?: string | null
          name?: string | null
          unit?: string | null
          unit_cost?: number | null
          category_id?: number | null
        }
        Update: {
          id?: number
          company_id?: string | null
          name?: string | null
          unit?: string | null
          unit_cost?: number | null
          category_id?: number | null
        }
        Relationships: []
      }
      estimations: {
        Row: {
          id: string // uuid (The "Cart ID")
          client_id: string | null
          company_id: string | null
          sequential_number: number // serial
          status: string | null // 'draft', 'sent', 'approved'
          net_total: number | null // numeric(12,2)
          items_summary: Json | null // cache visual
          notes: string | null
          estimation_date: string | null
          created_at: string | null
          pdf_url: string | null
          pdf_updated_at: string | null
        }
        Insert: {
          id?: string
          client_id?: string | null
          company_id?: string | null
          sequential_number?: number
          status?: string | null
          net_total?: number | null
          items_summary?: Json | null
          notes?: string | null
          estimation_date?: string | null
          created_at?: string | null
          pdf_url?: string | null
          pdf_updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string | null
          company_id?: string | null
          sequential_number?: number
          status?: string | null
          net_total?: number | null
          items_summary?: Json | null
          notes?: string | null
          estimation_date?: string | null
          created_at?: string | null
          pdf_url?: string | null
          pdf_updated_at?: string | null
        }
        Relationships: []
      }
      estimation_items: {
        Row: {
          id: number // bigserial
          estimation_id: string | null // FK -> estimations
          item_id: number | null // FK -> items
          description: string | null
          quantity: number | null // numeric(12,3)
          unit: string | null
          unit_cost: number | null // Precio congelado
          line_total: number | null
          category_id: number | null
        }
        Insert: {
          id?: number
          estimation_id?: string | null
          item_id?: number | null
          description?: string | null
          quantity?: number | null
          unit?: string | null
          unit_cost?: number | null
          line_total?: number | null
          category_id?: number | null
        }
        Update: {
          id?: number
          estimation_id?: string | null
          item_id?: number | null
          description?: string | null
          quantity?: number | null
          unit?: string | null
          unit_cost?: number | null
          line_total?: number | null
          category_id?: number | null
        }
        Relationships: []
      }
      dentix_clients: {
        Row: {
          id: number // bigint
          created_at: string // timestamp with time zone
          name: string | null
          email: string | null
          document_id: string | null
          phone_number: string | null
          service: string | null
          product: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name?: string | null
          email?: string | null
          document_id?: string | null
          phone_number?: string | null
          service?: string | null
          product?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string | null
          email?: string | null
          document_id?: string | null
          phone_number?: string | null
          service?: string | null
          product?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          id: number // bigint
          created_at: string // timestamp with time zone
          client_number: string
          messages: Json | null
          audio: boolean | null
          client_name: string | null
          chat_on: boolean | null
          chat_status: string | null
          agent_name: string | null
          nit: string | null
          notes: string | null
          email: string | null
          company: string | null
          position: string | null
          category: string | null
          classification: string | null
          credit: string | null
          address: string | null
          city: string | null
          notified_no_reply: boolean | null
          notified_out_of_hours: boolean | null
          notified_out_afternoon: boolean | null
          origin: string | null
          is_archived: boolean | null
          advisor_id: string | null // uuid
          payment_link_sent_at: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          client_number: string
          messages?: Json | null
          audio?: boolean | null
          client_name?: string | null
          chat_on?: boolean | null
          chat_status?: string | null
          agent_name?: string | null
          nit?: string | null
          notes?: string | null
          email?: string | null
          company?: string | null
          position?: string | null
          category?: string | null
          classification?: string | null
          credit?: string | null
          address?: string | null
          city?: string | null
          notified_no_reply?: boolean | null
          notified_out_of_hours?: boolean | null
          notified_out_afternoon?: boolean | null
          origin?: string | null
          is_archived?: boolean | null
          advisor_id?: string | null
          payment_link_sent_at?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          client_number?: string
          messages?: Json | null
          audio?: boolean | null
          client_name?: string | null
          chat_on?: boolean | null
          chat_status?: string | null
          agent_name?: string | null
          nit?: string | null
          notes?: string | null
          email?: string | null
          company?: string | null
          position?: string | null
          category?: string | null
          classification?: string | null
          credit?: string | null
          address?: string | null
          city?: string | null
          notified_no_reply?: boolean | null
          notified_out_of_hours?: boolean | null
          notified_out_afternoon?: boolean | null
          origin?: string | null
          is_archived?: boolean | null
          advisor_id?: string | null
          payment_link_sent_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: number // bigint
          conversation_id: number | null // bigint
          sender: string
          message: string | null
          url: string | null
          type: string | null
          status: string | null
          created_at: string | null
          read_at: string | null
          twilio_sid: string | null
          file_name: string | null
          delivered_at: string | null
          sent_at: string | null
          failed_at: string | null
          error_code: string | null
          error_message: string | null
          advisor_id: string | null // uuid
        }
        Insert: {
          id?: number
          conversation_id?: number | null
          sender: string
          message?: string | null
          url?: string | null
          type?: string | null
          status?: string | null
          created_at?: string | null
          read_at?: string | null
          twilio_sid?: string | null
          file_name?: string | null
          delivered_at?: string | null
          sent_at?: string | null
          failed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          advisor_id?: string | null
        }
        Update: {
          id?: number
          conversation_id?: number | null
          sender?: string
          message?: string | null
          url?: string | null
          type?: string | null
          status?: string | null
          created_at?: string | null
          read_at?: string | null
          twilio_sid?: string | null
          file_name?: string | null
          delivered_at?: string | null
          sent_at?: string | null
          failed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          advisor_id?: string | null
        }
        Relationships: []
      }
      suscripciones: {
        Row: {
          id: string // uuid
          created_at: string
          client_id: number // bigint
          vepay_subscription_id: string | null
          vepay_referencia: string
          plan_id: string
          estado: string | null
          response_data: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          client_id: number
          vepay_subscription_id?: string | null
          vepay_referencia: string
          plan_id: string
          estado?: string | null
          response_data?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          client_id?: number
          vepay_subscription_id?: string | null
          vepay_referencia?: string
          plan_id?: string
          estado?: string | null
          response_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "dentix_clients"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper Types for clean imports
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Update<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']