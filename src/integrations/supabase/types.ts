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
      app_settings: {
        Row: {
          background_color: string
          banner_shape: string
          banner_square_size: number
          display_mode: string
          favicon_url: string | null
          grid_cols_desktop: number
          grid_cols_mobile: number
          grid_cols_tablet: number
          header_alignment: string
          header_logo_url: string | null
          header_title: string
          icon_size_desktop: number
          icon_size_mobile: number
          icon_size_tablet: number
          id: string
          primary_color: string
          show_header: boolean
          text_color: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          banner_shape?: string
          banner_square_size?: number
          display_mode?: string
          favicon_url?: string | null
          grid_cols_desktop?: number
          grid_cols_mobile?: number
          grid_cols_tablet?: number
          header_alignment?: string
          header_logo_url?: string | null
          header_title?: string
          icon_size_desktop?: number
          icon_size_mobile?: number
          icon_size_tablet?: number
          id?: string
          primary_color?: string
          show_header?: boolean
          text_color?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          banner_shape?: string
          banner_square_size?: number
          display_mode?: string
          favicon_url?: string | null
          grid_cols_desktop?: number
          grid_cols_mobile?: number
          grid_cols_tablet?: number
          header_alignment?: string
          header_logo_url?: string | null
          header_title?: string
          icon_size_desktop?: number
          icon_size_mobile?: number
          icon_size_tablet?: number
          id?: string
          primary_color?: string
          show_header?: boolean
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          email: string | null
          end_time: string
          id: string
          name: string
          notes: string | null
          phone: string
          responsible: string
          start_time: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          email?: string | null
          end_time: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          responsible: string
          start_time: string
          status?: string
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          email?: string | null
          end_time?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          responsible?: string
          start_time?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      banner_slides: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          link_type: string
          link_url: string | null
          sort_order: number | null
          title: string | null
          type: string
          video_url: string | null
          youtube_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link_type?: string
          link_url?: string | null
          sort_order?: number | null
          title?: string | null
          type?: string
          video_url?: string | null
          youtube_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link_type?: string
          link_url?: string | null
          sort_order?: number | null
          title?: string | null
          type?: string
          video_url?: string | null
          youtube_id?: string | null
        }
        Relationships: []
      }
      blocked_slots: {
        Row: {
          created_at: string
          created_by: string
          date: string
          end_time: string
          id: string
          reason: string | null
          responsible: string | null
          start_time: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          end_time: string
          id?: string
          reason?: string | null
          responsible?: string | null
          start_time: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          end_time?: string
          id?: string
          reason?: string | null
          responsible?: string | null
          start_time?: string
          unit?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          completed: boolean | null
          created_at: string
          duration: string | null
          file_size: string | null
          id: string
          sort_order: number | null
          title: string
          training_id: string
          type: string
          url: string | null
          user_id: string
          youtube_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          duration?: string | null
          file_size?: string | null
          id?: string
          sort_order?: number | null
          title: string
          training_id: string
          type: string
          url?: string | null
          user_id: string
          youtube_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          duration?: string | null
          file_size?: string | null
          id?: string
          sort_order?: number | null
          title?: string
          training_id?: string
          type?: string
          url?: string | null
          user_id?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_messages: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          name: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          name?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          name?: string | null
        }
        Relationships: []
      }
      icon_grid_order: {
        Row: {
          allowed_roles: string[]
          custom_label: string | null
          icon_name: string | null
          id: string
          is_custom: boolean
          route: string | null
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          allowed_roles?: string[]
          custom_label?: string | null
          icon_name?: string | null
          id: string
          is_custom?: boolean
          route?: string | null
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          allowed_roles?: string[]
          custom_label?: string | null
          icon_name?: string | null
          id?: string
          is_custom?: boolean
          route?: string | null
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          id: string
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          message: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          title?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      planejamento_entries: {
        Row: {
          created_at: string
          id: string
          meta_atendimentos: number
          meta_faturamento: number
          meta_prospec: number
          meta_vendas_lar: number
          meta_vendas_motors: number
          observacoes: string | null
          realizado_atendimentos: number
          realizado_faturamento: number
          realizado_prospec: number
          realizado_vendas_lar: number
          realizado_vendas_motors: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_atendimentos?: number
          meta_faturamento?: number
          meta_prospec?: number
          meta_vendas_lar?: number
          meta_vendas_motors?: number
          observacoes?: string | null
          realizado_atendimentos?: number
          realizado_faturamento?: number
          realizado_prospec?: number
          realizado_vendas_lar?: number
          realizado_vendas_motors?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_atendimentos?: number
          meta_faturamento?: number
          meta_prospec?: number
          meta_vendas_lar?: number
          meta_vendas_motors?: number
          observacoes?: string | null
          realizado_atendimentos?: number
          realizado_faturamento?: number
          realizado_prospec?: number
          realizado_vendas_lar?: number
          realizado_vendas_motors?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      planejamento_form_drafts: {
        Row: {
          created_at: string
          data: Json
          form_key: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          form_key: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          form_key?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          cpf: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_active_at: string | null
          must_change_password: boolean
          phone: string | null
          unit: string | null
          unit_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_active_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          unit?: string | null
          unit_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_active_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          unit?: string | null
          unit_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rental_items: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string
          daily_price: number
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          daily_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          daily_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rentals: {
        Row: {
          created_at: string
          end_date: string
          id: string
          rental_item_id: string
          start_date: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          rental_item_id: string
          start_date: string
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          rental_item_id?: string
          start_date?: string
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_rental_item_id_fkey"
            columns: ["rental_item_id"]
            isOneToOne: false
            referencedRelation: "rental_items"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_configs: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          day_of_week: number
          end_time: string
          id: string
          responsible: string
          service_type: string | null
          slot_duration_minutes: number
          start_time: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          day_of_week: number
          end_time: string
          id?: string
          responsible: string
          service_type?: string | null
          slot_duration_minutes?: number
          start_time: string
          unit: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          day_of_week?: number
          end_time?: string
          id?: string
          responsible?: string
          service_type?: string | null
          slot_duration_minutes?: number
          start_time?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      section_contents: {
        Row: {
          allow_download: boolean
          allow_user_upload: boolean
          created_at: string
          description: string | null
          id: string
          open_mode: string
          parent_id: string | null
          section_id: string
          sort_order: number | null
          tab_id: string | null
          title: string
          type: string
          url: string | null
          user_id: string
          youtube_id: string | null
        }
        Insert: {
          allow_download?: boolean
          allow_user_upload?: boolean
          created_at?: string
          description?: string | null
          id?: string
          open_mode?: string
          parent_id?: string | null
          section_id: string
          sort_order?: number | null
          tab_id?: string | null
          title: string
          type?: string
          url?: string | null
          user_id: string
          youtube_id?: string | null
        }
        Update: {
          allow_download?: boolean
          allow_user_upload?: boolean
          created_at?: string
          description?: string | null
          id?: string
          open_mode?: string
          parent_id?: string | null
          section_id?: string
          sort_order?: number | null
          tab_id?: string | null
          title?: string
          type?: string
          url?: string | null
          user_id?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_contents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "section_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_contents_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "section_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      section_tabs: {
        Row: {
          created_at: string
          id: string
          section_id: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          section_id: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          section_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          progress: number | null
          thumbnail: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress?: number | null
          thumbnail?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress?: number | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trilha_certificates: {
        Row: {
          id: string
          issued_at: string
          scope: string
          scope_ref: string | null
          section_id: string
          title: string
          user_id: string
        }
        Insert: {
          id?: string
          issued_at?: string
          scope?: string
          scope_ref?: string | null
          section_id: string
          title: string
          user_id: string
        }
        Update: {
          id?: string
          issued_at?: string
          scope?: string
          scope_ref?: string | null
          section_id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      trilha_progress: {
        Row: {
          completed_at: string
          content_id: string
          id: string
          section_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          content_id: string
          id?: string
          section_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          content_id?: string
          id?: string
          section_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_content_uploads: {
        Row: {
          content_id: string
          created_at: string
          file_name: string | null
          file_url: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          file_name?: string | null
          file_url: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_uploads_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "section_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "iniciante"
        | "autorizado"
        | "supervisor"
        | "gestor"
        | "secretaria"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "iniciante",
        "autorizado",
        "supervisor",
        "gestor",
        "secretaria",
      ],
    },
  },
} as const
