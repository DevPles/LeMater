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
      admin_managed_passwords: {
        Row: {
          password_plaintext: string
          set_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          password_plaintext: string
          set_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          password_plaintext?: string
          set_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_acesso_pago: {
        Row: {
          ativo: boolean
          created_at: string
          expira_em: string | null
          id: string
          origem: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          expira_em?: string | null
          id?: string
          origem?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          expira_em?: string | null
          id?: string
          origem?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          preco_centavos: number
          produto_externo_id: string | null
          professional_id: string
          recording_duration_seg: number | null
          recording_path: string | null
          requer_pagamento: boolean
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
          preco_centavos?: number
          produto_externo_id?: string | null
          professional_id: string
          recording_duration_seg?: number | null
          recording_path?: string | null
          requer_pagamento?: boolean
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
          preco_centavos?: number
          produto_externo_id?: string | null
          professional_id?: string
          recording_duration_seg?: number | null
          recording_path?: string | null
          requer_pagamento?: boolean
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
      atlas_cards: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          link: string | null
          ordem: number
          titulo: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          ordem?: number
          titulo: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          link?: string | null
          ordem?: number
          titulo?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      atlas_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          momento: string
          nome: string
          origem: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          momento: string
          nome: string
          origem: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          momento?: string
          nome?: string
          origem?: string
          whatsapp?: string
        }
        Relationships: []
      }
      aula_matriculas: {
        Row: {
          ativo: boolean
          aula_id: string
          created_at: string
          expira_em: string | null
          id: string
          liberado_por: string | null
          origem: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          aula_id: string
          created_at?: string
          expira_em?: string | null
          id?: string
          liberado_por?: string | null
          origem?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          aula_id?: string
          created_at?: string
          expira_em?: string | null
          id?: string
          liberado_por?: string | null
          origem?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aula_matriculas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "curso_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      aula_temas: {
        Row: {
          aula_id: string
          created_at: string
          ordem: number
          tema_id: string
        }
        Insert: {
          aula_id: string
          created_at?: string
          ordem?: number
          tema_id: string
        }
        Update: {
          aula_id?: string
          created_at?: string
          ordem?: number
          tema_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aula_temas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "curso_aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aula_temas_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          order: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          order?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          active: boolean
          cover_image: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          order: number
          price_centavos: number
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          active?: boolean
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order?: number
          price_centavos?: number
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order?: number
          price_centavos?: number
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string
          id: string
          item_id: string
          item_type: string
          notes: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clinical_measurements: {
        Row: {
          appointment_id: string | null
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
          appointment_id?: string | null
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
          appointment_id?: string | null
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
      consultation_notes: {
        Row: {
          appointment_id: string
          created_at: string
          gestante_id: string
          id: string
          observacoes: string | null
          professional_user_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          gestante_id: string
          id?: string
          observacoes?: string | null
          professional_user_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          gestante_id?: string
          id?: string
          observacoes?: string | null
          professional_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_translations: {
        Row: {
          audio_url: string | null
          capa_url: string | null
          conteudo_html: string | null
          created_at: string
          descricao: string | null
          gratis: boolean | null
          id: string
          item_id: string
          item_type: string
          legenda_url: string | null
          moeda: string | null
          pais: string
          pdf_url: string | null
          preco_centavos: number | null
          preco_label: string | null
          titulo: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo_html?: string | null
          created_at?: string
          descricao?: string | null
          gratis?: boolean | null
          id?: string
          item_id: string
          item_type: string
          legenda_url?: string | null
          moeda?: string | null
          pais: string
          pdf_url?: string | null
          preco_centavos?: number | null
          preco_label?: string | null
          titulo?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          capa_url?: string | null
          conteudo_html?: string | null
          created_at?: string
          descricao?: string | null
          gratis?: boolean | null
          id?: string
          item_id?: string
          item_type?: string
          legenda_url?: string | null
          moeda?: string | null
          pais?: string
          pdf_url?: string | null
          preco_centavos?: number | null
          preco_label?: string | null
          titulo?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      course_audios: {
        Row: {
          ativo: boolean
          audio_url: string | null
          capa_url: string | null
          created_at: string
          descricao: string | null
          duracao_seg: number
          gratuito: boolean
          id: string
          liberacao: string
          ordem: number
          spotify_url: string | null
          tipo_audio: string
          titulo: string
          updated_at: string
          vinculo_id: string
          vinculo_tipo: string
        }
        Insert: {
          ativo?: boolean
          audio_url?: string | null
          capa_url?: string | null
          created_at?: string
          descricao?: string | null
          duracao_seg?: number
          gratuito?: boolean
          id?: string
          liberacao?: string
          ordem?: number
          spotify_url?: string | null
          tipo_audio?: string
          titulo: string
          updated_at?: string
          vinculo_id: string
          vinculo_tipo: string
        }
        Update: {
          ativo?: boolean
          audio_url?: string | null
          capa_url?: string | null
          created_at?: string
          descricao?: string | null
          duracao_seg?: number
          gratuito?: boolean
          id?: string
          liberacao?: string
          ordem?: number
          spotify_url?: string | null
          tipo_audio?: string
          titulo?: string
          updated_at?: string
          vinculo_id?: string
          vinculo_tipo?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          curso_id: string | null
          desconto_centavos: number | null
          desconto_pct: number | null
          descricao: string | null
          id: string
          max_usos: number | null
          updated_at: string
          usos: number
          valido_ate: string | null
          valido_de: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          curso_id?: string | null
          desconto_centavos?: number | null
          desconto_pct?: number | null
          descricao?: string | null
          id?: string
          max_usos?: number | null
          updated_at?: string
          usos?: number
          valido_ate?: string | null
          valido_de?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          curso_id?: string | null
          desconto_centavos?: number | null
          desconto_pct?: number | null
          descricao?: string | null
          id?: string
          max_usos?: number | null
          updated_at?: string
          usos?: number
          valido_ate?: string | null
          valido_de?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupons_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_aulas: {
        Row: {
          beneficios: string[]
          capa_url: string | null
          capa_video_url: string | null
          conteudo_html: string | null
          created_at: string
          descricao: string | null
          duracao_min: number
          gratis: boolean
          id: string
          link_compra_externo: string | null
          links_compra: Json
          materiais_extras: Json
          modulo_id: string
          moeda: string
          ordem: number
          pdf_url: string | null
          plataforma_venda: string | null
          preco_centavos: number
          preco_label: string | null
          previa_gratis: boolean
          publicado: boolean
          slug: string | null
          tipo: string
          titulo: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          beneficios?: string[]
          capa_url?: string | null
          capa_video_url?: string | null
          conteudo_html?: string | null
          created_at?: string
          descricao?: string | null
          duracao_min?: number
          gratis?: boolean
          id?: string
          link_compra_externo?: string | null
          links_compra?: Json
          materiais_extras?: Json
          modulo_id: string
          moeda?: string
          ordem?: number
          pdf_url?: string | null
          plataforma_venda?: string | null
          preco_centavos?: number
          preco_label?: string | null
          previa_gratis?: boolean
          publicado?: boolean
          slug?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          beneficios?: string[]
          capa_url?: string | null
          capa_video_url?: string | null
          conteudo_html?: string | null
          created_at?: string
          descricao?: string | null
          duracao_min?: number
          gratis?: boolean
          id?: string
          link_compra_externo?: string | null
          links_compra?: Json
          materiais_extras?: Json
          modulo_id?: string
          moeda?: string
          ordem?: number
          pdf_url?: string | null
          plataforma_venda?: string | null
          preco_centavos?: number
          preco_label?: string | null
          previa_gratis?: boolean
          publicado?: boolean
          slug?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curso_aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "curso_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_matriculas: {
        Row: {
          ativo: boolean
          created_at: string
          curso_id: string
          expira_em: string | null
          id: string
          liberado_por: string | null
          origem: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          curso_id: string
          expira_em?: string | null
          id?: string
          liberado_por?: string | null
          origem?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          curso_id?: string
          expira_em?: string | null
          id?: string
          liberado_por?: string | null
          origem?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_modulos: {
        Row: {
          created_at: string
          curso_id: string
          descricao: string | null
          id: string
          ordem: number
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_progresso: {
        Row: {
          aula_id: string
          concluida_em: string
          id: string
          user_id: string
        }
        Insert: {
          aula_id: string
          concluida_em?: string
          id?: string
          user_id: string
        }
        Update: {
          aula_id?: string
          concluida_em?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_progresso_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "curso_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          audio_apresentacao_url: string | null
          capa_url: string | null
          capa_video_url: string | null
          carga_horaria_min: number
          categoria: string
          created_at: string
          descricao_curta: string | null
          descricao_longa: string | null
          id: string
          instrutor_bio: string | null
          instrutor_foto: string | null
          instrutor_nome: string | null
          link_compra_externo: string | null
          links_compra: Json
          materiais_gratis: Json
          nivel: string
          ordem: number
          plataforma_venda: string | null
          preco_centavos: number
          preco_label: string | null
          produto_externo_id: string | null
          publicado: boolean
          slug: string
          subtitulo: string | null
          thumbnail_url: string | null
          titulo: string
          titulo_comercial: string | null
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          audio_apresentacao_url?: string | null
          capa_url?: string | null
          capa_video_url?: string | null
          carga_horaria_min?: number
          categoria?: string
          created_at?: string
          descricao_curta?: string | null
          descricao_longa?: string | null
          id?: string
          instrutor_bio?: string | null
          instrutor_foto?: string | null
          instrutor_nome?: string | null
          link_compra_externo?: string | null
          links_compra?: Json
          materiais_gratis?: Json
          nivel?: string
          ordem?: number
          plataforma_venda?: string | null
          preco_centavos?: number
          preco_label?: string | null
          produto_externo_id?: string | null
          publicado?: boolean
          slug: string
          subtitulo?: string | null
          thumbnail_url?: string | null
          titulo: string
          titulo_comercial?: string | null
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          audio_apresentacao_url?: string | null
          capa_url?: string | null
          capa_video_url?: string | null
          carga_horaria_min?: number
          categoria?: string
          created_at?: string
          descricao_curta?: string | null
          descricao_longa?: string | null
          id?: string
          instrutor_bio?: string | null
          instrutor_foto?: string | null
          instrutor_nome?: string | null
          link_compra_externo?: string | null
          links_compra?: Json
          materiais_gratis?: Json
          nivel?: string
          ordem?: number
          plataforma_venda?: string | null
          preco_centavos?: number
          preco_label?: string | null
          produto_externo_id?: string | null
          publicado?: boolean
          slug?: string
          subtitulo?: string | null
          thumbnail_url?: string | null
          titulo?: string
          titulo_comercial?: string | null
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dismissed_alerts: {
        Row: {
          alert_id: string
          dismissed_at: string
          gestante_id: string
          id: string
        }
        Insert: {
          alert_id: string
          dismissed_at?: string
          gestante_id: string
          id?: string
        }
        Update: {
          alert_id?: string
          dismissed_at?: string
          gestante_id?: string
          id?: string
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
      entitlements: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          item_id: string | null
          item_type: string
          notes: string | null
          source: string
          source_ref: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          item_id?: string | null
          item_type: string
          notes?: string | null
          source: string
          source_ref?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          item_id?: string | null
          item_type?: string
          notes?: string | null
          source?: string
          source_ref?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      evaluation_requests: {
        Row: {
          appointment_id: string | null
          created_at: string
          especialidade: string
          expira_em: string
          gestante_id: string
          id: string
          status: string
          token: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          especialidade: string
          expira_em?: string
          gestante_id: string
          id?: string
          status?: string
          token?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          especialidade?: string
          expira_em?: string
          gestante_id?: string
          id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      evaluation_responses: {
        Row: {
          created_at: string
          id: string
          professional_nome: string
          professional_registro_numero: string
          professional_registro_tipo: string
          professional_registro_uf: string
          request_id: string
          respostas: Json
        }
        Insert: {
          created_at?: string
          id?: string
          professional_nome: string
          professional_registro_numero: string
          professional_registro_tipo: string
          professional_registro_uf: string
          request_id: string
          respostas?: Json
        }
        Update: {
          created_at?: string
          id?: string
          professional_nome?: string
          professional_registro_numero?: string
          professional_registro_tipo?: string
          professional_registro_uf?: string
          request_id?: string
          respostas?: Json
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "evaluation_requests"
            referencedColumns: ["id"]
          },
        ]
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
          appointment_id: string | null
          arquivo_path: string | null
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
          appointment_id?: string | null
          arquivo_path?: string | null
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
          appointment_id?: string | null
          arquivo_path?: string | null
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
      hotmart_compras: {
        Row: {
          cupom_codigo: string | null
          curso_id: string | null
          email_comprador: string
          evento: string
          id: string
          nome_comprador: string | null
          plataforma: string | null
          processado_em: string
          produto: string | null
          raw_payload: Json
          status: string
          transaction_id: string | null
          valor_centavos: number | null
        }
        Insert: {
          cupom_codigo?: string | null
          curso_id?: string | null
          email_comprador: string
          evento: string
          id?: string
          nome_comprador?: string | null
          plataforma?: string | null
          processado_em?: string
          produto?: string | null
          raw_payload: Json
          status: string
          transaction_id?: string | null
          valor_centavos?: number | null
        }
        Update: {
          cupom_codigo?: string | null
          curso_id?: string | null
          email_comprador?: string
          evento?: string
          id?: string
          nome_comprador?: string | null
          plataforma?: string | null
          processado_em?: string
          produto?: string | null
          raw_payload?: Json
          status?: string
          transaction_id?: string | null
          valor_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hotmart_compras_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      image_exam_results: {
        Row: {
          appointment_id: string | null
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
          appointment_id?: string | null
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
          appointment_id?: string | null
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
      leads_gratis: {
        Row: {
          created_at: string
          email: string
          id: string
          material_id: string | null
          nome: string
          telefone: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          material_id?: string | null
          nome: string
          telefone: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          material_id?: string | null
          nome?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_gratis_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_modules: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          module_id: string
          order: number
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          module_id: string
          order?: number
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          module_id?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_modules_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          lesson_id: string
          progress_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          lesson_id: string
          progress_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          lesson_id?: string
          progress_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_views: {
        Row: {
          id: string
          lesson_id: string
          source: string | null
          user_id: string | null
          viewed_at: string
          watched_sec: number
        }
        Insert: {
          id?: string
          lesson_id: string
          source?: string | null
          user_id?: string | null
          viewed_at?: string
          watched_sec?: number
        }
        Update: {
          id?: string
          lesson_id?: string
          source?: string | null
          user_id?: string | null
          viewed_at?: string
          watched_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_views_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          active: boolean
          audience: string | null
          benefits: Json
          cover_image: string | null
          cover_video_url: string | null
          created_at: string
          currency: string
          difficulty: string
          duration_sec: number
          free_or_paid: string
          full_description: string | null
          id: string
          individual_price_centavos: number
          objectives: Json
          preview_enabled: boolean
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          subtitle: string | null
          tags: string[]
          thumbnail: string | null
          title: string
          trailer_url: string | null
          transformation: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          active?: boolean
          audience?: string | null
          benefits?: Json
          cover_image?: string | null
          cover_video_url?: string | null
          created_at?: string
          currency?: string
          difficulty?: string
          duration_sec?: number
          free_or_paid?: string
          full_description?: string | null
          id?: string
          individual_price_centavos?: number
          objectives?: Json
          preview_enabled?: boolean
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          subtitle?: string | null
          tags?: string[]
          thumbnail?: string | null
          title: string
          trailer_url?: string | null
          transformation?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          audience?: string | null
          benefits?: Json
          cover_image?: string | null
          cover_video_url?: string | null
          created_at?: string
          currency?: string
          difficulty?: string
          duration_sec?: number
          free_or_paid?: string
          full_description?: string | null
          id?: string
          individual_price_centavos?: number
          objectives?: Json
          preview_enabled?: boolean
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          subtitle?: string | null
          tags?: string[]
          thumbnail?: string | null
          title?: string
          trailer_url?: string | null
          transformation?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      materiais: {
        Row: {
          acesso: string
          area: string
          capa_url: string | null
          categoria: string
          conteudo_html: string | null
          conteudo_url: string | null
          created_at: string
          cta_label: string | null
          descricao: string | null
          id: string
          link_compra: string | null
          ordem: number
          plataforma_venda: string | null
          preco_centavos: number
          preco_label: string | null
          produto_externo_id: string | null
          publicado: boolean
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          acesso?: string
          area: string
          capa_url?: string | null
          categoria?: string
          conteudo_html?: string | null
          conteudo_url?: string | null
          created_at?: string
          cta_label?: string | null
          descricao?: string | null
          id?: string
          link_compra?: string | null
          ordem?: number
          plataforma_venda?: string | null
          preco_centavos?: number
          preco_label?: string | null
          produto_externo_id?: string | null
          publicado?: boolean
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          acesso?: string
          area?: string
          capa_url?: string | null
          categoria?: string
          conteudo_html?: string | null
          conteudo_url?: string | null
          created_at?: string
          cta_label?: string | null
          descricao?: string | null
          id?: string
          link_compra?: string | null
          ordem?: number
          plataforma_venda?: string | null
          preco_centavos?: number
          preco_label?: string | null
          produto_externo_id?: string | null
          publicado?: boolean
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_acessos: {
        Row: {
          created_at: string
          liberado_por: string | null
          material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          liberado_por?: string | null
          material_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          liberado_por?: string | null
          material_id?: string
          user_id?: string
        }
        Relationships: []
      }
      media_items: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_sec: number | null
          embed_url: string | null
          id: string
          lesson_id: string | null
          module_id: string | null
          order: number
          provider: string | null
          thumbnail: string | null
          title: string | null
          type: string
          updated_at: string
          url: string | null
          visibility: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_sec?: number | null
          embed_url?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          order?: number
          provider?: string | null
          thumbnail?: string | null
          title?: string | null
          type: string
          updated_at?: string
          url?: string | null
          visibility?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_sec?: number | null
          embed_url?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          order?: number
          provider?: string | null
          thumbnail?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          url?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_items_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          active: boolean
          color: string | null
          cover_image: string | null
          cover_video: string | null
          created_at: string
          description: string | null
          emotional_context: string | null
          id: string
          order: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          cover_image?: string | null
          cover_video?: string | null
          created_at?: string
          description?: string | null
          emotional_context?: string | null
          id?: string
          order?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          cover_image?: string | null
          cover_video?: string | null
          created_at?: string
          description?: string | null
          emotional_context?: string | null
          id?: string
          order?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          visibility?: string
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
      order_items: {
        Row: {
          created_at: string
          currency: string
          id: string
          item_id: string
          item_type: string
          metadata: Json
          order_id: string
          quantity: number
          title: string | null
          unit_price_centavos: number
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          item_id: string
          item_type: string
          metadata?: Json
          order_id: string
          quantity?: number
          title?: string | null
          unit_price_centavos?: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          item_id?: string
          item_type?: string
          metadata?: Json
          order_id?: string
          quantity?: number
          title?: string | null
          unit_price_centavos?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          aprovacao_manual: boolean
          aprovado_em: string | null
          aprovado_por: string | null
          comprador_email: string
          comprador_nome: string | null
          comprador_user_id: string | null
          created_at: string
          cupom_codigo: string | null
          id: string
          moeda: string
          observacao: string | null
          pais: string | null
          plataforma: string
          produto_id: string | null
          produto_tipo: string
          raw_payload: Json
          status: string
          transaction_id_externo: string | null
          updated_at: string
          valor_centavos: number
        }
        Insert: {
          aprovacao_manual?: boolean
          aprovado_em?: string | null
          aprovado_por?: string | null
          comprador_email: string
          comprador_nome?: string | null
          comprador_user_id?: string | null
          created_at?: string
          cupom_codigo?: string | null
          id?: string
          moeda?: string
          observacao?: string | null
          pais?: string | null
          plataforma: string
          produto_id?: string | null
          produto_tipo: string
          raw_payload?: Json
          status?: string
          transaction_id_externo?: string | null
          updated_at?: string
          valor_centavos?: number
        }
        Update: {
          aprovacao_manual?: boolean
          aprovado_em?: string | null
          aprovado_por?: string | null
          comprador_email?: string
          comprador_nome?: string | null
          comprador_user_id?: string | null
          created_at?: string
          cupom_codigo?: string | null
          id?: string
          moeda?: string
          observacao?: string | null
          pais?: string | null
          plataforma?: string
          produto_id?: string | null
          produto_tipo?: string
          raw_payload?: Json
          status?: string
          transaction_id_externo?: string | null
          updated_at?: string
          valor_centavos?: number
        }
        Relationships: []
      }
      pathway_lessons: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          order: number
          pathway_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          order?: number
          pathway_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          order?: number
          pathway_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_lessons_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathways: {
        Row: {
          active: boolean
          audience: string | null
          color: string | null
          cover_image: string | null
          cover_video: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          order: number
          price_centavos: number
          recommended_week_max: number | null
          recommended_week_min: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          active?: boolean
          audience?: string | null
          color?: string | null
          cover_image?: string | null
          cover_video?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order?: number
          price_centavos?: number
          recommended_week_max?: number | null
          recommended_week_min?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          audience?: string | null
          color?: string | null
          cover_image?: string | null
          cover_video?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order?: number
          price_centavos?: number
          recommended_week_max?: number | null
          recommended_week_min?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          event_type: string
          gateway: string
          id: string
          payment_id: string | null
          raw_payload: Json
          received_at: string
        }
        Insert: {
          event_type: string
          gateway: string
          id?: string
          payment_id?: string | null
          raw_payload: Json
          received_at?: string
        }
        Update: {
          event_type?: string
          gateway?: string
          id?: string
          payment_id?: string | null
          raw_payload?: Json
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_centavos: number
          checkout_url: string | null
          created_at: string
          currency: string
          external_id: string | null
          gateway: string
          id: string
          order_id: string
          payer_email: string | null
          payer_name: string | null
          raw_payload: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_centavos?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          external_id?: string | null
          gateway: string
          id?: string
          order_id: string
          payer_email?: string | null
          payer_name?: string | null
          raw_payload?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_centavos?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          external_id?: string | null
          gateway?: string
          id?: string
          order_id?: string
          payer_email?: string | null
          payer_name?: string | null
          raw_payload?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_offers: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          label: string | null
          moeda: string
          ordem: number
          pais: string
          plataforma: string
          preco_centavos: number
          produto_externo_id: string | null
          produto_id: string
          produto_tipo: string
          tipo_link: string
          updated_at: string
          url_externo: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          label?: string | null
          moeda?: string
          ordem?: number
          pais?: string
          plataforma: string
          preco_centavos?: number
          produto_externo_id?: string | null
          produto_id: string
          produto_tipo: string
          tipo_link?: string
          updated_at?: string
          url_externo?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          label?: string | null
          moeda?: string
          ordem?: number
          pais?: string
          plataforma?: string
          preco_centavos?: number
          produto_externo_id?: string | null
          produto_id?: string
          produto_tipo?: string
          tipo_link?: string
          updated_at?: string
          url_externo?: string | null
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
          altura_cm: number | null
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
          peso_inicial_kg: number | null
          telefone: string | null
          unidade_saude: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          altura_cm?: number | null
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
          peso_inicial_kg?: number | null
          telefone?: string | null
          unidade_saude?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          altura_cm?: number | null
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
          peso_inicial_kg?: number | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reel_categories: {
        Row: {
          created_at: string
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      reel_comments: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          reel_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          reel_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          reel_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          autor_id: string
          categoria_slug: string | null
          created_at: string
          descricao: string | null
          duracao_seg: number | null
          id: string
          publicado: boolean
          thumbnail_url: string | null
          titulo: string
          updated_at: string
          video_path: string | null
          video_url: string
          visualizacoes: number
        }
        Insert: {
          autor_id: string
          categoria_slug?: string | null
          created_at?: string
          descricao?: string | null
          duracao_seg?: number | null
          id?: string
          publicado?: boolean
          thumbnail_url?: string | null
          titulo: string
          updated_at?: string
          video_path?: string | null
          video_url: string
          visualizacoes?: number
        }
        Update: {
          autor_id?: string
          categoria_slug?: string | null
          created_at?: string
          descricao?: string | null
          duracao_seg?: number | null
          id?: string
          publicado?: boolean
          thumbnail_url?: string | null
          titulo?: string
          updated_at?: string
          video_path?: string | null
          video_url?: string
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "reels_categoria_slug_fkey"
            columns: ["categoria_slug"]
            isOneToOne: false
            referencedRelation: "reel_categories"
            referencedColumns: ["slug"]
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
      service_products: {
        Row: {
          active: boolean
          bookable: boolean
          cover_image: string | null
          created_at: string
          currency: string
          description: string | null
          duration_min: number | null
          id: string
          price_centavos: number
          professional_id: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          active?: boolean
          bookable?: boolean
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_min?: number | null
          id?: string
          price_centavos?: number
          professional_id?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          bookable?: boolean
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_min?: number | null
          id?: string
          price_centavos?: number
          professional_id?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      user_journey_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          journey_id: string
          order: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          journey_id: string
          order?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          journey_id?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_journey_items_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "user_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journeys: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          share_slug: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          share_slug?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          share_slug?: string | null
          title?: string
          updated_at?: string
          user_id?: string
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
          appointment_id: string | null
          created_at: string
          data_aplicacao: string
          fabricante: string | null
          gestante_id: string
          id: string
          lote: string | null
          observacao: string | null
          registrado_por: string | null
          vacina: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          data_aplicacao?: string
          fabricante?: string | null
          gestante_id: string
          id?: string
          lote?: string | null
          observacao?: string | null
          registrado_por?: string | null
          vacina: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          data_aplicacao?: string
          fabricante?: string | null
          gestante_id?: string
          id?: string
          lote?: string | null
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
      reels_feed: {
        Row: {
          autor_foto: string | null
          autor_id: string | null
          autor_nome: string | null
          categoria_slug: string | null
          created_at: string | null
          descricao: string | null
          duracao_seg: number | null
          id: string | null
          publicado: boolean | null
          thumbnail_url: string | null
          titulo: string | null
          total_comentarios: number | null
          total_likes: number | null
          updated_at: string | null
          video_path: string | null
          video_url: string | null
          visualizacoes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_categoria_slug_fkey"
            columns: ["categoria_slug"]
            isOneToOne: false
            referencedRelation: "reel_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
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
      get_cartao_publico: { Args: { _user_id: string }; Returns: Json }
      get_consulta_prontuario: {
        Args: { _appointment_id: string }
        Returns: Json
      }
      get_evaluation_request_public: { Args: { _token: string }; Returns: Json }
      get_public_offers: {
        Args: { _id: string; _pais?: string; _tipo: string }
        Returns: {
          id: string
          label: string
          moeda: string
          ordem: number
          pais: string
          plataforma: string
          preco_centavos: number
          tipo_link: string
          url_externo: string
        }[]
      }
      has_entitlement: {
        Args: { _id: string; _type: string; _user: string }
        Returns: boolean
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
      lesson_access: {
        Args: { _lesson: string; _user: string }
        Returns: boolean
      }
      liberar_acesso_por_pedido: { Args: { _order_id: string }; Returns: Json }
      list_consultas_prof: {
        Args: { _only_with_lancamentos?: boolean }
        Returns: {
          appointment_id: string
          data_hora: string
          gestante_id: string
          gestante_nome: string
          status: string
          total_ex: number
          total_img: number
          total_med: number
          total_obs: number
          total_vac: number
        }[]
      }
      pode_ver_aula: {
        Args: { _aula: string; _user: string }
        Returns: boolean
      }
      pode_ver_material: {
        Args: { _mat: string; _user: string }
        Returns: boolean
      }
      promote_to_professional: {
        Args: { _user_id: string }
        Returns: undefined
      }
      recommend_lessons: {
        Args: { _limit?: number; _user: string }
        Returns: {
          lesson_id: string
          score: number
        }[]
      }
      resolve_login_email_by_cpf: { Args: { _cpf: string }; Returns: string }
      resolve_login_email_by_registro: {
        Args: { _registro: string }
        Returns: string
      }
      revogar_acesso_por_pedido: { Args: { _order_id: string }; Returns: Json }
      submit_evaluation_response: {
        Args: {
          _nome: string
          _registro_numero: string
          _registro_tipo: string
          _registro_uf: string
          _respostas: Json
          _token: string
        }
        Returns: Json
      }
      validate_cupom: {
        Args: { _codigo: string; _curso_id?: string }
        Returns: Json
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
