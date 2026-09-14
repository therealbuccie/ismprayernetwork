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
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          changed_fields: string[] | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          record_label: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          record_label?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          record_label?: string | null
          table_name?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          archived: boolean
          body: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_active: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          espees_price: number | null
          featured: boolean
          id: string
          is_digital: boolean
          is_physical: boolean
          isbn: string | null
          ngn_price: number | null
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
          espees_price?: number | null
          featured?: boolean
          id?: string
          is_digital?: boolean
          is_physical?: boolean
          isbn?: string | null
          ngn_price?: number | null
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
          espees_price?: number | null
          featured?: boolean
          id?: string
          is_digital?: boolean
          is_physical?: boolean
          isbn?: string | null
          ngn_price?: number | null
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
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          display_type: string
          id: string
          images: Json
          is_active: boolean
          link_url: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_type?: string
          id?: string
          images?: Json
          is_active?: boolean
          link_url?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_type?: string
          id?: string
          images?: Json
          is_active?: boolean
          link_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      combo_pack_items: {
        Row: {
          book_id: string
          combo_pack_id: string
          id: string
        }
        Insert: {
          book_id: string
          combo_pack_id: string
          id?: string
        }
        Update: {
          book_id?: string
          combo_pack_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_pack_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_pack_items_combo_pack_id_fkey"
            columns: ["combo_pack_id"]
            isOneToOne: false
            referencedRelation: "combo_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_packs: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          espees_price: number | null
          featured: boolean
          id: string
          is_active: boolean
          ngn_price: number | null
          price: number
          short_description: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          espees_price?: number | null
          featured?: boolean
          id?: string
          is_active?: boolean
          ngn_price?: number | null
          price?: number
          short_description?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          espees_price?: number | null
          featured?: boolean
          id?: string
          is_active?: boolean
          ngn_price?: number | null
          price?: number
          short_description?: string | null
          title?: string
          updated_at?: string
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
      contacts: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          dob_day: number | null
          dob_month: number | null
          email: string | null
          first_name: string
          group_name: string | null
          id: string
          last_name: string
          ministerial_role: string | null
          notes: string | null
          phone: string | null
          source: string
          title: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          dob_day?: number | null
          dob_month?: number | null
          email?: string | null
          first_name?: string
          group_name?: string | null
          id?: string
          last_name?: string
          ministerial_role?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          dob_day?: number | null
          dob_month?: number | null
          email?: string | null
          first_name?: string
          group_name?: string | null
          id?: string
          last_name?: string
          ministerial_role?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      group_call_participations: {
        Row: {
          created_at: string
          duration_seconds: number
          group_id: string
          id: string
          joined_at: string
          left_at: string | null
          participant_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          group_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          participant_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          group_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          participant_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_call_participations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "prayer_groups"
            referencedColumns: ["id"]
          },
        ]
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
      group_prayer_assignments: {
        Row: {
          created_at: string
          group_id: string
          id: string
          prayer_point_id: string
          sent_by: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          prayer_point_id: string
          sent_by?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          prayer_point_id?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_prayer_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "prayer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_prayer_assignments_prayer_point_id_fkey"
            columns: ["prayer_point_id"]
            isOneToOne: false
            referencedRelation: "prayer_points"
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
          slug: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean
          member_count?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          member_count?: number
          name?: string
          slug?: string
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
      prayer_points: {
        Row: {
          archived: boolean
          body: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          scripture: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          body?: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          scripture?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          scripture?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prayer_reports: {
        Row: {
          admin_note: string | null
          attendance: number
          church: string
          contact_email: string | null
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          minister_name: string
          notes: string | null
          prayer_date: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          attendance?: number
          church: string
          contact_email?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          minister_name: string
          notes?: string | null
          prayer_date: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          attendance?: number
          church?: string
          contact_email?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          minister_name?: string
          notes?: string | null
          prayer_date?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
          timer_started_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          owner_name?: string
          slug: string
          timer_started_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          owner_name?: string
          slug?: string
          timer_started_at?: string | null
        }
        Relationships: []
      }
      prayer_slots: {
        Row: {
          created_at: string
          id: string
          reminder_sent: boolean
          slot_date: string
          slot_time: string
          status: string
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_sent?: boolean
          slot_date: string
          slot_time: string
          status?: string
          user_email: string
          user_id: string
          user_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_sent?: boolean
          slot_date?: string
          slot_time?: string
          status?: string
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      prayer_weeks: {
        Row: {
          affirmations: string | null
          archived: boolean
          conclusion: string | null
          confession_scripture: string | null
          confession_topic: string | null
          created_at: string
          created_by: string | null
          id: string
          intro: string | null
          is_active: boolean
          points: Json
          song_artist: string | null
          song_lyrics: string | null
          song_title: string | null
          song_url: string | null
          title: string
          updated_at: string
          week_start: string
        }
        Insert: {
          affirmations?: string | null
          archived?: boolean
          conclusion?: string | null
          confession_scripture?: string | null
          confession_topic?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intro?: string | null
          is_active?: boolean
          points?: Json
          song_artist?: string | null
          song_lyrics?: string | null
          song_title?: string | null
          song_url?: string | null
          title: string
          updated_at?: string
          week_start: string
        }
        Update: {
          affirmations?: string | null
          archived?: boolean
          conclusion?: string | null
          confession_scripture?: string | null
          confession_topic?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intro?: string | null
          is_active?: boolean
          points?: Json
          song_artist?: string | null
          song_lyrics?: string | null
          song_title?: string | null
          song_url?: string | null
          title?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          dob_day: number | null
          dob_month: number | null
          email: string | null
          full_name: string | null
          id: string
          ministerial_role: string | null
          ministry_name: string | null
          phone: string | null
          role: string
          title: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          dob_day?: number | null
          dob_month?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          ministerial_role?: string | null
          ministry_name?: string | null
          phone?: string | null
          role?: string
          title?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          dob_day?: number | null
          dob_month?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          ministerial_role?: string | null
          ministry_name?: string | null
          phone?: string | null
          role?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      program_dispatches: {
        Row: {
          created_at: string
          id: string
          match_mode: string
          program_id: string | null
          program_title: string | null
          recipient_count: number
          sent_at: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_mode?: string
          program_id?: string | null
          program_title?: string | null
          recipient_count?: number
          sent_at?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_mode?: string
          program_id?: string | null
          program_title?: string | null
          recipient_count?: number
          sent_at?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_dispatches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_engagements: {
        Row: {
          click_count: number
          clicked_at: string | null
          country: string | null
          created_at: string
          dispatch_id: string
          email: string
          full_name: string | null
          id: string
          open_count: number
          opened_at: string | null
          program_id: string | null
          sent_at: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          clicked_at?: string | null
          country?: string | null
          created_at?: string
          dispatch_id: string
          email: string
          full_name?: string | null
          id?: string
          open_count?: number
          opened_at?: string | null
          program_id?: string | null
          sent_at?: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          clicked_at?: string | null
          country?: string | null
          created_at?: string
          dispatch_id?: string
          email?: string
          full_name?: string | null
          id?: string
          open_count?: number
          opened_at?: string | null
          program_id?: string | null
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_engagements_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "program_dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_engagements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
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
          registration_url: string | null
          title: string
          video_url: string | null
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
          registration_url?: string | null
          title: string
          video_url?: string | null
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
          registration_url?: string | null
          title?: string
          video_url?: string | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      check_email_exists: { Args: { lookup_email: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
