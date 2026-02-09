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
      company_role: "admin" | "gerente" | "caixa"
      fiscal_doc_status:
        | "pendente"
        | "autorizada"
        | "cancelada"
        | "rejeitada"
        | "contingencia"
        | "inutilizada"
      fiscal_doc_type: "nfce" | "nfe" | "sat"
      sefaz_environment: "homologacao" | "producao"
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
      company_role: ["admin", "gerente", "caixa"],
      fiscal_doc_status: [
        "pendente",
        "autorizada",
        "cancelada",
        "rejeitada",
        "contingencia",
        "inutilizada",
      ],
      fiscal_doc_type: ["nfce", "nfe", "sat"],
      sefaz_environment: ["homologacao", "producao"],
    },
  },
} as const
