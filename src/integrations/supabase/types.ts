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
      birthday_wishes: {
        Row: {
          author_name: string
          created_at: string
          event_id: string
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          author_name?: string
          created_at?: string
          event_id: string
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          event_id?: string
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthday_wishes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          category_id: string | null
          cloudpdf_document_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          digital_file_url: string | null
          featured: boolean
          id: string
          is_digital: boolean
          is_physical: boolean
          isbn: string | null
          pages: number | null
          price: number
          short_description: string | null
          stock: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          category_id?: string | null
          cloudpdf_document_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          digital_file_url?: string | null
          featured?: boolean
          id?: string
          is_digital?: boolean
          is_physical?: boolean
          isbn?: string | null
          pages?: number | null
          price?: number
          short_description?: string | null
          stock?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category_id?: string | null
          cloudpdf_document_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          digital_file_url?: string | null
          featured?: boolean
          id?: string
          is_digital?: boolean
          is_physical?: boolean
          isbn?: string | null
          pages?: number | null
          price?: number
          short_description?: string | null
          stock?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          birthday_day: number
          birthday_month: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          minister_image_url: string | null
          minister_name: string
        }
        Insert: {
          birthday_day: number
          birthday_month: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          minister_image_url?: string | null
          minister_name: string
        }
        Update: {
          birthday_day?: number
          birthday_month?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          minister_image_url?: string | null
          minister_name?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "prayer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      prayer_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean
          member_count: number
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean
          member_count?: number
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          member_count?: number
          name?: string
        }
        Relationships: []
      }
      prayer_interactions: {
        Row: {
          created_at: string
          id: string
          prayer_request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prayer_request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prayer_request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_interactions_prayer_request_id_fkey"
            columns: ["prayer_request_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          author_name: string
          category: string
          created_at: string
          description: string | null
          id: string
          is_anonymous: boolean
          prayer_count: number
          title: string
          user_id: string | null
        }
        Insert: {
          author_name?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_anonymous?: boolean
          prayer_count?: number
          title: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_anonymous?: boolean
          prayer_count?: number
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prayer_room_participants: {
        Row: {
          full_name: string
          id: string
          joined_at: string
          location: string | null
          session_id: string
        }
        Insert: {
          full_name: string
          id?: string
          joined_at?: string
          location?: string | null
          session_id: string
        }
        Update: {
          full_name?: string
          id?: string
          joined_at?: string
          location?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_room_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "prayer_room_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_room_sessions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          owner_name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          owner_name?: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          owner_name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dob_day: number | null
          dob_month: number | null
          email: string | null
          full_name: string | null
          id: string
          ministry_name: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dob_day?: number | null
          dob_month?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          ministry_name?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dob_day?: number | null
          dob_month?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          ministry_name?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          is_upcoming: boolean
          location: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_upcoming?: boolean
          location?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_upcoming?: boolean
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          admin_note: string | null
          created_at: string
          espees_code: string | null
          id: string
          items: Json
          payment_method: string
          pop_image_url: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          espees_code?: string | null
          id?: string
          items?: Json
          payment_method?: string
          pop_image_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          espees_code?: string | null
          id?: string
          items?: Json
          payment_method?: string
          pop_image_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          book_id: string
          created_at: string
          format: string
          granted_by: string | null
          id: string
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          book_id: string
          created_at?: string
          format?: string
          granted_by?: string | null
          id?: string
          status?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          book_id?: string
          created_at?: string
          format?: string
          granted_by?: string | null
          id?: string
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      testimonies: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          location: string | null
          title: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          location?: string | null
          title: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          location?: string | null
          title?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
