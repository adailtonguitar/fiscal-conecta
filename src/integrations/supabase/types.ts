export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string
          details: string | null
          id: string
          metadata: Json | null
          module: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          module: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          module?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_history: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          file_path: string
          file_size: number | null
          id: string
          records_count: Json | null
          tables_included: string[]
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          records_count?: Json | null
          tables_included: string[]
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          records_count?: Json | null
          tables_included?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "backup_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          description: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          performed_by: string
          sale_id: string | null
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          performed_by: string
          sale_id?: string | null
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          performed_by?: string
          sale_id?: string | null
          session_id?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_balance: number | null
          company_id: string
          counted_credito: number | null
          counted_debito: number | null
          counted_dinheiro: number | null
          counted_pix: number | null
          created_at: string
          difference: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_balance: number
          sales_count: number | null
          status: Database["public"]["Enums"]["cash_session_status"]
          terminal_id: string
          total_credito: number | null
          total_debito: number | null
          total_dinheiro: number | null
          total_outros: number | null
          total_pix: number | null
          total_sangria: number | null
          total_suprimento: number | null
          total_vendas: number | null
          total_voucher: number | null
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          company_id: string
          counted_credito?: number | null
          counted_debito?: number | null
          counted_dinheiro?: number | null
          counted_pix?: number | null
          created_at?: string
          difference?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_balance?: number
          sales_count?: number | null
          status?: Database["public"]["Enums"]["cash_session_status"]
          terminal_id?: string
          total_credito?: number | null
          total_debito?: number | null
          total_dinheiro?: number | null
          total_outros?: number | null
          total_pix?: number | null
          total_sangria?: number | null
          total_suprimento?: number | null
          total_vendas?: number | null
          total_voucher?: number | null
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          company_id?: string
          counted_credito?: number | null
          counted_debito?: number | null
          counted_dinheiro?: number | null
          counted_pix?: number | null
          created_at?: string
          difference?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_balance?: number
          sales_count?: number | null
          status?: Database["public"]["Enums"]["cash_session_status"]
          terminal_id?: string
          total_credito?: number | null
          total_debito?: number | null
          total_dinheiro?: number | null
          total_outros?: number | null
          total_pix?: number | null
          total_sangria?: number | null
          total_suprimento?: number | null
          total_vendas?: number | null
          total_voucher?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_ibge_code: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cnpj: string
          created_at: string
          email: string | null
          id: string
          ie: string | null
          im: string | null
          name: string
          phone: string | null
          tax_regime: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_ibge_code?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj: string
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          name: string
          phone?: string | null
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_ibge_code?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          name?: string
          phone?: string | null
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contingencies: {
        Row: {
          auto_detected: boolean
          company_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["fiscal_doc_type"]
          documents_count: number
          ended_at: string | null
          id: string
          reason: string
          resolved_by: string | null
          started_at: string
        }
        Insert: {
          auto_detected?: boolean
          company_id: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["fiscal_doc_type"]
          documents_count?: number
          ended_at?: string | null
          id?: string
          reason: string
          resolved_by?: string | null
          started_at?: string
        }
        Update: {
          auto_detected?: boolean
          company_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["fiscal_doc_type"]
          documents_count?: number
          ended_at?: string | null
          id?: string
          reason?: string
          resolved_by?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contingencies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_closings: {
        Row: {
          cash_balance: number | null
          closed_by: string
          closing_date: string
          company_id: string
          created_at: string
          id: string
          notes: string | null
          total_credito: number | null
          total_debito: number | null
          total_dinheiro: number | null
          total_outros: number | null
          total_payables: number | null
          total_pix: number | null
          total_receivables: number | null
          total_sales: number | null
        }
        Insert: {
          cash_balance?: number | null
          closed_by: string
          closing_date: string
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          total_credito?: number | null
          total_debito?: number | null
          total_dinheiro?: number | null
          total_outros?: number | null
          total_payables?: number | null
          total_pix?: number | null
          total_receivables?: number | null
          total_sales?: number | null
        }
        Update: {
          cash_balance?: number | null
          closed_by?: string
          closing_date?: string
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          total_credito?: number | null
          total_debito?: number | null
          total_dinheiro?: number | null
          total_outros?: number | null
          total_payables?: number | null
          total_pix?: number | null
          total_receivables?: number | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_closings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["financial_category"]
          company_id: string
          counterpart: string | null
          created_at: string
          created_by: string
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          recurrence: string | null
          reference: string | null
          status: Database["public"]["Enums"]["financial_status"]
          type: Database["public"]["Enums"]["financial_type"]
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["financial_category"]
          company_id: string
          counterpart?: string | null
          created_at?: string
          created_by: string
          description: string
          due_date: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          recurrence?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["financial_status"]
          type: Database["public"]["Enums"]["financial_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["financial_category"]
          company_id?: string
          counterpart?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          recurrence?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["financial_status"]
          type?: Database["public"]["Enums"]["financial_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_audit_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string
          details: Json | null
          doc_type: Database["public"]["Enums"]["fiscal_doc_type"] | null
          document_id: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          details?: Json | null
          doc_type?: Database["public"]["Enums"]["fiscal_doc_type"] | null
          document_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          details?: Json | null
          doc_type?: Database["public"]["Enums"]["fiscal_doc_type"] | null
          document_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_configs: {
        Row: {
          certificate_expires_at: string | null
          certificate_password_hash: string | null
          certificate_path: string | null
          company_id: string
          created_at: string
          csc_id: string | null
          csc_token: string | null
          doc_type: Database["public"]["Enums"]["fiscal_doc_type"]
          environment: Database["public"]["Enums"]["sefaz_environment"]
          id: string
          is_active: boolean
          next_number: number
          sat_activation_code: string | null
          sat_serial_number: string | null
          serie: number
          updated_at: string
        }
        Insert: {
          certificate_expires_at?: string | null
          certificate_password_hash?: string | null
          certificate_path?: string | null
          company_id: string
          created_at?: string
          csc_id?: string | null
          csc_token?: string | null
          doc_type: Database["public"]["Enums"]["fiscal_doc_type"]
          environment?: Database["public"]["Enums"]["sefaz_environment"]
          id?: string
          is_active?: boolean
          next_number?: number
          sat_activation_code?: string | null
          sat_serial_number?: string | null
          serie?: number
          updated_at?: string
        }
        Update: {
          certificate_expires_at?: string | null
          certificate_password_hash?: string | null
          certificate_path?: string | null
          company_id?: string
          created_at?: string
          csc_id?: string | null
          csc_token?: string | null
          doc_type?: Database["public"]["Enums"]["fiscal_doc_type"]
          environment?: Database["public"]["Enums"]["sefaz_environment"]
          id?: string
          is_active?: boolean
          next_number?: number
          sat_activation_code?: string | null
          sat_serial_number?: string | null
          serie?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_documents: {
        Row: {
          access_key: string | null
          cancel_protocol: string | null
          cancel_reason: string | null
          canceled_at: string | null
          canceled_by: string | null
          company_id: string
          contingency_reason: string | null
          contingency_type: string | null
          created_at: string
          customer_cpf_cnpj: string | null
          customer_name: string | null
          doc_type: Database["public"]["Enums"]["fiscal_doc_type"]
          environment: Database["public"]["Enums"]["sefaz_environment"]
          id: string
          is_contingency: boolean
          issued_by: string | null
          items_json: Json | null
          number: number | null
          payment_method: string | null
          protocol_date: string | null
          protocol_number: string | null
          rejection_reason: string | null
          serie: number | null
          status: Database["public"]["Enums"]["fiscal_doc_status"]
          synced_at: string | null
          total_value: number
          updated_at: string
          xml_response: string | null
          xml_sent: string | null
        }
        Insert: {
          access_key?: string | null
          cancel_protocol?: string | null
          cancel_reason?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          company_id: string
          contingency_reason?: string | null
          contingency_type?: string | null
          created_at?: string
          customer_cpf_cnpj?: string | null
          customer_name?: string | null
          doc_type: Database["public"]["Enums"]["fiscal_doc_type"]
          environment?: Database["public"]["Enums"]["sefaz_environment"]
          id?: string
          is_contingency?: boolean
          issued_by?: string | null
          items_json?: Json | null
          number?: number | null
          payment_method?: string | null
          protocol_date?: string | null
          protocol_number?: string | null
          rejection_reason?: string | null
          serie?: number | null
          status?: Database["public"]["Enums"]["fiscal_doc_status"]
          synced_at?: string | null
          total_value?: number
          updated_at?: string
          xml_response?: string | null
          xml_sent?: string | null
        }
        Update: {
          access_key?: string | null
          cancel_protocol?: string | null
          cancel_reason?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          company_id?: string
          contingency_reason?: string | null
          contingency_type?: string | null
          created_at?: string
          customer_cpf_cnpj?: string | null
          customer_name?: string | null
          doc_type?: Database["public"]["Enums"]["fiscal_doc_type"]
          environment?: Database["public"]["Enums"]["sefaz_environment"]
          id?: string
          is_contingency?: boolean
          issued_by?: string | null
          items_json?: Json | null
          number?: number | null
          payment_method?: string | null
          protocol_date?: string | null
          protocol_number?: string | null
          rejection_reason?: string | null
          serie?: number | null
          status?: Database["public"]["Enums"]["fiscal_doc_status"]
          synced_at?: string | null
          total_value?: number
          updated_at?: string
          xml_response?: string | null
          xml_sent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          id: string
          module: string
          role: Database["public"]["Enums"]["company_role"]
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          id?: string
          module: string
          role: Database["public"]["Enums"]["company_role"]
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["company_role"]
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          company_id: string
          cost_price: number | null
          created_at: string
          id: string
          is_active: boolean
          min_stock: number | null
          name: string
          ncm: string | null
          price: number
          sku: string
          stock_quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          company_id: string
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_stock?: number | null
          name: string
          ncm?: string | null
          price?: number
          sku: string
          stock_quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          company_id?: string
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_stock?: number | null
          name?: string
          ncm?: string | null
          price?: number
          sku?: string
          stock_quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          company_id: string
          created_at: string
          id: string
          new_stock: number
          performed_by: string
          previous_stock: number
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          new_stock?: number
          performed_by: string
          previous_stock?: number
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          new_stock?: number
          performed_by?: string
          previous_stock?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      tef_transactions: {
        Row: {
          acquirer: string | null
          amount: number
          authorization_code: string | null
          card_brand: string | null
          card_last_digits: string | null
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          installments: number | null
          nsu: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pix_qrcode: string | null
          pix_txid: string | null
          pix_url: string | null
          processed_by: string | null
          receipt_customer: string | null
          receipt_merchant: string | null
          sale_id: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["tef_status"]
          transaction_date: string | null
          updated_at: string
        }
        Insert: {
          acquirer?: string | null
          amount: number
          authorization_code?: string | null
          card_brand?: string | null
          card_last_digits?: string | null
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          installments?: number | null
          nsu?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pix_qrcode?: string | null
          pix_txid?: string | null
          pix_url?: string | null
          processed_by?: string | null
          receipt_customer?: string | null
          receipt_merchant?: string | null
          sale_id?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["tef_status"]
          transaction_date?: string | null
          updated_at?: string
        }
        Update: {
          acquirer?: string | null
          amount?: number
          authorization_code?: string | null
          card_brand?: string | null
          card_last_digits?: string | null
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          installments?: number | null
          nsu?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          pix_qrcode?: string | null
          pix_txid?: string | null
          pix_url?: string | null
          processed_by?: string | null
          receipt_customer?: string | null
          receipt_merchant?: string | null
          sale_id?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["tef_status"]
          transaction_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tef_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tef_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tef_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_ids: { Args: never; Returns: string[] }
      is_company_admin_or_manager: {
        Args: { _company_id: string }
        Returns: boolean
      }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
    }
    Enums: {
      cash_movement_type:
        | "abertura"
        | "sangria"
        | "suprimento"
        | "venda"
        | "fechamento"
      cash_session_status: "aberto" | "fechado"
      company_role: "admin" | "gerente" | "supervisor" | "caixa"
      financial_category:
        | "fornecedor"
        | "aluguel"
        | "energia"
        | "agua"
        | "internet"
        | "salario"
        | "impostos"
        | "manutencao"
        | "outros"
        | "venda"
        | "servico"
        | "comissao"
        | "reembolso"
      financial_status: "pendente" | "pago" | "vencido" | "cancelado"
      financial_type: "pagar" | "receber"
      fiscal_doc_status:
        | "pendente"
        | "autorizada"
        | "cancelada"
        | "rejeitada"
        | "contingencia"
        | "inutilizada"
      fiscal_doc_type: "nfce" | "nfe" | "sat"
      payment_method:
        | "dinheiro"
        | "debito"
        | "credito"
        | "pix"
        | "voucher"
        | "outros"
      sefaz_environment: "homologacao" | "producao"
      stock_movement_type:
        | "entrada"
        | "saida"
        | "ajuste"
        | "venda"
        | "devolucao"
      tef_status:
        | "iniciado"
        | "aguardando_pinpad"
        | "processando"
        | "aprovado"
        | "negado"
        | "cancelado"
        | "timeout"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cash_movement_type: [
        "abertura",
        "sangria",
        "suprimento",
        "venda",
        "fechamento",
      ],
      cash_session_status: ["aberto", "fechado"],
      company_role: ["admin", "gerente", "supervisor", "caixa"],
      financial_category: [
        "fornecedor",
        "aluguel",
        "energia",
        "agua",
        "internet",
        "salario",
        "impostos",
        "manutencao",
        "outros",
        "venda",
        "servico",
        "comissao",
        "reembolso",
      ],
      financial_status: ["pendente", "pago", "vencido", "cancelado"],
      financial_type: ["pagar", "receber"],
      fiscal_doc_status: [
        "pendente",
        "autorizada",
        "cancelada",
        "rejeitada",
        "contingencia",
        "inutilizada",
      ],
      fiscal_doc_type: ["nfce", "nfe", "sat"],
      payment_method: [
        "dinheiro",
        "debito",
        "credito",
        "pix",
        "voucher",
        "outros",
      ],
      sefaz_environment: ["homologacao", "producao"],
      stock_movement_type: ["entrada", "saida", "ajuste", "venda", "devolucao"],
      tef_status: [
        "iniciado",
        "aguardando_pinpad",
        "processando",
        "aprovado",
        "negado",
        "cancelado",
        "timeout",
      ],
    },
  },
} as const
