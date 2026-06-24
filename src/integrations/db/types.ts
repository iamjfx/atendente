export interface Database {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          id: string;
          user_id: string;
          cliente_id: string | null;
          cliente_nome: string;
          telefone: string | null;
          email: string | null;
          endereco: Record<string, unknown> | null;
          data: string;
          hora_inicio: string;
          hora_fim: string;
          servico: string;
          valor: number;
          observacoes: string | null;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          tipo: 'agendado' | 'imediato';
          atendimento_id: string | null;
          pacote_id: string | null;
          metodo_pagamento: string | null;
          status_publico: string | null;
          profissional_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cliente_id?: string | null;
          cliente_nome: string;
          telefone?: string | null;
          email?: string | null;
          endereco?: Record<string, unknown> | null;
          data: string;
          hora_inicio: string;
          hora_fim: string;
          servico: string;
          valor?: number;
          observacoes?: string | null;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          tipo?: 'agendado' | 'imediato';
          atendimento_id?: string | null;
          pacote_id?: string | null;
          metodo_pagamento?: string | null;
          status_publico?: string | null;
          profissional_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          cliente_id?: string | null;
          cliente_nome?: string;
          telefone?: string | null;
          email?: string | null;
          endereco?: Record<string, unknown> | null;
          data?: string;
          hora_inicio?: string;
          hora_fim?: string;
          servico?: string;
          valor?: number;
          observacoes?: string | null;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          tipo?: 'agendado' | 'imediato';
          atendimento_id?: string | null;
          pacote_id?: string | null;
          metodo_pagamento?: string | null;
          status_publico?: string | null;
          profissional_id?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          nome: string;
          email: string | null;
          telefone: string | null;
          logo_url: string | null;
          nome_fantasia: string | null;
          nome_usuario: string | null;
          nome_ia: string | null;
          role: string;
          owner_user_id: string | null;
          onboarding_completo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nome?: string;
          email?: string | null;
          telefone?: string | null;
          logo_url?: string | null;
          nome_fantasia?: string | null;
          nome_usuario?: string | null;
          nome_ia?: string | null;
          role?: string;
          owner_user_id?: string | null;
          onboarding_completo?: boolean;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string | null;
          telefone?: string | null;
          logo_url?: string | null;
          nome_fantasia?: string | null;
          nome_usuario?: string | null;
          nome_ia?: string | null;
          role?: string;
          owner_user_id?: string | null;
          onboarding_completo?: boolean;
        };
      };
      products: {
        Row: {
          slug: string;
          nome: string;
          descricao: string | null;
          paddle_product_id: string | null;
          created_at: string;
        };
        Insert: {
          slug: string;
          nome: string;
          descricao?: string | null;
          paddle_product_id?: string | null;
        };
        Update: {
          slug?: string;
          nome?: string;
          descricao?: string | null;
          paddle_product_id?: string | null;
        };
      };
      account_products: {
        Row: {
          account_id: string;
          product_slug: string;
          ativo: boolean;
          paddle_subscription_id: string | null;
          created_at: string;
        };
        Insert: {
          account_id: string;
          product_slug: string;
          ativo?: boolean;
          paddle_subscription_id?: string | null;
        };
        Update: {
          account_id?: string;
          product_slug?: string;
          ativo?: boolean;
          paddle_subscription_id?: string | null;
        };
      };
      user_plans: {
        Row: {
          user_id: string;
          plano: 'mei' | 'profissional' | 'empresarial';
          ativo_ate: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plano: 'mei' | 'profissional' | 'empresarial';
          ativo_ate?: string | null;
        };
        Update: {
          user_id?: string;
          plano?: 'mei' | 'profissional' | 'empresarial';
          ativo_ate?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          paddle_subscription_id: string;
          product_id: string;
          price_id: string;
          status: string;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          paddle_subscription_id: string;
          product_id: string;
          price_id: string;
          status: string;
          current_period_end?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          paddle_subscription_id?: string;
          product_id?: string;
          price_id?: string;
          status?: string;
          current_period_end?: string | null;
        };
      };
      evolution_instances: {
        Row: {
          id: string;
          account_id: string;
          instance_name: string;
          connection_status: 'disconnected' | 'connecting' | 'connected';
          qr_code: string | null;
          webhook_secret: string | null;
          webhook_events: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          instance_name: string;
          connection_status?: 'disconnected' | 'connecting' | 'connected';
          qr_code?: string | null;
          webhook_secret?: string | null;
          webhook_events?: string[] | null;
        };
        Update: {
          id?: string;
          account_id?: string;
          instance_name?: string;
          connection_status?: 'disconnected' | 'connecting' | 'connected';
          qr_code?: string | null;
          webhook_secret?: string | null;
          webhook_events?: string[] | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          account_id: string;
          instance_id: string;
          remote_jid: string;
          contact_name: string | null;
          contact_phone: string | null;
          last_message_at: string;
          last_message_preview: string | null;
          unread_count: number;
          status: 'active' | 'archived' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          instance_id: string;
          remote_jid: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          last_message_at?: string;
          last_message_preview?: string | null;
          unread_count?: number;
          status?: 'active' | 'archived' | 'blocked';
        };
        Update: {
          id?: string;
          account_id?: string;
          instance_id?: string;
          remote_jid?: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          last_message_at?: string;
          last_message_preview?: string | null;
          unread_count?: number;
          status?: 'active' | 'archived' | 'blocked';
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          remote_jid: string;
          instance_id: string;
          from_me: boolean;
          message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker' | 'reaction' | 'unknown';
          content: string | null;
          raw_json: Record<string, unknown> | null;
          ai_processed: boolean;
          ai_response_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          remote_jid: string;
          instance_id: string;
          from_me?: boolean;
          message_type?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker' | 'reaction' | 'unknown';
          content?: string | null;
          raw_json?: Record<string, unknown> | null;
          ai_processed?: boolean;
          ai_response_id?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          remote_jid?: string;
          instance_id?: string;
          from_me?: boolean;
          message_type?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker' | 'reaction' | 'unknown';
          content?: string | null;
          raw_json?: Record<string, unknown> | null;
          ai_processed?: boolean;
          ai_response_id?: string | null;
        };
      };
      message_queue: {
        Row: {
          id: string;
          conversation_id: string;
          instance_id: string;
          remote_jid: string;
          content: string;
          media_url: string | null;
          status: 'pending' | 'sending' | 'sent' | 'failed';
          error: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          instance_id: string;
          remote_jid: string;
          content: string;
          media_url?: string | null;
          status?: 'pending' | 'sending' | 'sent' | 'failed';
          error?: string | null;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          instance_id?: string;
          remote_jid?: string;
          content?: string;
          media_url?: string | null;
          status?: 'pending' | 'sending' | 'sent' | 'failed';
          error?: string | null;
          sent_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_account_owner: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      app_plan: 'mei' | 'profissional' | 'empresarial';
    };
  };
}
