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
      bank_transactions: {
        Row: {
          account_number: string | null
          amount: number
          bank_name: string | null
          company_id: string
          created_at: string
          description: string
          financial_entry_id: string | null
          id: string
          imported_at: string
          imported_by: string
          notes: string | null
          reconciled: boolean
          transaction_date: string
          type: string
        }
        Insert: {
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          company_id: string
          created_at?: string
          description: string
          financial_entry_id?: string | null
          id?: string
          imported_at?: string
          imported_by: string
          notes?: string | null
          reconciled?: boolean
          transaction_date: string
          type?: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          company_id?: string
          created_at?: string
          description?: string
          financial_entry_id?: string | null
          id?: string
          imported_at?: string
          imported_by?: string
          notes?: string | null
          reconciled?: boolean
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_financial_entry_id_fkey"
            columns: ["financial_entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      card_administrators: {
        Row: {
          antecipation_rate: number | null
          cnpj: string | null
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          credit_installment_rate: number
          credit_rate: number
          credit_settlement_days: number
          debit_rate: number
          debit_settlement_days: number
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          antecipation_rate?: number | null
          cnpj?: string | null
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_installment_rate?: number
          credit_rate?: number
          credit_settlement_days?: number
          debit_rate?: number
          debit_settlement_days?: number
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          antecipation_rate?: number | null
          cnpj?: string | null
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_installment_rate?: number
          credit_rate?: number
          credit_settlement_days?: number
          debit_rate?: number
          debit_settlement_days?: number
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_administrators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          antt_code: string | null
          cnpj: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          ie: string | null
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          trade_name: string | null
          updated_at: string
          vehicle_plate: string | null
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          antt_code?: string | null
          cnpj?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          trade_name?: string | null
          updated_at?: string
          vehicle_plate?: string | null
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          antt_code?: string | null
          cnpj?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          trade_name?: string | null
          updated_at?: string
          vehicle_plate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carriers_company_id_fkey"
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
      clients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_ibge_code: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          company_id: string
          cpf_cnpj: string | null
          created_at: string
          credit_balance: number | null
          credit_limit: number | null
          email: string | null
          id: string
          ie: string | null
          is_active: boolean
          loyalty_points: number
          name: string
          notes: string | null
          phone: string | null
          phone2: string | null
          tipo_pessoa: string
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
          company_id: string
          cpf_cnpj?: string | null
          created_at?: string
          credit_balance?: number | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          loyalty_points?: number
          name: string
          notes?: string | null
          phone?: string | null
          phone2?: string | null
          tipo_pessoa?: string
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
          company_id?: string
          cpf_cnpj?: string | null
          created_at?: string
          credit_balance?: number | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          loyalty_points?: number
          name?: string
          notes?: string | null
          phone?: string | null
          phone2?: string | null
          tipo_pessoa?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          accountant_auto_send: boolean | null
          accountant_crc: string | null
          accountant_email: string | null
          accountant_name: string | null
          accountant_phone: string | null
          accountant_send_day: number | null
          address_city: string | null
          address_complement: string | null
          address_ibge_code: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          block_reason: string | null
          cnpj: string
          created_at: string
          email: string | null
          id: string
          ie: string | null
          im: string | null
          is_blocked: boolean
          logo_url: string | null
          modo_seguro_fiscal: boolean
          name: string
          phone: string | null
          pix_city: string | null
          pix_key: string | null
          pix_key_type: string | null
          slogan: string | null
          tax_regime: string | null
          trade_name: string | null
          updated_at: string
          whatsapp_support: string | null
        }
        Insert: {
          accountant_auto_send?: boolean | null
          accountant_crc?: string | null
          accountant_email?: string | null
          accountant_name?: string | null
          accountant_phone?: string | null
          accountant_send_day?: number | null
          address_city?: string | null
          address_complement?: string | null
          address_ibge_code?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          block_reason?: string | null
          cnpj: string
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          is_blocked?: boolean
          logo_url?: string | null
          modo_seguro_fiscal?: boolean
          name: string
          phone?: string | null
          pix_city?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          slogan?: string | null
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
          whatsapp_support?: string | null
        }
        Update: {
          accountant_auto_send?: boolean | null
          accountant_crc?: string | null
          accountant_email?: string | null
          accountant_name?: string | null
          accountant_phone?: string | null
          accountant_send_day?: number | null
          address_city?: string | null
          address_complement?: string | null
          address_ibge_code?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          block_reason?: string | null
          cnpj?: string
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          is_blocked?: boolean
          logo_url?: string | null
          modo_seguro_fiscal?: boolean
          name?: string
          phone?: string | null
          pix_city?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          slogan?: string | null
          tax_regime?: string | null
          trade_name?: string | null
          updated_at?: string
          whatsapp_support?: string | null
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
      discount_limits: {
        Row: {
          created_at: string
          id: string
          max_discount_percent: number
          role: Database["public"]["Enums"]["company_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_discount_percent?: number
          role: Database["public"]["Enums"]["company_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_discount_percent?: number
          role?: Database["public"]["Enums"]["company_role"]
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address_city: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          admission_date: string | null
          commission_rate: number | null
          company_id: string
          cpf: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          rg: string | null
          role: string | null
          salary: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_city?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          admission_date?: string | null
          commission_rate?: number | null
          company_id: string
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          rg?: string | null
          role?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_city?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          admission_date?: string | null
          commission_rate?: number | null
          company_id?: string
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          rg?: string | null
          role?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
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
          cost_center: string | null
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
          cost_center?: string | null
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
          cost_center?: string | null
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
      fiscal_categories: {
        Row: {
          cest: string | null
          cfop: string
          cofins_rate: number
          company_id: string
          created_at: string
          csosn: string | null
          cst_icms: string | null
          icms_rate: number
          icms_st_rate: number | null
          id: string
          ipi_rate: number | null
          is_active: boolean
          mva: number | null
          name: string
          ncm: string | null
          operation_type: string
          pis_rate: number
          product_type: string
          regime: string
          updated_at: string
        }
        Insert: {
          cest?: string | null
          cfop?: string
          cofins_rate?: number
          company_id: string
          created_at?: string
          csosn?: string | null
          cst_icms?: string | null
          icms_rate?: number
          icms_st_rate?: number | null
          id?: string
          ipi_rate?: number | null
          is_active?: boolean
          mva?: number | null
          name?: string
          ncm?: string | null
          operation_type?: string
          pis_rate?: number
          product_type?: string
          regime?: string
          updated_at?: string
        }
        Update: {
          cest?: string | null
          cfop?: string
          cofins_rate?: number
          company_id?: string
          created_at?: string
          csosn?: string | null
          cst_icms?: string | null
          icms_rate?: number
          icms_st_rate?: number | null
          id?: string
          ipi_rate?: number | null
          is_active?: boolean
          mva?: number | null
          name?: string
          ncm?: string | null
          operation_type?: string
          pis_rate?: number
          product_type?: string
          regime?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_configs: {
        Row: {
          a3_subject_name: string | null
          a3_thumbprint: string | null
          certificate_expires_at: string | null
          certificate_password_hash: string | null
          certificate_path: string | null
          certificate_type: string
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
          a3_subject_name?: string | null
          a3_thumbprint?: string | null
          certificate_expires_at?: string | null
          certificate_password_hash?: string | null
          certificate_path?: string | null
          certificate_type?: string
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
          a3_subject_name?: string | null
          a3_thumbprint?: string | null
          certificate_expires_at?: string | null
          certificate_password_hash?: string | null
          certificate_path?: string | null
          certificate_type?: string
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
      icms_st_rules: {
        Row: {
          cest: string | null
          company_id: string
          created_at: string
          description: string | null
          fiscal_category_id: string | null
          icms_internal_rate: number
          icms_interstate_rate: number
          id: string
          is_active: boolean
          mva_adjusted: number | null
          mva_original: number
          ncm: string | null
          uf_destination: string
          uf_origin: string
          updated_at: string
        }
        Insert: {
          cest?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          fiscal_category_id?: string | null
          icms_internal_rate?: number
          icms_interstate_rate?: number
          id?: string
          is_active?: boolean
          mva_adjusted?: number | null
          mva_original?: number
          ncm?: string | null
          uf_destination: string
          uf_origin?: string
          updated_at?: string
        }
        Update: {
          cest?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          fiscal_category_id?: string | null
          icms_internal_rate?: number
          icms_interstate_rate?: number
          id?: string
          is_active?: boolean
          mva_adjusted?: number | null
          mva_original?: number
          ncm?: string | null
          uf_destination?: string
          uf_origin?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "icms_st_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icms_st_rules_fiscal_category_id_fkey"
            columns: ["fiscal_category_id"]
            isOneToOne: false
            referencedRelation: "fiscal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_count_items: {
        Row: {
          company_id: string
          counted_at: string | null
          counted_quantity: number | null
          created_at: string
          difference: number | null
          id: string
          inventory_id: string
          notes: string | null
          product_id: string
          system_quantity: number
        }
        Insert: {
          company_id: string
          counted_at?: string | null
          counted_quantity?: number | null
          created_at?: string
          difference?: number | null
          id?: string
          inventory_id: string
          notes?: string | null
          product_id: string
          system_quantity?: number
        }
        Update: {
          company_id?: string
          counted_at?: string | null
          counted_quantity?: number | null
          created_at?: string
          difference?: number | null
          id?: string
          inventory_id?: string
          notes?: string | null
          product_id?: string
          system_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          company_id: string
          created_at: string
          finished_at: string | null
          id: string
          name: string
          notes: string | null
          performed_by: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          finished_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          performed_by: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          performed_by?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_config: {
        Row: {
          birthday_multiplier: number
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          min_redemption_points: number
          points_per_real: number
          redemption_value: number
          updated_at: string
          welcome_bonus: number
        }
        Insert: {
          birthday_multiplier?: number
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          min_redemption_points?: number
          points_per_real?: number
          redemption_value?: number
          updated_at?: string
          welcome_bonus?: number
        }
        Update: {
          birthday_multiplier?: number
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          min_redemption_points?: number
          points_per_real?: number
          redemption_value?: number
          updated_at?: string
          welcome_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          client_id: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          points: number
          sale_id: string | null
          type: string
        }
        Insert: {
          balance_after?: number
          client_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          points: number
          sale_id?: string | null
          type: string
        }
        Update: {
          balance_after?: number
          client_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          points?: number
          sale_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          payment_method: string | null
          plan_key: string
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          plan_key: string
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          plan_key?: string
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
      pix_payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          external_reference: string
          id: string
          mp_payment_id: string | null
          paid_at: string | null
          qr_code: string | null
          qr_code_base64: string | null
          status: string
          ticket_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          external_reference: string
          id?: string
          mp_payment_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string
          ticket_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          external_reference?: string
          id?: string
          mp_payment_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string
          ticket_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          error: string | null
          id: string
          params: Json | null
          progress: number | null
          result: Json | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          error?: string | null
          id?: string
          params?: Json | null
          progress?: number | null
          result?: Json | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          error?: string | null
          id?: string
          params?: Json | null
          progress?: number | null
          result?: Json | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_labels: {
        Row: {
          company_id: string
          created_at: string
          id: string
          last_printed_at: string | null
          printed_by: string | null
          product_id: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          last_printed_at?: string | null
          printed_by?: string | null
          product_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          last_printed_at?: string | null
          printed_by?: string | null
          product_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_labels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_labels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lots: {
        Row: {
          company_id: string
          created_at: string
          expiry_date: string | null
          id: string
          is_active: boolean
          lot_number: string
          manufacture_date: string | null
          notes: string | null
          product_id: string
          quantity: number
          supplier: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          lot_number: string
          manufacture_date?: string | null
          notes?: string | null
          product_id: string
          quantity?: number
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          lot_number?: string
          manufacture_date?: string | null
          notes?: string | null
          product_id?: string
          quantity?: number
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
          product_name: string
          production_order_id: string
          quantity_required: number
          total_cost: number | null
          unit: string
          unit_cost: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          production_order_id: string
          quantity_required: number
          total_cost?: number | null
          unit?: string
          unit_cost?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          production_order_id?: string
          quantity_required?: number
          total_cost?: number | null
          unit?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          company_id: string
          created_at: string
          id: string
          multiplier: number
          notes: string | null
          output_product_id: string | null
          output_quantity: number
          output_unit: string
          produced_at: string | null
          produced_by: string
          recipe_id: string | null
          recipe_name: string
          status: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          multiplier?: number
          notes?: string | null
          output_product_id?: string | null
          output_quantity?: number
          output_unit?: string
          produced_at?: string | null
          produced_by: string
          recipe_id?: string | null
          recipe_name: string
          status?: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          multiplier?: number
          notes?: string | null
          output_product_id?: string | null
          output_quantity?: number
          output_unit?: string
          produced_at?: string | null
          produced_by?: string
          recipe_id?: string | null
          recipe_name?: string
          status?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_output_product_id_fkey"
            columns: ["output_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          aliq_cofins: number | null
          aliq_icms: number | null
          aliq_pis: number | null
          barcode: string | null
          category: string | null
          cest: string | null
          cfop: string | null
          company_id: string
          cost_price: number | null
          created_at: string
          csosn: string | null
          cst_cofins: string | null
          cst_icms: string | null
          cst_pis: string | null
          fiscal_category_id: string | null
          gtin_tributavel: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock: number | null
          name: string
          ncm: string | null
          origem: number | null
          price: number
          reorder_point: number | null
          reorder_quantity: number | null
          sku: string
          stock_quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          aliq_cofins?: number | null
          aliq_icms?: number | null
          aliq_pis?: number | null
          barcode?: string | null
          category?: string | null
          cest?: string | null
          cfop?: string | null
          company_id: string
          cost_price?: number | null
          created_at?: string
          csosn?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_pis?: string | null
          fiscal_category_id?: string | null
          gtin_tributavel?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock?: number | null
          name: string
          ncm?: string | null
          origem?: number | null
          price?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          sku: string
          stock_quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          aliq_cofins?: number | null
          aliq_icms?: number | null
          aliq_pis?: number | null
          barcode?: string | null
          category?: string | null
          cest?: string | null
          cfop?: string | null
          company_id?: string
          cost_price?: number | null
          created_at?: string
          csosn?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_pis?: string | null
          fiscal_category_id?: string | null
          gtin_tributavel?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock?: number | null
          name?: string
          ncm?: string | null
          origem?: number | null
          price?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
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
          {
            foreignKeyName: "products_fiscal_category_id_fkey"
            columns: ["fiscal_category_id"]
            isOneToOne: false
            referencedRelation: "fiscal_categories"
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
      promotion_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
          promotion_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          promotion_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_items_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          active_days: number[] | null
          buy_quantity: number | null
          category_name: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_percent: number | null
          ends_at: string | null
          fixed_price: number | null
          id: string
          is_active: boolean
          min_quantity: number | null
          name: string
          pay_quantity: number | null
          promo_type: string
          scope: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          active_days?: number[] | null
          buy_quantity?: number | null
          category_name?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          fixed_price?: number | null
          id?: string
          is_active?: boolean
          min_quantity?: number | null
          name: string
          pay_quantity?: number | null
          promo_type?: string
          scope?: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          active_days?: number[] | null
          buy_quantity?: number | null
          category_name?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          fixed_price?: number | null
          id?: string
          is_active?: boolean
          min_quantity?: number | null
          name?: string
          pay_quantity?: number | null
          promo_type?: string
          scope?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          received_quantity: number | null
          total: number
          unit_cost: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          received_quantity?: number | null
          total?: number
          unit_cost?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          received_quantity?: number | null
          total?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          received_at: string | null
          received_by: string | null
          sent_at: string | null
          status: string
          supplier_id: string | null
          total_value: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          sent_at?: string | null
          status?: string
          supplier_id?: string | null
          total_value?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          sent_at?: string | null
          status?: string
          supplier_id?: string | null
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          client_name: string | null
          company_id: string
          converted_at: string | null
          converted_sale_id: string | null
          created_at: string
          created_by: string
          discount_percent: number
          discount_value: number
          id: string
          items_json: Json
          notes: string | null
          quote_number: number
          status: string
          subtotal: number
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          company_id: string
          converted_at?: string | null
          converted_sale_id?: string | null
          created_at?: string
          created_by: string
          discount_percent?: number
          discount_value?: number
          id?: string
          items_json?: Json
          notes?: string | null
          quote_number?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          converted_at?: string | null
          converted_sale_id?: string | null
          created_at?: string
          created_by?: string
          discount_percent?: number
          discount_value?: number
          id?: string
          items_json?: Json
          notes?: string | null
          quote_number?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_sale_id_fkey"
            columns: ["converted_sale_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          recipe_id: string
          unit: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          recipe_id: string
          unit?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          output_product_id: string | null
          output_quantity: number
          output_unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          output_product_id?: string | null
          output_quantity?: number
          output_unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          output_product_id?: string | null
          output_quantity?: number
          output_unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_output_product_id_fkey"
            columns: ["output_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_commissions: {
        Row: {
          base_amount: number
          created_at: string
          id: string
          license_id: string
          markup_amount: number
          paid_at: string | null
          period_end: string
          period_start: string
          reseller_id: string
          status: string
        }
        Insert: {
          base_amount?: number
          created_at?: string
          id?: string
          license_id: string
          markup_amount?: number
          paid_at?: string | null
          period_end: string
          period_start: string
          reseller_id: string
          status?: string
        }
        Update: {
          base_amount?: number
          created_at?: string
          id?: string
          license_id?: string
          markup_amount?: number
          paid_at?: string | null
          period_end?: string
          period_start?: string
          reseller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_commissions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "reseller_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_commissions_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_licenses: {
        Row: {
          client_cnpj: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_trade_name: string | null
          company_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          reseller_id: string
          seller_email: string | null
          seller_name: string | null
          seller_phone: string | null
          started_at: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          client_cnpj?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_trade_name?: string | null
          company_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          reseller_id: string
          seller_email?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          client_cnpj?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_trade_name?: string | null
          company_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          reseller_id?: string
          seller_email?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_licenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_licenses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reseller_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_licenses_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_plans: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_monthly_sales: number | null
          max_nfce: number | null
          max_nfe: number | null
          max_products: number
          max_users: number
          name: string
          reseller_id: string
          reseller_price: number
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_monthly_sales?: number | null
          max_nfce?: number | null
          max_nfe?: number | null
          max_products?: number
          max_users?: number
          name: string
          reseller_id: string
          reseller_price?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_monthly_sales?: number | null
          max_nfce?: number | null
          max_nfe?: number | null
          max_products?: number
          max_users?: number
          name?: string
          reseller_id?: string
          reseller_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_plans_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          brand_name: string
          cnpj: string | null
          created_at: string
          custom_domain: string | null
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          markup_percentage: number
          name: string
          owner_user_id: string
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          trade_name: string | null
          updated_at: string
          whatsapp_support: string | null
        }
        Insert: {
          brand_name?: string
          cnpj?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          markup_percentage?: number
          name: string
          owner_user_id: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          trade_name?: string | null
          updated_at?: string
          whatsapp_support?: string | null
        }
        Update: {
          brand_name?: string
          cnpj?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          markup_percentage?: number
          name?: string
          owner_user_id?: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          trade_name?: string | null
          updated_at?: string
          whatsapp_support?: string | null
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
      subscriptions: {
        Row: {
          company_id: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          payment_method: string | null
          plan_key: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_method?: string | null
          plan_key: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_method?: string | null
          plan_key?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cnpj: string | null
          company_id: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          ie: string | null
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          company_id: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          company_id?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tef_configs: {
        Row: {
          accepted_brands: string[] | null
          api_key: string | null
          api_secret: string | null
          auto_confirm: boolean
          company_id: string
          connection_type: string | null
          created_at: string
          environment: string
          hardware_model: string | null
          id: string
          is_active: boolean
          max_installments: number
          merchant_id: string | null
          provider: string
          terminal_id: string | null
          updated_at: string
        }
        Insert: {
          accepted_brands?: string[] | null
          api_key?: string | null
          api_secret?: string | null
          auto_confirm?: boolean
          company_id: string
          connection_type?: string | null
          created_at?: string
          environment?: string
          hardware_model?: string | null
          id?: string
          is_active?: boolean
          max_installments?: number
          merchant_id?: string | null
          provider?: string
          terminal_id?: string | null
          updated_at?: string
        }
        Update: {
          accepted_brands?: string[] | null
          api_key?: string | null
          api_secret?: string | null
          auto_confirm?: boolean
          company_id?: string
          connection_type?: string | null
          created_at?: string
          environment?: string
          hardware_model?: string | null
          id?: string
          is_active?: boolean
          max_installments?: number
          merchant_id?: string | null
          provider?: string
          terminal_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tef_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
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
      telemetry: {
        Row: {
          active_users: number
          app_version: string | null
          clients_count: number
          company_id: string
          id: string
          metadata: Json | null
          nfce_count: number
          nfe_count: number
          period_date: string
          platform: string | null
          products_count: number
          reported_at: string
          sales_count: number
          sales_total: number
        }
        Insert: {
          active_users?: number
          app_version?: string | null
          clients_count?: number
          company_id: string
          id?: string
          metadata?: Json | null
          nfce_count?: number
          nfe_count?: number
          period_date: string
          platform?: string | null
          products_count?: number
          reported_at?: string
          sales_count?: number
          sales_total?: number
        }
        Update: {
          active_users?: number
          app_version?: string | null
          clients_count?: number
          company_id?: string
          id?: string
          metadata?: Json | null
          nfce_count?: number
          nfe_count?: number
          period_date?: string
          platform?: string | null
          products_count?: number
          reported_at?: string
          sales_count?: number
          sales_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_profit_report: {
        Args: { p_company_id: string; p_date: string }
        Returns: {
          by_payment: Json
          margin: number
          profit: number
          total_cost: number
          total_revenue: number
          total_sales: number
        }[]
      }
      get_decrypted_tef_config: {
        Args: { p_company_id: string }
        Returns: {
          accepted_brands: string[]
          api_key: string
          api_secret: string
          auto_confirm: boolean
          company_id: string
          connection_type: string
          environment: string
          hardware_model: string
          id: string
          is_active: boolean
          max_installments: number
          merchant_id: string
          provider: string
          terminal_id: string
        }[]
      }
      get_user_company_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin_or_manager: {
        Args: { _company_id: string }
        Returns: boolean
      }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_reseller_owner: { Args: { _reseller_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin"
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
      app_role: ["super_admin"],
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
