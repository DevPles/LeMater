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
          descricao: string | null
          duracao_min: number
          gestante_id: string | null
          gravacao_finalizada_em: string | null
          gravacao_iniciada_em: string | null
          id: string
          modalidade: string
          observacao: string | null
          professional_id: string
          recording_duration_seg: number | null
          recording_path: string | null
          reservado_em: string | null
          room_id: string | null
          status: string
          tipo_atendimento: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_hora: string
          descricao?: string | null
          duracao_min?: number
          gestante_id?: string | null
          gravacao_finalizada_em?: string | null
          gravacao_iniciada_em?: string | null
          id?: string
          modalidade?: string
          observacao?: string | null
          professional_id: string
          recording_duration_seg?: number | null
          recording_path?: string | null
          reservado_em?: string | null
          room_id?: string | null
          status?: string
          tipo_atendimento?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          descricao?: string | null
          duracao_min?: number
          gestante_id?: string | null
          gravacao_finalizada_em?: string | null
          gravacao_iniciada_em?: string | null
          id?: string
          modalidade?: string
          observacao?: string | null
          professional_id?: string
          recording_duration_seg?: number | null
          recording_path?: string | null
          reservado_em?: string | null
          room_id?: string | null
          status?: string
          tipo_atendimento?: string | null
          titulo?: string | null
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
      districts: {
        Row: {
          cidade: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cidade: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_criteria: {
        Row: {
          created_at: string
          fonte: string | null
          id: string
          mensagem: string
          resultado_alterado: string
          severidade: string
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fonte?: string | null
          id?: string
          mensagem: string
          resultado_alterado: string
          severidade?: string
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fonte?: string | null
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
      health_units: {
        Row: {
          ativo: boolean
          cidade: string
          cnes: string | null
          created_at: string
          district_id: string | null
          endereco: string | null
          id: string
          neighborhood_id: string | null
          nome: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade: string
          cnes?: string | null
          created_at?: string
          district_id?: string | null
          endereco?: string | null
          id?: string
          neighborhood_id?: string | null
          nome: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string
          cnes?: string | null
          created_at?: string
          district_id?: string | null
          endereco?: string | null
          id?: string
          neighborhood_id?: string | null
          nome?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_units_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_units_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      image_exam_results: {
        Row: {
          created_at: string
          data_exame: string
          gestante_id: string
          id: string
          imagem_path: string | null
          laudo_texto: string | null
          observacao: string | null
          registrado_por: string | null
          semana_gestacional: number | null
          status: string
          tipo_exame: string
        }
        Insert: {
          created_at?: string
          data_exame?: string
          gestante_id: string
          id?: string
          imagem_path?: string | null
          laudo_texto?: string | null
          observacao?: string | null
          registrado_por?: string | null
          semana_gestacional?: number | null
          status?: string
          tipo_exame: string
        }
        Update: {
          created_at?: string
          data_exame?: string
          gestante_id?: string
          id?: string
          imagem_path?: string | null
          laudo_texto?: string | null
          observacao?: string | null
          registrado_por?: string | null
          semana_gestacional?: number | null
          status?: string
          tipo_exame?: string
        }
        Relationships: []
      }
      image_exam_schedule: {
        Row: {
          created_at: string
          fonte: string | null
          id: string
          mensagem: string
          obrigatorio: boolean
          semana_max: number
          semana_min: number
          tipo_exame: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fonte?: string | null
          id?: string
          mensagem: string
          obrigatorio?: boolean
          semana_max: number
          semana_min: number
          tipo_exame: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fonte?: string | null
          id?: string
          mensagem?: string
          obrigatorio?: boolean
          semana_max?: number
          semana_min?: number
          tipo_exame?: string
          updated_at?: string
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          cidade: string
          created_at: string
          district_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cidade: string
          created_at?: string
          district_id?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          created_at?: string
          district_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          canal: string
          created_at: string
          enviado_por: string | null
          filtros_snapshot: Json
          group_id: string | null
          id: string
          mensagem: string
          template_origem: string | null
          titulo: string | null
          total_destinatarios: number
        }
        Insert: {
          canal: string
          created_at?: string
          enviado_por?: string | null
          filtros_snapshot?: Json
          group_id?: string | null
          id?: string
          mensagem: string
          template_origem?: string | null
          titulo?: string | null
          total_destinatarios?: number
        }
        Update: {
          canal?: string
          created_at?: string
          enviado_por?: string | null
          filtros_snapshot?: Json
          group_id?: string | null
          id?: string
          mensagem?: string
          template_origem?: string | null
          titulo?: string | null
          total_destinatarios?: number
        }
        Relationships: [
          {
            foreignKeyName: "notification_campaigns_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "notification_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          campaign_id: string
          canal: string
          created_at: string
          enviado_em: string | null
          erro: string | null
          gestante_id: string
          id: string
          lido_em: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          canal: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          gestante_id: string
          id?: string
          lido_em?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          canal?: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          gestante_id?: string
          id?: string
          lido_em?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_groups: {
        Row: {
          created_at: string
          criado_por: string | null
          descricao: string | null
          filtros: Json
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          filtros?: Json
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          filtros?: Json
          id?: string
          nome?: string
          updated_at?: string
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
          bairro: string | null
          bebe_sexo: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          district_id: string | null
          dum: string | null
          email: string | null
          foto_url: string | null
          health_unit_id: string | null
          id: string
          nome: string | null
          numero_abortos: number | null
          numero_gestacoes: number | null
          numero_partos: number | null
          partos_classificacao: Json | null
          telefone: string | null
          unidade_saude: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro?: string | null
          bebe_sexo?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          district_id?: string | null
          dum?: string | null
          email?: string | null
          foto_url?: string | null
          health_unit_id?: string | null
          id?: string
          nome?: string | null
          numero_abortos?: number | null
          numero_gestacoes?: number | null
          numero_partos?: number | null
          partos_classificacao?: Json | null
          telefone?: string | null
          unidade_saude?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bairro?: string | null
          bebe_sexo?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          district_id?: string | null
          dum?: string | null
          email?: string | null
          foto_url?: string | null
          health_unit_id?: string | null
          id?: string
          nome?: string | null
          numero_abortos?: number | null
          numero_gestacoes?: number | null
          numero_partos?: number | null
          partos_classificacao?: Json | null
          telefone?: string | null
          unidade_saude?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_health_unit_id_fkey"
            columns: ["health_unit_id"]
            isOneToOne: false
            referencedRelation: "health_units"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_ranges: {
        Row: {
          created_at: string
          fonte: string | null
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
          fonte?: string | null
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
          fonte?: string | null
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
          fonte: string | null
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
          fonte?: string | null
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
          fonte?: string | null
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
      vaccine_schedule_extra: {
        Row: {
          created_at: string
          fonte: string | null
          id: string
          mensagem: string
          semana_max: number | null
          semana_min: number
          updated_at: string
          vacina: string
        }
        Insert: {
          created_at?: string
          fonte?: string | null
          id?: string
          mensagem: string
          semana_max?: number | null
          semana_min?: number
          updated_at?: string
          vacina: string
        }
        Update: {
          created_at?: string
          fonte?: string | null
          id?: string
          mensagem?: string
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
      get_all_active_alerts: {
        Args: never
        Returns: {
          data: string
          gestante_id: string
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
      is_professional_of_gestante: {
        Args: { _gestante_id: string; _prof_user_id: string }
        Returns: boolean
      }
      promote_to_professional: {
        Args: { _user_id: string }
        Returns: undefined
      }
      resolve_login_email_by_cpf: { Args: { _cpf: string }; Returns: string }
      resolve_login_email_by_registro: {
        Args: { _registro: string }
        Returns: string
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
