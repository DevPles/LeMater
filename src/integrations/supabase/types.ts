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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          screen_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          screen_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          screen_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointment_slots: {
        Row: {
          created_at: string
          data_hora: string
          duracao_min: number
          gestante_id: string | null
          id: string
          modalidade: string
          observacao: string | null
          professional_id: string
          reservado_em: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_hora: string
          duracao_min?: number
          gestante_id?: string | null
          id?: string
          modalidade?: string
          observacao?: string | null
          professional_id: string
          reservado_em?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          duracao_min?: number
          gestante_id?: string | null
          id?: string
          modalidade?: string
          observacao?: string | null
          professional_id?: string
          reservado_em?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_measurements: {
        Row: {
          created_at: string
          data_medicao: string
          gestante_id: string
          id: string
          observacao: string | null
          parametro: string
          registrado_por: string | null
          semana_gestacional: number | null
          valor: number
        }
        Insert: {
          created_at?: string
          data_medicao?: string
          gestante_id: string
          id?: string
          observacao?: string | null
          parametro: string
          registrado_por?: string | null
          semana_gestacional?: number | null
          valor: number
        }
        Update: {
          created_at?: string
          data_medicao?: string
          gestante_id?: string
          id?: string
          observacao?: string | null
          parametro?: string
          registrado_por?: string | null
          semana_gestacional?: number | null
          valor?: number
        }
        Relationships: []
      }
      exam_criteria: {
        Row: {
          created_at: string
          id: string
          mensagem: string
          resultado_alterado: string
          severidade: string
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem: string
          resultado_alterado: string
          severidade?: string
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string
          resultado_alterado?: string
          severidade?: string
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          created_at: string
          data_exame: string
          gestante_id: string
          id: string
          observacao: string | null
          registrado_por: string | null
          resultado: string
          status: string
          tipo_exame: string
        }
        Insert: {
          created_at?: string
          data_exame?: string
          gestante_id: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          resultado: string
          status?: string
          tipo_exame: string
        }
        Update: {
          created_at?: string
          data_exame?: string
          gestante_id?: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          resultado?: string
          status?: string
          tipo_exame?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          ativo: boolean
          bio: string | null
          created_at: string
          especialidade: string
          id: string
          nome: string
          registro: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          bio?: string | null
          created_at?: string
          especialidade: string
          id?: string
          nome: string
          registro?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          bio?: string | null
          created_at?: string
          especialidade?: string
          id?: string
          nome?: string
          registro?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dum: string | null
          email: string | null
          foto_url: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dum?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dum?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reference_ranges: {
        Row: {
          created_at: string
          id: string
          mensagem: string
          parametro: string
          semana_max: number
          semana_min: number
          severidade: string
          unidade: string | null
          updated_at: string
          valor_max: number | null
          valor_min: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem: string
          parametro: string
          semana_max?: number
          semana_min?: number
          severidade?: string
          unidade?: string | null
          updated_at?: string
          valor_max?: number | null
          valor_min?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string
          parametro?: string
          semana_max?: number
          semana_min?: number
          severidade?: string
          unidade?: string | null
          updated_at?: string
          valor_max?: number | null
          valor_min?: number | null
        }
        Relationships: []
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
      vaccinations: {
        Row: {
          created_at: string
          data_aplicacao: string
          gestante_id: string
          id: string
          observacao: string | null
          registrado_por: string | null
          vacina: string
        }
        Insert: {
          created_at?: string
          data_aplicacao?: string
          gestante_id: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          vacina: string
        }
        Update: {
          created_at?: string
          data_aplicacao?: string
          gestante_id?: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          vacina?: string
        }
        Relationships: []
      }
      vaccine_schedule: {
        Row: {
          created_at: string
          id: string
          mensagem: string
          obrigatoria: boolean
          semana_max: number | null
          semana_min: number
          updated_at: string
          vacina: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem: string
          obrigatoria?: boolean
          semana_max?: number | null
          semana_min?: number
          updated_at?: string
          vacina: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string
          obrigatoria?: boolean
          semana_max?: number | null
          semana_min?: number
          updated_at?: string
          vacina?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_slot: {
        Args: { _slot_id: string }
        Returns: {
          message: string
          slot_id: string
          success: boolean
        }[]
      }
      get_active_alerts: {
        Args: { _gestante_id: string }
        Returns: {
          data: string
          id: string
          mensagem: string
          origem: string
          severidade: string
          titulo: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "gestante" | "profissional" | "admin"
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
      app_role: ["gestante", "profissional", "admin"],
    },
  },
} as const
